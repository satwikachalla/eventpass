import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import {
  Shield,
  FileCheck,
  UploadCloud,
  Lock,
  Sparkles,
  Copy,
  Check,
  LogIn,
} from 'lucide-react';

interface DemoAccount {
  email: string;
  password: string;
}

interface DemoAccounts {
  proctor: DemoAccount;
  incharge: DemoAccount;
}

export const LandingPage: React.FC = () => {
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [demoAccounts, setDemoAccounts] = useState<DemoAccounts | null>(null);
  const [credentialsLoading, setCredentialsLoading] = useState(true);
  const [copiedCredential, setCopiedCredential] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetch('/api/evaluator-credentials')
      .then((response) => {
        if (!response.ok) throw new Error('Demo credentials are not enabled.');
        return response.json();
      })
      .then((data: { accounts?: DemoAccounts }) => {
        if (isMounted && data.accounts?.proctor && data.accounts?.incharge) {
          setDemoAccounts(data.accounts);
        }
      })
      .catch(() => {
        if (isMounted) setDemoAccounts(null);
      })
      .finally(() => {
        if (isMounted) setCredentialsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const copyCredential = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedCredential(key);
      window.setTimeout(() => setCopiedCredential(null), 1800);
    } catch {
      setCopiedCredential(null);
    }
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
            onClick={() => document.getElementById('evaluator-demos')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Evaluator Login
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

        <section id="evaluator-demos" className="mt-10 max-w-4xl mx-auto w-full text-left">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">Evaluator Access</p>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">Demo Login for Evaluators</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Dedicated, role-verified Firebase accounts</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(['proctor', 'incharge'] as const).map((role) => {
              const account = demoAccounts?.[role];
              const title = role === 'proctor' ? 'Proctor Demo Account' : 'In-Charge Demo Account';
              return (
                <article key={role} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-navy-850 p-5 shadow-subtle">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
                  {account ? (
                    <>
                      <div className="mt-4 space-y-3">
                        {(['email', 'password'] as const).map((field) => {
                          const value = account[field];
                          const key = `${role}-${field}`;
                          return (
                            <div key={field}>
                              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">{field === 'email' ? 'Email' : 'Password'}</p>
                              <div className="flex items-center gap-2">
                                <code className="min-w-0 flex-1 truncate rounded-lg bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-100">{value}</code>
                                <button type="button" onClick={() => copyCredential(key, value)} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-2 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:border-brand-400" aria-label={`Copy ${field}`}>
                                  {copiedCredential === key ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                  {copiedCredential === key ? 'Copied' : `Copy ${field === 'email' ? 'Email' : 'Password'}`}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <Button variant="outline" size="sm" className="mt-4 w-full" leftIcon={<LogIn className="h-4 w-4" />} onClick={() => navigate('/login')}>
                        Open sign in
                      </Button>
                    </>
                  ) : (
                    <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      {credentialsLoading ? 'Checking evaluator account availability…' : 'Credentials will appear here after both Firebase demo accounts are provisioned and verified.'}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </section>

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
