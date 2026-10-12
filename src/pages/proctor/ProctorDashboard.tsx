import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { eventPassStore } from '@/lib/store';
import { useEventPassStoreVersion } from '@/lib/useEventPassStoreVersion';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FilterBar } from '@/components/ui/FilterBar';
import { exportToCsv, exportToXlsx } from '@/lib/exportUtils';
import {
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Search,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export const ProctorDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  useEventPassStoreVersion();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Find all students assigned to this proctor
  const assignedStudents = currentUser
    ? eventPassStore.getUsers().filter((user) => user.assignedProctorId === currentUser.uid)
    : [];

  // Find all requests belonging to assigned students
  const proctorRequests = currentUser
    ? eventPassStore.getEventRequests({ role: 'proctor', userUid: currentUser.uid })
    : [];

  // Derived counts
  const pendingReviews = proctorRequests.filter(
    (r) => r.status === 'Under Proctor Review' || r.status === 'Submitted'
  ).length;

  const returnedCount = proctorRequests.filter(
    (r) => r.status === 'Returned for Correction'
  ).length;

  const eligibilityWarningsCount = proctorRequests.filter(
    (r) => !r.attendanceSnapshot.isEligible || r.attendanceSnapshot.isStale
  ).length;

  const completedReviewsCount = proctorRequests.filter(
    (r) =>
      r.status === 'Recommended for Approval' ||
      r.status === 'Recommended for Rejection' ||
      r.status === 'Approved' ||
      r.status === 'Rejected'
  ).length;

  // Filtered requests list
  const filteredRequests = proctorRequests.filter((r) => {
      const matchSearch =
        searchTerm === '' ||
        r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.studentRollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
      const matchCategory = categoryFilter === 'ALL' || r.category === categoryFilter;

      return matchSearch && matchStatus && matchCategory;
    });

  const handleExportCsv = () => {
    const data = filteredRequests.map((r) => ({
      'Reference Number': r.referenceNumber,
      'Student Name': r.studentName,
      'Roll Number': r.studentRollNumber,
      'Event Title': r.title,
      'Category': r.category,
      'Start Date': r.startDate,
      'End Date': r.endDate,
      'Status': r.status,
      'Attendance %': r.attendanceSnapshot.percentage ?? 'N/A',
      'Eligibility': r.attendanceSnapshot.statusText,
      'Recommendation': r.proctorReview?.decision ?? 'Pending',
    }));
    exportToCsv(data, `Proctor_Assigned_Reviews_${currentUser?.displayName?.replace(/\s+/g, '_')}`);
  };

  const handleExportXlsx = () => {
    const data = filteredRequests.map((r) => ({
      'Reference Number': r.referenceNumber,
      'Student Name': r.studentName,
      'Roll Number': r.studentRollNumber,
      'Event Title': r.title,
      'Category': r.category,
      'Start Date': r.startDate,
      'End Date': r.endDate,
      'Status': r.status,
      'Attendance %': r.attendanceSnapshot.percentage ?? 'N/A',
      'Eligibility': r.attendanceSnapshot.statusText,
      'Recommendation': r.proctorReview?.decision ?? 'Pending',
    }));
    exportToXlsx(data, `Proctor_Assigned_Reviews_${currentUser?.displayName?.replace(/\s+/g, '_')}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-navy-850 via-slate-900 to-brand-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-brand-200 text-xs font-semibold mb-2">
              <span>Proctoring Portfolio</span>
              <span>•</span>
              <span>{currentUser?.department}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {currentUser?.displayName}
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Authorized to mentor and review event applications for assigned students (Roll Nos{' '}
              {assignedStudents[0]?.rollNumber || 'CS2026-001'} -{' '}
              {assignedStudents[assignedStudents.length - 1]?.rollNumber || 'CS2026-015'}).
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-right">
            <div className="text-xs text-brand-200">Active Review Scope</div>
            <div className="text-xl font-bold">{assignedStudents.length} Students Assigned</div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Students"
          value={assignedStudents.length}
          subtitle="Direct mentorship portfolio"
          icon={<Users className="w-5 h-5" />}
          iconBgColor="bg-brand-50 dark:bg-brand-950 text-brand-600"
        />

        <StatCard
          title="Pending Reviews"
          value={pendingReviews}
          subtitle="Applications awaiting recommendation"
          icon={<Clock className="w-5 h-5" />}
          iconBgColor="bg-purple-50 dark:bg-purple-950 text-purple-600"
          badge={pendingReviews > 0 ? <Badge variant="warning">Action Needed</Badge> : undefined}
        />

        <StatCard
          title="Attendance Warnings"
          value={eligibilityWarningsCount}
          subtitle="Students below 75% cutoff or stale"
          icon={<ShieldAlert className="w-5 h-5" />}
          iconBgColor="bg-amber-50 dark:bg-amber-950 text-amber-600"
        />

        <StatCard
          title="Reviews Completed"
          value={completedReviewsCount}
          subtitle="Recommendations forwarded"
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconBgColor="bg-emerald-50 dark:bg-emerald-950 text-emerald-600"
        />
      </div>

      {/* Filters and Search Bar */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search assigned student, roll number, or event title..."
        totalCount={filteredRequests.length}
        onExportCsv={handleExportCsv}
        onExportXlsx={handleExportXlsx}
        onResetFilters={() => {
          setSearchTerm('');
          setStatusFilter('ALL');
          setCategoryFilter('ALL');
        }}
        filters={[
          {
            label: 'Workflow Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'All Statuses', value: 'ALL' },
              { label: 'Under Proctor Review', value: 'Under Proctor Review' },
              { label: 'Recommended for Approval', value: 'Recommended for Approval' },
              { label: 'Recommended for Rejection', value: 'Recommended for Rejection' },
              { label: 'Returned for Correction', value: 'Returned for Correction' },
              { label: 'Approved', value: 'Approved' },
              { label: 'Rejected', value: 'Rejected' },
            ],
          },
          {
            label: 'Category',
            value: categoryFilter,
            onChange: setCategoryFilter,
            options: [
              { label: 'All Categories', value: 'ALL' },
              { label: 'Hackathon', value: 'Hackathon' },
              { label: 'Workshop', value: 'Workshop' },
              { label: 'Conference', value: 'Conference' },
              { label: 'Technical Competition', value: 'Technical Competition' },
            ],
          },
        ]}
      />

      {/* Assigned Requests Review Table */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned Student Event Applications</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredRequests.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No matching applications found for your assigned student portfolio.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Ref No</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Event Details</th>
                    <th className="py-3 px-4">Attendance Basis</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-brand-600 dark:text-brand-400">
                        {req.referenceNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{req.studentName}</div>
                        <div className="text-[11px] font-mono text-slate-400">{req.studentRollNumber}</div>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {req.title}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {req.category} • {new Date(req.startDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold">
                          {req.attendanceSnapshot.percentage !== null
                            ? `${req.attendanceSnapshot.percentage}%`
                            : 'Unavailable'}
                        </div>
                        <Badge size="sm" status={req.attendanceSnapshot.statusText}>
                          {req.attendanceSnapshot.statusText}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge status={req.status}>{req.status}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link to={`/proctor/review/${req.id}`}>
                          <Button
                            size="sm"
                            variant={req.status === 'Under Proctor Review' ? 'primary' : 'outline'}
                          >
                            {req.status === 'Under Proctor Review' ? 'Review Now' : 'Inspect'}
                          </Button>
                        </Link>
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
