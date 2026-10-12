import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { eventPassStore } from '@/lib/store';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Upload,
  ClipboardList,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  PieChart,
  BarChart2,
  Calendar,
} from 'lucide-react';

export const InchargeDashboard: React.FC = () => {
  const { currentUser } = useAuth();

  const allRequests = useMemo(() => eventPassStore.getEventRequests(), []);
  const allStudents = useMemo(() => eventPassStore.getUsers().filter((u) => u.role === 'student'), []);
  const attendanceRecords = useMemo(() => eventPassStore.getAttendanceRecords(), []);
  const datasets = useMemo(() => eventPassStore.getAttendanceDatasets(), []);
  const settings = useMemo(() => eventPassStore.getDepartmentSettings(), []);

  // Summary Metrics strictly calculated from store
  const totalRequests = allRequests.length;
  const pendingProctor = allRequests.filter(
    (r) => r.status === 'Under Proctor Review' || r.status === 'Submitted'
  ).length;
  const pendingFinalDecision = allRequests.filter(
    (r) =>
      r.status === 'Recommended for Approval' ||
      r.status === 'Recommended for Rejection' ||
      r.status === 'Pending Final Decision'
  ).length;
  const approvedRequests = allRequests.filter((r) => r.status === 'Approved').length;
  const rejectedRequests = allRequests.filter((r) => r.status === 'Rejected').length;
  const returnedRequests = allRequests.filter((r) => r.status === 'Returned for Correction').length;
  const withdrawnRequests = allRequests.filter((r) => r.status === 'Withdrawn').length;

  const requestsWithWarnings = allRequests.filter(
    (r) => !r.attendanceSnapshot.isEligible || r.attendanceSnapshot.isStale
  ).length;

  const upcomingApprovedEvents = allRequests.filter(
    (r) => r.status === 'Approved' && new Date(r.startDate).getTime() >= Date.now() - 86400000
  );

  const studentsWithCurrentAttendance = attendanceRecords.filter((r) => !r.isStale && r.calculatedPercentage !== null).length;
  const studentsWithMissingOrStale = attendanceRecords.filter(
    (r) => r.isStale || r.calculatedPercentage === null
  ).length;

  const activeDataset = datasets.find((d) => d.isActive) || datasets[0];

  // Category counts
  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    allRequests.forEach((r) => {
      map[r.category] = (map[r.category] || 0) + 1;
    });
    return Object.entries(map);
  }, [allRequests]);

  // Attendance eligibility distribution
  const eligibleStudentsCount = attendanceRecords.filter((r) => r.isEligible).length;
  const ineligibleStudentsCount = attendanceRecords.filter((r) => !r.isEligible && r.calculatedPercentage !== null).length;
  const missingStudentsCount = attendanceRecords.filter((r) => r.calculatedPercentage === null).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-brand-950 via-navy-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-brand-200 text-xs font-semibold mb-2">
              <span>Departmental Event Authority</span>
              <span>•</span>
              <span>{settings.academicYear}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {currentUser?.displayName || 'Technical-Event In-Charge'}
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Final sanctioning authority for collegiate On-Duty permissions and master attendance dataset management.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link to="/incharge/requests">
              <Button
                variant="primary"
                size="md"
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                className="bg-brand-500 hover:bg-brand-400 text-white shadow-md"
              >
                Decide Pending ({pendingFinalDecision})
              </Button>
            </Link>
            <Link to="/incharge/attendance/import">
              <Button
                variant="outline"
                size="md"
                leftIcon={<Upload className="w-4 h-4" />}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Import Attendance
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pending Final Decisions"
          value={pendingFinalDecision}
          subtitle="Proctor-recommended requests awaiting sanction"
          icon={<Clock className="w-5 h-5" />}
          iconBgColor="bg-cyan-50 dark:bg-cyan-950 text-cyan-600"
          badge={pendingFinalDecision > 0 ? <Badge variant="warning">Action Needed</Badge> : undefined}
          onClick={() => {}}
        />

        <StatCard
          title="Under Proctor Review"
          value={pendingProctor}
          subtitle="Waiting for mentor recommendation"
          icon={<FileText className="w-5 h-5" />}
          iconBgColor="bg-purple-50 dark:bg-purple-950 text-purple-600"
        />

        <StatCard
          title="Approved On-Duty"
          value={approvedRequests}
          subtitle={`${Math.round((approvedRequests / (totalRequests || 1)) * 100)}% approval rate`}
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconBgColor="bg-emerald-50 dark:bg-emerald-950 text-emerald-600"
        />

        <StatCard
          title="Eligibility Warnings"
          value={requestsWithWarnings}
          subtitle="Applications with attendance < 75% or stale"
          icon={<ShieldAlert className="w-5 h-5" />}
          iconBgColor="bg-amber-50 dark:bg-amber-950 text-amber-600"
        />
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-navy-850 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-subtle">
          <div className="text-xs text-slate-500">Total Submissions</div>
          <div className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">{totalRequests}</div>
        </div>
        <div className="bg-white dark:bg-navy-850 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-subtle">
          <div className="text-xs text-slate-500">Returned for Edit</div>
          <div className="text-xl font-bold text-amber-600 mt-1">{returnedRequests}</div>
        </div>
        <div className="bg-white dark:bg-navy-850 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-subtle">
          <div className="text-xs text-slate-500">Rejected Requests</div>
          <div className="text-xl font-bold text-rose-600 mt-1">{rejectedRequests}</div>
        </div>
        <div className="bg-white dark:bg-navy-850 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-subtle">
          <div className="text-xs text-slate-500">Active Dataset</div>
          <div className="text-xs font-mono font-bold text-brand-600 truncate mt-1">
            {activeDataset?.version || 'v1.0.0'} ({activeDataset?.totalRows || 30} rows)
          </div>
        </div>
      </div>

      {/* Analytics Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Eligibility Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-brand-600" />
                <span>Attendance Eligibility Distribution ({attendanceRecords.length} Students)</span>
              </span>
              <span className="text-xs text-slate-400">Cutoff: {settings.attendanceThreshold}%</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Visual Bar Distribution */}
            <div className="h-6 w-full bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex">
              <div
                style={{ width: `${(eligibleStudentsCount / (attendanceRecords.length || 1)) * 100}%` }}
                className="bg-emerald-500 h-full transition-all"
                title={`Eligible: ${eligibleStudentsCount}`}
              />
              <div
                style={{ width: `${(ineligibleStudentsCount / (attendanceRecords.length || 1)) * 100}%` }}
                className="bg-rose-500 h-full transition-all"
                title={`Ineligible: ${ineligibleStudentsCount}`}
              />
              <div
                style={{ width: `${(missingStudentsCount / (attendanceRecords.length || 1)) * 100}%` }}
                className="bg-amber-400 h-full transition-all"
                title={`Missing/Unavailable: ${missingStudentsCount}`}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900">
                <div className="font-bold text-emerald-700 dark:text-emerald-300 text-lg">
                  {eligibleStudentsCount}
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400">Eligible (&gt;= 75%)</div>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900">
                <div className="font-bold text-rose-700 dark:text-rose-300 text-lg">
                  {ineligibleStudentsCount}
                </div>
                <div className="text-[11px] text-rose-600 dark:text-rose-400">Ineligible (&lt; 75%)</div>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900">
                <div className="font-bold text-amber-700 dark:text-amber-300 text-lg">
                  {missingStudentsCount}
                </div>
                <div className="text-[11px] text-amber-600 dark:text-amber-400">Unavailable / Stale</div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs flex justify-between text-slate-500">
              <span>Freshness Status:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {studentsWithCurrentAttendance} Verified Current • {studentsWithMissingOrStale} Stale / Unverified
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Event Categories Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-violet-600" />
              <span>Event Categories Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {categoryCounts.map(([cat, count]) => {
              const pct = Math.round((count / (totalRequests || 1)) * 100);
              return (
                <div key={cat} className="space-y-1 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-700 dark:text-slate-300">{cat}</span>
                    <span className="text-slate-500">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="bg-brand-500 h-full rounded-full transition-all"
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Approved Events and Quick Decision Feed */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-600" />
            <span>Upcoming Sanctioned OD Events ({upcomingApprovedEvents.length})</span>
          </CardTitle>
          <Link to="/incharge/requests">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Monitor All Requests
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {upcomingApprovedEvents.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No approved upcoming events on schedule.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 text-slate-500">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Ref No</th>
                    <th className="py-3 px-4 font-semibold">Student & Roll No</th>
                    <th className="py-3 px-4 font-semibold">Event Title</th>
                    <th className="py-3 px-4 font-semibold">Event Dates</th>
                    <th className="py-3 px-4 font-semibold">Sanction Remarks</th>
                    <th className="py-3 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {upcomingApprovedEvents.slice(0, 5).map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-brand-600 dark:text-brand-400">
                        {req.referenceNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{req.studentName}</div>
                        <div className="text-[11px] font-mono text-slate-400">{req.studentRollNumber}</div>
                      </td>
                      <td className="py-3 px-4 font-medium max-w-xs truncate">{req.title}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {new Date(req.startDate).toLocaleDateString()} to {new Date(req.endDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate">
                        "{req.finalDecision?.remarks || 'Approved'}"
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link to={`/student/requests/${req.id}`}>
                          <button className="text-xs font-semibold text-brand-600 hover:underline">
                            Inspect
                          </button>
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
