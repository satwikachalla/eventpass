import { EventStatus, UserRole } from '@/types';

/**
 * Valid state transitions mapping:
 * Key: current status
 * Value: array of allowed next statuses
 */
export const ALLOWED_TRANSITIONS: Record<EventStatus, { nextStatuses: EventStatus[]; allowedRoles: UserRole[] }[]> = {
  Draft: [
    { nextStatuses: ['Submitted', 'Under Proctor Review'], allowedRoles: ['student'] },
  ],
  Submitted: [
    { nextStatuses: ['Under Proctor Review'], allowedRoles: ['student', 'proctor', 'incharge', 'admin'] },
    { nextStatuses: ['Withdrawn'], allowedRoles: ['student'] },
  ],
  'Under Proctor Review': [
    { nextStatuses: ['Recommended for Approval', 'Recommended for Rejection', 'Returned for Correction'], allowedRoles: ['proctor', 'incharge', 'admin'] },
    { nextStatuses: ['Withdrawn'], allowedRoles: ['student'] },
  ],
  'Returned for Correction': [
    { nextStatuses: ['Under Proctor Review'], allowedRoles: ['student'] },
    { nextStatuses: ['Withdrawn'], allowedRoles: ['student'] },
  ],
  'Recommended for Approval': [
    { nextStatuses: ['Approved', 'Rejected', 'Returned for Correction'], allowedRoles: ['incharge', 'admin'] },
  ],
  'Recommended for Rejection': [
    { nextStatuses: ['Approved', 'Rejected', 'Returned for Correction'], allowedRoles: ['incharge', 'admin'] },
  ],
  'Pending Final Decision': [
    { nextStatuses: ['Approved', 'Rejected', 'Returned for Correction'], allowedRoles: ['incharge', 'admin'] },
  ],
  Approved: [], // Finalized terminal state
  Rejected: [], // Finalized terminal state
  Withdrawn: [], // Finalized terminal state
};

export interface TransitionValidationResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Validates whether a state transition is legal according to role permissions and state rules
 */
export function validateTransition(
  currentStatus: EventStatus,
  nextStatus: EventStatus,
  userRole: UserRole,
  remarks?: string
): TransitionValidationResult {
  // Disallow transitioning to the same status
  if (currentStatus === nextStatus) {
    return { allowed: false, reason: `Request is already in status '${currentStatus}'.` };
  }

  // Finalized states cannot be changed
  if (currentStatus === 'Approved' || currentStatus === 'Rejected' || currentStatus === 'Withdrawn') {
    return { allowed: false, reason: `Cannot modify a request in finalized status '${currentStatus}'.` };
  }

  // Proctors can NEVER issue final approval or final rejection
  if (userRole === 'proctor' && (nextStatus === 'Approved' || nextStatus === 'Rejected')) {
    return { allowed: false, reason: 'Proctors cannot issue final approval or rejection. Only Technical-Event In-Charge can finalize decisions.' };
  }

  // Students can NEVER approve, reject, or recommend requests
  if (userRole === 'student') {
    const studentForbidden: EventStatus[] = [
      'Approved',
      'Rejected',
      'Recommended for Approval',
      'Recommended for Rejection',
    ];
    if (studentForbidden.includes(nextStatus)) {
      return { allowed: false, reason: 'Students cannot approve, reject, or recommend event requests.' };
    }
  }

  // Find transition rule
  const rules = ALLOWED_TRANSITIONS[currentStatus] || [];
  const matchingRule = rules.find((r) => r.nextStatuses.includes(nextStatus));

  if (!matchingRule) {
    return {
      allowed: false,
      reason: `Illegal state transition from '${currentStatus}' to '${nextStatus}'.`,
    };
  }

  if (!matchingRule.allowedRoles.includes(userRole)) {
    return {
      allowed: false,
      reason: `Role '${userRole}' is not authorized to transition request from '${currentStatus}' to '${nextStatus}'.`,
    };
  }

  // Remark requirements
  if (nextStatus === 'Rejected' && (!remarks || remarks.trim().length === 0)) {
    return { allowed: false, reason: 'A meaningful rejection reason is mandatory when rejecting a request.' };
  }

  if (nextStatus === 'Returned for Correction' && (!remarks || remarks.trim().length === 0)) {
    return { allowed: false, reason: 'Remarks explaining required corrections are mandatory when returning a request.' };
  }

  if (nextStatus === 'Recommended for Rejection' && (!remarks || remarks.trim().length === 0)) {
    return { allowed: false, reason: 'Remarks are mandatory when recommending rejection.' };
  }

  return { allowed: true };
}

/**
 * Checks for date overlap between an existing list of requests and a candidate date range.
 * Returns true if an overlap is detected.
 */
export function checkDateOverlap(
  existingRequests: { id: string; startDate: string; endDate: string; status: EventStatus }[],
  candidateStartDate: string,
  candidateEndDate: string,
  excludeRequestId?: string
): boolean {
  const candStart = new Date(candidateStartDate).getTime();
  const candEnd = new Date(candidateEndDate).getTime();

  if (isNaN(candStart) || isNaN(candEnd) || candStart > candEnd) {
    return false;
  }

  return existingRequests.some((req) => {
    if (excludeRequestId && req.id === excludeRequestId) return false;
    // Disregard rejected or withdrawn requests
    if (req.status === 'Rejected' || req.status === 'Withdrawn') return false;

    const existStart = new Date(req.startDate).getTime();
    const existEnd = new Date(req.endDate).getTime();
    if (isNaN(existStart) || existEnd) {
      // Overlap condition: startA <= endB && endA >= startB
      return candStart <= existEnd && candEnd >= existStart;
    }
    return false;
  });
}
