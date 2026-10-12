import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { eventPassStore } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import {
  Calendar,
  MapPin,
  Building,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  ExternalLink,
  ArrowLeft,
  Trash2,
  Edit,
  ShieldCheck,
} from 'lucide-react';

export const RequestDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, role } = useAuth();
  const { success, error } = useToast();

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const request = id ? eventPassStore.getEventRequestById(id) : null;

  if (!request) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
          Request Not Found
        </h2>
        <p className="text-xs text-slate-500">
          The requested event application ID could not be located.
        </p>
        <Button variant="primary" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    );
  }

  // Security check: Student can only view their own requests
  if (role === 'student' && request.studentUid !== currentUser?.uid) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-xl font-bold text-rose-600">Access Denied</h2>
        <p className="text-xs text-slate-500">
          You are not authorized to inspect another student's private request.
        </p>
        <Button variant="primary" onClick={() => navigate('/student/requests')}>
          Return to My Requests
        </Button>
      </div>
    );
  }

  const isOwner = currentUser?.uid === request.studentUid;
  const canWithdraw =
    isOwner &&
    request.status !== 'Approved' &&
    request.status !== 'Rejected' &&
    request.status !== 'Withdrawn';

  const handleWithdraw = () => {
    if (!currentUser) return;
    try {
      eventPassStore.withdrawEventRequest(request.id, currentUser);
      success('Request withdrawn', `Application ${request.referenceNumber} has been withdrawn.`);
      setShowWithdrawModal(false);
      navigate('/student/requests');
    } catch (err: any) {
      error('Withdrawal failed', err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header with Status & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-brand-600 dark:text-brand-400">
                {request.referenceNumber}
              </span>
              <Badge size="md" status={request.status}>
                {request.status}
              </Badge>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {request.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {request.status === 'Returned for Correction' && isOwner && (
            <Link to={`/student/requests/edit/${request.id}`}>
              <Button variant="warning" size="sm" leftIcon={<Edit className="w-4 h-4" />}>
                Edit & Resubmit
              </Button>
            </Link>
          )}

          {canWithdraw && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowWithdrawModal(true)}
              leftIcon={<Trash2 className="w-4 h-4 text-rose-500" />}
              className="text-rose-600 hover:text-rose-700 hover:border-rose-300"
            >
              Withdraw Request
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Event & Student Info */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Event Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400">Organizer:</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {request.organizer}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Category:</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {request.category}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Venue & City:</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {request.venueCity}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Date Range:</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {new Date(request.startDate).toLocaleDateString()} to{' '}
                    {new Date(request.endDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {request.eventUrl && (
                <div className="text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">External URL:</span>
                  <a
                    href={request.eventUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-brand-600 hover:underline mt-0.5 font-medium"
                  >
                    {request.eventUrl} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold">Purpose of Participation:</span>
                  <p className="mt-1 text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    {request.purpose}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Expected Academic Benefit:</span>
                  <p className="mt-1 text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    {request.expectedAcademicBenefit}
                  </p>
                </div>
              </div>

              {request.supportingDocName && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span className="text-slate-400 font-semibold">Supporting Document:</span>
                  <div className="mt-1 flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <FileText className="w-4 h-4 text-brand-500" />
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate flex-1">
                      {request.supportingDocName}
                    </span>
                    <a
                      href={request.supportingDocUrl || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-brand-600 hover:underline"
                    >
                      View
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Workflow Review Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Review & Approval Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Submission */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Submitted by Student
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {new Date(request.createdAt).toLocaleString()} • {request.studentName} ({request.studentRollNumber})
                  </div>
                </div>
              </div>

              {/* Proctor Review */}
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    request.proctorReview
                      ? request.proctorReview.decision === 'recommend_approval'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                        : request.proctorReview.decision === 'recommend_rejection'
                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-600'
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-600'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {request.proctorReview ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Proctor Recommendation
                  </div>
                  {request.proctorReview ? (
                    <div className="mt-1 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {request.proctorReview.proctorName}
                        </span>
                        <Badge size="sm" variant={request.proctorReview.decision === 'recommend_approval' ? 'success' : 'danger'}>
                          {request.proctorReview.decision.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 italic">
                        "{request.proctorReview.remarks}"
                      </p>
                      <div className="text-[10px] text-slate-400">
                        {new Date(request.proctorReview.reviewedAt).toLocaleString()}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 mt-0.5">
                      Awaiting assigned proctor review.
                    </div>
                  )}
                </div>
              </div>

              {/* In-Charge Decision */}
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    request.finalDecision
                      ? request.finalDecision.decision === 'Approved'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-600'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {request.finalDecision ? (
                    request.finalDecision.decision === 'Approved' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Technical-Event In-Charge Final Decision
                  </div>
                  {request.finalDecision ? (
                    <div className="mt-1 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {request.finalDecision.decidedByName}
                        </span>
                        <Badge size="sm" status={request.finalDecision.decision}>
                          {request.finalDecision.decision.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 font-medium">
                        "{request.finalDecision.remarks}"
                      </p>
                      {request.finalDecision.isOverride && (
                        <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-200 text-amber-800 dark:text-amber-300 text-[11px]">
                          <strong>Special Override Justification:</strong> {request.finalDecision.overrideReason}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400">
                        {new Date(request.finalDecision.decidedAt).toLocaleString()}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 mt-0.5">
                      Pending final sanction from Technical-Event In-Charge.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Attendance Snapshot Evidence & Student Card */}
        <div className="space-y-6">
          {/* Authoritative Attendance Snapshot */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-brand-600" />
                <span>Attendance Snapshot Evidence</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-center">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {request.attendanceSnapshot.percentage !== null
                    ? `${request.attendanceSnapshot.percentage}%`
                    : 'Unavailable'}
                </div>
                <div className="mt-1">
                  <Badge status={request.attendanceSnapshot.statusText}>
                    {request.attendanceSnapshot.statusText}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-slate-500">
                  <span>Classes Attended:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {request.attendanceSnapshot.classesAttended}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Classes Conducted:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {request.attendanceSnapshot.classesConducted}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Eligibility Cutoff:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {request.attendanceSnapshot.threshold}%
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Dataset Version:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {request.attendanceSnapshot.datasetVersion}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Recorded At:</span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {new Date(request.attendanceSnapshot.calculatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 leading-tight">
                🔒 Immutable evidence: This snapshot records the authoritative attendance state at the time of review.
              </p>
            </CardContent>
          </Card>

          {/* Student Profile Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Student Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400">Name:</span>
                <div className="font-semibold text-slate-800 dark:text-slate-200">{request.studentName}</div>
              </div>
              <div>
                <span className="text-slate-400">Roll Number:</span>
                <div className="font-mono font-bold text-brand-600">{request.studentRollNumber}</div>
              </div>
              <div>
                <span className="text-slate-400">Department:</span>
                <div className="font-semibold text-slate-800 dark:text-slate-200">{request.studentDepartment}</div>
              </div>
              <div>
                <span className="text-slate-400">Year & Section:</span>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  {request.studentYear} • Section {request.studentSection}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Modal: Withdraw */}
      <Modal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        title="Withdraw Event Request?"
        description="Are you sure you want to withdraw this application?"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Withdrawing will cancel review of <span className="font-semibold">{request.referenceNumber}</span> ({request.title}). This action is final and recorded in the audit log.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowWithdrawModal(false)}>
              Keep Request
            </Button>
            <Button variant="danger" onClick={handleWithdraw}>
              Confirm Withdrawal
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
