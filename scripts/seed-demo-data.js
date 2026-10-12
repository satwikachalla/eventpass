/**
 * EventPass Demo Data Seeder for Firebase Firestore
 * 
 * Usage:
 *   node scripts/seed-demo-data.js [path-to-service-account.json]
 */

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

const serviceAccountPath = process.argv[2] || process.env.GOOGLE_APPLICATION_CREDENTIALS;

async function seedData() {
  try {
    let credential;
    if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(path.resolve(serviceAccountPath), 'utf8'));
      credential = admin.credential.cert(serviceAccount);
    } else {
      credential = admin.credential.applicationDefault();
    }

    admin.initializeApp({ credential });
    const db = admin.firestore();

    console.log('\x1b[34m[EventPass Seeder]\x1b[0m Starting Firestore database seeding...');

    // 1. Settings
    await db.collection('departmentSettings').doc('global').set({
      attendanceThreshold: 75,
      dataStalenessDays: 30,
      academicYear: '2026-2027',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: 'Dr. Ramesh Iyer',
    });

    console.log('✔ Department Settings seeded.');

    // 2. Staff Profiles
    const staff = [
      {
        uid: 'admin-001',
        email: 'admin.office@college.edu',
        displayName: 'Academic Admin Office',
        role: 'admin',
        department: 'Dean Academics',
        isProfileComplete: true,
      },
      {
        uid: 'incharge-001',
        email: 'ramesh.iyer@college.edu',
        displayName: 'Dr. Ramesh Iyer',
        role: 'incharge',
        department: 'Computer Science & Engineering',
        isProfileComplete: true,
      },
      {
        uid: 'proctor-001',
        email: 'rajesh.kumar@college.edu',
        displayName: 'Dr. Rajesh Kumar',
        role: 'proctor',
        department: 'Computer Science & Engineering',
        isProfileComplete: true,
      },
      {
        uid: 'proctor-002',
        email: 'sunita.nair@college.edu',
        displayName: 'Prof. Sunita Nair',
        role: 'proctor',
        department: 'Information Technology',
        isProfileComplete: true,
      },
    ];

    for (const member of staff) {
      await db.collection('users').doc(member.uid).set({
        ...member,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    console.log(`✔ ${staff.length} staff accounts seeded.`);

    // 3. Students
    const studentNames = [
      'Aarav Sharma', 'Diya Patel', 'Rohan Verma', 'Ananya Iyer', 'Vikram Reddy',
      'Priya Sundaram', 'Sneha Kulkarni', 'Aditya Joshi', 'Kavya Pillai', 'Arjun Kapoor',
      'Ishaan Mehra', 'Meera Nambiar', 'Siddharth Rao', 'Pooja Hegde', 'Varun Menon',
      'Rhea Sengupta', 'Karan Saxena', 'Tanvi Deshmukh', 'Gautam Bhatt', 'Shruti Nair',
      'Manish Chawla', 'Nikita Roy', 'Harsh Singhal', 'Divya Balan', 'Abhishek Das',
      'Ritu Choudhury', 'Sameer Kothari', 'Pranavi Murthy', 'Kunal Banerjee', 'Deepa Ghosh'
    ];

    const batch = db.batch();

    studentNames.forEach((name, idx) => {
      const num = (idx + 1).toString().padStart(3, '0');
      const uid = `student-${num}`;
      const rollNumber = `CS2026-${num}`;
      const isFirst = idx < 15;
      const proctor = isFirst ? staff[2] : staff[3];

      const userRef = db.collection('users').doc(uid);
      batch.set(userRef, {
        uid,
        email: `${name.toLowerCase().replace(/\s+/g, '.')}.demo@college.edu`,
        displayName: name,
        role: 'student',
        rollNumber,
        department: idx % 2 === 0 ? 'Computer Science & Engineering' : 'Information Technology',
        academicYear: idx < 20 ? '3rd Year' : '4th Year',
        section: idx % 4 < 2 ? 'A' : 'B',
        assignedProctorId: proctor.uid,
        assignedProctorName: proctor.displayName,
        isProfileComplete: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Attendance record
      let attended = 36;
      let conducted = 48;
      if (idx === 0) attended = 36; // 75% exactly
      else if (idx === 1) attended = 32; // 66.67%
      else if (idx === 3) { attended = 0; conducted = 0; } // Unavailable
      else attended = 34 + (idx % 14);

      const pct = conducted > 0 ? Math.round((attended / conducted) * 10000) / 100 : null;
      const isEligible = pct !== null && pct >= 75;

      const attRef = db.collection('attendanceRecords').doc(`att-${rollNumber}`);
      batch.set(attRef, {
        rollNumber,
        studentUid: uid,
        studentName: name,
        classesAttended: attended,
        classesConducted: conducted,
        calculatedPercentage: pct,
        isEligible,
        statusText: conducted === 0 ? 'Unavailable' : isEligible ? 'Eligible' : 'Ineligible',
        academicTerm: 'Fall 2026',
        datasetVersion: 'v1.0.0',
        lastVerifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        isStale: false,
      });
    });

    await batch.commit();
    console.log(`✔ 30 student profiles and attendance records successfully written.`);
    console.log('\x1b[32m✔ Seeding completed successfully!\x1b[0m');
    process.exit(0);
  } catch (err) {
    console.error('\x1b[31mSeeding failed:\x1b[0m', err);
    process.exit(1);
  }
}

seedData();
