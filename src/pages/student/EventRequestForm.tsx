import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { eventPassStore } from '@/lib/store';
import { checkDateOverlap } from '@/lib/workflow';
import { EventCategory, EventRequest } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import {
  Calendar,
  AlertTriangle,
  Upload,
  Link as LinkIcon,
  CheckCircle2,
  FileText,
  Building,
  MapPin,
  HelpCircle,
} from 'lucide-react';

export const EventRequestForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { success, error, warning } = useToast();

  const [title, setTitle] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [category, setCategory] = useState<EventCategory>('Hackathon');
  const [venueCity, setVenueCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [eventUrl, setEventUrl] = useState('');
  const [purpose, setPurpose] = useState('');
  const [expectedBenefit, setExpectedBenefit] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [overlapWarning, setOverlapWarning] = useState<string | null>(null);
  const [existingRequest, setExistingRequest] = useState<EventRequest | null>(null);

  // If editing an existing request
  useEffect(() => {
    if (isEditing && id) {
      const req = eventPassStore.getEventRequestById(id);
      if (req) {
        if (req.studentUid !== currentUser?.uid && currentUser?.role !== 'admin') {
          error('Forbidden', 'You can only edit your own requests.');
          navigate('/student/requests');
          return;
        }
        setExistingRequest(req);
        setTitle(req.title);
        setOrganizer(req.organizer);
        setCategory(req.category);
        setVenueCity(req.venueCity);
        setStartDate(req.startDate);
        setEndDate(req.endDate);
        setEventUrl(req.eventUrl || '');
        setPurpose(req.purpose);
        setExpectedBenefit(req.expectedAcademicBenefit);
        setFileName(req.supportingDocName || '');
        setFileUrl(req.supportingDocUrl || '');
      }
    }
  }, [isEditing, id, currentUser, navigate, error]);

  // Check date overlap whenever startDate or endDate change
  useEffect(() => {
    if (startDate && endDate && currentUser) {
      if (new Date(startDate) > new Date(endDate)) {
        setOverlapWarning('Start date cannot be after end date.');
        return;
      }

      const allUserRequests = eventPassStore.getEventRequests({
        role: 'student',
        userUid: currentUser.uid,
      });

      const hasOverlap = checkDateOverlap(allUserRequests, startDate, endDate, id);
      if (hasOverlap) {
        setOverlapWarning(
          'Warning: You have another active event request scheduled during overlapping dates. You may still proceed with submission.'
        );
      } else {
        setOverlapWarning(null);
      }
    } else {
      setOverlapWarning(null);
    }
  }, [startDate, endDate, currentUser, id]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      error('File too large', 'Supporting document must be smaller than 10MB.');
      return;
    }

    // Validate types (PDF, PNG, JPG)
    const allowed = ['application/pdf', 'image/png', 'image/jpeg'];
    if (!allowed.includes(file.type)) {
      error('Invalid format', 'Only PDF, PNG, and JPEG files are permitted.');
      return;
    }

    setFileName(file.name);
    // In browser client mode, create object URL for immediate preview
    setFileUrl(URL.createObjectURL(file));
    success('File attached', `${file.name} ready for upload.`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      error('Authentication Error', 'You must be signed in.');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      error('Date Error', 'Start date cannot be after end date.');
      return;
    }

    if (isEditing && id) {
      try {
        eventPassStore.updateEventRequest(
          id,
          {
            title,
            organizer,
            category,
            venueCity,
            startDate,
            endDate,
            eventUrl: eventUrl || undefined,
            purpose,
            expectedAcademicBenefit: expectedBenefit,
            supportingDocName: fileName || undefined,
            supportingDocUrl: fileUrl || undefined,
          },
          currentUser
        );
        success('Request resubmitted', 'Your corrected request has been submitted for review.');
        navigate(`/student/requests/${id}`);
      } catch (err: any) {
        error('Update failed', err.message);
      }
    } else {
      try {
        const newReq = eventPassStore.createEventRequest(
          {
            studentUid: currentUser.uid,
            studentName: currentUser.displayName,
            studentRollNumber: currentUser.rollNumber || 'CS2026-001',
            studentDepartment: currentUser.department || 'Computer Science & Engineering',
            studentYear: currentUser.academicYear || '3rd Year',
            studentSection: currentUser.section || 'A',
            studentEmail: currentUser.email,
            title,
            organizer,
            category,
            venueCity,
            startDate,
            endDate,
            eventUrl: eventUrl || undefined,
            purpose,
            expectedAcademicBenefit: expectedBenefit,
            supportingDocName: fileName || undefined,
            supportingDocUrl: fileUrl || undefined,
          },
          currentUser
        );
        success('Request submitted!', `Application created under ${newReq.referenceNumber}`);
        navigate(`/student/requests/${newReq.id}`);
      } catch (err: any) {
        error('Submission failed', err.message);
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {isEditing ? `Edit & Resubmit Request (${existingRequest?.referenceNumber})` : 'Submit Technical Event Request'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Apply for institutional On-Duty (OD) sanction for hackathons, workshops, conferences, and technical competitions.
        </p>
      </div>

      {isEditing && existingRequest?.correctionRemarks && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-xs">
          <div className="font-bold flex items-center gap-1.5 mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Remarks from Proctor / In-Charge:</span>
          </div>
          <p className="leading-relaxed">{existingRequest.correctionRemarks}</p>
        </div>
      )}

      {overlapWarning && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{overlapWarning}</span>
        </div>
      )}

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Event Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Event Title / Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Smart India Hackathon 2026 Grand Finale"
                required
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            {/* Organizer & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Organizer / Host Institution <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={organizer}
                  onChange={(e) => setOrganizer(e.target.value)}
                  placeholder="e.g. Ministry of Education / IIT Bombay"
                  required
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as EventCategory)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value="Hackathon">Hackathon</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Conference">Conference</option>
                  <option value="Technical Competition">Technical Competition</option>
                  <option value="Industrial Visit">Industrial Visit</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Venue & URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Venue & City <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={venueCity}
                  onChange={(e) => setVenueCity(e.target.value)}
                  placeholder="e.g. IIT Bombay, Powai, Mumbai"
                  required
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Event Website / Registration URL (Optional)
                </label>
                <input
                  type="url"
                  value={eventUrl}
                  onChange={(e) => setEventUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Start Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  End Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Purpose */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Purpose of Participation <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="State your role, paper acceptance, finalist selection, or team details..."
                rows={3}
                required
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            {/* Expected Academic Benefit */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Expected Academic Benefit & Outcome <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={expectedBenefit}
                onChange={(e) => setExpectedBenefit(e.target.value)}
                placeholder="How does this event enrich your curriculum, final year project, or institutional ranking?"
                rows={2}
                required
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            {/* Supporting Document Upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Supporting Document (Brochure / Selection Letter / Ticket)
              </label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors">
                  <Upload className="w-4 h-4 text-brand-500" />
                  <span>Choose PDF / Image</span>
                  <input
                    type="file"
                    accept=".pdf,image/png,image/jpeg"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                {fileName && (
                  <span className="text-xs text-brand-600 dark:text-brand-400 font-semibold truncate max-w-xs">
                    📎 {fileName}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Max 10MB. Allowed formats: PDF, PNG, JPG. Restricted to authorized reviewers.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => navigate('/student/requests')}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {isEditing ? 'Resubmit Corrected Request' : 'Submit for Proctor Review'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
