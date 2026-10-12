import React, { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { eventPassStore } from '@/lib/store';
import { UserProfile, UserRole } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FilterBar } from '@/components/ui/FilterBar';
import { useToast } from '@/components/ui/Toast';
import { exportToCsv, exportToXlsx } from '@/lib/exportUtils';
import {
  Users,
  Shield,
  ShieldAlert,
  UserCheck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Download,
} from 'lucide-react';

export const AdminManagement: React.FC = () => {
  const { currentUser, role } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Role Edit Modal
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [targetRole, setTargetRole] = useState<UserRole>('student');
  const [targetProctorId, setTargetProctorId] = useState<string>('');

  const allUsers = useMemo(() => eventPassStore.getUsers(), []);
  const allProctors = useMemo(() => allUsers.filter((u) => u.role === 'proctor'), [allUsers]);
  const auditLogs = useMemo(() => eventPassStore.getAuditLogs(), []);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return allUsers.filter((u) => {
      const matchSearch =
        searchTerm === '' ||
        u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.rollNumber && u.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchRole = roleFilter === 'ALL' || u.role === roleFilter;

      return matchSearch && matchRole;
    });
  }, [allUsers, searchTerm, roleFilter]);

  // Open Edit Modal
  const openEditModal = (u: UserProfile) => {
    setEditingUser(u);
    setTargetRole(u.role);
    setTargetProctorId(u.assignedProctorId || '');
  };

  const handleSaveRoleAndAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !currentUser) return;

    try {
      // 1. Update role if changed
      if (editingUser.role !== targetRole) {
        eventPassStore.updateUserRole(editingUser.uid, targetRole, currentUser);
      }

      // 2. Update proctor assignment if student
      if (editingUser.role === 'student' && targetProctorId && targetProctorId !== editingUser.assignedProctorId) {
        eventPassStore.assignProctorToStudent(editingUser.uid, targetProctorId, currentUser);
      }

      success('Permissions Updated', `Updated permissions and assignments for ${editingUser.displayName}.`);
      setEditingUser(null);
    } catch (err: any) {
      error('Failed to update user', err.message);
    }
  };

  // Export Audit Logs
  const handleExportAuditLogsCsv = () => {
    const data = auditLogs.map((l) => ({
      'Timestamp': l.timestamp,
      'Actor UID': l.actorUid,
      'Actor Name': l.actorName,
      'Actor Role': l.actorRole,
      'Action': l.action,
      'Target Type': l.targetType,
      'Target ID': l.targetId,
      'Details': JSON.stringify(l.details),
    }));
    exportToCsv(data, 'EventPass_System_Audit_Logs');
  };

  const handleExportAuditLogsXlsx = () => {
    const data = auditLogs.map((l) => ({
      'Timestamp': l.timestamp,
      'Actor UID': l.actorUid,
      'Actor Name': l.actorName,
      'Actor Role': l.actorRole,
      'Action': l.action,
      'Target Type': l.targetType,
      'Target ID': l.targetId,
      'Details': JSON.stringify(l.details),
    }));
    exportToXlsx(data, 'EventPass_System_Audit_Logs', 'AuditLogs');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Administrative Control & Security Audit Registry
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Server-controlled role designations, proctor student mappings, and immutable compliance audit logs.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'users'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Users & Roles ({allUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'audit'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Audit Trail ({auditLogs.length})
          </button>
        </div>
      </div>

      {activeTab === 'users' ? (
        <div className="space-y-4">
          <FilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search user name, email, or roll number..."
            totalCount={filteredUsers.length}
            onResetFilters={() => {
              setSearchTerm('');
              setRoleFilter('ALL');
            }}
            filters={[
              {
                label: 'Role',
                value: roleFilter,
                onChange: setRoleFilter,
                options: [
                  { label: 'All Roles', value: 'ALL' },
                  { label: 'Student', value: 'student' },
                  { label: 'Proctor', value: 'proctor' },
                  { label: 'In-Charge', value: 'incharge' },
                  { label: 'Administrator', value: 'admin' },
                ],
              },
            ]}
          />

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold">
                    <tr>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Department & Class</th>
                      <th className="py-3 px-4">Assigned Proctor</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredUsers.map((u) => (
                      <tr key={u.uid} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                          {u.displayName}
                          {u.rollNumber && (
                            <span className="block text-[11px] font-mono font-normal text-slate-400">
                              {u.rollNumber}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{u.email}</td>
                        <td className="py-3.5 px-4">
                          <Badge
                            size="sm"
                            variant={
                              u.role === 'incharge'
                                ? 'purple'
                                : u.role === 'admin'
                                ? 'danger'
                                : u.role === 'proctor'
                                ? 'info'
                                : 'default'
                            }
                          >
                            {u.role.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                          {u.department} {u.section && `• Sec ${u.section}`}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                          {u.assignedProctorName || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Button size="sm" variant="outline" onClick={() => openEditModal(u)}>
                            Manage
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Audit Logs Tab */
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-navy-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="text-xs text-slate-600 dark:text-slate-400">
              Showing <span className="font-bold text-slate-900 dark:text-white">{auditLogs.length}</span> immutable audit events.
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportAuditLogsCsv} leftIcon={<Download className="w-3.5 h-3.5" />}>
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportAuditLogsXlsx} leftIcon={<Download className="w-3.5 h-3.5" />}>
                Export Excel
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[600px]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold sticky top-0">
                    <tr>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Actor & Role</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Target Type & ID</th>
                      <th className="py-3 px-4">Audit Payload Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {log.actorName}
                          </span>
                          <span className="block text-[10px] uppercase font-bold text-slate-400">
                            {log.actorRole}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-brand-600 dark:text-brand-400">
                          {log.action}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          <span className="font-semibold">{log.targetType}</span> •{' '}
                          <span className="font-mono text-[11px]">{log.targetId}</span>
                        </td>
                        <td className="py-3 px-4 max-w-md text-slate-600 dark:text-slate-300 font-mono text-[11px] truncate">
                          {JSON.stringify(log.details)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Role & Assignment Management Modal */}
      {editingUser && (
        <Modal
          isOpen={Boolean(editingUser)}
          onClose={() => setEditingUser(null)}
          title={`Manage Permissions • ${editingUser.displayName}`}
          description={`UID: ${editingUser.uid} • Email: ${editingUser.email}`}
        >
          <form onSubmit={handleSaveRoleAndAssignment} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Authorized System Role <span className="text-rose-500">*</span>
              </label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value as UserRole)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="student">Student (Limited to own requests & profile)</option>
                <option value="proctor">Proctor (Assigned student review only)</option>
                <option value="incharge">Technical-Event In-Charge (Final decision authority)</option>
                <option value="admin">Administrator (Role and mapping management)</option>
              </select>
            </div>

            {targetRole === 'student' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assign Mentor Proctor
                </label>
                <select
                  value={targetProctorId}
                  onChange={(e) => setTargetProctorId(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value="">Select Proctor...</option>
                  {allProctors.map((p) => (
                    <option key={p.uid} value={p.uid}>
                      {p.displayName} ({p.department})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 text-amber-900 dark:text-amber-200 text-xs">
              ⚠️ Role changes are recorded permanently in the system audit trail with your administrator credentials.
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setEditingUser(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save Role & Assignment
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
