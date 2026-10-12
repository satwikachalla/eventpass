import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

export const AccessDenied: React.FC = () => {
  const navigate = useNavigate();
  const { role, currentUser } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-navy-900">
      <div className="max-w-md w-full bg-white dark:bg-navy-850 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-200 dark:border-rose-900">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Access Denied
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          Your current session role (<span className="font-semibold text-rose-600 uppercase">{role}</span>) is not authorized to access this protected area.
        </p>

        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-left text-xs text-slate-600 dark:text-slate-300">
          <div className="font-semibold">User: {currentUser?.displayName}</div>
          <div className="text-[11px] text-slate-400">{currentUser?.email}</div>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <Button
            variant="primary"
            onClick={() => {
              if (role === 'student') navigate('/student/dashboard');
              else if (role === 'proctor') navigate('/proctor/dashboard');
              else if (role === 'incharge') navigate('/incharge/dashboard');
              else navigate('/admin/users');
            }}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Return to Authorized Dashboard
          </Button>
          <Button variant="ghost" onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};
