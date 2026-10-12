import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { eventPassStore } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  AlertTriangle,
  FileText,
  ExternalLink,
  ArrowLeft,
  Calendar,
  Building,
  MapPin,
  Clock,
  User,
} from 'lucide-react';

export const ProctorReview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, role } = useAuth();
  const { success, error } = useToast();

  const [decision, setDecision] = useState<'recommend_approval' | 'recommend_rejection' | 'return_for_correction'>('recommend_approval');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const request = id ? eventPassStore.getEventRequestById(id) : null;
  const student = request ? eventPassStore.getUserById(request.studentUid) : null;

  if (!request) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-xl font-bold">Request Not Found</h2>
        <Button variant="primary" onClick={() => navigate('/proctor/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  // Cross-student access restriction check: Proctor can only review assigned students!
  const isAssigned = student?.assignedProctorId === currentUser?.uid || role === 'admin' || role === 'incharge';
  if (!isAssigned) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white dark:bg-navy-850 rounded-2xl border border-rose-200 shadow-xl text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Unauthorized Student Application
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Student <span className="font-semibold">{request.studentName}</span> is not assigned to your proctoring portfolio. Strict RBAC rules prohibit unassigned mentor reviews.
        </p>
        <Button variant="primary" onClick={() => navigate('/proctor/dashboard')}>
          Return to My Assigned Reviews
        </Button>
      </div>
    );
  }

  const isPendingReview = request.status === 'Under Proctor Review' || request.status === 'Submitted';

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if ((decision === 'recommend_rejection' || decision === 'return_for_correction') && !remarks.trim()) {
      error('Remarks required', 'Meaningful remarks are mandatory when recommending rejection or returning for correction.');
      return;
    }

    setIsSubmitting(true);
    try {
      eventPassStore.submitProctorReview(request.id, decision, remarks, currentUser);
      success('Review submitted', `Recommendation recorded for ${request.referenceNumber}.`);
      navigate('/proctor/dashboard');
    } catch (err: any) {
      error('Review submission failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-brand-600 dark:text-brand-400">
                {request.referenceNumber}
              </span>
              <Badge status={request.status}>{request.status}</Badge>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
              Proctor Evaluation • {request.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Attendance & Eligibility Warning Banner */}
      {!request.attendanceSnapshot.isEligible && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <div>
            <span className="font-bold">Attendance Eligibility Warning:</span> Student attendance (
            {request.attendanceSnapshot.percentage ?? 'Unavailable'}%) is below the mandatory 75% cutoff.
            Exercise scrutiny before recommending for approval.
          </div>
        </div>
      )}

      {request.attendanceSnapshot.isStale && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <span className="font-bold">Data Freshness Warning:</span> Student attendance dataset record is older than the configured staleness threshold.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Student Details & Event Info */}
        <div className="md:col-span-2 space-y-6">
          {/* Event Application Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Event & Academic Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400">Organizer:</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{request.organizer}</div>
                </div>
                <div>
                  <span className="text-slate-400">Category:</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{request.category}</div>
                </div>
                <div>
                  <span className="text-slate-400">Venue & City:</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{request.venueCity}</div>
                </div>
                <div>
                  <span className="text-slate-400">Scheduled Dates:</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {new Date(request.startDate).toLocaleDateString()} to {new Date(request.endDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {request.eventUrl && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Event Website:</span>
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

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div>
                  <span className="text-slate-400 font-semibold">Purpose:</span>
                  <p className="mt-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                    {request.purpose}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Academic Benefit:</span>
                  <p className="mt-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                    {request.expectedAcademicBenefit}
                  </p>
                </div>
              </div>

              {request.supportingDocName && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 font-semibold">Supporting Document:</span>
                  <div className="mt-1 flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                      📎 {request.supportingDocName}
                    </span>
                    <a
                      href={request.supportingDocUrl || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-brand-600 hover:underline"
                    >
                      Inspect File
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Proctor Review Action Form */}
          {isPendingReview ? (
            <Card className="border-brand-500/30">
              <CardHeader className="bg-brand-50/40 dark:bg-brand-950/20">
                <CardTitle className="text-sm text-brand-900 dark:text-brand-200">
                  Submit Proctor Recommendation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Recommendation Action <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <label
                        className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                          decision === 'recommend_approval'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="decision"
                          value="recommend_approval"
                          checked={decision === 'recommend_approval'}
                          onChange={() => setDecision('recommend_approval')}
                          className="hidden"
                        />
                        <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                        <span className="text-xs">Recommend Approval</span>
                      </label>

                      <label
                        className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                          decision === 'return_for_correction'
                            ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-800 dark:text-amber-200 font-bold'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="decision"
                          value="return_for_correction"
                          checked={decision === 'return_for_correction'}
                          onChange={() => setDecision('return_for_correction')}
                          className="hidden"
                        />
                        <RotateCcw className="w-5 h-5 mx-auto mb-1 text-amber-600" />
                        <span className="text-xs">Return for Edit</span>
                      </label>

                      <label
                        className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                          decision === 'recommend_rejection'
                            ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-800 dark:text-rose-200 font-bold'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="decision"
                          value="recommend_rejection"
                          checked={decision === 'recommend_rejection'}
                          onChange={() => setDecision('recommend_rejection')}
                          className="hidden"
                        />
                        <XCircle className="w-5 h-5 mx-auto mb-1 text-rose-600" />
                        <span className="text-xs">Recommend Rejection</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Proctor Remarks{' '}
                      {decision !== 'recommend_approval' && <span className="text-rose-500">(Mandatory)</span>}
                    </label>
                    <textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder={
                        decision === 'recommend_approval'
                          ? 'Optional positive endorsement remarks...'
                          : decision === 'return_for_correction'
                          ? 'Detail specific missing documents or revisions required...'
                          : 'State academic reason for recommending rejection...'
                      }
                      rows={3}
                      required={decision !== 'recommend_approval'}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={isSubmitting}
                      className={decision === 'recommend_rejection' ? 'bg-rose-600 hover:bg-rose-700' : ''}
                    >
                      Submit Recommendation
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Proctor Review Summary</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Reviewer:</span>
                  <span className="font-semibold">{request.proctorReview?.proctorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Recommendation:</span>
                  <Badge status={request.status}>{request.status}</Badge>
                </div>
                <div>
                  <span className="text-slate-400">Remarks:</span>
                  <p className="mt-1 p-2 bg-slate-50 dark:bg-slate-900 rounded italic">
                    "{request.proctorReview?.remarks}"
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Attendance Basis & Student Profile */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-brand-600" />
                <span>Attendance Evidence Snapshot</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-center">
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
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

              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-slate-500">
                  <span>Classes Attended:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {request.attendanceSnapshot.classesAttended} / {request.attendanceSnapshot.classesConducted}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Cutoff Threshold:</span>
                  <span className="font-semibold">{request.attendanceSnapshot.threshold}%</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Dataset:</span>
                  <span className="font-mono">{request.attendanceSnapshot.datasetVersion}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Freshness:</span>
                  <span className={request.attendanceSnapshot.isStale ? 'text-amber-600 font-bold' : 'text-emerald-600'}>
                    {request.attendanceSnapshot.isStale ? 'Stale Record' : 'Current'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Student Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400">Student:</span>
                <div className="font-bold text-slate-800 dark:text-slate-200">{request.studentName}</div>
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
                <span className="text-slate-400">Class:</span>
                <div className="text-slate-700 dark:text-slate-300">
                  {request.studentYear} • Section {request.studentSection}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
