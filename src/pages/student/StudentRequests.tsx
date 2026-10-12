import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { eventPassStore } from '@/lib/store';
import { useEventPassStoreVersion } from '@/lib/useEventPassStoreVersion';
import { EventRequest, EventStatus, EventCategory } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FilterBar } from '@/components/ui/FilterBar';
import { exportToCsv, exportToXlsx } from '@/lib/exportUtils';
import {
  FileText,
  PlusCircle,
  ExternalLink,
  Edit3,
  Calendar,
  Clock,
  ArrowRight,
} from 'lucide-react';

export const StudentRequests: React.FC = () => {
  const { currentUser } = useAuth();
  useEventPassStoreVersion();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const allRequests = currentUser
    ? eventPassStore.getEventRequests({ role: 'student', userUid: currentUser.uid })
    : [];

  const filteredRequests = allRequests.filter((r) => {
      const matchSearch =
        searchTerm === '' ||
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.organizer.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
      const matchCategory = categoryFilter === 'ALL' || r.category === categoryFilter;

      return matchSearch && matchStatus && matchCategory;
    });

  const handleExportCsv = () => {
    const exportData = filteredRequests.map((r) => ({
      'Reference Number': r.referenceNumber,
      'Event Title': r.title,
      'Organizer': r.organizer,
      'Category': r.category,
      'Venue': r.venueCity,
      'Start Date': r.startDate,
      'End Date': r.endDate,
      'Status': r.status,
      'Attendance Snapshot %': r.attendanceSnapshot.percentage ?? 'N/A',
      'Eligibility Basis': r.attendanceSnapshot.statusText,
      'Proctor Recommendation': r.proctorReview?.decision ?? 'Pending',
      'Final Decision': r.finalDecision?.decision ?? 'Pending',
      'Submitted At': r.createdAt,
    }));
    exportToCsv(exportData, `My_Event_Requests_${currentUser?.rollNumber}`);
  };

  const handleExportXlsx = () => {
    const exportData = filteredRequests.map((r) => ({
      'Reference Number': r.referenceNumber,
      'Event Title': r.title,
      'Organizer': r.organizer,
      'Category': r.category,
      'Venue': r.venueCity,
      'Start Date': r.startDate,
      'End Date': r.endDate,
      'Status': r.status,
      'Attendance Snapshot %': r.attendanceSnapshot.percentage ?? 'N/A',
      'Eligibility Basis': r.attendanceSnapshot.statusText,
      'Proctor Recommendation': r.proctorReview?.decision ?? 'Pending',
      'Final Decision': r.finalDecision?.decision ?? 'Pending',
      'Submitted At': r.createdAt,
    }));
    exportToXlsx(exportData, `My_Event_Requests_${currentUser?.rollNumber}`, 'Requests');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            My Event Requests
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track workflow progress, reviewer remarks, and official On-Duty sanctions.
          </p>
        </div>
        <Link to="/student/requests/new">
          <Button variant="primary" leftIcon={<PlusCircle className="w-4 h-4" />}>
            New Event Request
          </Button>
        </Link>
      </div>

      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by event title, reference number, or organizer..."
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
            label: 'Status',
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
              { label: 'Withdrawn', value: 'Withdrawn' },
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
              { label: 'Industrial Visit', value: 'Industrial Visit' },
            ],
          },
        ]}
      />

      <Card>
        <CardContent className="p-0">
          {filteredRequests.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No matching event requests found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Ref Number</th>
                    <th className="py-3 px-4">Event Details</th>
                    <th className="py-3 px-4">Dates</th>
                    <th className="py-3 px-4">Attendance Basis</th>
                    <th className="py-3 px-4">Current Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-brand-600 dark:text-brand-400">
                        {req.referenceNumber}
                      </td>
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {req.title}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {req.organizer} • <span className="font-medium text-slate-700 dark:text-slate-300">{req.category}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        <div>{new Date(req.startDate).toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-400">to {new Date(req.endDate).toLocaleDateString()}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold">
                          {req.attendanceSnapshot.percentage !== null
                            ? `${req.attendanceSnapshot.percentage}%`
                            : 'N/A'}
                        </div>
                        <Badge size="sm" status={req.attendanceSnapshot.statusText}>
                          {req.attendanceSnapshot.statusText}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge status={req.status}>{req.status}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {req.status === 'Returned for Correction' && (
                          <Link to={`/student/requests/edit/${req.id}`}>
                            <button className="text-xs font-semibold text-amber-600 hover:text-amber-700 hover:underline">
                              Edit
                            </button>
                          </Link>
                        )}
                        <Link to={`/student/requests/${req.id}`}>
                          <button className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline">
                            View Details
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
