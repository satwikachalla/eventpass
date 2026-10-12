import React from 'react';

export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}> = ({ children, className = '', onClick, hoverable = false }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-navy-850 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-subtle ${
        hoverable ? 'hover:shadow-card hover:border-brand-500/30 transition-all duration-200 cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return <div className={`px-6 py-5 border-b border-slate-100 dark:border-slate-800/60 ${className}`}>{children}</div>;
};

export const CardTitle: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return <h3 className={`text-base font-semibold text-slate-900 dark:text-slate-100 ${className}`}>{children}</h3>;
};

export const CardDescription: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return <p className={`text-xs text-slate-500 dark:text-slate-400 mt-1 ${className}`}>{children}</p>;
};

export const CardContent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return <div className={`p-6 ${className}`}>{children}</div>;
};

export const CardFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-4 bg-slate-50/50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800/60 rounded-b-2xl ${className}`}>
      {children}
    </div>
  );
};
