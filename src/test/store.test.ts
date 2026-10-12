import { describe, it, expect, beforeEach } from 'vitest';
import { eventPassStore } from '../lib/store';
import { UserProfile, EventRequest } from '../types';

describe('EventPass RBAC and Store Security Engine', () => {
  beforeEach(() => {
    eventPassStore.resetToDefault();
  });

  it('registers students unassigned until In-Charge selects a proctor', () => {
    const newUser = eventPassStore.createOrRegisterUser({
      uid: 'user-new-999',
      email: 'newstudent@college.edu',
      displayName: 'New Student Test',
    });

    expect(newUser.role).toBe('student');
    expect(newUser.rollNumber).toBeDefined();
    expect(newUser.assignedProctorId).toBeUndefined();

    const incharge = eventPassStore.getUsers().find((user) => user.role === 'incharge')!;
    const proctor = eventPassStore.getUsers().find((user) => user.role === 'proctor')!;
    eventPassStore.assignProctorToStudent(newUser.uid, proctor.uid, incharge);
    expect(eventPassStore.getUserById(newUser.uid)?.assignedProctorId).toBe(proctor.uid);
  });

  it('prevents user from modifying their own role via profile update', () => {
    const student = eventPassStore.getUsers().find((u) => u.uid === 'student-001')!;
    // Attempt to inject elevated role
    const updated = eventPassStore.updateUserProfile(student.uid, {
      displayName: 'Aarav Sharma Updated',
      role: 'admin' as any,
    });

    expect(updated.displayName).toBe('Aarav Sharma Updated');
    expect(updated.role).toBe('student'); // Role was not elevated!
  });

  it('allows ONLY admin to change user roles', () => {
    const admin = eventPassStore.getUsers().find((u) => u.role === 'admin')!;
    const student = eventPassStore.getUsers().find((u) => u.uid === 'student-002')!;

    // Admin elevates role
    eventPassStore.updateUserRole(student.uid, 'proctor', admin);
    const elevated = eventPassStore.getUserById(student.uid);
    expect(elevated?.role).toBe('proctor');

    // Non-admin attempting to elevate throws error
    expect(() => {
      eventPassStore.updateUserRole(student.uid, 'admin', student);
    }).toThrow(/Unauthorized/);
  });

  it('allows only admin or incharge to assign proctor to student', () => {
    const admin = eventPassStore.getUsers().find((u) => u.role === 'admin')!;
    const proctor2 = eventPassStore.getUsers().find((u) => u.uid === 'proctor-002')!;
    const student = eventPassStore.getUsers().find((u) => u.uid === 'student-001')!;

    eventPassStore.assignProctorToStudent(student.uid, proctor2.uid, admin);
    const updatedStudent = eventPassStore.getUserById(student.uid);
    expect(updatedStudent?.assignedProctorId).toBe('proctor-002');
    expect(updatedStudent?.assignedProctorName).toBe(proctor2.displayName);

    // Student attempting throws
    expect(() => {
      eventPassStore.assignProctorToStudent(student.uid, proctor2.uid, student);
    }).toThrow(/Unauthorized/);
  });

  it('routes a student request through the assigned proctor to In-Charge', () => {
    const incharge = eventPassStore.getUsers().find((u) => u.role === 'incharge')!;
    const proctor = eventPassStore.getUsers().find((u) => u.uid === 'proctor-002')!;
    const authenticatedStudent = eventPassStore.syncAuthenticatedUser({
      uid: 'google-student-001',
      email: 'google.student@college.edu',
      displayName: 'Google Student',
      role: 'student',
      rollNumber: 'CS2026-101',
      department: 'Computer Science & Engineering',
      academicYear: '3rd Year',
      section: 'A',
      isProfileComplete: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    eventPassStore.assignProctorToStudent(
      authenticatedStudent.uid,
      proctor.uid,
      incharge
    );

    const request = eventPassStore.createEventRequest({
      studentUid: authenticatedStudent.uid,
      studentName: authenticatedStudent.displayName,
      studentRollNumber: authenticatedStudent.rollNumber!,
      studentDepartment: authenticatedStudent.department!,
      studentYear: authenticatedStudent.academicYear!,
      studentSection: authenticatedStudent.section!,
      studentEmail: authenticatedStudent.email,
      title: 'Campus Robotics Workshop',
      organizer: 'Engineering Club',
      category: 'Workshop',
      venueCity: 'Campus',
      startDate: '2026-11-20',
      endDate: '2026-11-20',
      purpose: 'Build practical robotics skills.',
      expectedAcademicBenefit: 'Apply embedded systems coursework.',
    }, authenticatedStudent);

    expect(eventPassStore.getUsers().find((user) => user.uid === authenticatedStudent.uid)?.assignedProctorId)
      .toBe(proctor.uid);
    expect(eventPassStore.getEventRequests({ role: 'proctor', userUid: proctor.uid }))
      .toContainEqual(expect.objectContaining({ id: request.id }));
    expect(eventPassStore.getNotifications(proctor.uid))
      .toContainEqual(expect.objectContaining({ link: `/proctor/review/${request.id}` }));

    expect(() => eventPassStore.submitProctorReview(
      request.id,
      'recommend_approval',
      'Recommended.',
      eventPassStore.getUsers().find((user) => user.uid === 'proctor-001')!
    )).toThrow(/not assigned/);

    const recommendation = eventPassStore.submitProctorReview(
      request.id,
      'recommend_approval',
      'Recommended for approval.',
      proctor
    );
    expect(recommendation.status).toBe('Recommended for Approval');
    expect(eventPassStore.getNotifications(incharge.uid))
      .toContainEqual(expect.objectContaining({ link: `/incharge/requests/${request.id}` }));

    const finalized = eventPassStore.submitFinalDecision(
      request.id,
      'Approved',
      'Approved for participation.',
      false,
      undefined,
      incharge
    );
    expect(finalized.status).toBe('Approved');
    expect(eventPassStore.getNotifications(authenticatedStudent.uid))
      .toContainEqual(expect.objectContaining({ title: 'Event Request Approved' }));
  });

  it('moves pending requests to the newly assigned proctor dashboard', () => {
    const incharge = eventPassStore.getUsers().find((u) => u.role === 'incharge')!;
    const student = eventPassStore.getUserById('student-010')!;
    const previousProctor = eventPassStore.getUserById(student.assignedProctorId!)!;
    const newProctor = eventPassStore.getUserById('proctor-002')!;
    let changeCount = 0;
    const unsubscribe = eventPassStore.subscribe(() => {
      changeCount += 1;
    });

    eventPassStore.assignProctorToStudent(student.uid, newProctor.uid, incharge);
    unsubscribe();

    expect(changeCount).toBeGreaterThan(0);
    expect(eventPassStore.getEventRequests({ role: 'proctor', userUid: previousProctor.uid }))
      .not.toContainEqual(expect.objectContaining({ id: 'req-006' }));
    expect(eventPassStore.getEventRequests({ role: 'proctor', userUid: newProctor.uid }))
      .toContainEqual(expect.objectContaining({ id: 'req-006' }));
    expect(eventPassStore.getNotifications(newProctor.uid))
      .toContainEqual(expect.objectContaining({ link: '/proctor/review/req-006' }));
  });

  it('reloads shared users when another tab updates localStorage', () => {
    const student = eventPassStore.getUserById('student-010')!;
    const users = eventPassStore.getUsers().map((user) =>
      user.uid === student.uid
        ? { ...user, assignedProctorId: 'proctor-002' }
        : user
    );
    const serializedUsers = JSON.stringify(users);

    localStorage.setItem('eventpass_users', serializedUsers);
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'eventpass_users',
      newValue: serializedUsers,
    }));

    expect(eventPassStore.getUserById(student.uid)?.assignedProctorId)
      .toBe('proctor-002');
  });

  it('forbids students from submitting requests on behalf of other students', () => {
    const student1 = eventPassStore.getUsers().find((u) => u.uid === 'student-001')!;
    const student2 = eventPassStore.getUsers().find((u) => u.uid === 'student-002')!;

    // Student 2 tries to edit Student 1's request
    expect(() => {
      eventPassStore.updateEventRequest('req-003', { title: 'Hacked Title' }, student2);
    }).toThrow(/Forbidden/);
  });

  it('forbids students from editing finalized requests (Approved or Rejected)', () => {
    const student1 = eventPassStore.getUsers().find((u) => u.uid === 'student-001')!;
    // req-001 is already Approved
    expect(() => {
      eventPassStore.updateEventRequest('req-001', { title: 'Edited Title' }, student1);
    }).toThrow(/Cannot edit request in status 'Approved'/);
  });

  it('records immutable audit log entry for every privileged action', () => {
    const admin = eventPassStore.getUsers().find((u) => u.role === 'admin')!;
    const initialLogsCount = eventPassStore.getAuditLogs().length;

    eventPassStore.updateDepartmentSettings({ attendanceThreshold: 78 }, admin);

    const updatedLogs = eventPassStore.getAuditLogs();
    expect(updatedLogs.length).toBe(initialLogsCount + 1);
    expect(updatedLogs[0].action).toBe('DEPARTMENT_SETTINGS_UPDATED');
    expect(updatedLogs[0].actorRole).toBe('admin');
  });

  it('recalculates pending requests when threshold changes, but preserves finalized requests', () => {
    const admin = eventPassStore.getUsers().find((u) => u.role === 'admin')!;
    const approvedBefore = eventPassStore.getEventRequestById('req-001')!;
    const approvedSnapshotThresholdBefore = approvedBefore.attendanceSnapshot.threshold;

    // Change threshold to 80%
    eventPassStore.updateDepartmentSettings({ attendanceThreshold: 80 }, admin);

    // Finalized request retains original historical evidence
    const approvedAfter = eventPassStore.getEventRequestById('req-001')!;
    expect(approvedAfter.attendanceSnapshot.threshold).toBe(approvedSnapshotThresholdBefore);

    // Pending request has updated snapshot
    const pendingReq = eventPassStore.getEventRequestById('req-006')!;
    expect(pendingReq.attendanceSnapshot.threshold).toBe(80);
  });

  it('permits student withdrawal only for non-finalized requests', () => {
    const student = eventPassStore.getUsers().find((u) => u.uid === 'student-010')!;
    // req-006 is Under Proctor Review
    const withdrawn = eventPassStore.withdrawEventRequest('req-006', student);
    expect(withdrawn.status).toBe('Withdrawn');

    // Attempting to withdraw already approved request throws
    const student1 = eventPassStore.getUsers().find((u) => u.uid === 'student-001')!;
    expect(() => {
      eventPassStore.withdrawEventRequest('req-001', student1);
    }).toThrow();
  });
});
