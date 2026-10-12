import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  User,
  CheckSquare,
  Upload,
  BarChart3,
  Users,
  Settings,
  HelpCircle,
  ShieldAlert,
  ClipboardList,
} from 'lucide-react';

export const Sidebar: React.FC<{ isOpen?: boolean; onClose?: () => void }> = ({
  isOpen = false,
  onClose,
}) => {
  const { role } = useAuth();

  const studentLinks = [
    { to: '/student/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { to: '/student/requests/new', label: 'Submit Event Request', icon: <PlusCircle className="w-4 h-4" /> },
    { to: '/student/requests', label: 'My Requests', icon: <FileText className="w-4 h-4" /> },
    { to: '/student/profile', label: 'My Profile & Attendance', icon: <User className="w-4 h-4" /> },
  ];

  const proctorLinks = [
    { to: '/proctor/dashboard', label: 'Proctor Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { to: '/proctor/reviews', label: 'Assigned Student Reviews', icon: <CheckSquare className="w-4 h-4" /> },
  ];

  const inchargeLinks = [
    { to: '/incharge/dashboard', label: 'Overview & Analytics', icon: <LayoutDashboard className="w-4 h-4" /> },
    { to: '/incharge/requests', label: 'Request Final Decisions', icon: <FileText className="w-4 h-4" /> },
    { to: '/incharge/attendance/import', label: 'Import Attendance', icon: <Upload className="w-4 h-4" /> },
    { to: '/incharge/attendance/records', label: 'Attendance Records', icon: <ClipboardList className="w-4 h-4" /> },
    { to: '/reports', label: 'Reports & Exports', icon: <BarChart3 className="w-4 h-4" /> },
    { to: '/incharge/settings', label: 'Policy Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const adminLinks = [
    { to: '/admin/users', label: 'Role & User Management', icon: <Users className="w-4 h-4" /> },
    { to: '/admin/audit-logs', label: 'System Audit Logs', icon: <ShieldAlert className="w-4 h-4" /> },
    { to: '/reports', label: 'Reports & Exports', icon: <BarChart3 className="w-4 h-4" /> },
    { to: '/incharge/settings', label: 'System Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const commonLinks = [
    { to: '/help', label: 'Demo Guide & Specs', icon: <HelpCircle className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-30 md:hidden"
        />
      )}

      <aside
        className={`fixed md:sticky top-16 left-0 z-30 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-navy-900 border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between p-4 transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-6 overflow-y-auto">
          {/* Section: Primary Role Navigation */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2">
              {role === 'student' && 'Student Portal'}
              {role === 'proctor' && 'Proctor Portal'}
              {role === 'incharge' && 'In-Charge Authority'}
              {role === 'admin' && 'Administrator'}
            </div>
            <nav className="space-y-1">
              {(role === 'student'
                ? studentLinks
                : role === 'proctor'
                ? proctorLinks
                : role === 'incharge'
                ? inchargeLinks
                : adminLinks
              ).map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                    }`
                  }
                >
                  {link.icon}
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Section: Secondary / Common Navigation */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2">
              Resources
            </div>
            <nav className="space-y-1">
              {commonLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                    }`
                  }
                >
                  {link.icon}
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>

        {/* Footer info pill */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="font-semibold text-slate-800 dark:text-slate-200">
            Attendance Cutoff: 75%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Academic Term: Fall 2026
          </div>
        </div>
      </aside>
    </>
  );
};
