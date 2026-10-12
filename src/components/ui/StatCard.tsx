import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBgColor?: string;
  badge?: React.ReactNode;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBgColor = 'bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400',
  badge,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-navy-850 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-subtle ${
        onClick ? 'cursor-pointer hover:border-brand-500/40 hover:shadow-card transition-all' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl ${iconBgColor}`}>{icon}</div>
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {value}
        </div>
        {badge && <div>{badge}</div>}
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
};
