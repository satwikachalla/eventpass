export type UserRole = 'student' | 'proctor' | 'incharge' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  rollNumber?: string;
  department?: string;
  academicYear?: string;
  section?: string;
  assignedProctorId?: string;
  assignedProctorName?: string;
  isProfileComplete: boolean;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
}

export type EventCategory =
  | 'Hackathon'
  | 'Workshop'
  | 'Conference'
  | 'Technical Competition'
  | 'Industrial Visit'
  | 'Other';

export type EventStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under Proctor Review'
  | 'Returned for Correction'
  | 'Recommended for Approval'
  | 'Recommended for Rejection'
  | 'Pending Final Decision'
  | 'Approved'
  | 'Rejected'
  | 'Withdrawn';

export interface AttendanceSnapshot {
  percentage: number | null;
  classesAttended: number;
  classesConducted: number;
  threshold: number;
  isEligible: boolean;
  statusText: 'Eligible' | 'Ineligible' | 'Unavailable' | 'Stale Data';
  calculatedAt: string;
  datasetVersion: string;
  isStale: boolean;
}

export interface ProctorReviewDetails {
  proctorUid: string;
  proctorName: string;
  decision: 'recommend_approval' | 'recommend_rejection' | 'return_for_correction';
  remarks: string;
  reviewedAt: string;
}

export interface FinalDecisionDetails {
  decidedByUid: string;
  decidedByName: string;
  decision: 'Approved' | 'Rejected' | 'Returned';
  remarks: string;
  isOverride: boolean;
  overrideReason?: string;
  decidedAt: string;
}

export interface EventRequest {
  id: string;
  referenceNumber: string;
  studentUid: string;
  studentName: string;
  studentRollNumber: string;
  studentDepartment: string;
  studentYear: string;
  studentSection: string;
  studentEmail: string;
  title: string;
  organizer: string;
  category: EventCategory;
  venueCity: string;
  startDate: string;
  endDate: string;
  eventUrl?: string;
  purpose: string;
  expectedAcademicBenefit: string;
  supportingDocUrl?: string;
  supportingDocName?: string;
  attendanceSnapshot: AttendanceSnapshot;
  status: EventStatus;
  proctorReview: ProctorReviewDetails | null;
  finalDecision: FinalDecisionDetails | null;
  correctionRemarks?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface AttendanceRecord {
  id: string;
  rollNumber: string;
  studentUid?: string;
  studentName?: string;
  department?: string;
  section?: string;
  classesAttended: number;
  classesConducted: number;
  calculatedPercentage: number | null;
  isEligible: boolean;
  statusText: 'Eligible' | 'Ineligible' | 'Unavailable' | 'Stale Data';
  academicTerm: string;
  datasetVersion: string;
  lastVerifiedAt: string;
  isStale: boolean;
}

export interface AttendanceDataset {
  id: string;
  version: string;
  filename: string;
  uploadedByUid: string;
  uploadedByName: string;
  uploadedAt: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  unmatchedRows: number;
  importedRecordsCount: number;
  thresholdApplied: number;
  status: 'committed' | 'staged' | 'archived';
  isActive: boolean;
}

export interface AttendanceImportRow {
  rowNumber: number;
  rollNumber: string;
  studentName?: string;
  department?: string;
  section?: string;
  classesAttended: number;
  classesConducted: number;
  academicTerm?: string;
  status: 'valid' | 'invalid' | 'duplicate' | 'unmatched';
  errors: string[];
  calculatedPercentage: number | null;
  isEligible: boolean;
}

export interface DepartmentSettings {
  attendanceThreshold: number;
  dataStalenessDays: number;
  academicYear: string;
  updatedAt: string;
  updatedBy: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorUid: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  targetType: 'request' | 'attendance' | 'role' | 'assignment' | 'settings' | 'auth';
  targetId: string;
  details: Record<string, any>;
  previousState?: any;
  newState?: any;
}

export interface NotificationItem {
  id: string;
  recipientUid: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  link?: string;
  isRead: boolean;
  createdAt: string;
}
