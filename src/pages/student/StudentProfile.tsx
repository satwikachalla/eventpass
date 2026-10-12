import React, {
  useEffect,
  useState,
} from 'react';

import {
  Navigate,
  Link,
} from 'react-router-dom';

import {
  User,
  BookOpen,
  ShieldCheck,
  Lock,
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { eventPassStore } from '@/lib/store';

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/Card';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

export const StudentProfile: React.FC = () => {
  const {
    currentUser,
    updateProfile,
  } = useAuth();

  const { success } = useToast();

  const [displayName, setDisplayName] =
    useState('');

  const [department, setDepartment] =
    useState('');

  const [academicYear, setAcademicYear] =
    useState('');

  const [section, setSection] =
    useState('');

  useEffect(() => {
    if (!currentUser) return;

    setDisplayName(
      currentUser.displayName || ''
    );

    setDepartment(
      currentUser.department || ''
    );

    setAcademicYear(
      currentUser.academicYear || ''
    );

    setSection(
      currentUser.section || ''
    );
  }, [currentUser]);

  if (!currentUser) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  /*
   * IMPORTANT:
   * Profile is always loaded from currentUser.
   * There is no :uid in the URL.
   *
   * Therefore:
   * /student/profile
   *
   * can ONLY display the currently
   * authenticated student's profile.
   */

  const attendance =
    currentUser.rollNumber
      ? eventPassStore.getAttendanceByRollNumber(
          currentUser.rollNumber
        )
      : null;

  const handleSave = (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    updateProfile({
      displayName,
      department,
      academicYear,
      section,
    });

    success(
      'Profile updated',
      'Your profile has been saved.'
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          My Profile
        </h1>

        <p className="text-xs text-slate-500 mt-1">
          Personal details and official attendance.
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900 flex items-center gap-3">
        <Lock className="w-5 h-5 text-brand-600" />

        <div>
          <p className="text-xs font-bold text-brand-800 dark:text-brand-300">
            Private student profile
          </p>

          <p className="text-[11px] text-brand-700 dark:text-brand-400">
            You can only access your own profile.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brand-600" />
              Attendance
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">

            <div className="text-center p-5 rounded-2xl bg-slate-50 dark:bg-slate-900">
              <div className="text-4xl font-black text-slate-900 dark:text-white">
                {attendance?.calculatedPercentage != null
                  ? `${attendance.calculatedPercentage}%`
                  : 'N/A'}
              </div>

              <div className="mt-2">
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

            <div className="space-y-3 text-xs">

              <div className="flex justify-between">
                <span className="text-slate-500">
                  Roll Number
                </span>

                <strong>
                  {currentUser.rollNumber}
                </strong>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">
                  Attended
                </span>

                <strong>
                  {attendance?.classesAttended ?? 0}
                </strong>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">
                  Conducted
                </span>

                <strong>
                  {attendance?.classesConducted ?? 0}
                </strong>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">
                  Required
                </span>

                <strong className="text-brand-600">
                  75%
                </strong>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">
                  Proctor
                </span>

                <strong>
                  {currentUser.assignedProctorName ||
                    'Not assigned'}
                </strong>
              </div>

            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-4 h-4 text-brand-600" />
              Personal Information
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={handleSave}
              className="space-y-5"
            >

              <div>
                <label className="text-xs font-semibold">
                  Full Name
                </label>

                <input
                  value={displayName}
                  onChange={(e) =>
                    setDisplayName(
                      e.target.value
                    )
                  }
                  className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold">
                  Email
                </label>

                <input
                  value={currentUser.email}
                  disabled
                  className="mt-1 w-full px-3 py-3 rounded-xl border bg-slate-100 dark:bg-slate-800 text-sm cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div>
                  <label className="text-xs font-semibold">
                    Department
                  </label>

                  <select
                    value={department}
                    onChange={(e) =>
                      setDepartment(
                        e.target.value
                      )
                    }
                    className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                  >
                    <option>
                      Computer Science & Engineering
                    </option>

                    <option>
                      Information Technology
                    </option>

                    <option>
                      Electronics & Communication
                    </option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold">
                    Academic Year
                  </label>

                  <select
                    value={academicYear}
                    onChange={(e) =>
                      setAcademicYear(
                        e.target.value
                      )
                    }
                    className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                  >
                    <option>1st Year</option>
                    <option>2nd Year</option>
                    <option>3rd Year</option>
                    <option>4th Year</option>
                  </select>
                </div>

              </div>

              <div>
                <label className="text-xs font-semibold">
                  Section
                </label>

                <input
                  value={section}
                  onChange={(e) =>
                    setSection(
                      e.target.value
                    )
                  }
                  maxLength={3}
                  className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                />
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />

                <div>
                  <p className="text-xs font-bold">
                    Assigned Proctor
                  </p>

                  <p className="text-xs text-slate-500">
                    {currentUser.assignedProctorName ||
                      'Not assigned'}
                  </p>
                </div>
              </div>

              <Button type="submit">
                Save Changes
              </Button>

            </form>
          </CardContent>
        </Card>

      </div>

      <Link
        to="/student/dashboard"
        className="text-xs text-brand-600 hover:underline"
      >
        ← Back to Dashboard
      </Link>
    </div>
  );
};