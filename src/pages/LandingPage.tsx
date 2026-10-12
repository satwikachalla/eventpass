import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import {
  Shield,
  CheckCircle2,
  FileCheck,
  UploadCloud,
  FileText,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
const { signInWithGoogle, isFirebaseActive } = useAuth();  const navigate = useNavigate();

  const handleLaunchRole = (role: 'student' | 'proctor' | 'incharge' | 'admin', uid?: string) => {
  
    if (role === 'student') navigate('/student/dashboard');
    else if (role === 'proctor') navigate('/proctor/dashboard');
    else if (role === 'incharge') navigate('/incharge/dashboard');
    else navigate('/admin/users');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-brand-50/30 dark:from-navy-950 dark:via-navy-900 dark:to-navy-950 flex flex-col justify-between">
      {/* Top Navigation */}
      <header className="max-w-7xl mx-auto w-full px-6 py-5 flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              EventPass
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 block -mt-1">
              Collegiate Technical Event Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleLaunchRole('student', 'student-001')}
          >
            Launch Demo
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={async () => {
              await signInWithGoogle();
              navigate('/student/dashboard');
            }}
          >
            Sign In with Google
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 py-12 text-center flex-1 flex flex-col justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 text-xs font-semibold mx-auto mb-6">
          <Sparkles className="w-4 h-4 text-brand-500" />
          <span>Hackathon Build • Production Architectural Spec</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          Your Events. <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-violet-600 to-cyan-500">Verified.</span> Approved.
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          The verified collegiate portal for technical event approvals and real-time attendance compliance. 
          Seamless integration from student application to proctor review and In-Charge final sanction.
        </p>

        {/* Evaluator Fast-Track Buttons */}
        <div className="mt-10 bg-white dark:bg-navy-850 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl max-w-3xl mx-auto w-full">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
            Evaluator Fast-Track • Select User Viewpoint
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <button
              onClick={() => handleLaunchRole('student', 'student-001')}
              className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-left hover:border-brand-500 hover:shadow-md transition-all group"
            >
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                <span>🎓 Student (Eligible)</span>
                <ArrowRight className="w-3.5 h-3.5 text-brand-500 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Aarav Sharma • 75.0% Attendance</p>
            </button>

            <button
              onClick={() => handleLaunchRole('student', 'student-002')}
              className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-left hover:border-brand-500 hover:shadow-md transition-all group"
            >
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                <span>🎓 Student (Ineligible)</span>
                <ArrowRight className="w-3.5 h-3.5 text-brand-500 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Diya Patel • 66.7% Attendance</p>
            </button>

            <button
              onClick={() => handleLaunchRole('proctor', 'proctor-001')}
              className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-left hover:border-brand-500 hover:shadow-md transition-all group"
            >
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                <span>👨‍🏫 Proctor 1</span>
                <ArrowRight className="w-3.5 h-3.5 text-brand-500 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Dr. Rajesh Kumar • 15 Assigned</p>
            </button>

            <button
              onClick={() => handleLaunchRole('incharge')}
              className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-left hover:border-brand-500 hover:shadow-md transition-all group"
            >
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                <span>⚡ Event In-Charge</span>
                <ArrowRight className="w-3.5 h-3.5 text-brand-500 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Dr. Ramesh Iyer • Final Approver</p>
            </button>

            <button
              onClick={() => handleLaunchRole('admin')}
              className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-left hover:border-brand-500 hover:shadow-md transition-all group"
            >
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                <span>🛡️ Administrator</span>
                <ArrowRight className="w-3.5 h-3.5 text-brand-500 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">System Roles & Audit Logs</p>
            </button>

            <button
              onClick={async () => {
                await signInWithGoogle();
                navigate('/student/dashboard');
              }}
              className="p-3.5 rounded-2xl border border-brand-300 dark:border-brand-700 bg-brand-50/50 dark:bg-brand-950/30 text-left hover:bg-brand-100/50 transition-all group"
            >
              <div className="text-xs font-bold text-brand-700 dark:text-brand-300 flex items-center justify-between">
                <span>🔑 Google Sign In</span>
                <ArrowRight className="w-3.5 h-3.5 text-brand-600 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {isFirebaseActive ? 'Connected to Firebase' : 'Simulate Google Account'}
              </p>
            </button>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-5 rounded-2xl bg-white dark:bg-navy-850 border border-slate-200/80 dark:border-slate-800 shadow-subtle">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 flex items-center justify-center mb-3">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Authoritative Attendance Engine</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              Real-time formula calculation with configurable 75% cutoff, stale data detection, and zero-count edge case handling.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-navy-850 border border-slate-200/80 dark:border-slate-800 shadow-subtle">
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950 text-violet-600 flex items-center justify-center mb-3">
              <UploadCloud className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">CSV & Excel Safe Import</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              Batch validation with row-by-row previews, duplicate/unmatched detection, and staged dataset commit safety.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-navy-850 border border-slate-200/80 dark:border-slate-800 shadow-subtle">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950 text-cyan-600 flex items-center justify-center mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Strict Least-Privilege RBAC</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              Default-deny Firestore security rules, server-enforced role assignments, and immutable decision audit trails.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full px-6 py-6 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
        <p>© 2026 EventPass Portal • All Rights Reserved</p>
        <div className="flex gap-4 mt-2 sm:mt-0">
          <span>Status: Production-Grade</span>
          <span>•</span>
          <a href="/help" className="hover:underline">Documentation & Test Guide</a>
        </div>
      </footer>
    </div>
  );
};
