
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
    this.users = getStorageItem<UserProfile[]>(
      'users',
      deepClone([
        INITIAL_ADMIN,
        INITIAL_INCHARGE,
        ...INITIAL_PROCTORS,
        ...INITIAL_STUDENTS,
      ])
    );

    this.requests = getStorageItem<EventRequest[]>(
      'requests',
      deepClone(INITIAL_REQUESTS)
    );

    this.attendanceRecords = getStorageItem<AttendanceRecord[]>(
      'attendance_records',
      deepClone(INITIAL_ATTENDANCE_RECORDS)
    );

    this.datasets = getStorageItem<AttendanceDataset[]>(
      'datasets',
      deepClone(INITIAL_DATASETS)
    );

    this.settings = getStorageItem<DepartmentSettings>(
      'settings',
      deepClone(INITIAL_SETTINGS)
    );

    this.auditLogs = getStorageItem<AuditLog[]>(
      'audit_logs',
      deepClone(INITIAL_AUDIT_LOGS)
    );

    this.notifications = getStorageItem<NotificationItem[]>(
      'notifications',
      deepClone(INITIAL_NOTIFICATIONS)
    );

    this.currentUser = getStorageItem<UserProfile | null>(
      'current_user',
      deepClone(INITIAL_STUDENTS[0])
    );
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
    return (
      this.users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      ) || null
    );
  }

  /**
   * Return only students who currently have no proctor assigned.
   * This includes students who register through Google sign-in.
   */
  public getUnassignedStudents(): UserProfile[] {
    return this.users.filter(
      (user) =>
        user.role === 'student' &&
        !user.assignedProctorId &&
        !user.assignedProctorName
    );
  }

  /**
   * Return registered users whose role is proctor.
   */
  public getProctors(): UserProfile[] {
    return this.users.filter((user) => user.role === 'proctor');
  }

  public createOrRegisterUser(authUser: {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
  }): UserProfile {
    const existing =
      this.getUserById(authUser.uid) ||
      this.getUserByEmail(authUser.email);

    if (existing) {
      this.currentUser = existing;
      setStorageItem('current_user', existing);
      return existing;
    }

    const now = new Date().toISOString();

    const studentCount = this.users.filter(
      (user) => user.role === 'student'
    ).length;

    // New Google sign-ins are students until an administrator
    // changes their role. Leave the proctor assignment empty so
    // In-Charge can assign one from the dashboard.
    const newUser: UserProfile = {
      uid: authUser.uid,
      email: authUser.email,
      displayName:
        authUser.displayName || authUser.email.split('@')[0],
      role: 'student',
      department: 'Computer Science & Engineering',
      academicYear: '3rd Year',
      section: 'A',
      rollNumber: `CS2026-${(studentCount + 1)
        .toString()
        .padStart(3, '0')}`,
      isProfileComplete: false,
      photoURL: authUser.photoURL,
      createdAt: now,
      updatedAt: now,
      assignedProctorId: undefined,
      assignedProctorName: undefined,
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
      details: {
        email: newUser.email,
        assignedRole: 'student',
        proctorAssigned: false,
      },
    });

    return newUser;
  }

  public updateUserProfile(
    uid: string,
    updates: Partial<UserProfile>
  ): UserProfile {
    const idx = this.users.findIndex((user) => user.uid === uid);

    if (idx === -1) {
      throw new Error('User not found');
    }

    // Profile updates cannot change a user's role.
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

  public updateUserRole(
    uid: string,
    newRole: UserRole,
    adminActor: UserProfile
  ): void {
    if (adminActor.role !== 'admin') {
      throw new Error(
        'Unauthorized: Only administrators can modify user roles.'
      );
    }

    const idx = this.users.findIndex((user) => user.uid === uid);

    if (idx === -1) {
      throw new Error('User not found');
    }

    const previousRole = this.users[idx].role;

    this.users[idx] = {
      ...this.users[idx],
      role: newRole,
      updatedAt: new Date().toISOString(),
    };

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
      details: {
        user: this.users[idx].displayName,
        previousRole,
        newRole,
      },
      previousState: { role: previousRole },
      newState: { role: newRole },
    });

    this.persistAll();
  }

  public assignProctorToStudent(
    studentUid: string,
    proctorUid: string,
    adminActor: UserProfile
  ): void {
    if (
      adminActor.role !== 'admin' &&
      adminActor.role !== 'incharge'
    ) {
      throw new Error(
        'Unauthorized: Only administrators or In-Charge can assign proctors.'
      );
    }

    const studentIdx = this.users.findIndex(
      (user) => user.uid === studentUid && user.role === 'student'
    );

    const proctor = this.users.find(
      (user) => user.uid === proctorUid && user.role === 'proctor'
    );

    if (studentIdx === -1) {
      throw new Error('Student not found');
    }

    if (!proctor) {
      throw new Error('Selected user is not a registered proctor');
    }

    const previousProctor =
      this.users[studentIdx].assignedProctorName || 'Unassigned';

    this.users[studentIdx] = {
      ...this.users[studentIdx],
      assignedProctorId: proctor.uid,
      assignedProctorName: proctor.displayName,
      updatedAt: new Date().toISOString(),
    };

    this.recordAuditLog({
      actorUid: adminActor.uid,
      actorName: adminActor.displayName,
      actorRole: adminActor.role,
      action: 'PROCTOR_ASSIGNED_TO_STUDENT',
      targetType: 'assignment',
      targetId: studentUid,
      details: {
        student: this.users[studentIdx].displayName,
        previousProctor,
        newProctor: proctor.displayName,
      },
    });

    this.persistAll();
  }

  // Attendance

  public getAttendanceRecords(): AttendanceRecord[] {
    return [...this.attendanceRecords];
  }

  public getAttendanceByRollNumber(
    rollNumber: string
  ): AttendanceRecord | null {
    if (!rollNumber) return null;

    return (
      this.attendanceRecords.find(
        (record) =>
          record.rollNumber.toUpperCase() === rollNumber.toUpperCase()
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
      throw new Error(
        'Unauthorized: Only Technical-Event In-Charge or Admin can update department settings.'
      );
    }

    const previousSettings = { ...this.settings };

    this.settings = {
      ...this.settings,
      ...newSettings,
      updatedAt: new Date().toISOString(),
      updatedBy: actor.displayName,
    };

    if (
      newSettings.attendanceThreshold &&
      newSettings.attendanceThreshold !==
        previousSettings.attendanceThreshold
    ) {
      this.recalculatePendingRequestSnapshots(
        newSettings.attendanceThreshold
      );
    }

    this.recordAuditLog({
      actorUid: actor.uid,
      actorName: actor.displayName,
      actorRole: actor.role,
      action: 'DEPARTMENT_SETTINGS_UPDATED',
      targetType: 'settings',
      targetId: 'global',
      details: {
        previousSettings,
        updatedSettings: this.settings,
      },
    });

    this.persistAll();
    return { ...this.settings };
  }

  public commitAttendanceDataset(
    dataset: Omit<AttendanceDataset, 'id' | 'status' | 'isActive'>,
    records: Omit<
      AttendanceRecord,
      'id' | 'datasetVersion' | 'lastVerifiedAt'
    >[],
    actor: UserProfile
  ): AttendanceDataset {
    if (actor.role !== 'incharge' && actor.role !== 'admin') {
      throw new Error(
        'Unauthorized: Only Technical-Event In-Charge can commit attendance datasets.'
      );
    }

    this.datasets.forEach((item) => {
      if (item.isActive) {
        item.isActive = false;
        item.status = 'archived';
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

    const updatedRecordsMap = new Map<string, AttendanceRecord>();

    this.attendanceRecords.forEach((record) => {
      updatedRecordsMap.set(record.rollNumber.toUpperCase(), record);
    });

    records.forEach((record) => {
      const calculation = calculateAttendanceEligibility(
        record.classesAttended,
        record.classesConducted,
        this.settings.attendanceThreshold,
        now,
        this.settings.dataStalenessDays
      );

      const updatedRecord: AttendanceRecord = {
        ...record,
        id: `att-${record.rollNumber}`,
        calculatedPercentage: calculation.percentage,
        isEligible: calculation.isEligible,
        statusText: calculation.statusText,
        datasetVersion: newDataset.version,
        lastVerifiedAt: now,
        isStale: calculation.isStale,
      };

      updatedRecordsMap.set(
        record.rollNumber.toUpperCase(),
        updatedRecord
      );
    });

    this.attendanceRecords = Array.from(updatedRecordsMap.values());

    this.recalculatePendingRequestSnapshots(
      this.settings.attendanceThreshold
    );

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
    const activeDataset =
      this.datasets.find((dataset) => dataset.isActive) ||
      this.datasets[0];

    const version = activeDataset ? activeDataset.version : 'v1.0.0';

    this.requests.forEach((request) => {
      if (
        request.status === 'Draft' ||
        request.status === 'Submitted' ||
        request.status === 'Under Proctor Review' ||
        request.status === 'Returned for Correction' ||
        request.status === 'Recommended for Approval' ||
        request.status === 'Recommended for Rejection' ||
        request.status === 'Pending Final Decision'
      ) {
        const attendance = this.getAttendanceByRollNumber(
          request.studentRollNumber
        );

        if (attendance) {
          const calculation = calculateAttendanceEligibility(
            attendance.classesAttended,
            attendance.classesConducted,
            threshold,
            attendance.lastVerifiedAt,
            this.settings.dataStalenessDays
          );

          request.attendanceSnapshot = {
            percentage: calculation.percentage,
            classesAttended: attendance.classesAttended,
            classesConducted: attendance.classesConducted,
            threshold,
            isEligible: calculation.isEligible,
            statusText: calculation.statusText,
            calculatedAt: new Date().toISOString(),
            datasetVersion: version,
            isStale: calculation.isStale,
          };

          request.updatedAt = new Date().toISOString();
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
    const list = [...this.requests];

    if (!filter) return list;

    if (filter.role === 'student' && filter.userUid) {
      return list.filter(
        (request) => request.studentUid === filter.userUid
      );
    }

    if (filter.role === 'proctor' && filter.userUid) {
      const assignedStudents = new Set(
        this.users
          .filter((user) => user.assignedProctorId === filter.userUid)
          .map((user) => user.uid)
      );

      return list.filter((request) =>
        assignedStudents.has(request.studentUid)
      );
    }

    return list;
  }

  public getEventRequestById(id: string): EventRequest | null {
    return this.requests.find((request) => request.id === id) || null;
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

    const attendance = this.getAttendanceByRollNumber(
      data.studentRollNumber
    );

    const activeDataset =
      this.datasets.find((dataset) => dataset.isActive) ||
      this.datasets[0];

    const calculation = attendance
      ? calculateAttendanceEligibility(
          attendance.classesAttended,
          attendance.classesConducted,
          this.settings.attendanceThreshold,
          attendance.lastVerifiedAt,
          this.settings.dataStalenessDays
        )
      : {
          percentage: null,
          statusText: 'Unavailable' as const,
          isEligible: false,
          isStale: false,
        };

    const referenceNumber = `EP-2026-${(
      this.requests.length + 1
    )
      .toString()
      .padStart(3, '0')}`;

    const now = new Date().toISOString();

    const newRequest: EventRequest = {
      ...data,
      id: `req-${Date.now()}`,
      referenceNumber,
      attendanceSnapshot: {
        percentage: calculation.percentage,
        classesAttended: attendance?.classesAttended ?? 0,
        classesConducted: attendance?.classesConducted ?? 0,
        threshold: this.settings.attendanceThreshold,
        isEligible: calculation.isEligible,
        statusText: calculation.statusText,
        calculatedAt: now,
        datasetVersion: activeDataset
          ? activeDataset.version
          : 'v1.0.0',
        isStale: calculation.isStale,
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
        referenceNumber,
        title: newRequest.title,
        attendancePercentage: calculation.percentage,
        isEligible: calculation.isEligible,
      },
    });

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
    const idx = this.requests.findIndex((request) => request.id === id);

    if (idx === -1) {
      throw new Error('Request not found');
    }

    const current = this.requests[idx];

    if (actor.role === 'student' && current.studentUid !== actor.uid) {
      throw new Error(
        'Forbidden: You can only edit your own requests.'
      );
    }

    if (
      actor.role === 'student' &&
      current.status !== 'Draft' &&
      current.status !== 'Returned for Correction'
    ) {
      throw new Error(
        `Cannot edit request in status '${current.status}'.`
      );
    }

    const nextStatus =
      current.status === 'Returned for Correction'
        ? 'Under Proctor Review'
        : current.status;

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
    decision:
      | 'recommend_approval'
      | 'recommend_rejection'
      | 'return_for_correction',
    remarks: string,
    proctorActor: UserProfile
  ): EventRequest {
    if (
      proctorActor.role !== 'proctor' &&
      proctorActor.role !== 'incharge' &&
      proctorActor.role !== 'admin'
    ) {
      throw new Error(
        'Unauthorized: Only assigned Proctors or In-Charge can submit reviews.'
      );
    }

    const idx = this.requests.findIndex((request) => request.id === id);

    if (idx === -1) {
      throw new Error('Request not found');
    }

    const current = this.requests[idx];

    let targetStatus: EventStatus;

    if (decision === 'recommend_approval') {
      targetStatus = 'Recommended for Approval';
    } else if (decision === 'recommend_rejection') {
      targetStatus = 'Recommended for Rejection';
    } else {
      targetStatus = 'Returned for Correction';
    }

    const validation = validateTransition(
      current.status,
      targetStatus,
      'proctor',
      remarks
    );

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
      correctionRemarks:
        decision === 'return_for_correction' ? remarks : undefined,
      updatedAt: now,
      version: current.version + 1,
    };

    this.recordAuditLog({
      actorUid: proctorActor.uid,
      actorName: proctorActor.displayName,
      actorRole: proctorActor.role,
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

    this.createNotification({
      recipientUid: current.studentUid,
      title:
        decision === 'return_for_correction'
          ? 'Request Returned for Correction'
          : `Proctor Recommendation: ${
              decision === 'recommend_approval'
                ? 'Recommended for Approval'
                : 'Recommended for Rejection'
            }`,
      message: `${proctorActor.displayName} has reviewed "${current.title}". Remarks: ${remarks}`,
      type:
        decision === 'recommend_approval'
          ? 'success'
          : decision === 'return_for_correction'
          ? 'warning'
          : 'alert',
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

    if (
      !actor ||
      (actor.role !== 'incharge' && actor.role !== 'admin')
    ) {
      throw new Error(
        'Unauthorized: Only Technical-Event In-Charge can make final decisions.'
      );
    }

    const idx = this.requests.findIndex((request) => request.id === id);

    if (idx === -1) {
      throw new Error('Request not found');
    }

    const current = this.requests[idx];

    const targetStatus: EventStatus =
      decision === 'Approved'
        ? 'Approved'
        : decision === 'Rejected'
        ? 'Rejected'
        : 'Returned for Correction';

    const validation = validateTransition(
      current.status,
      targetStatus,
      'incharge',
      remarks
    );

    if (!validation.allowed) {
      throw new Error(validation.reason);
    }

    if (isOverride && (!overrideReason || !overrideReason.trim())) {
      throw new Error(
        'An explicit justification reason is required when overriding attendance eligibility.'
      );
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
      correctionRemarks:
        decision === 'Returned' ? remarks : undefined,
      updatedAt: now,
      version: current.version + 1,
    };

    this.recordAuditLog({
      actorUid: actor.uid,
      actorName: actor.displayName,
      actorRole: actor.role,
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

    this.createNotification({
      recipientUid: current.studentUid,
      title: `Event Request ${decision}`,
      message: `Your request "${current.title}" was ${decision.toLowerCase()} by ${actor.displayName}. Remarks: ${remarks}`,
      type:
        decision === 'Approved'
          ? 'success'
          : decision === 'Rejected'
          ? 'alert'
          : 'warning',
      link: `/student/requests/${current.id}`,
    });

    this.persistAll();
    return this.requests[idx];
  }

  public withdrawEventRequest(
    id: string,
    studentActor: UserProfile
  ): EventRequest {
    const idx = this.requests.findIndex((request) => request.id === id);

    if (idx === -1) {
      throw new Error('Request not found');
    }

    const current = this.requests[idx];

    if (current.studentUid !== studentActor.uid) {
      throw new Error(
        'Unauthorized: You cannot withdraw another student\'s request.'
      );
    }

    const validation = validateTransition(
      current.status,
      'Withdrawn',
      'student'
    );

    if (!validation.allowed) {
      throw new Error(validation.reason);
    }

    this.requests[idx] = {
      ...current,
      status: 'Withdrawn',
      updatedAt: new Date().toISOString(),
      version: current.version + 1,
    };

    this.recordAuditLog({
      actorUid: studentActor.uid,
      actorName: studentActor.displayName,
      actorRole: 'student',
      action: 'EVENT_REQUEST_WITHDRAWN',
      targetType: 'request',
      targetId: id,
      details: {
        referenceNumber: current.referenceNumber,
        previousStatus: current.status,
      },
    });

    this.persistAll();
    return this.requests[idx];
  }

  // Audit Logs

  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() -
        new Date(a.timestamp).getTime()
    );
  }

  public recordAuditLog(
    entry: Omit<AuditLog, 'id' | 'timestamp'>
  ): void {
    const log: AuditLog = {
      ...entry,
      id: `log-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 5)}`,
      timestamp: new Date().toISOString(),
    };

    this.auditLogs.unshift(log);
    setStorageItem('audit_logs', this.auditLogs);
  }

  // Notifications

  public getNotifications(recipientUid: string): NotificationItem[] {
    return this.notifications
      .filter((notification) => notification.recipientUid === recipientUid)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );
  }

  public createNotification(
    entry: Omit<NotificationItem, 'id' | 'isRead' | 'createdAt'>
  ): void {
    const notification: NotificationItem = {
      ...entry,
      id: `notif-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 5)}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    this.notifications.unshift(notification);
    setStorageItem('notifications', this.notifications);
  }

  public markNotificationAsRead(id: string): void {
    const idx = this.notifications.findIndex(
      (notification) => notification.id === id
    );

    if (idx !== -1) {
      this.notifications[idx].isRead = true;
      setStorageItem('notifications', this.notifications);
    }
  }

  public markAllNotificationsAsRead(recipientUid: string): void {
    this.notifications.forEach((notification) => {
      if (notification.recipientUid === recipientUid) {
        notification.isRead = true;
      }
    });

    setStorageItem('notifications', this.notifications);
  }
}

export const eventPassStore = new EventPassStore();
