/**
 * EventPass Administrative Bootstrap Script
 * 
 * Usage:
 *   node scripts/bootstrap-admin.js <admin-email> [serviceAccountKey.json]
 * 
 * Description:
 *   Designates the initial system administrator using the Firebase Admin SDK.
 *   This is a secure, server-side one-time setup script.
 *   Never expose this capability via public client endpoints.
 */

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

const email = process.argv[2];
const serviceAccountPath = process.argv[3] || process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!email) {
  console.error('\x1b[31mError: Administrator email is required.\x1b[0m');
  console.log('Usage: node scripts/bootstrap-admin.js <admin-email> [path-to-service-account.json]');
  process.exit(1);
}

async function bootstrapAdmin() {
  try {
    let credential;
    if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(path.resolve(serviceAccountPath), 'utf8'));
      credential = admin.credential.cert(serviceAccount);
    } else {
      credential = admin.credential.applicationDefault();
    }

    admin.initializeApp({ credential });
    const auth = admin.auth();
    const db = admin.firestore();

    console.log(`\x1b[34m[EventPass Admin Bootstrap]\x1b[0m Locating user with email: ${email}...`);

    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
    } catch (err) {
      console.log(`User not found in Auth. Creating new user record for ${email}...`);
      userRecord = await auth.createUser({
        email,
        displayName: 'Initial Administrator',
        emailVerified: true,
      });
    }

    // Set privileged custom user claims
    await auth.setCustomUserClaims(userRecord.uid, {
      role: 'admin',
      isAdmin: true,
    });

    // Create or update Firestore profile document
    await db.collection('users').doc(userRecord.uid).set(
      {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName || 'Administrator',
        role: 'admin',
        department: 'Academic Administration',
        isProfileComplete: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Record audit log entry
    await db.collection('auditLogs').add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      actorUid: 'SERVER_BOOTSTRAP_SCRIPT',
      actorName: 'System Bootstrap CLI',
      actorRole: 'admin',
      action: 'ADMIN_BOOTSTRAP_DESIGNATED',
      targetType: 'role',
      targetId: userRecord.uid,
      details: {
        email: userRecord.email,
        assignedRole: 'admin',
      },
    });

    console.log(`\x1b[32m✔ Success! User ${email} (UID: ${userRecord.uid}) has been designated as Administrator.\x1b[0m`);
    console.log('Admin custom claims set and Firestore profile updated.');
    process.exit(0);
  } catch (error) {
    console.error('\x1b[31mFailed to bootstrap administrator:\x1b[0m', error);
    process.exit(1);
  }
}

bootstrapAdmin();
