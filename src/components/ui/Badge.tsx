import React from 'react';
import { EventStatus } from '@/types';

export interface BadgeProps {
  children?: React.ReactNode;
  variant?:
    | 'default'
    | 'primary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'purple'
    | 'secondary'
    | 'outline';
  status?: EventStatus | 'Eligible' | 'Ineligible' | 'Unavailable' | 'Stale Data' | string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant,
  status,
  className = '',
  size = 'md',
}) => {
  let resolvedVariant = variant || 'default';
  let label = children;

  if (status) {
    label = children || status;
    switch (status) {
      case 'Approved':
      case 'Eligible':
        resolvedVariant = 'success';
        break;
      case 'Rejected':
      case 'Ineligible':
        resolvedVariant = 'danger';
        break;
      case 'Recommended for Approval':
        resolvedVariant = 'info';
        break;
      case 'Recommended for Rejection':
        resolvedVariant = 'warning';
        break;
      case 'Returned for Correction':
        resolvedVariant = 'warning';
        break;
      case 'Under Proctor Review':
      case 'Pending Final Decision':
        resolvedVariant = 'purple';
        break;
      case 'Submitted':
        resolvedVariant = 'primary';
        break;
      case 'Draft':
        resolvedVariant = 'secondary';
        break;
      case 'Withdrawn':
        resolvedVariant = 'outline';
        break;
      case 'Unavailable':
      case 'Stale Data':
        resolvedVariant = 'warning';
        break;
      default:
        resolvedVariant = 'default';
    }
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3 py-1.5 font-semibold',
  }[size];

  const variantClasses = {
    default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    primary: 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border-brand-200 dark:border-brand-800',
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    danger: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    info: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
    purple: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    secondary: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600',
    outline: 'bg-transparent text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700',
  }[resolvedVariant];

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border transition-colors ${sizeClasses} ${variantClasses} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {label}
    </span>
  );
};
