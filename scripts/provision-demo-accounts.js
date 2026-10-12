import admin from 'firebase-admin';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const [webApiKey, proctorEmail, inchargeEmail, serviceAccountPath] = process.argv.slice(2);

if (!webApiKey || !proctorEmail || !inchargeEmail) {
  console.error(
    'Usage: node scripts/provision-demo-accounts.js <firebase-web-api-key> <proctor-email> <incharge-email> [service-account.json]'
  );
  process.exit(1);
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (
  !emailPattern.test(proctorEmail) ||
  !emailPattern.test(inchargeEmail) ||
  proctorEmail.toLowerCase() === inchargeEmail.toLowerCase()
) {
  console.error('Provide two distinct valid email addresses.');
  process.exit(1);
}

function temporaryPassword() {
  return randomBytes(24).toString('base64url');
}

async function signInAndVerify(email, password, expectedUid) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(webApiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );

  if (!response.ok) {
    throw new Error(`Firebase password sign-in verification failed for ${email}.`);
  }

  const result = await response.json();
  if (result.localId !== expectedUid) {
    throw new Error(`Firebase returned an unexpected UID for ${email}.`);
  }
}

async function provisionAccount(config) {
  const { email, role, displayName, department } = config;
  const auth = admin.auth();
  const db = admin.firestore();
  let userRecord;

  try {
    userRecord = await auth.getUserByEmail(email);
  } catch (error) {
    if (error.code !== 'auth/user-not-found') throw error;
  }

  if (userRecord) {
    if (userRecord.uid !== config.uid) {
      throw new Error(
        `${email} already belongs to a different UID; refusing to change its identity.`
      );
    }
    const existingProfile = await db.collection('users').doc(userRecord.uid).get();
    const profile = existingProfile.data();
    if (
      profile &&
      (profile.role !== role || profile.uid !== userRecord.uid)
    ) {
      throw new Error(`Refusing to replace the existing role profile for ${email}.`);
    }
  } else {
    try {
      const uidOwner = await auth.getUser(config.uid);
      throw new Error(`${config.uid} is already assigned to ${uidOwner.email || 'another account'}.`);
    } catch (error) {
      if (error.code !== 'auth/user-not-found') throw error;
    }
  }

  const password = temporaryPassword();
  userRecord = userRecord
    ? await auth.updateUser(userRecord.uid, {
        email,
        password,
        displayName,
        disabled: false,
      })
    : await auth.createUser({
        uid: config.uid,
        email,
        password,
        displayName,
        emailVerified: false,
        disabled: false,
      });

  const userRef = db.collection('users').doc(userRecord.uid);
  const existingProfile = await userRef.get();
  await userRef.set(
    {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName,
      role,
      department,
      isProfileComplete: true,
      createdAt: existingProfile.data()?.createdAt ||
        admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  const verifiedProfile = await userRef.get();
  if (
    verifiedProfile.data()?.uid !== userRecord.uid ||
    verifiedProfile.data()?.role !== role
  ) {
    throw new Error(`Firestore role profile verification failed for ${email}.`);
  }

  await signInAndVerify(email, password, userRecord.uid);
  return { email, password, uid: userRecord.uid, role };
}

async function main() {
  let credential;
  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(
      fs.readFileSync(path.resolve(serviceAccountPath), 'utf8')
    );
    credential = admin.credential.cert(serviceAccount);
  } else {
    credential = admin.credential.applicationDefault();
  }

  admin.initializeApp({ credential });

  const accounts = [
    {
      uid: 'proctor-001',
      email: proctorEmail,
      role: 'proctor',
      displayName: 'EventPass Demo Proctor',
      department: 'Computer Science & Engineering',
    },
    {
      uid: 'incharge-001',
      email: inchargeEmail,
      role: 'incharge',
      displayName: 'EventPass Demo In-Charge',
      department: 'Computer Science & Engineering',
    },
  ];

  const provisioned = [];
  for (const account of accounts) {
    provisioned.push(await provisionAccount(account));
  }

  console.log('Both Firebase accounts and Firestore UID role profiles were verified.');
  console.log('Store these temporary credentials only in the Vercel server environment:');
  for (const account of provisioned) {
    console.log(`${account.role}: ${account.email}`);
    console.log(`Password: ${account.password}`);
  }
  console.log('Re-running this script rotates both passwords.');
}

main().catch((error) => {
  console.error('Demo account provisioning failed:', error.message);
  process.exitCode = 1;
});