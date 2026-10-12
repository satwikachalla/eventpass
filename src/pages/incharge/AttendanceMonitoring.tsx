import React, { useState, useMemo } from 'react';
import { eventPassStore } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FilterBar } from '@/components/ui/FilterBar';
import { exportToCsv, exportToXlsx } from '@/lib/exportUtils';
import { ClipboardList, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

export const AttendanceMonitoring: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [eligibilityFilter, setEligibilityFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  const records = useMemo(() => eventPassStore.getAttendanceRecords(), []);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchSearch =
        searchTerm === '' ||
        r.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.studentName && r.studentName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchDept = departmentFilter === 'ALL' || r.department === departmentFilter;

      let matchEligibility = true;
      if (eligibilityFilter === 'ELIGIBLE') matchEligibility = r.isEligible && !r.isStale;
      else if (eligibilityFilter === 'INELIGIBLE') matchEligibility = !r.isEligible && !r.isStale && r.calculatedPercentage !== null;
      else if (eligibilityFilter === 'STALE') matchEligibility = r.isStale;
      else if (eligibilityFilter === 'UNAVAILABLE') matchEligibility = r.calculatedPercentage === null;

      return matchSearch && matchDept && matchEligibility;
    });
  }, [records, searchTerm, eligibilityFilter, departmentFilter]);

  const handleExportCsv = () => {
    const data = filteredRecords.map((r) => ({
      'Roll Number': r.rollNumber,
      'Student Name': r.studentName || '—',
      'Department': r.department || '—',
      'Section': r.section || '—',
      'Classes Attended': r.classesAttended,
      'Classes Conducted': r.classesConducted,
      'Calculated %': r.calculatedPercentage !== null ? `${r.calculatedPercentage}%` : 'Unavailable',
      'Eligibility': r.statusText,
      'Stale Record': r.isStale ? 'YES' : 'NO',
      'Dataset Version': r.datasetVersion,
      'Last Verified': r.lastVerifiedAt,
    }));
    exportToCsv(data, 'Institutional_Attendance_Records');
  };

  const handleExportXlsx = () => {
    const data = filteredRecords.map((r) => ({
      'Roll Number': r.rollNumber,
      'Student Name': r.studentName || '—',
      'Department': r.department || '—',
      'Section': r.section || '—',
      'Classes Attended': r.classesAttended,
      'Classes Conducted': r.classesConducted,
      'Calculated %': r.calculatedPercentage !== null ? `${r.calculatedPercentage}%` : 'Unavailable',
      'Eligibility': r.statusText,
      'Stale Record': r.isStale ? 'YES' : 'NO',
      'Dataset Version': r.datasetVersion,
      'Last Verified': r.lastVerifiedAt,
    }));
    exportToXlsx(data, 'Institutional_Attendance_Records', 'Attendance');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Institutional Attendance Records & Eligibility Monitoring
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Master registry of student class attendance percentages, threshold compliance, and dataset freshness.
        </p>
      </div>

      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by roll number or student name..."
        totalCount={filteredRecords.length}
        onExportCsv={handleExportCsv}
        onExportXlsx={handleExportXlsx}
        onResetFilters={() => {
          setSearchTerm('');
          setEligibilityFilter('ALL');
          setDepartmentFilter('ALL');
        }}
        filters={[
          {
            label: 'Eligibility',
            value: eligibilityFilter,
            onChange: setEligibilityFilter,
            options: [
              { label: 'All Eligibility States', value: 'ALL' },
              { label: 'Eligible (>=75%)', value: 'ELIGIBLE' },
              { label: 'Ineligible (<75%)', value: 'INELIGIBLE' },
              { label: 'Stale Data Warning', value: 'STALE' },
              { label: 'Unavailable / 0 Conducted', value: 'UNAVAILABLE' },
            ],
          },
          {
            label: 'Department',
            value: departmentFilter,
            onChange: setDepartmentFilter,
            options: [
              { label: 'All Departments', value: 'ALL' },
              { label: 'Computer Science & Engineering', value: 'Computer Science & Engineering' },
              { label: 'Information Technology', value: 'Information Technology' },
            ],
          },
        ]}
      />

      <Card>
        <CardContent className="p-0">
          {filteredRecords.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No matching attendance records found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Roll Number</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Department & Sec</th>
                    <th className="py-3 px-4">Attended / Conducted</th>
                    <th className="py-3 px-4">Calculated %</th>
                    <th className="py-3 px-4">Eligibility Status</th>
                    <th className="py-3 px-4">Freshness</th>
                    <th className="py-3 px-4 text-right">Last Verified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-mono font-bold text-brand-600 dark:text-brand-400">
                        {r.rollNumber}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                        {r.studentName || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {r.department} • Sec {r.section}
                      </td>
                      <td className="py-3.5 px-4 font-medium">
                        {r.classesAttended} / {r.classesConducted}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {r.calculatedPercentage !== null ? `${r.calculatedPercentage}%` : 'Unavailable'}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge status={r.statusText}>{r.statusText}</Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        {r.isStale ? (
                          <span className="text-amber-600 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> Stale
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-medium">Current</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-500">
                        {new Date(r.lastVerifiedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
