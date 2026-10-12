import {
  UserProfile,
  EventRequest,
  AttendanceRecord,
  AttendanceDataset,
  DepartmentSettings,
  AuditLog,
  NotificationItem,
  UserRole,
  EventStatus,
} from '@/types';
import {
  INITIAL_ADMIN,
  INITIAL_INCHARGE,
  INITIAL_PROCTORS,
  INITIAL_STUDENTS,
  INITIAL_ATTENDANCE_RECORDS,
  INITIAL_DATASETS,
  INITIAL_REQUESTS,
  INITIAL_SETTINGS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
} from './mockData';
import { calculateAttendanceEligibility } from './attendance';
import { validateTransition } from './workflow';

const STORAGE_KEY_PREFIX = 'eventpass_';

function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (err) {
    console.warn(`Error reading localStorage for key ${key}:`, err);
    return defaultValue;
  }
}

function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Error saving localStorage for key ${key}:`, err);
  }
}

const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

class EventPassStore {
  private users: UserProfile[];
  private requests: EventRequest[];
  private attendanceRecords: AttendanceRecord[];
  private datasets: AttendanceDataset[];
  private settings: DepartmentSettings;
  private auditLogs: AuditLog[];
  private notifications: NotificationItem[];
  private currentUser: UserProfile | null;

  constructor() {
    this.users = getStorageItem<UserProfile[]>('users', deepClone([
      INITIAL_ADMIN,
      INITIAL_INCHARGE,
      ...INITIAL_PROCTORS,
      ...INITIAL_STUDENTS,
    ]));
    this.requests = getStorageItem<EventRequest[]>('requests', deepClone(INITIAL_REQUESTS));
    this.attendanceRecords = getStorageItem<AttendanceRecord[]>(
      'attendance_records',
      deepClone(INITIAL_ATTENDANCE_RECORDS)
    );
    this.datasets = getStorageItem<AttendanceDataset[]>('datasets', deepClone(INITIAL_DATASETS));
    this.settings = getStorageItem<DepartmentSettings>('settings', deepClone(INITIAL_SETTINGS));
    this.auditLogs = getStorageItem<AuditLog[]>('audit_logs', deepClone(INITIAL_AUDIT_LOGS));
    this.notifications = getStorageItem<NotificationItem[]>(
      'notifications',
      deepClone(INITIAL_NOTIFICATIONS)
    );
    this.currentUser = getStorageItem<UserProfile | null>('current_user', deepClone(INITIAL_STUDENTS[0]));
  }

  public resetToDefault(): void {
    this.users = deepClone([
      INITIAL_ADMIN,
      INITIAL_INCHARGE,
      ...INITIAL_PROCTORS,
      ...INITIAL_STUDENTS,
    ]);
    this.requests = deepClone(INITIAL_REQUESTS);
    this.attendanceRecords = deepClone(INITIAL_ATTENDANCE_RECORDS);
    this.datasets = deepClone(INITIAL_DATASETS);
    this.settings = deepClone(INITIAL_SETTINGS);
    this.auditLogs = deepClone(INITIAL_AUDIT_LOGS);
    this.notifications = deepClone(INITIAL_NOTIFICATIONS);
    this.currentUser = deepClone(INITIAL_STUDENTS[0]);

    this.persistAll();
  }

  private persistAll(): void {
    setStorageItem('users', this.users);
    setStorageItem('requests', this.requests);
    setStorageItem('attendance_records', this.attendanceRecords);
    setStorageItem('datasets', this.datasets);
    setStorageItem('settings', this.settings);
    setStorageItem('audit_logs', this.auditLogs);
    setStorageItem('notifications', this.notifications);
    setStorageItem('current_user', this.currentUser);
  }

  // Current User & Session
  public getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  public setCurrentUser(user: UserProfile | null): void {
    this.currentUser = user;
    setStorageItem('current_user', user);
  }

  // Users
  public getUsers(): UserProfile[] {
    return [...this.users];
  }

  public getUserById(uid: string): UserProfile | null {
    return this.users.find((u) => u.uid === uid) || null;
  }

  public getUserByEmail(email: string): UserProfile | null {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  public createOrRegisterUser(authUser: { uid: string; email: string; displayName?: string; photoURL?: string }): UserProfile {
    const existing = this.getUserById(authUser.uid) || this.getUserByEmail(authUser.email);
    if (existing) {
      this.currentUser = existing;
      setStorageItem('current_user', existing);
      return existing;
    }

    // Default to student role for any new sign in
    const newUser: UserProfile = {
      uid: authUser.uid,
      email: authUser.email,
      displayName: authUser.displayName || authUser.email.split('@')[0],
      role: 'student',
      department: 'Computer Science & Engineering',
      academicYear: '3rd Year',
      section: 'A',
      rollNumber: `CS2026-${(this.users.filter((u) => u.role === 'student').length + 1).toString().padStart(3, '0')}`,
      isProfileComplete: false,
      photoURL: authUser.photoURL,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignedProctorId: INITIAL_PROCTORS[0].uid,
      assignedProctorName: INITIAL_PROCTORS[0].displayName,
    };

    this.users.push(newUser);
    this.currentUser = newUser;
    this.persistAll();

    this.recordAuditLog({
      actorUid: newUser.uid,
      actorName: newUser.displayName,
      actorRole: 'student',
      action: 'USER_REGISTERED',
      targetType: 'auth',
      targetId: newUser.uid,
      details: { email: newUser.email, assignedRole: 'student' },
    });

    return newUser;
  }

  public updateUserProfile(uid: string, updates: Partial<UserProfile>): UserProfile {
    const idx = this.users.findIndex((u) => u.uid === uid);
    if (idx === -1) throw new Error('User not found');

    // Never allow updating role via profile update
    const { role, ...safeUpdates } = updates;
    this.users[idx] = {
      ...this.users[idx],
      ...safeUpdates,
      updatedAt: new Date().toISOString(),
      isProfileComplete: true,
    };

    if (this.currentUser?.uid === uid) {
      this.currentUser = this.users[idx];
    }

    this.persistAll();
    return this.users[idx];
  }

  public updateUserRole(uid: string, newRole: UserRole, adminActor: UserProfile): void {
    if (adminActor.role !== 'admin') {
      throw new Error('Unauthorized: Only administrators can modify user roles.');
    }
    const idx = this.users.findIndex((u) => u.uid === uid);
    if (idx === -1) throw new Error('User not found');

    const prevRole = this.users[idx].role;
    this.users[idx].role = newRole;
    this.users[idx].updatedAt = new Date().toISOString();

    if (this.currentUser?.uid === uid) {
      this.currentUser = this.users[idx];
    }

    this.recordAuditLog({
      actorUid: adminActor.uid,
      actorName: adminActor.displayName,
      actorRole: 'admin',
      action: 'USER_ROLE_CHANGED',
      targetType: 'role',
      targetId: uid,
      details: { user: this.users[idx].displayName, previousRole: prevRole, newRole },
      previousState: { role: prevRole },
      newState: { role: newRole },
    });

    this.persistAll();
  }

  public assignProctorToStudent(studentUid: string, proctorUid: string, adminActor: UserProfile): void {
    if (adminActor.role !== 'admin' && adminActor.role !== 'incharge') {
      throw new Error('Unauthorized: Only administrators or In-Charge can assign proctors.');
    }
    const studentIdx = this.users.findIndex((u) => u.uid === studentUid);
    const proctor = this.users.find((u) => u.uid === proctorUid);
    if (studentIdx === -1 || !proctor) throw new Error('Student or Proctor not found');

    const prevProctor = this.users[studentIdx].assignedProctorName;
    this.users[studentIdx].assignedProctorId = proctor.uid;
    this.users[studentIdx].assignedProctorName = proctor.displayName;
    this.users[studentIdx].updatedAt = new Date().toISOString();

    this.recordAuditLog({
      actorUid: adminActor.uid,
      actorName: adminActor.displayName,
      actorRole: adminActor.role,
      action: 'PROCTOR_ASSIGNED_TO_STUDENT',
      targetType: 'assignment',
      targetId: studentUid,
      details: {
        student: this.users[studentIdx].displayName,
        previousProctor: prevProctor,
        newProctor: proctor.displayName,
      },
    });

    this.persistAll();
  }

  // Attendance
  public getAttendanceRecords(): AttendanceRecord[] {
    return [...this.attendanceRecords];
  }

  public getAttendanceByRollNumber(rollNumber: string): AttendanceRecord | null {
    if (!rollNumber) return null;
    return (
      this.attendanceRecords.find(
        (r) => r.rollNumber.toUpperCase() === rollNumber.toUpperCase()
      ) || null
    );
  }

  public getAttendanceDatasets(): AttendanceDataset[] {
    return [...this.datasets];
  }

  public getDepartmentSettings(): DepartmentSettings {
    return { ...this.settings };
  }

  public updateDepartmentSettings(
    newSettings: Partial<DepartmentSettings>,
    actor: UserProfile
  ): DepartmentSettings {
    if (actor.role !== 'incharge' && actor.role !== 'admin') {
      throw new Error('Unauthorized: Only Technical-Event In-Charge or Admin can update department settings.');
    }

    const prev = { ...this.settings };
    this.settings = {
      ...this.settings,
      ...newSettings,
      updatedAt: new Date().toISOString(),
      updatedBy: actor.displayName,
    };

    // Recalculate pending requests if threshold changed
    if (newSettings.attendanceThreshold && newSettings.attendanceThreshold !== prev.attendanceThreshold) {
      this.recalculatePendingRequestSnapshots(newSettings.attendanceThreshold);
    }

    this.recordAuditLog({
      actorUid: actor.uid,
      actorName: actor.displayName,
      actorRole: actor.role,
      action: 'DEPARTMENT_SETTINGS_UPDATED',
      targetType: 'settings',
      targetId: 'global',
      details: { previousSettings: prev, updatedSettings: this.settings },
    });

    this.persistAll();
    return { ...this.settings };
  }

  public commitAttendanceDataset(
    dataset: Omit<AttendanceDataset, 'id' | 'status' | 'isActive'>,
    records: Omit<AttendanceRecord, 'id' | 'datasetVersion' | 'lastVerifiedAt'>[],
    actor: UserProfile
  ): AttendanceDataset {
    if (actor.role !== 'incharge' && actor.role !== 'admin') {
      throw new Error('Unauthorized: Only Technical-Event In-Charge can commit attendance datasets.');
    }

    // Archive previous active datasets
    this.datasets.forEach((d) => {
      if (d.isActive) {
        d.isActive = false;
        d.status = 'archived';
      }
    });

    const now = new Date().toISOString();
    const newDataset: AttendanceDataset = {
      ...dataset,
      id: `dataset-${Date.now()}`,
      status: 'committed',
      isActive: true,
      uploadedAt: now,
    };

    this.datasets.unshift(newDataset);

    // Update attendance records safely
    const updatedRecordsMap = new Map<string, AttendanceRecord>();
    this.attendanceRecords.forEach((r) => updatedRecordsMap.set(r.rollNumber.toUpperCase(), r));

    records.forEach((r) => {
      const calc = calculateAttendanceEligibility(
        r.classesAttended,
        r.classesConducted,
        this.settings.attendanceThreshold,
        now,
        this.settings.dataStalenessDays
      );

      const record: AttendanceRecord = {
        ...r,
        id: `att-${r.rollNumber}`,
        calculatedPercentage: calc.percentage,
        isEligible: calc.isEligible,
        statusText: calc.statusText,
        datasetVersion: newDataset.version,
        lastVerifiedAt: now,
        isStale: calc.isStale,
      };

      updatedRecordsMap.set(r.rollNumber.toUpperCase(), record);
    });

    this.attendanceRecords = Array.from(updatedRecordsMap.values());

    // Recalculate pending event requests
    this.recalculatePendingRequestSnapshots(this.settings.attendanceThreshold);

    this.recordAuditLog({
      actorUid: actor.uid,
      actorName: actor.displayName,
      actorRole: actor.role,
      action: 'ATTENDANCE_DATASET_COMMITTED',
      targetType: 'attendance',
      targetId: newDataset.id,
      details: {
        version: newDataset.version,
        filename: newDataset.filename,
        recordsCommitted: records.length,
        totalRows: newDataset.totalRows,
      },
    });

    this.persistAll();
    return newDataset;
  }

  private recalculatePendingRequestSnapshots(threshold: number): void {
    const activeDataset = this.datasets.find((d) => d.isActive) || this.datasets[0];
    const version = activeDataset ? activeDataset.version : 'v1.0.0';

    this.requests.forEach((req) => {
      // Only recalculate non-finalized requests (preserve historical evidence)
      if (
        req.status === 'Draft' ||
        req.status === 'Submitted' ||
        req.status === 'Under Proctor Review' ||
        req.status === 'Returned for Correction' ||
        req.status === 'Recommended for Approval' ||
        req.status === 'Recommended for Rejection' ||
        req.status === 'Pending Final Decision'
      ) {
        const att = this.getAttendanceByRollNumber(req.studentRollNumber);
        if (att) {
          const calc = calculateAttendanceEligibility(
            att.classesAttended,
            att.classesConducted,
            threshold,
            att.lastVerifiedAt,
            this.settings.dataStalenessDays
          );

          req.attendanceSnapshot = {
            percentage: calc.percentage,
            classesAttended: att.classesAttended,
            classesConducted: att.classesConducted,
            threshold,
            isEligible: calc.isEligible,
            statusText: calc.statusText,
            calculatedAt: new Date().toISOString(),
            datasetVersion: version,
            isStale: calc.isStale,
          };
          req.updatedAt = new Date().toISOString();
        }
      }
    });
  }

  // Event Requests
  public getEventRequests(filter?: {
    role?: UserRole;
    userUid?: string;
    studentRollNumber?: string;
  }): EventRequest[] {
    let list = [...this.requests];

    if (!filter) return list;

    if (filter.role === 'student' && filter.userUid) {
      return list.filter((r) => r.studentUid === filter.userUid);
    }

    if (filter.role === 'proctor' && filter.userUid) {
      // Find students assigned to this proctor
      const assignedStudents = new Set(
        this.users
          .filter((u) => u.assignedProctorId === filter.userUid)
          .map((u) => u.uid)
      );
      return list.filter((r) => assignedStudents.has(r.studentUid));
    }

    return list;
  }

  public getEventRequestById(id: string): EventRequest | null {
    return this.requests.find((r) => r.id === id) || null;
  }

  public createEventRequest(
    data: Omit<
      EventRequest,
      | 'id'
      | 'referenceNumber'
      | 'attendanceSnapshot'
      | 'status'
      | 'proctorReview'
      | 'finalDecision'
      | 'createdAt'
      | 'updatedAt'
      | 'version'
    >,
    actor: UserProfile
  ): EventRequest {
    if (actor.role !== 'student') {
      throw new Error('Only students can create event requests.');
    }

    // Get current attendance snapshot
    const att = this.getAttendanceByRollNumber(data.studentRollNumber);
    const activeDataset = this.datasets.find((d) => d.isActive) || this.datasets[0];
    const calc = att
      ? calculateAttendanceEligibility(
          att.classesAttended,
          att.classesConducted,
          this.settings.attendanceThreshold,
          att.lastVerifiedAt,
          this.settings.dataStalenessDays
        )
      : {
          percentage: null,
          statusText: 'Unavailable' as const,
          isEligible: false,
          isStale: false,
        };

    const newRefNumber = `EP-2026-${(this.requests.length + 1).toString().padStart(3, '0')}`;
    const now = new Date().toISOString();

    const newRequest: EventRequest = {
      ...data,
      id: `req-${Date.now()}`,
      referenceNumber: newRefNumber,
      attendanceSnapshot: {
        percentage: calc.percentage,
        classesAttended: att?.classesAttended ?? 0,
        classesConducted: att?.classesConducted ?? 0,
        threshold: this.settings.attendanceThreshold,
        isEligible: calc.isEligible,
        statusText: calc.statusText,
        calculatedAt: now,
        datasetVersion: activeDataset ? activeDataset.version : 'v1.0.0',
        isStale: calc.isStale,
      },
      status: 'Under Proctor Review',
      proctorReview: null,
      finalDecision: null,
      createdAt: now,
      updatedAt: now,
      version: 1,
    };

    this.requests.unshift(newRequest);

    this.recordAuditLog({
      actorUid: actor.uid,
      actorName: actor.displayName,
      actorRole: 'student',
      action: 'EVENT_REQUEST_SUBMITTED',
      targetType: 'request',
      targetId: newRequest.id,
      details: {
        referenceNumber: newRefNumber,
        title: newRequest.title,
        attendancePercentage: calc.percentage,
        isEligible: calc.isEligible,
      },
    });

    // Notify assigned proctor
    if (actor.assignedProctorId) {
      this.createNotification({
        recipientUid: actor.assignedProctorId,
        title: 'New Review Assignment',
        message: `${actor.displayName} (${actor.rollNumber}) submitted request "${newRequest.title}".`,
        type: 'info',
        link: `/proctor/review/${newRequest.id}`,
      });
    }

    this.persistAll();
    return newRequest;
  }

  public updateEventRequest(
    id: string,
    updates: Partial<EventRequest>,
    actor: UserProfile
  ): EventRequest {
    const idx = this.requests.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Request not found');

    const current = this.requests[idx];

    // Check ownership
    if (actor.role === 'student' && current.studentUid !== actor.uid) {
      throw new Error('Forbidden: You can only edit your own requests.');
    }

    // Check editability: students can only edit Draft or Returned for Correction
    if (
      actor.role === 'student' &&
      current.status !== 'Draft' &&
      current.status !== 'Returned for Correction'
    ) {
      throw new Error(`Cannot edit request in status '${current.status}'.`);
    }

    let nextStatus = current.status;
    if (current.status === 'Returned for Correction') {
      nextStatus = 'Under Proctor Review'; // Resubmit
    }

    this.requests[idx] = {
      ...current,
      ...updates,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
      version: current.version + 1,
    };

    this.recordAuditLog({
      actorUid: actor.uid,
      actorName: actor.displayName,
      actorRole: actor.role,
      action: 'EVENT_REQUEST_UPDATED',
      targetType: 'request',
      targetId: id,
      details: {
        referenceNumber: current.referenceNumber,
        previousStatus: current.status,
        newStatus: nextStatus,
      },
    });

    this.persistAll();
    return this.requests[idx];
  }

  public submitProctorReview(
    id: string,
    decision: 'recommend_approval' | 'recommend_rejection' | 'return_for_correction',
    remarks: string,
    proctorActor: UserProfile
  ): EventRequest {
    if (proctorActor.role !== 'proctor' && proctorActor.role !== 'incharge' && proctorActor.role !== 'admin') {
      throw new Error('Unauthorized: Only assigned Proctors or In-Charge can submit reviews.');
    }

    const idx = this.requests.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Request not found');

    const current = this.requests[idx];

    let targetStatus: EventStatus;
    if (decision === 'recommend_approval') targetStatus = 'Recommended for Approval';
    else if (decision === 'recommend_rejection') targetStatus = 'Recommended for Rejection';
    else targetStatus = 'Returned for Correction';

    const validation = validateTransition(current.status, targetStatus, 'proctor', remarks);
    if (!validation.allowed) {
      throw new Error(validation.reason);
    }

    const now = new Date().toISOString();
    this.requests[idx] = {
      ...current,
      status: targetStatus,
      proctorReview: {
        proctorUid: proctorActor.uid,
        proctorName: proctorActor.displayName,
        decision,
        remarks,
        reviewedAt: now,
      },
      correctionRemarks: decision === 'return_for_correction' ? remarks : undefined,
      updatedAt: now,
      version: current.version + 1,
    };

    this.recordAuditLog({
      actorUid: proctorActor.uid,
      actorName: proctorActor.displayName,
      actorRole: 'proctor',
      action: 'PROCTOR_REVIEW_SUBMITTED',
      targetType: 'request',
      targetId: id,
      details: {
        recommendation: decision,
        remarks,
        previousStatus: current.status,
        newStatus: targetStatus,
      },
    });

    // Notify student
    this.createNotification({
      recipientUid: current.studentUid,
      title:
        decision === 'return_for_correction'
          ? 'Request Returned for Correction'
          : `Proctor Recommendation: ${decision === 'recommend_approval' ? 'Recommended for Approval' : 'Recommended for Rejection'}`,
      message: `${proctorActor.displayName} has reviewed "${current.title}". Remarks: ${remarks}`,
      type: decision === 'recommend_approval' ? 'success' : decision === 'return_for_correction' ? 'warning' : 'alert',
      link: `/student/requests/${current.id}`,
    });

    this.persistAll();
    return this.requests[idx];
  }

  public submitFinalDecision(
    id: string,
    decision: 'Approved' | 'Rejected' | 'Returned',
    remarks: string,
    isOverride: boolean = false,
    overrideReason?: string,
    inchargeActor?: UserProfile
  ): EventRequest {
    const actor = inchargeActor || this.currentUser;
    if (!actor || (actor.role !== 'incharge' && actor.role !== 'admin')) {
      throw new Error('Unauthorized: Only Technical-Event In-Charge can make final decisions.');
    }

    const idx = this.requests.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Request not found');

    const current = this.requests[idx];
    const targetStatus: EventStatus =
      decision === 'Approved'
        ? 'Approved'
        : decision === 'Rejected'
        ? 'Rejected'
        : 'Returned for Correction';

    const validation = validateTransition(current.status, targetStatus, 'incharge', remarks);
    if (!validation.allowed) {
      throw new Error(validation.reason);
    }

    if (isOverride && (!overrideReason || overrideReason.trim().length === 0)) {
      throw new Error('An explicit justification reason is required when overriding attendance eligibility.');
    }

    const now = new Date().toISOString();
    this.requests[idx] = {
      ...current,
      status: targetStatus,
      finalDecision: {
        decidedByUid: actor.uid,
        decidedByName: actor.displayName,
        decision,
        remarks,
        isOverride,
        overrideReason: isOverride ? overrideReason : undefined,
        decidedAt: now,
      },
      rejectionReason: decision === 'Rejected' ? remarks : undefined,
      correctionRemarks: decision === 'Returned' ? remarks : undefined,
      updatedAt: now,
      version: current.version + 1,
    };

    this.recordAuditLog({
      actorUid: actor.uid,
      actorName: actor.displayName,
      actorRole: 'incharge',
      action: 'FINAL_DECISION_EXECUTED',
      targetType: 'request',
      targetId: id,
      details: {
        decision,
        remarks,
        isOverride,
        overrideReason,
        eligibilitySnapshot: current.attendanceSnapshot,
        previousStatus: current.status,
        newStatus: targetStatus,
      },
    });

    // Notify student
    this.createNotification({
      recipientUid: current.studentUid,
      title: `Event Request ${decision}`,
      message: `Your request "${current.title}" was ${decision.toLowerCase()} by ${actor.displayName}. Remarks: ${remarks}`,
      type: decision === 'Approved' ? 'success' : decision === 'Rejected' ? 'alert' : 'warning',
      link: `/student/requests/${current.id}`,
    });

    this.persistAll();
    return this.requests[idx];
  }

  public withdrawEventRequest(id: string, studentActor: UserProfile): EventRequest {
    const idx = this.requests.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Request not found');

    const current = this.requests[idx];
    if (current.studentUid !== studentActor.uid) {
      throw new Error('Unauthorized: You cannot withdraw another student\'s request.');
    }

    const validation = validateTransition(current.status, 'Withdrawn', 'student');
    if (!validation.allowed) {
      throw new Error(validation.reason);
    }

    const now = new Date().toISOString();
    this.requests[idx] = {
      ...current,
      status: 'Withdrawn',
      updatedAt: now,
      version: current.version + 1,
    };

    this.recordAuditLog({
      actorUid: studentActor.uid,
      actorName: studentActor.displayName,
      actorRole: 'student',
      action: 'EVENT_REQUEST_WITHDRAWN',
      targetType: 'request',
      targetId: id,
      details: { referenceNumber: current.referenceNumber, previousStatus: current.status },
    });

    this.persistAll();
    return this.requests[idx];
  }

  // Audit Logs
  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public recordAuditLog(entry: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const log: AuditLog = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
    setStorageItem('audit_logs', this.auditLogs);
  }

  // Notifications
  public getNotifications(recipientUid: string): NotificationItem[] {
    return this.notifications
      .filter((n) => n.recipientUid === recipientUid)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createNotification(entry: Omit<NotificationItem, 'id' | 'isRead' | 'createdAt'>): void {
    const notif: NotificationItem = {
      ...entry,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    this.notifications.unshift(notif);
    setStorageItem('notifications', this.notifications);
  }

  public markNotificationAsRead(id: string): void {
    const idx = this.notifications.findIndex((n) => n.id === id);
    if (idx !== -1) {
      this.notifications[idx].isRead = true;
      setStorageItem('notifications', this.notifications);
    }
  }

  public markAllNotificationsAsRead(recipientUid: string): void {
    this.notifications.forEach((n) => {
      if (n.recipientUid === recipientUid) n.isRead = true;
    });
    setStorageItem('notifications', this.notifications);
  }
}

export const eventPassStore = new EventPassStore();
