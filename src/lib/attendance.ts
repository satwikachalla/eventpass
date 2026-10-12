import { AttendanceSnapshot, AttendanceRecord, AttendanceImportRow } from '@/types';

export interface CalculationResult {
  percentage: number | null;
  statusText: 'Eligible' | 'Ineligible' | 'Unavailable' | 'Stale Data';
  isEligible: boolean;
  isStale: boolean;
}

/**
 * Calculate attendance percentage and eligibility according to Section 7 specs.
 * Rules:
 * - (Classes Attended / Classes Conducted) * 100
 * - Attendance >= threshold -> Eligible
 * - Attendance < threshold -> Ineligible
 * - Exactly at threshold -> Eligible
 * - If data missing or conducted == 0 -> 'Unavailable', ineligible
 * - If staleness exceeds limit -> 'Stale Data', ineligible (requires verification warning)
 */
export function calculateAttendanceEligibility(
  classesAttended: number | null | undefined,
  classesConducted: number | null | undefined,
  threshold: number = 75,
  lastVerifiedDate?: string | Date | null,
  stalenessDays: number = 30
): CalculationResult {
  // If either count is missing or undefined
  if (
    classesAttended === null ||
    classesAttended === undefined ||
    classesConducted === null ||
    classesConducted === undefined ||
    isNaN(Number(classesAttended)) ||
    isNaN(Number(classesConducted))
  ) {
    return {
      percentage: null,
      statusText: 'Unavailable',
      isEligible: false,
      isStale: false,
    };
  }

  const attended = Number(classesAttended);
  const conducted = Number(classesConducted);

  // If classes conducted is 0, show Unavailable, not 0%
  if (conducted <= 0) {
    return {
      percentage: null,
      statusText: 'Unavailable',
      isEligible: false,
      isStale: false,
    };
  }

  // Calculate percentage rounded to 2 decimal places
  const percentage = Math.round((attended / conducted) * 10000) / 100;

  // Check staleness
  let isStale = false;
  if (lastVerifiedDate) {
    const verifiedTime = new Date(lastVerifiedDate).getTime();
    if (!isNaN(verifiedTime)) {
      const diffDays = (Date.now() - verifiedTime) / (1000 * 60 * 60 * 24);
      if (diffDays > stalenessDays) {
        isStale = true;
      }
    }
  }

  if (isStale) {
    return {
      percentage,
      statusText: 'Stale Data',
      isEligible: false, // Staleness must not automatically qualify
      isStale: true,
    };
  }

  const isEligible = percentage >= threshold;
  return {
    percentage,
    statusText: isEligible ? 'Eligible' : 'Ineligible',
    isEligible,
    isStale: false,
  };
}

/**
 * Validate an imported attendance row.
 */
export function validateAttendanceRow(
  rawRow: Record<string, any>,
  rowNumber: number,
  seenRollNumbers: Set<string>,
  knownStudentRollNumbers?: Set<string>,
  threshold: number = 75
): AttendanceImportRow {
  const errors: string[] = [];

  // Extract roll number with safe variations
  const rollNumberRaw =
    rawRow['Roll Number'] ??
    rawRow['rollNumber'] ??
    rawRow['Roll No'] ??
    rawRow['roll_number'] ??
    rawRow['RollNo'] ??
    '';
  const rollNumber = String(rollNumberRaw).trim().toUpperCase();

  const studentName =
    String(
      rawRow['Student Name'] ??
      rawRow['studentName'] ??
      rawRow['Name'] ??
      rawRow['name'] ??
      ''
    ).trim() || undefined;

  const department =
    String(
      rawRow['Department'] ??
      rawRow['department'] ??
      rawRow['Dept'] ??
      ''
    ).trim() || undefined;

  const section =
    String(
      rawRow['Section'] ??
      rawRow['section'] ??
      rawRow['Sec'] ??
      ''
    ).trim() || undefined;

  const academicTerm =
    String(
      rawRow['Academic Term'] ??
      rawRow['academicTerm'] ??
      rawRow['Term'] ??
      rawRow['Semester'] ??
      'Fall 2026'
    ).trim();

  // Validate missing roll number
  if (!rollNumber) {
    errors.push('Missing roll number.');
  }

  // Validate duplicates in the same import file
  let isDuplicate = false;
  if (rollNumber) {
    if (seenRollNumbers.has(rollNumber)) {
      errors.push(`Duplicate roll number '${rollNumber}' in the same file.`);
      isDuplicate = true;
    } else {
      seenRollNumbers.add(rollNumber);
    }
  }

  // Validate unknown students if known students set provided
  let isUnmatched = false;
  if (rollNumber && knownStudentRollNumbers && knownStudentRollNumbers.size > 0) {
    if (!knownStudentRollNumbers.has(rollNumber)) {
      // Flag as unmatched student record
      isUnmatched = true;
      errors.push(`Roll number '${rollNumber}' is not matched to any registered student.`);
    }
  }

  // Attended count
  const attendedRaw =
    rawRow['Classes Attended'] ??
    rawRow['classesAttended'] ??
    rawRow['Attended'] ??
    rawRow['classes_attended'];

  // Conducted count
  const conductedRaw =
    rawRow['Classes Conducted'] ??
    rawRow['classesConducted'] ??
    rawRow['Conducted'] ??
    rawRow['classes_conducted'];

  let classesAttended = 0;
  let classesConducted = 0;

  if (attendedRaw === undefined || attendedRaw === null || String(attendedRaw).trim() === '') {
    errors.push('Missing Classes Attended count.');
  } else {
    const val = Number(attendedRaw);
    if (isNaN(val)) {
      errors.push('Classes Attended must be a valid number.');
    } else if (val < 0) {
      errors.push('Classes Attended cannot be negative.');
    } else if (!Number.isInteger(val)) {
      errors.push('Classes Attended must be an integer.');
    } else {
      classesAttended = val;
    }
  }

  if (conductedRaw === undefined || conductedRaw === null || String(conductedRaw).trim() === '') {
    errors.push('Missing Classes Conducted count.');
  } else {
    const val = Number(conductedRaw);
    if (isNaN(val)) {
      errors.push('Classes Conducted must be a valid number.');
    } else if (val < 0) {
      errors.push('Classes Conducted cannot be negative.');
    } else if (val === 0) {
      errors.push('Classes Conducted cannot be zero.');
    } else if (!Number.isInteger(val)) {
      errors.push('Classes Conducted must be an integer.');
    } else {
      classesConducted = val;
    }
  }

  // Classes attended cannot exceed classes conducted
  if (classesConducted > 0 && classesAttended > classesConducted) {
    errors.push(`Classes Attended (${classesAttended}) cannot exceed Classes Conducted (${classesConducted}).`);
  }

  // Optional supplied percentage verification
  const suppliedPercentageRaw =
    rawRow['Attendance %'] ??
    rawRow['Percentage'] ??
    rawRow['percentage'];
  if (suppliedPercentageRaw !== undefined && suppliedPercentageRaw !== null && String(suppliedPercentageRaw).trim() !== '') {
    const suppliedPct = Number(suppliedPercentageRaw);
    if (isNaN(suppliedPct) || suppliedPct < 0 || suppliedPct > 100) {
      errors.push('Supplied percentage must be between 0 and 100.');
    } else if (classesConducted > 0) {
      const calcPct = Math.round((classesAttended / classesConducted) * 10000) / 100;
      if (Math.abs(suppliedPct - calcPct) > 1.5) {
        errors.push(`Supplied percentage (${suppliedPct}%) is inconsistent with Attended/Conducted ratio (${calcPct}%).`);
      }
    }
  }

  // Determine status
  let status: 'valid' | 'invalid' | 'duplicate' | 'unmatched' = 'valid';
  if (isDuplicate) {
    status = 'duplicate';
  } else if (isUnmatched) {
    status = 'unmatched';
  } else if (errors.length > 0) {
    status = 'invalid';
  }

  const calc = calculateAttendanceEligibility(classesAttended, classesConducted, threshold);

  return {
    rowNumber,
    rollNumber,
    studentName,
    department,
    section,
    classesAttended,
    classesConducted,
    academicTerm,
    status,
    errors,
    calculatedPercentage: calc.percentage,
    isEligible: calc.isEligible,
  };
}

/**
 * Generates sample CSV template string
 */
export function generateSampleCsvTemplate(): string {
  return `Roll Number,Student Name,Department,Section,Classes Attended,Classes Conducted,Academic Term
CS2026-001,Aarav Sharma,Computer Science,A,42,48,Fall 2026
CS2026-002,Diya Patel,Computer Science,A,38,48,Fall 2026
CS2026-003,Rohan Verma,Computer Science,B,32,48,Fall 2026
CS2026-004,Ananya Iyer,Information Technology,A,36,48,Fall 2026
CS2026-005,Vikram Reddy,Information Technology,B,45,48,Fall 2026`;
}
