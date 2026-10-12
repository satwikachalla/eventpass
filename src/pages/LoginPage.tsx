import React, { useState } from 'react';
import {
  Link,
  useNavigate,
} from 'react-router-dom';

import {
  Mail,
  Lock,
  Shield,
  LogIn,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

export const LoginPage: React.FC = () => {
  const {
    signInWithGoogle,
    signInWithPassword,
    isFirebaseActive,
  } = useAuth();

  const navigate = useNavigate();
  const { success, error } = useToast();

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [showPassword, setShowPassword] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(false);

  const redirectUser = (
    role: string
  ) => {
    switch (role) {
      case 'student':
        navigate('/student/dashboard');
        break;

      case 'proctor':
        navigate('/proctor/dashboard');
        break;

      case 'incharge':
        navigate('/incharge/dashboard');
        break;

      case 'admin':
        navigate('/admin/users');
        break;

      default:
        navigate('/');
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);

    try {
      const user =
        await signInWithGoogle();

      success(
        'Login successful',
        `Welcome ${user.displayName}`
      );

      redirectUser(user.role);
    } catch (err: any) {
      console.error(err);

      error(
        'Google login failed',
        err?.message ||
          'Unable to sign in with Google.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordLogin = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!email || !password) {
      error(
        'Missing details',
        'Enter your email and password.'
      );
      return;
    }

    setIsLoading(true);

    try {
      const user =
        await signInWithPassword(
          email,
          password
        );

      success(
        'Login successful',
        `Welcome ${user.displayName}`
      );

      redirectUser(user.role);
    } catch (err: any) {
      console.error(err);

      error(
        'Login failed',
        'Invalid email/password or account is not authorized.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-navy-950 to-brand-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-3"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>

            <div className="text-left">
              <div className="text-xl font-bold text-white">
                EventPass
              </div>

              <div className="text-xs text-slate-400">
                Institutional Event Portal
              </div>
            </div>
          </Link>
        </div>

        <div className="bg-white dark:bg-navy-850 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8">

          <div className="text-center mb-7">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Sign in
            </h1>

            <p className="text-sm text-slate-500 mt-2">
              Use your authorized institutional account.
            </p>
          </div>

          {!isFirebaseActive && (
            <div className="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />

              <span>
                Firebase authentication is not configured.
                Add the Firebase variables to your
                <strong> .env </strong>
                file before signing in.
              </span>
            </div>
          )}

          <form
            onSubmit={handlePasswordLogin}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email
              </label>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="you@college.edu"
                  autoComplete="email"
                  className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                <input
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (value) => !value
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={
                isLoading ||
                !isFirebaseActive
              }
              className="w-full"
              leftIcon={
                isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )
              }
            >
              Sign in
            </Button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            <span className="text-[10px] uppercase font-bold text-slate-400">
              OR
            </span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          </div>

          <button
            type="button"
            disabled={
              isLoading ||
              !isFirebaseActive
            }
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
<span className="text-sm font-bold">G</span>            )}

            Continue with Google
          </button>

          <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center leading-relaxed">
              Your account role is assigned by the
              institution. Students cannot select or
              switch into another user's account.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-5">
          <Link
            to="/"
            className="hover:text-brand-400"
          >
            ← Back to EventPass
          </Link>
        </p>
      </div>
    </div>
  );
};