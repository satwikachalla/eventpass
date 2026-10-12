# EventPass — Technical Event Approval & Attendance Monitoring Portal

> **Your Events. Verified. Approved.**

EventPass is a complete, production-grade web application engineered for colleges and universities to manage technical event participation, faculty proctor reviews, On-Duty (OD) sanctioning, and institutional attendance compliance.

Built for hackathon demonstration with strict security boundaries, genuine attendance calculation formulas, multi-tier approval state machines, CSV/XLSX validation engines, and automated test coverage.

---

## 🌟 Key Features

1. **Authoritative Attendance Calculation Engine**
   - Exact mathematical evaluation: `Attendance Percentage = (Classes Attended / Classes Conducted) * 100`.
   - Default configurable threshold: **75.0%** (configured by Technical-Event In-Charge).
   - Strict edge-case resolution: missing data or zero conducted classes displays **Unavailable**, never `0%`.
   - Staleness detection: records older than configured freshness policy (30 days) trigger warnings and prevent auto-qualification.
   - Immutable snapshot evidence: records attendance state at decision time and preserves evidence for audit.

2. **CSV & Excel (.xlsx) Safe Batch Import Engine**
   - Support for `.csv` and `.xlsx` attendance master files.
   - Row-by-row pre-validation: identifies missing roll numbers, unknown students, duplicate entries, negative values, attended > conducted errors, and zero counts.
   - Staged dataset commit model: invalid rows never corrupt previous active datasets.
   - Dynamic recalculation: committed datasets automatically refresh snapshots of pending requests while leaving finalized decisions intact.
   - Built-in sample CSV and Excel template downloads.

3. **Multi-Tier Role-Based Access Control (RBAC)**
   - **Student**: Submit applications, inspect personal attendance, track review stages, edit returned requests, and withdraw non-finalized requests.
   - **Proctor**: Review only assigned students, inspect attendance snapshots, submit recommendations (Approval / Rejection / Return for Edit) with mandatory remarks. Proctors cannot issue final approvals.
   - **Technical-Event In-Charge**: Department-wide oversight, final OD sanction authority, rejection with mandatory justification, special attendance override with justification, dataset commit authority.
   - **Administrator**: Designate roles, reassign proctor-to-student mappings, and view immutable audit trails.

4. **Security & Default-Deny Architecture**
   - Complete Firebase Authentication with Google Sign-In.
   - First-time users strictly receive `student` role by default.
   - Default-deny Firestore security rules (`firestore.rules`) and restricted Storage rules (`storage.rules`).
   - Server-side administrative bootstrap CLI script (`scripts/bootstrap-admin.js`) using Firebase Admin SDK.
   - In-memory/localStorage persistent fallback with instant evaluator demo role switcher.

5. **Certified Reports & Exports**
   - Download CSV and Excel registers for Event Requests, Master Attendance, Eligibility Compliance, and Import History.
   - Scoped data access: students export only their own records; proctors export assigned students; in-charge and admins export department master files.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 19, TypeScript (Strict), Vite 8 |
| **Styling & Design System** | Tailwind CSS v3 (Indigo/Navy palette with violet & cyan accents), Lucide Icons |
| **Parsing & Exports** | Papa Parse (CSV), SheetJS / XLSX (Excel) |
| **Authentication & Cloud** | Firebase Auth (Google Sign-In), Cloud Firestore, Firebase Storage |
| **Testing Suite** | Vitest, React Testing Library, jsdom |
| **Administrative CLI** | Node.js, Firebase Admin SDK |

---

## 📊 Database Schema (Cloud Firestore)

- **`users`**: `{ uid, email, displayName, role ('student'|'proctor'|'incharge'|'admin'), rollNumber, department, academicYear, section, assignedProctorId, assignedProctorName, isProfileComplete, createdAt, updatedAt }`
- **`eventRequests`**: `{ id, referenceNumber ('EP-2026-XXX'), studentUid, studentName, studentRollNumber, studentDepartment, title, organizer, category, venueCity, startDate, endDate, eventUrl, purpose, expectedAcademicBenefit, supportingDocName, supportingDocUrl, attendanceSnapshot: { percentage, classesAttended, classesConducted, threshold, isEligible, statusText, datasetVersion, isStale }, status, proctorReview, finalDecision, correctionRemarks, rejectionReason, createdAt, updatedAt, version }`
- **`attendanceRecords`**: `{ id, rollNumber, studentUid, studentName, department, section, classesAttended, classesConducted, calculatedPercentage, isEligible, statusText, academicTerm, datasetVersion, lastVerifiedAt, isStale }`
- **`attendanceDatasets`**: `{ id, version, filename, uploadedByUid, uploadedByName, uploadedAt, totalRows, validRows, invalidRows, duplicateRows, unmatchedRows, importedRecordsCount, thresholdApplied, status, isActive }`
- **`departmentSettings`**: `{ attendanceThreshold, dataStalenessDays, academicYear, updatedAt, updatedBy }`
- **`auditLogs`**: `{ id, timestamp, actorUid, actorName, actorRole, action, targetType, targetId, details, previousState, newState }`
- **`notifications`**: `{ id, recipientUid, title, message, type, link, isRead, createdAt }`

---

## ⚡ Workflow State Machine

```
[Student Submits] ──> 'Under Proctor Review'
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
'Recommended Approval'  'Recommended Rejection' 'Returned for Correction'
        │                   │                   │
        │                   │                   ▼
        │                   │           [Student Resubmits] ──> 'Under Proctor Review'
        ▼                   ▼
    ┌───────────────────────────┐
    │ Technical-Event In-Charge │
    │      Final Decision       │
    └─────────────┬─────────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
    'Approved'          'Rejected'
(On-Duty Sanctioned)  (Mandatory Reason)
```

---

## 🚀 Quickstart & Local Development

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation
```bash
# Clone the repository (if applicable)
git clone <repo-url>
cd eventpass-portal

# Install dependencies
npm install

# Run automated test suite
npm run test

# Start the Vite local development server
npm run dev
```

The portal will launch at `http://localhost:5173`.

---

## 🧪 Automated Testing

EventPass includes comprehensive test coverage for all core business invariants, attendance math, state transitions, and RBAC security rules:

```bash
npm run test
```

### Verified Test Suites:
- `src/test/attendance.test.ts` (13 tests): 75% cutoff boundary, zero conducted classes returning `Unavailable`, stale data flagging, negative values, attended > conducted validation, duplicates, and unmatched records.
- `src/test/workflow.test.ts` (14 tests): Valid transition paths, proctor forbidden from issuing final approval or rejection, student forbidden from self-approving, mandatory rejection reason enforcement, and date overlap detection.
- `src/test/store.test.ts` (9 tests): Default student registration, unauthorized role elevation prevention, immutable audit logs, dynamic threshold recalculation, and student withdrawal rules.

---

## 🔒 Security Model & Firebase Setup

### 1. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Populate your Firebase web app keys:
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-app
VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_USE_FIREBASE_EMULATOR=false
```

### 2. Deploying Security Rules
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and select project
firebase login
firebase use your-project-id

# Deploy Firestore and Storage security rules
firebase deploy --only firestore:rules,storage
```

### 3. Server-Side Administrative Bootstrap
To designate the initial administrator using Firebase Admin SDK:
```bash
node scripts/bootstrap-admin.js admin@yourcollege.edu serviceAccountKey.json
```

### 4. Firestore Demo Data Seeder
To seed 30 student records, 2 proctors, in-charge, and initial attendance datasets into Cloud Firestore:
```bash
node scripts/seed-demo-data.js serviceAccountKey.json
```

---

## 🎯 5-Minute Evaluator & Judge Demo Walkthrough

Even without cloud credentials, EventPass features a turnkey **Demo Mode** with realistic persistent data and an instant **Role Switcher** in the top navigation bar:

1. **Student Viewpoint (75.0% - Aarav Sharma)**:
   - Click `Student (75%)` in the top bar.
   - Notice Aarav's attendance is calculated as exactly **75.0%** (36/48 classes) and flagged as **Eligible**.
   - Navigate to `Submit Event Request` and fill out an application. Test entering overlapping dates to view the real-time collision warning.
2. **Student Viewpoint (<75% - Diya Patel)**:
   - Click `Student (<75%)` in the top bar.
   - Observe her 66.67% attendance marked as **Ineligible**.
   - Click `My Requests` and view request `EP-2026-002` to inspect the In-Charge's rejection remarks.
3. **Proctor Viewpoint (Dr. Rajesh Kumar)**:
   - Click `Proctor 1` in the top bar.
   - Review his portfolio of 15 assigned students.
   - Click `Assigned Student Reviews` -> `Review Now` on Arjun Kapoor's ISRO visit request (`EP-2026-006`).
   - Submit a recommendation with remarks. Proctors cannot issue final approval.
4. **Technical-Event In-Charge Viewpoint (Dr. Ramesh Iyer)**:
   - Click `In-Charge` in the top bar.
   - View live departmental analytics: eligibility distribution, approval trends, and upcoming schedules.
   - Go to `Request Final Decisions` and click `Finalize` on any pending application.
   - If approving an ineligible student, notice the mandatory **Attendance Override Justification** field.
   - Go to `Import Attendance` and upload a sample CSV/Excel file to inspect the row-by-row validation table.
5. **Administrator Viewpoint**:
   - Click `Admin` in the top bar.
   - Go to `Role & User Management` to assign roles or re-map proctors.
   - Click `Audit Trail` to view immutable, timestamped logs for all system operations.

---

## 📄 License
MIT License. Built for collegiate technical event administration and hackathon demonstration.
