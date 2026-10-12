import React, { useState, useMemo } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useAuth } from '@/context/AuthContext';
import { eventPassStore } from '@/lib/store';
import { validateAttendanceRow, generateSampleCsvTemplate } from '@/lib/attendance';
import { AttendanceImportRow, AttendanceDataset } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { exportToCsv, exportToXlsx } from '@/lib/exportUtils';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Clock,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';

export const AttendanceImport: React.FC = () => {
  const { currentUser } = useAuth();
  const { success, error, warning } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<AttendanceImportRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'valid' | 'invalid' | 'duplicate' | 'unmatched'>('all');

  const registeredStudents = useMemo(() => eventPassStore.getUsers().filter((u) => u.role === 'student'), []);
  const knownRollNumbers = useMemo(
    () => new Set(registeredStudents.map((s) => s.rollNumber?.toUpperCase()).filter(Boolean) as string[]),
    [registeredStudents]
  );
  const settings = useMemo(() => eventPassStore.getDepartmentSettings(), []);
  const datasets = useMemo(() => eventPassStore.getAttendanceDatasets(), []);

  // Filtered preview rows by tab
  const validRows = parsedRows.filter((r) => r.status === 'valid');
  const invalidRows = parsedRows.filter((r) => r.status === 'invalid');
  const duplicateRows = parsedRows.filter((r) => r.status === 'duplicate');
  const unmatchedRows = parsedRows.filter((r) => r.status === 'unmatched');

  const displayedRows = useMemo(() => {
    switch (activeTab) {
      case 'valid':
        return validRows;
      case 'invalid':
        return invalidRows;
      case 'duplicate':
        return duplicateRows;
      case 'unmatched':
        return unmatchedRows;
      default:
        return parsedRows;
    }
  }, [activeTab, parsedRows, validRows, invalidRows, duplicateRows, unmatchedRows]);

  // Handle CSV / XLSX parsing
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsParsing(true);
    setParsedRows([]);

    const ext = selectedFile.name.split('.').pop()?.toLowerCase();

    if (ext === 'csv') {
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          processRawRows(results.data as Record<string, any>[]);
          setIsParsing(false);
        },
        error: (err) => {
          error('CSV Parsing Error', err.message);
          setIsParsing(false);
        },
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = evt.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(sheet) as Record<string, any>[];
          processRawRows(json);
        } catch (err: any) {
          error('Excel Parsing Error', err.message);
        } finally {
          setIsParsing(false);
        }
      };
      reader.readAsBinaryString(selectedFile);
    } else {
      error('Unsupported format', 'Please upload a .csv or .xlsx file.');
      setIsParsing(false);
    }
  };

  const processRawRows = (rawRows: Record<string, any>[]) => {
    const seenRollNumbers = new Set<string>();
    const validated = rawRows.map((row, idx) =>
      validateAttendanceRow(row, idx + 1, seenRollNumbers, knownRollNumbers, settings.attendanceThreshold)
    );
    setParsedRows(validated);

    const validCount = validated.filter((r) => r.status === 'valid').length;
    const invalidCount = validated.filter((r) => r.status === 'invalid').length;
    if (invalidCount > 0) {
      warning('Validation Warnings', `Found ${validCount} valid rows and ${invalidCount} invalid rows.`);
    } else {
      success('File Validated', `All ${validCount} records parsed and validated successfully.`);
    }
  };

  // Download Sample Templates
  const handleDownloadSampleCsv = () => {
    const csvContent = generateSampleCsvTemplate();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'EventPass_Attendance_Sample_Template.csv';
    link.click();
  };

  const handleDownloadSampleXlsx = () => {
    const sampleData = [
      { 'Roll Number': 'CS2026-001', 'Student Name': 'Aarav Sharma', 'Department': 'Computer Science', 'Section': 'A', 'Classes Attended': 42, 'Classes Conducted': 48, 'Academic Term': 'Fall 2026' },
      { 'Roll Number': 'CS2026-002', 'Student Name': 'Diya Patel', 'Department': 'Computer Science', 'Section': 'A', 'Classes Attended': 38, 'Classes Conducted': 48, 'Academic Term': 'Fall 2026' },
      { 'Roll Number': 'CS2026-003', 'Student Name': 'Rohan Verma', 'Department': 'Computer Science', 'Section': 'B', 'Classes Attended': 32, 'Classes Conducted': 48, 'Academic Term': 'Fall 2026' },
      { 'Roll Number': 'CS2026-004', 'Student Name': 'Ananya Iyer', 'Department': 'Information Technology', 'Section': 'A', 'Classes Attended': 36, 'Classes Conducted': 48, 'Academic Term': 'Fall 2026' },
      { 'Roll Number': 'CS2026-005', 'Student Name': 'Vikram Reddy', 'Department': 'Information Technology', 'Section': 'B', 'Classes Attended': 45, 'Classes Conducted': 48, 'Academic Term': 'Fall 2026' },
    ];
    exportToXlsx(sampleData, 'EventPass_Attendance_Sample_Template', 'Attendance');
  };

  // Safe Versioned Dataset Commit
  const handleCommitDataset = () => {
    if (!currentUser) return;
    if (validRows.length === 0) {
      error('No Valid Rows', 'There are no valid records available to commit.');
      return;
    }

    setIsCommitting(true);
    try {
      const nextVersion = `v1.${datasets.length}.0`;
      const recordsToCommit = validRows.map((r) => {
        const student = registeredStudents.find(
          (s) => s.rollNumber?.toUpperCase() === r.rollNumber.toUpperCase()
        );
        return {
          rollNumber: r.rollNumber,
          studentUid: student?.uid,
          studentName: student?.displayName || r.studentName,
          department: student?.department || r.department,
          section: student?.section || r.section,
          classesAttended: r.classesAttended,
          classesConducted: r.classesConducted,
          calculatedPercentage: r.calculatedPercentage,
          isEligible: r.isEligible,
          statusText: r.isEligible ? ('Eligible' as const) : ('Ineligible' as const),
          academicTerm: r.academicTerm || 'Fall 2026',
          isStale: false,
        };
      });

      const newDataset = eventPassStore.commitAttendanceDataset(
        {
          version: nextVersion,
          filename: file?.name || 'Manual_Import.csv',
          uploadedByUid: currentUser.uid,
          uploadedByName: currentUser.displayName,
          uploadedAt: new Date().toISOString(),
          totalRows: parsedRows.length,
          validRows: validRows.length,
          invalidRows: invalidRows.length,
          duplicateRows: duplicateRows.length,
          unmatchedRows: unmatchedRows.length,
          importedRecordsCount: validRows.length,
          thresholdApplied: settings.attendanceThreshold,
        },
        recordsToCommit,
        currentUser
      );

      success(
        'Attendance Committed!',
        `Dataset ${newDataset.version} committed with ${recordsToCommit.length} records. Pending request snapshots recalculated.`
      );

      // Reset preview
      setFile(null);
      setParsedRows([]);
    } catch (err: any) {
      error('Commit Failed', err.message);
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Attendance Batch Import & Validation Engine
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Upload institutional attendance spreadsheets (.csv, .xlsx) with automated integrity verification.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadSampleCsv} leftIcon={<Download className="w-3.5 h-3.5" />}>
            Sample CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadSampleXlsx} leftIcon={<Download className="w-3.5 h-3.5" />}>
            Sample Excel
          </Button>
        </div>
      </div>

      {/* Upload Drop Zone Card */}
      <Card>
        <CardContent className="p-8 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 flex items-center justify-center mx-auto border border-brand-100 dark:border-brand-900 shadow-subtle">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Select Attendance Spreadsheet
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Supports .CSV and .XLSX files. Expected columns: Roll Number, Classes Attended, Classes Conducted.
              </p>
            </div>

            <label className="cursor-pointer inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-md shadow-brand-500/20 transition-all">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Browse File to Inspect</span>
              <input
                type="file"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {file && (
              <div className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Validation Results & Preview */}
      {parsedRows.length > 0 && (
        <div className="space-y-4 animate-fade-in">
          {/* Validation Summary Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <button
              onClick={() => setActiveTab('all')}
              className={`p-3 rounded-xl border text-left transition-all ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900'
                  : 'bg-white dark:bg-navy-850 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="text-[11px] opacity-70">Total Rows</div>
              <div className="text-xl font-bold mt-0.5">{parsedRows.length}</div>
            </button>

            <button
              onClick={() => setActiveTab('valid')}
              className={`p-3 rounded-xl border text-left transition-all ${
                activeTab === 'valid'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300'
              }`}
            >
              <div className="text-[11px] opacity-80">Valid Rows</div>
              <div className="text-xl font-bold mt-0.5">{validRows.length}</div>
            </button>

            <button
              onClick={() => setActiveTab('invalid')}
              className={`p-3 rounded-xl border text-left transition-all ${
                activeTab === 'invalid'
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300'
              }`}
            >
              <div className="text-[11px] opacity-80">Invalid Rows</div>
              <div className="text-xl font-bold mt-0.5">{invalidRows.length}</div>
            </button>

            <button
              onClick={() => setActiveTab('duplicate')}
              className={`p-3 rounded-xl border text-left transition-all ${
                activeTab === 'duplicate'
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300'
              }`}
            >
              <div className="text-[11px] opacity-80">Duplicate Rows</div>
              <div className="text-xl font-bold mt-0.5">{duplicateRows.length}</div>
            </button>

            <button
              onClick={() => setActiveTab('unmatched')}
              className={`p-3 rounded-xl border text-left transition-all ${
                activeTab === 'unmatched'
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900 text-purple-800 dark:text-purple-300'
              }`}
            >
              <div className="text-[11px] opacity-80">Unmatched</div>
              <div className="text-xl font-bold mt-0.5">{unmatchedRows.length}</div>
            </button>
          </div>

          {/* Staged Dataset Commit Action Bar */}
          <div className="bg-white dark:bg-navy-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-600 dark:text-slate-300">
              <span className="font-bold text-slate-900 dark:text-white">Commit Confirmation:</span> Only the{' '}
              <span className="font-bold text-emerald-600">{validRows.length} valid rows</span> will be committed to the master dataset. Invalid rows are excluded automatically.
            </div>

            <Button
              variant="success"
              onClick={handleCommitDataset}
              disabled={validRows.length === 0}
              isLoading={isCommitting}
              leftIcon={<ShieldCheck className="w-4 h-4" />}
            >
              Commit {validRows.length} Valid Records to Master
            </Button>
          </div>

          {/* Validation Rows Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Validation Preview ({displayedRows.length} Records)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Row #</th>
                      <th className="py-2.5 px-3">Roll Number</th>
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3">Attended / Conducted</th>
                      <th className="py-2.5 px-3">Calculated %</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Validation Errors / Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {displayedRows.map((r) => (
                      <tr
                        key={r.rowNumber}
                        className={
                          r.status === 'invalid'
                            ? 'bg-rose-50/40 dark:bg-rose-950/20'
                            : r.status === 'duplicate'
                            ? 'bg-amber-50/40 dark:bg-amber-950/20'
                            : r.status === 'unmatched'
                            ? 'bg-purple-50/40 dark:bg-purple-950/20'
                            : ''
                        }
                      >
                        <td className="py-2.5 px-3 font-mono text-slate-400">{r.rowNumber}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {r.rollNumber || 'MISSING'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{r.studentName || '—'}</td>
                        <td className="py-2.5 px-3 font-medium">
                          {r.classesAttended} / {r.classesConducted}
                        </td>
                        <td className="py-2.5 px-3 font-bold">
                          {r.calculatedPercentage !== null ? `${r.calculatedPercentage}%` : 'Unavailable'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              r.status === 'valid'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : r.status === 'duplicate'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : r.status === 'unmatched'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-rose-600 dark:text-rose-400 font-medium">
                          {r.errors.length > 0 ? r.errors.join(' • ') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dataset Version History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Attendance Dataset Version History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Version</th>
                  <th className="py-3 px-4">Filename</th>
                  <th className="py-3 px-4">Uploaded By</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Committed Records</th>
                  <th className="py-3 px-4">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {datasets.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-brand-600">{d.version}</td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{d.filename}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{d.uploadedByName}</td>
                    <td className="py-3 px-4 text-slate-500">{new Date(d.uploadedAt).toLocaleString()}</td>
                    <td className="py-3 px-4 font-bold text-emerald-600">{d.importedRecordsCount}</td>
                    <td className="py-3 px-4">
                      {d.isActive ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          Active Master
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          Archived
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
