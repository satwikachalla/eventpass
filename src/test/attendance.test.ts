import { describe, it, expect } from 'vitest';
import { calculateAttendanceEligibility, validateAttendanceRow } from '../lib/attendance';

describe('Attendance Calculation Engine', () => {
  it('correctly calculates percentage: 36 / 48 = 75%', () => {
    const res = calculateAttendanceEligibility(36, 48, 75);
    expect(res.percentage).toBe(75);
    expect(res.isEligible).toBe(true);
    expect(res.statusText).toBe('Eligible');
  });

  it('evaluates attendance exactly at 75% threshold as eligible', () => {
    const res = calculateAttendanceEligibility(75, 100, 75);
    expect(res.percentage).toBe(75);
    expect(res.isEligible).toBe(true);
    expect(res.statusText).toBe('Eligible');
  });

  it('evaluates attendance below 75% as ineligible', () => {
    const res = calculateAttendanceEligibility(35, 48, 75); // 72.92%
    expect(res.percentage).toBe(72.92);
    expect(res.isEligible).toBe(false);
    expect(res.statusText).toBe('Ineligible');
  });

  it('evaluates attendance above threshold as eligible', () => {
    const res = calculateAttendanceEligibility(45, 48, 75); // 93.75%
    expect(res.percentage).toBe(93.75);
    expect(res.isEligible).toBe(true);
    expect(res.statusText).toBe('Eligible');
  });

  it('returns Unavailable when attendance data is missing or undefined', () => {
    const res = calculateAttendanceEligibility(null, 50, 75);
    expect(res.percentage).toBeNull();
    expect(res.statusText).toBe('Unavailable');
    expect(res.isEligible).toBe(false);
  });

  it('returns Unavailable, not 0%, when classes conducted is zero', () => {
    const res = calculateAttendanceEligibility(0, 0, 75);
    expect(res.percentage).toBeNull();
    expect(res.statusText).toBe('Unavailable');
    expect(res.isEligible).toBe(false);
  });

  it('flags stale attendance data and prevents automatic qualification', () => {
    const fortyDaysAgo = new Date(Date.now() - 40 * 86400000).toISOString();
    const res = calculateAttendanceEligibility(45, 50, 75, fortyDaysAgo, 30);
    expect(res.isStale).toBe(true);
    expect(res.statusText).toBe('Stale Data');
    expect(res.isEligible).toBe(false);
  });
});

describe('Attendance Import Row Validator', () => {
  it('validates a correct row successfully', () => {
    const seen = new Set<string>();
    const row = {
      'Roll Number': 'CS2026-001',
      'Student Name': 'Aarav Sharma',
      'Department': 'Computer Science',
      'Classes Attended': '40',
      'Classes Conducted': '50',
    };
    const res = validateAttendanceRow(row, 1, seen);
    expect(res.status).toBe('valid');
    expect(res.errors).toHaveLength(0);
    expect(res.calculatedPercentage).toBe(80);
    expect(res.isEligible).toBe(true);
  });

  it('rejects row with missing roll number', () => {
    const seen = new Set<string>();
    const row = {
      'Student Name': 'Aarav Sharma',
      'Classes Attended': '40',
      'Classes Conducted': '50',
    };
    const res = validateAttendanceRow(row, 1, seen);
    expect(res.status).toBe('invalid');
    expect(res.errors).toContain('Missing roll number.');
  });

  it('identifies duplicate roll numbers within the same file', () => {
    const seen = new Set<string>(['CS2026-001']);
    const row = {
      'Roll Number': 'CS2026-001',
      'Classes Attended': '40',
      'Classes Conducted': '50',
    };
    const res = validateAttendanceRow(row, 2, seen);
    expect(res.status).toBe('duplicate');
    expect(res.errors.some((e) => e.includes('Duplicate roll number'))).toBe(true);
  });

  it('rejects rows where Classes Attended exceeds Classes Conducted', () => {
    const seen = new Set<string>();
    const row = {
      'Roll Number': 'CS2026-002',
      'Classes Attended': '55',
      'Classes Conducted': '50',
    };
    const res = validateAttendanceRow(row, 1, seen);
    expect(res.status).toBe('invalid');
    expect(res.errors.some((e) => e.includes('cannot exceed'))).toBe(true);
  });

  it('rejects negative attendance counts', () => {
    const seen = new Set<string>();
    const row = {
      'Roll Number': 'CS2026-003',
      'Classes Attended': '-5',
      'Classes Conducted': '50',
    };
    const res = validateAttendanceRow(row, 1, seen);
    expect(res.status).toBe('invalid');
    expect(res.errors.some((e) => e.includes('cannot be negative'))).toBe(true);
  });

  it('identifies unmatched student records when known list is provided', () => {
    const seen = new Set<string>();
    const known = new Set<string>(['CS2026-001', 'CS2026-002']);
    const row = {
      'Roll Number': 'CS2026-999',
      'Classes Attended': '40',
      'Classes Conducted': '50',
    };
    const res = validateAttendanceRow(row, 1, seen, known);
    expect(res.status).toBe('unmatched');
    expect(res.errors.some((e) => e.includes('not matched'))).toBe(true);
  });
});
