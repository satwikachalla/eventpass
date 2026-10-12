import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { eventPassStore } from '@/lib/store';
import { EventRequest, EventStatus, EventCategory } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FilterBar } from '@/components/ui/FilterBar';
import { useToast } from '@/components/ui/Toast';
import { exportToCsv, exportToXlsx } from '@/lib/exportUtils';
import {
  FileText,
  CheckCircle2,
  XCircle,
  RotateCcw,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Scale,
} from 'lucide-react';

export const RequestMonitoring: React.FC = () => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [eligibilityFilter, setEligibilityFilter] = useState('ALL');

  // Decision Modal State
  const [selectedRequest, setSelectedRequest] = useState<EventRequest | null>(null);
  const [decisionAction, setDecisionAction] = useState<'Approved' | 'Rejected' | 'Returned'>('Approved');
  const [remarks, setRemarks] = useState('');
  const [isOverride, setIsOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allRequests = useMemo(() => eventPassStore.getEventRequests(), []);

  const filteredRequests = useMemo(() => {
    return allRequests.filter((r) => {
      const matchSearch =
        searchTerm === '' ||
        r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.studentRollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
      const matchCategory = categoryFilter === 'ALL' || r.category === categoryFilter;
      const matchEligibility =
        eligibilityFilter === 'ALL' ||
        (eligibilityFilter === 'ELIGIBLE' && r.attendanceSnapshot.isEligible) ||
        (eligibilityFilter === 'INELIGIBLE' && !r.attendanceSnapshot.isEligible);

      return matchSearch && matchStatus && matchCategory && matchEligibility;
    });
  }, [allRequests, searchTerm, statusFilter, categoryFilter, eligibilityFilter]);

  const openDecisionModal = (req: EventRequest) => {
    setSelectedRequest(req);
    // Pre-populate sensible defaults
    if (req.proctorReview?.decision === 'recommend_rejection') {
      setDecisionAction('Rejected');
      setRemarks(req.proctorReview.remarks || '');
    } else {
      setDecisionAction('Approved');
      setRemarks('Approved for collegiate On-Duty sanction.');
    }
    setIsOverride(!req.attendanceSnapshot.isEligible);
    setOverrideReason('');
  };

  const handleExecuteDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !currentUser) return;

    if (decisionAction === 'Rejected' && !remarks.trim()) {
      error('Rejection Reason Mandatory', 'A clear reason is required when rejecting a student request.');
      return;
    }

    if (decisionAction === 'Returned' && !remarks.trim()) {
      error('Remarks Mandatory', 'Clear remarks are required when returning a request.');
      return;
    }

    if (decisionAction === 'Approved' && !selectedRequest.attendanceSnapshot.isEligible && !isOverride) {
      error(
        'Ineligible Attendance',
        'Student has attendance below the 75% cutoff. You must check "Attendance Eligibility Override" and provide an explicit justification.'
      );
      return;
    }

    if (isOverride && !overrideReason.trim()) {
      error('Override Justification Required', 'An explicit justification is mandatory to override attendance cutoff.');
      return;
    }

    setIsSubmitting(true);
    try {
      eventPassStore.submitFinalDecision(
        selectedRequest.id,
        decisionAction,
        remarks,
        isOverride,
        isOverride ? overrideReason : undefined,
        currentUser
      );

      success('Final Decision Executed', `Request ${selectedRequest.referenceNumber} marked as ${decisionAction}.`);
      setSelectedRequest(null);
    } catch (err: any) {
      error('Decision execution failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCsv = () => {
    const data = filteredRequests.map((r) => ({
      'Ref Number': r.referenceNumber,
      'Student Name': r.studentName,
      'Roll Number': r.studentRollNumber,
      'Department': r.studentDepartment,
      'Event Title': r.title,
      'Category': r.category,
      'Dates': `${r.startDate} to ${r.endDate}`,
      'Status': r.status,
      'Attendance %': r.attendanceSnapshot.percentage ?? 'N/A',
      'Eligibility Basis': r.attendanceSnapshot.statusText,
      'Proctor Recommendation': r.proctorReview?.decision ?? 'Pending',
      'Proctor Remarks': r.proctorReview?.remarks ?? '',
      'Final Decision': r.finalDecision?.decision ?? 'Pending',
      'Final Remarks': r.finalDecision?.remarks ?? '',
      'Attendance Override': r.finalDecision?.isOverride ? 'YES' : 'NO',
    }));
    exportToCsv(data, 'EventPass_Master_Request_Register');
  };

  const handleExportXlsx = () => {
    const data = filteredRequests.map((r) => ({
      'Ref Number': r.referenceNumber,
      'Student Name': r.studentName,
      'Roll Number': r.studentRollNumber,
      'Department': r.studentDepartment,
      'Event Title': r.title,
      'Category': r.category,
      'Dates': `${r.startDate} to ${r.endDate}`,
      'Status': r.status,
      'Attendance %': r.attendanceSnapshot.percentage ?? 'N/A',
      'Eligibility Basis': r.attendanceSnapshot.statusText,
      'Proctor Recommendation': r.proctorReview?.decision ?? 'Pending',
      'Proctor Remarks': r.proctorReview?.remarks ?? '',
      'Final Decision': r.finalDecision?.decision ?? 'Pending',
      'Final Remarks': r.finalDecision?.remarks ?? '',
      'Attendance Override': r.finalDecision?.isOverride ? 'YES' : 'NO',
    }));
    exportToXlsx(data, 'EventPass_Master_Request_Register', 'Requests');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Department Request Monitoring & Final Decisions
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative department-wide register. Inspect proctor recommendations and execute final On-Duty sanctions.
          </p>
        </div>
      </div>

      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search student name, roll number, or event title..."
        totalCount={filteredRequests.length}
        onExportCsv={handleExportCsv}
        onExportXlsx={handleExportXlsx}
        onResetFilters={() => {
          setSearchTerm('');
          setStatusFilter('ALL');
          setCategoryFilter('ALL');
          setEligibilityFilter('ALL');
        }}
        filters={[
          {
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'All Statuses', value: 'ALL' },
              { label: 'Pending Final Decision', value: 'Recommended for Approval' },
              { label: 'Under Proctor Review', value: 'Under Proctor Review' },
              { label: 'Approved', value: 'Approved' },
              { label: 'Rejected', value: 'Rejected' },
              { label: 'Returned for Correction', value: 'Returned for Correction' },
            ],
          },
          {
            label: 'Eligibility',
            value: eligibilityFilter,
            onChange: setEligibilityFilter,
            options: [
              { label: 'All Eligibility', value: 'ALL' },
              { label: 'Eligible (>=75%)', value: 'ELIGIBLE' },
              { label: 'Ineligible / Stale (<75%)', value: 'INELIGIBLE' },
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

      {/* Master Requests Table */}
      <Card>
        <CardContent className="p-0">
          {filteredRequests.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No matching department requests found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Ref No</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Event Title</th>
                    <th className="py-3 px-4">Attendance Snapshot</th>
                    <th className="py-3 px-4">Proctor Review</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">In-Charge Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-brand-600 dark:text-brand-400">
                        {req.referenceNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{req.studentName}</div>
                        <div className="text-[11px] font-mono text-slate-400">{req.studentRollNumber}</div>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-medium text-slate-800 dark:text-slate-200 truncate">{req.title}</div>
                        <div className="text-[11px] text-slate-500">{req.category} • {new Date(req.startDate).toLocaleDateString()}</div>
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
                      <td className="py-3.5 px-4 max-w-xs">
                        {req.proctorReview ? (
                          <div>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {req.proctorReview.decision === 'recommend_approval' ? 'Recommended' : 'Rejected by Proctor'}
                            </span>
                            <div className="text-[11px] text-slate-500 truncate italic">
                              "{req.proctorReview.remarks}"
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">Pending Proctor</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge status={req.status}>{req.status}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <Link to={`/student/requests/${req.id}`}>
                          <button className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:hover:text-slate-100 hover:underline">
                            Inspect
                          </button>
                        </Link>
                        {req.status !== 'Approved' && req.status !== 'Rejected' && req.status !== 'Withdrawn' && (
                          <Button size="sm" variant="primary" onClick={() => openDecisionModal(req)}>
                            Finalize
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Decision Execution Modal */}
      {selectedRequest && (
        <Modal
          isOpen={Boolean(selectedRequest)}
          onClose={() => setSelectedRequest(null)}
          title={`Final Sanction Decision • ${selectedRequest.referenceNumber}`}
          description={`Student: ${selectedRequest.studentName} (${selectedRequest.studentRollNumber}) • Event: ${selectedRequest.title}`}
          maxWidth="lg"
        >
          <form onSubmit={handleExecuteDecision} className="space-y-4">
            {/* Attendance Evidence Snapshot Banner */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500">Attendance Evidence Basis:</span>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {selectedRequest.attendanceSnapshot.percentage !== null
                    ? `${selectedRequest.attendanceSnapshot.percentage}% (${selectedRequest.attendanceSnapshot.classesAttended}/${selectedRequest.attendanceSnapshot.classesConducted} classes)`
                    : 'Unavailable'}
                </div>
              </div>
              <Badge size="md" status={selectedRequest.attendanceSnapshot.statusText}>
                {selectedRequest.attendanceSnapshot.statusText}
              </Badge>
            </div>

            {/* Decision Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Executive Action
              </label>
              <div className="grid grid-cols-3 gap-2">
                <label
                  className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                    decisionAction === 'Approved'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="decisionAction"
                    value="Approved"
                    checked={decisionAction === 'Approved'}
                    onChange={() => setDecisionAction('Approved')}
                    className="hidden"
                  />
                  <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                  <span className="text-xs">Approve OD</span>
                </label>

                <label
                  className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                    decisionAction === 'Rejected'
                      ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-800 dark:text-rose-200 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="decisionAction"
                    value="Rejected"
                    checked={decisionAction === 'Rejected'}
                    onChange={() => setDecisionAction('Rejected')}
                    className="hidden"
                  />
                  <XCircle className="w-5 h-5 mx-auto mb-1 text-rose-600" />
                  <span className="text-xs">Reject Application</span>
                </label>

                <label
                  className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                    decisionAction === 'Returned'
                      ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-800 dark:text-amber-200 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="decisionAction"
                    value="Returned"
                    checked={decisionAction === 'Returned'}
                    onChange={() => setDecisionAction('Returned')}
                    className="hidden"
                  />
                  <RotateCcw className="w-5 h-5 mx-auto mb-1 text-amber-600" />
                  <span className="text-xs">Return for Clarification</span>
                </label>
              </div>
            </div>

            {/* Attendance Override Option (Section 7) */}
            {decisionAction === 'Approved' && !selectedRequest.attendanceSnapshot.isEligible && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="overrideCheck"
                    checked={isOverride}
                    onChange={(e) => setIsOverride(e.target.checked)}
                    className="rounded text-brand-600 focus:ring-brand-500"
                  />
                  <label htmlFor="overrideCheck" className="text-xs font-bold text-amber-900 dark:text-amber-200 cursor-pointer">
                    Sanction Special Attendance Eligibility Override
                  </label>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300">
                  Attendance is below the 75% cutoff. You must specify an authorized academic justification (e.g., national finale prestige or Dean sanction) to proceed with approval.
                </p>
                {isOverride && (
                  <div>
                    <label className="block text-xs font-semibold text-amber-900 dark:text-amber-200 mb-1">
                      Mandatory Override Justification:
                    </label>
                    <input
                      type="text"
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="e.g. Approved under Institutional Excellence Guideline 4.2"
                      required={isOverride}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Remarks Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Executive Remarks{' '}
                {decisionAction === 'Rejected' && <span className="text-rose-500">(Mandatory Reason)</span>}
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={
                  decisionAction === 'Approved'
                    ? 'Enter sanction terms, OD days sanctioned, or certificate requirements...'
                    : 'Enter formal rejection reason...'
                }
                rows={3}
                required={decisionAction === 'Rejected'}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setSelectedRequest(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant={decisionAction === 'Rejected' ? 'danger' : 'primary'}
                isLoading={isSubmitting}
              >
                Execute {decisionAction}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
