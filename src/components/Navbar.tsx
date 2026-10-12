import React, {
  useState,
} from 'react';

import {
  Bell,
  Sun,
  Moon,
  LogOut,
  Menu,
  Clock,
} from 'lucide-react';

import {
  useNavigate,
  Link,
} from 'react-router-dom';

import { useAuth } from '@/context/AuthContext';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { eventPassStore } from '@/lib/store';
import { useEventPassStoreVersion } from '@/lib/useEventPassStoreVersion';

export const Navbar: React.FC<{
  onToggleSidebar?: () => void;
}> = ({
  onToggleSidebar,
}) => {
  const {
    currentUser,
    role,
    signOut,
  } = useAuth();

  const navigate = useNavigate();
  useEventPassStoreVersion();

  const [isDark, setIsDark] =
    useState(
      document.documentElement.classList.contains(
        'dark'
      )
    );

  const [showNotifications, setShowNotifications] =
    useState(false);

  const notifications =
    currentUser
      ? eventPassStore.getNotifications(
          currentUser.uid
        )
      : [];

  const unreadCount =
    notifications.filter(
      (item) => !item.isRead
    ).length;

  const toggleTheme = () => {
    document.documentElement.classList.toggle(
      'dark'
    );

    setIsDark(
      document.documentElement.classList.contains(
        'dark'
      )
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-navy-950/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 flex items-center justify-between">

        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link
            to="/"
            className="flex items-center gap-2"
          >
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center">
              <span className="text-white font-bold">
                E
              </span>
            </div>

            <div>
              <div className="font-bold text-slate-900 dark:text-white">
                EventPass
              </div>

              <div className="hidden sm:block text-[10px] text-slate-400">
                Institutional Portal
              </div>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          <div className="relative">
            <button
              onClick={() =>
                setShowNotifications(
                  (value) => !value
                )
              }
              className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Bell className="w-4 h-4" />

              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[9px] rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-navy-850 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-4">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Notifications
                </h3>

                <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-5">
                      No notifications
                    </p>
                  ) : (
                    notifications.map(
                      (notification) => (
                        <button
                          key={notification.id}
                          onClick={() => {
                            eventPassStore.markNotificationAsRead(
                              notification.id
                            );

                            if (
                              notification.link
                            ) {
                              navigate(
                                notification.link
                              );
                            }

                            setShowNotifications(
                              false
                            );
                          }}
                          className="w-full text-left p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <div className="flex justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                              {notification.title}
                            </span>

                            <Clock className="w-3 h-3 text-slate-400" />
                          </div>

                          <p className="text-[11px] text-slate-500 mt-1">
                            {notification.message}
                          </p>
                        </button>
                      )
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          {currentUser ? (
            <div className="flex items-center gap-2 pl-2 ml-1 border-l border-slate-200 dark:border-slate-800">

              <div className="hidden sm:block text-right">
                <div className="text-xs font-bold text-slate-800 dark:text-white">
                  {currentUser.displayName}
                </div>

                <Badge
                  size="sm"
                  variant={
                    role === 'admin'
                      ? 'danger'
                      : role === 'incharge'
                      ? 'purple'
                      : role === 'proctor'
                      ? 'info'
                      : 'primary'
                  }
                >
                  {role?.toUpperCase()}
                </Badge>
              </div>

              <div className="w-9 h-9 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-sm">
                {currentUser.displayName
                  ?.charAt(0)
                  ?.toUpperCase()}
              </div>

              <button
                onClick={signOut}
                title="Sign out"
                className="p-2 text-slate-400 hover:text-rose-600"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={() =>
                navigate('/login')
              }
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};