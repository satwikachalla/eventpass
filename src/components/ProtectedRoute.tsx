import React from 'react';

import {
  Navigate,
  Outlet,
} from 'react-router-dom';

import { Loader2 } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<
  ProtectedRouteProps
> = ({
  allowedRoles,
}) => {
  const {
    currentUser,
    role,
    isLoading,
  } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-navy-900">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />

          <p className="text-xs text-slate-500">
            Verifying authorized session...
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser || !role) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (
    allowedRoles &&
    !allowedRoles.includes(role)
  ) {
    return (
      <Navigate
        to="/access-denied"
        replace
      />
    );
  }

  return <Outlet />;
};