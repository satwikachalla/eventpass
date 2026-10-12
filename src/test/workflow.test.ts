import { describe, it, expect } from 'vitest';
import { validateTransition, checkDateOverlap } from '../lib/workflow';

describe('Workflow State Machine and Role Authorization', () => {
  it('allows student to submit draft to Under Proctor Review', () => {
    const res = validateTransition('Draft', 'Under Proctor Review', 'student');
    expect(res.allowed).toBe(true);
  });

  it('allows proctor to recommend approval from Under Proctor Review', () => {
    const res = validateTransition('Under Proctor Review', 'Recommended for Approval', 'proctor');
    expect(res.allowed).toBe(true);
  });

  it('allows proctor to return request for correction with remarks', () => {
    const res = validateTransition('Under Proctor Review', 'Returned for Correction', 'proctor', 'Please upload signed brochure.');
    expect(res.allowed).toBe(true);
  });

  it('rejects proctor returning request without remarks', () => {
    const res = validateTransition('Under Proctor Review', 'Returned for Correction', 'proctor', '');
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain('mandatory');
  });

  it('FORBIDS proctor from issuing final approval', () => {
    const res = validateTransition('Under Proctor Review', 'Approved', 'proctor', 'Approved by me');
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain('Proctors cannot issue final approval');
  });

  it('FORBIDS proctor from issuing final rejection', () => {
    const res = validateTransition('Under Proctor Review', 'Rejected', 'proctor', 'Rejected by me');
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain('Proctors cannot issue final approval or rejection');
  });

  it('FORBIDS student from approving or recommending requests', () => {
    const res = validateTransition('Under Proctor Review', 'Approved', 'student');
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain('Students cannot');
  });

  it('allows In-Charge to issue final approval from Recommended for Approval', () => {
    const res = validateTransition('Recommended for Approval', 'Approved', 'incharge', 'Approved for OD');
    expect(res.allowed).toBe(true);
  });

  it('allows In-Charge to issue final rejection with reason', () => {
    const res = validateTransition('Recommended for Approval', 'Rejected', 'incharge', 'Event overlaps with semester midterms.');
    expect(res.allowed).toBe(true);
  });

  it('FORBIDS In-Charge from rejecting without a reason', () => {
    const res = validateTransition('Recommended for Approval', 'Rejected', 'incharge', '');
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain('rejection reason is mandatory');
  });

  it('FORBIDS modifying an Approved finalized request', () => {
    const res = validateTransition('Approved', 'Under Proctor Review', 'incharge');
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain('Cannot modify a request in finalized status');
  });

  it('allows student to withdraw pending request', () => {
    const res = validateTransition('Under Proctor Review', 'Withdrawn', 'student');
    expect(res.allowed).toBe(true);
  });
});

describe('Date Overlap Detector', () => {
  it('detects overlapping date ranges for active requests', () => {
    const existing = [
      { id: '1', startDate: '2026-11-10', endDate: '2026-11-15', status: 'Approved' as const },
    ];
    // Candidate completely inside
    expect(checkDateOverlap(existing, '2026-11-12', '2026-11-13')).toBe(true);
    // Candidate overlapping start
    expect(checkDateOverlap(existing, '2026-11-08', '2026-11-11')).toBe(true);
    // Candidate non-overlapping
    expect(checkDateOverlap(existing, '2026-11-20', '2026-11-25')).toBe(false);
  });

  it('ignores rejected and withdrawn requests when checking overlaps', () => {
    const existing = [
      { id: '1', startDate: '2026-11-10', endDate: '2026-11-15', status: 'Rejected' as const },
      { id: '2', startDate: '2026-11-10', endDate: '2026-11-15', status: 'Withdrawn' as const },
    ];
    expect(checkDateOverlap(existing, '2026-11-12', '2026-11-13')).toBe(false);
  });
});
