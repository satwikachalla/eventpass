import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Link,
} from 'react-router-dom';

import {
  GraduationCap,
  PlusCircle,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { eventPassStore } from '@/lib/store';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/Card';

export const StudentDashboard: React.FC = () => {
  const { currentUser } =
    useAuth();

  const [, forceRefresh] =
    useState(0);

  /*
   * Real-time local data refresh.
   *
   * When attendance/import/request data changes,
   * the dashboard refreshes automatically.
   *
   * Replace this polling with Firestore
   * onSnapshot() when your production database
   * is connected.
   */
  useEffect(() => {
    const interval =
      window.setInterval(() => {
        forceRefresh(
          (value) => value + 1
        );
      }, 5000);

    return () =>
      window.clearInterval(
        interval
      );
  }, []);

  const attendance = useMemo(() => {
    if (!currentUser?.rollNumber) {
      return null;
    }

    return eventPassStore.getAttendanceByRollNumber(
      currentUser.rollNumber
    );
  }, [currentUser]);

  const settings =
    eventPassStore.getDepartmentSettings();

  const requests = useMemo(() => {
    if (!currentUser) {
      return [];
    }

    return eventPassStore.getEventRequests({
      role: 'student',
      userUid: currentUser.uid,
    });
  }, [currentUser]);

  const total =
    requests.length;

  const pending =
    requests.filter(
      (request) =>
        request.status ===
          'Submitted' ||
        request.status ===
          'Under Proctor Review'
    ).length;

  const approved =
    requests.filter(
      (request) =>
        request.status ===
        'Approved'
    ).length;

  const rejected =
    requests.filter(
      (request) =>
        request.status ===
        'Rejected'
    ).length;

  const returned =
    requests.filter(
      (request) =>
        request.status ===
        'Returned for Correction'
    ).length;

  const percentage =
    attendance?.calculatedPercentage ??
    0;

  const attended =
    attendance?.classesAttended ?? 0;

  const conducted =
    attendance?.classesConducted ?? 0;

  const missed =
    Math.max(
      conducted - attended,
      0
    );

  const attendanceColor =
    percentage >= 75
      ? 'bg-emerald-500'
      : 'bg-rose-500';

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-r from-brand-900 via-navy-850 to-indigo-950 p-6 sm:p-8 text-white">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs mb-3">
              <GraduationCap className="w-4 h-4" />

              {currentUser?.department}

              <span>•</span>

              {currentUser?.academicYear}

              <span>•</span>

              Section {currentUser?.section}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold">
              Welcome, {currentUser?.displayName}
            </h1>

            <p className="text-sm text-slate-300 mt-2">
              Roll Number:{' '}
              <strong>
                {currentUser?.rollNumber}
              </strong>
            </p>
          </div>

          <Link to="/student/requests/new">
            <Button
              leftIcon={
                <PlusCircle className="w-4 h-4" />
              }
            >
              Apply for Event OD
            </Button>
          </Link>

        </div>
      </div>

      {/* Attendance */}
      <Card>

        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>
              Student Attendance
            </CardTitle>

            <p className="text-xs text-slate-500 mt-1">
              Live institutional attendance status
            </p>
          </div>

          <RefreshCw className="w-4 h-4 text-slate-400" />
        </CardHeader>

        <CardContent>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Percentage */}
            <div className="flex flex-col items-center justify-center">

              <div className="relative w-36 h-36">

                <div className="absolute inset-0 rounded-full border-[14px] border-slate-100 dark:border-slate-800" />

                <div
                  className="absolute inset-0 rounded-full border-[14px] border-transparent"
                  style={{
                    background: `conic-gradient(
                      ${percentage >= 75 ? '#10b981' : '#f43f5e'}
                      ${Math.min(percentage, 100)}%,
                      transparent 0
                    )`,
                    WebkitMask:
                      'radial-gradient(farthest-side,#0000 calc(100% - 14px),#000 0)',
                    mask:
                      'radial-gradient(farthest-side,#0000 calc(100% - 14px),#000 0)',
                  }}
                />

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">
                    {attendance?.calculatedPercentage != null
                      ? `${attendance.calculatedPercentage}%`
                      : 'N/A'}
                  </span>

                  <span className="text-[10px] text-slate-500">
                    Attendance
                  </span>
                </div>

              </div>

              <div className="mt-4">
                <Badge
                  status={
                    attendance?.statusText ||
                    'Unavailable'
                  }
                >
                  {attendance?.statusText ||
                    'Unavailable'}
                </Badge>
              </div>

            </div>

            {/* Graph */}
            <div className="lg:col-span-2">

              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Attendance Breakdown
                  </h3>

                  <p className="text-xs text-slate-500">
                    {attended} attended / {conducted} conducted
                  </p>
                </div>

                <span className="text-xs font-bold text-brand-600">
                  Required: {settings.attendanceThreshold}%
                </span>
              </div>

              {/* Bar graph */}
              <div className="h-52 flex items-end justify-center gap-16 px-5 border-b border-slate-200 dark:border-slate-700">

                {/* Attended */}
                <div className="h-full flex flex-col items-center justify-end">

                  <span className="text-xs font-bold mb-2 text-emerald-600">
                    {attended}
                  </span>

                  <div
                    className="w-16 rounded-t-xl bg-emerald-500 transition-all duration-700"
                    style={{
                      height: `${conducted > 0
                        ? Math.max(
                            (attended /
                              conducted) *
                              100,
                            5
                          )
                        : 5}%`,
                    }}
                  />

                  <span className="text-[11px] font-semibold text-slate-500 mt-2">
                    Attended
                  </span>
                </div>

                {/* Missed */}
                <div className="h-full flex flex-col items-center justify-end">

                  <span className="text-xs font-bold mb-2 text-rose-500">
                    {missed}
                  </span>

                  <div
                    className="w-16 rounded-t-xl bg-rose-500 transition-all duration-700"
                    style={{
                      height: `${conducted > 0
                        ? Math.max(
                            (missed /
                              conducted) *
                              100,
                            5
                          )
                        : 5}%`,
                    }}
                  />

                  <span className="text-[11px] font-semibold text-slate-500 mt-2">
                    Missed
                  </span>
                </div>

              </div>

              <div className="grid grid-cols-3 gap-3 mt-5">

                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                  <div className="text-[10px] text-slate-500">
                    Attended
                  </div>

                  <div className="text-xl font-bold text-emerald-600">
                    {attended}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30">
                  <div className="text-[10px] text-slate-500">
                    Missed
                  </div>

                  <div className="text-xl font-bold text-rose-600">
                    {missed}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-950/30">
                  <div className="text-[10px] text-slate-500">
                    Percentage
                  </div>

                  <div className="text-xl font-bold text-brand-600">
                    {percentage}%
                  </div>
                </div>

              </div>

            </div>
          </div>

          {attendance?.isStale && (
            <div className="mt-5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 text-amber-700 text-xs flex gap-2">
              <AlertTriangle className="w-4 h-4" />

              Attendance data needs verification because
              the current record is older than the allowed
              freshness period.
            </div>
          )}

        </CardContent>
      </Card>

      {/* Request Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <StatCard
          title="Total Requests"
          value={total}
          subtitle="Your event OD requests"
          icon={
            <FileText className="w-5 h-5" />
          }
        />

        <StatCard
          title="Pending"
          value={pending}
          subtitle="Waiting for review"
          icon={
            <Clock className="w-5 h-5" />
          }
        />

        <StatCard
          title="Approved"
          value={approved}
          subtitle="Approved requests"
          icon={
            <CheckCircle2 className="w-5 h-5" />
          }
        />

        <StatCard
          title="Rejected"
          value={rejected}
          subtitle={`${returned} returned for correction`}
          icon={
            <XCircle className="w-5 h-5" />
          }
        />

      </div>

      {/* Recent Requests */}
      <Card>

        <CardHeader className="flex items-center justify-between">
          <CardTitle>
            Recent Event Requests
          </CardTitle>

          <Link
            to="/student/requests"
            className="text-xs text-brand-600 hover:underline"
          >
            View all
          </Link>
        </CardHeader>

        <CardContent className="p-0">

          {requests.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No event requests submitted yet.
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full text-xs">

                <thead className="bg-slate-50 dark:bg-slate-900">
                  <tr>
                    <th className="text-left p-4">
                      Reference
                    </th>

                    <th className="text-left p-4">
                      Event
                    </th>

                    <th className="text-left p-4">
                      Date
                    </th>

                    <th className="text-left p-4">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {requests
                    .slice(0, 8)
                    .map((request) => (
                      <tr
                        key={request.id}
                        className="border-t border-slate-100 dark:border-slate-800"
                      >
                        <td className="p-4 font-mono font-bold text-brand-600">
                          {request.referenceNumber}
                        </td>

                        <td className="p-4 font-semibold">
                          {request.title}
                        </td>

                        <td className="p-4 text-slate-500">
                          {new Date(
                            request.startDate
                          ).toLocaleDateString()}
                        </td>

                        <td className="p-4">
                          <Badge
                            status={
                              request.status
                            }
                          >
                            {request.status}
                          </Badge>
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