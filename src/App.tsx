import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';

import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { AccessDenied } from '@/pages/AccessDenied';
import { NotFound } from '@/pages/NotFound';

import { StudentDashboard } from '@/pages/student/StudentDashboard';
import { StudentProfile } from '@/pages/student/StudentProfile';
import { EventRequestForm } from '@/pages/student/EventRequestForm';
import { StudentRequests } from '@/pages/student/StudentRequests';
import { RequestDetails } from '@/pages/RequestDetails';

import { ProctorDashboard } from '@/pages/proctor/ProctorDashboard';
import { ProctorReview } from '@/pages/proctor/ProctorReview';

import { InchargeDashboard } from '@/pages/incharge/InchargeDashboard';
import { RequestMonitoring } from '@/pages/incharge/RequestMonitoring';
import { AttendanceImport } from '@/pages/incharge/AttendanceImport';
import { AttendanceMonitoring } from '@/pages/incharge/AttendanceMonitoring';
import { SettingsPage } from '@/pages/SettingsPage';

import { AdminManagement } from '@/pages/admin/AdminManagement';
import { ReportsPage } from '@/pages/ReportsPage';
import { HelpPage } from '@/pages/HelpPage';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Pages */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/access-denied" element={<AccessDenied />} />

            {/* Protected Application Routes inside Master Layout */}
            <Route element={<Layout />}>
              {/* Student Portal */}
              <Route element={<ProtectedRoute allowedRoles={['student', 'admin']} />}>
                <Route path="/student/dashboard" element={<StudentDashboard />} />
                <Route path="/student/profile" element={<StudentProfile />} />
                <Route path="/student/requests/new" element={<EventRequestForm />} />
                <Route path="/student/requests/edit/:id" element={<EventRequestForm />} />
                <Route path="/student/requests" element={<StudentRequests />} />
                <Route path="/student/requests/:id" element={<RequestDetails />} />
              </Route>

              {/* Proctor Portal */}
              <Route element={<ProtectedRoute allowedRoles={['proctor', 'incharge', 'admin']} />}>
                <Route path="/proctor/dashboard" element={<ProctorDashboard />} />
                <Route path="/proctor/reviews" element={<ProctorDashboard />} />
                <Route path="/proctor/review/:id" element={<ProctorReview />} />
              </Route>

              {/* In-Charge Portal */}
              <Route element={<ProtectedRoute allowedRoles={['incharge', 'admin']} />}>
                <Route path="/incharge/dashboard" element={<InchargeDashboard />} />
                <Route path="/incharge/requests" element={<RequestMonitoring />} />
                <Route path="/incharge/requests/:id" element={<RequestDetails />} />
                <Route path="/incharge/attendance/import" element={<AttendanceImport />} />
                <Route path="/incharge/attendance/records" element={<AttendanceMonitoring />} />
                <Route path="/incharge/settings" element={<SettingsPage />} />
              </Route>

              {/* Admin Portal */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin/users" element={<AdminManagement />} />
                <Route path="/admin/audit-logs" element={<AdminManagement />} />
                <Route path="/admin/mappings" element={<AdminManagement />} />
              </Route>

              {/* Shared Protected Pages */}
              <Route element={<ProtectedRoute allowedRoles={['student', 'proctor', 'incharge', 'admin']} />}>
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/help" element={<HelpPage />} />
              </Route>
            </Route>

            {/* 404 Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
