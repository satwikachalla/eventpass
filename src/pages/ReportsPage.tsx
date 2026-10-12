import React, { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { eventPassStore } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { exportToCsv, exportToXlsx } from '@/lib/exportUtils';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  Users,
  CheckCircle2,
  Calendar,
  ShieldAlert,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { currentUser, role } = useAuth();

  const requests = useMemo(() => {
    if (role === 'student') {
      return eventPassStore.getEventRequests({ role: 'student', userUid: currentUser?.uid });
    }
    if (role === 'proctor') {
      return eventPassStore.getEventRequests({ role: 'proctor', userUid: currentUser?.uid });
    }
    return eventPassStore.getEventRequests();
  }, [role, currentUser]);

  const attendanceRecords = useMemo(() => {
    const all = eventPassStore.getAttendanceRecords();
    if (role === 'student') {
      return all.filter((r) => r.rollNumber.toUpperCase() === currentUser?.rollNumber?.toUpperCase());
    }
    return all;
  }, [role, currentUser]);

  const datasets = useMemo(() => eventPassStore.getAttendanceDatasets(), []);

  // 1. Export Request Register
  const exportRequests = (format: 'csv' | 'xlsx') => {
    const data = requests.map((r) => ({
      'Reference Number': r.referenceNumber,
      'Student Name': r.studentName,
      'Roll Number': r.studentRollNumber,
      'Department': r.studentDepartment,
      'Event Title': r.title,
      'Category': r.category,
      'Venue': r.venueCity,
      'Start Date': r.startDate,
      'End Date': r.endDate,
      'Status': r.status,
      'Attendance %': r.attendanceSnapshot.percentage ?? 'N/A',
      'Eligibility Basis': r.attendanceSnapshot.statusText,
      'Proctor Recommendation': r.proctorReview?.decision ?? 'Pending',
      'Final Decision': r.finalDecision?.decision ?? 'Pending',
      'Final Remarks': r.finalDecision?.remarks ?? '',
    }));
    if (format === 'csv') exportToCsv(data, 'EventPass_Event_Requests');
    else exportToXlsx(data, 'EventPass_Event_Requests', 'Requests');
  };

  // 2. Export Attendance Master
  const exportAttendance = (format: 'csv' | 'xlsx') => {
    const data = attendanceRecords.map((r) => ({
      'Roll Number': r.rollNumber,
      'Student Name': r.studentName || '—',
      'Department': r.department || '—',
      'Section': r.section || '—',
      'Classes Attended': r.classesAttended,
      'Classes Conducted': r.classesConducted,
      'Calculated %': r.calculatedPercentage !== null ? `${r.calculatedPercentage}%` : 'Unavailable',
      'Eligibility': r.statusText,
      'Freshness State': r.isStale ? 'Stale Record' : 'Current',
      'Dataset Version': r.datasetVersion,
      'Last Verified': r.lastVerifiedAt,
    }));
    if (format === 'csv') exportToCsv(data, 'EventPass_Attendance_Master');
    else exportToXlsx(data, 'EventPass_Attendance_Master', 'Attendance');
  };

  // 3. Export Attendance Eligibility Summary
  const exportEligibilitySummary = (format: 'csv' | 'xlsx') => {
    const data = attendanceRecords.map((r) => ({
      'Roll Number': r.rollNumber,
      'Student Name': r.studentName || '—',
      'Attendance %': r.calculatedPercentage !== null ? `${r.calculatedPercentage}%` : 'Unavailable',
      'Eligible for OD': r.isEligible ? 'YES' : 'NO',
      'Status Classification': r.statusText,
    }));
    if (format === 'csv') exportToCsv(data, 'Attendance_Eligibility_Summary');
    else exportToXlsx(data, 'Attendance_Eligibility_Summary', 'Summary');
  };

  // 4. Export Import History
  const exportImportHistory = (format: 'csv' | 'xlsx') => {
    const data = datasets.map((d) => ({
      'Dataset Version': d.version,
      'Source Filename': d.filename,
      'Uploaded By': d.uploadedByName,
      'Timestamp': d.uploadedAt,
      'Total Rows': d.totalRows,
      'Committed Records': d.importedRecordsCount,
      'Threshold Applied': `${d.thresholdApplied}%`,
      'Active Master': d.isActive ? 'YES' : 'ARCHIVED',
    }));
    if (format === 'csv') exportToCsv(data, 'Attendance_Import_History');
    else exportToXlsx(data, 'Attendance_Import_History', 'History');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Institutional Reports & Data Exports
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Download certified CSV and Excel spreadsheets respecting role authorization boundaries.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Event Requests Register */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-600" />
              <span>Event Requests Register ({requests.length} records)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-slate-500 leading-relaxed">
              Complete register of all student event applications, approval states, dates, and reviewer remarks.
            </p>
            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={() => exportRequests('csv')} leftIcon={<Download className="w-3.5 h-3.5" />}>
                Export CSV
              </Button>
              <Button size="sm" variant="outline" onClick={() => exportRequests('xlsx')} leftIcon={<FileSpreadsheet className="w-3.5 h-3.5" />}>
                Export Excel
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Attendance Master Records */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Attendance Master Records ({attendanceRecords.length} records)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-slate-500 leading-relaxed">
              Individual student attendance counts, calculated percentages, dataset versions, and last verified dates.
            </p>
            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={() => exportAttendance('csv')} leftIcon={<Download className="w-3.5 h-3.5" />}>
                Export CSV
              </Button>
              <Button size="sm" variant="outline" onClick={() => exportAttendance('xlsx')} leftIcon={<FileSpreadsheet className="w-3.5 h-3.5" />}>
                Export Excel
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Attendance Eligibility Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-600" />
              <span>Attendance Eligibility Compliance Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-slate-500 leading-relaxed">
              Classification of students meeting the minimum 75% cutoff threshold vs ineligible or stale profiles.
            </p>
            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={() => exportEligibilitySummary('csv')} leftIcon={<Download className="w-3.5 h-3.5" />}>
                Export CSV
              </Button>
              <Button size="sm" variant="outline" onClick={() => exportEligibilitySummary('xlsx')} leftIcon={<FileSpreadsheet className="w-3.5 h-3.5" />}>
                Export Excel
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Attendance Import History (In-Charge & Admin) */}
        {(role === 'incharge' || role === 'admin') && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-600" />
                <span>Attendance Import & Version History ({datasets.length} datasets)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-slate-500 leading-relaxed">
                Log of all uploaded attendance batches, uploaders, row counts, and committed versions.
              </p>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => exportImportHistory('csv')} leftIcon={<Download className="w-3.5 h-3.5" />}>
                  Export CSV
                </Button>
                <Button size="sm" variant="outline" onClick={() => exportImportHistory('xlsx')} leftIcon={<FileSpreadsheet className="w-3.5 h-3.5" />}>
                  Export Excel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
