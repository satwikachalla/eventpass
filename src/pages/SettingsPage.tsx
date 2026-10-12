import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { eventPassStore } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { Settings, Save, AlertTriangle, ShieldCheck } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { currentUser, role } = useAuth();
  const { success, error } = useToast();

  const currentSettings = eventPassStore.getDepartmentSettings();

  const [threshold, setThreshold] = useState(currentSettings.attendanceThreshold);
  const [stalenessDays, setStalenessDays] = useState(currentSettings.dataStalenessDays);
  const [academicYear, setAcademicYear] = useState(currentSettings.academicYear);
  const [isSaving, setIsSaving] = useState(false);

  const canEdit = role === 'incharge' || role === 'admin';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !canEdit) {
      error('Unauthorized', 'Only Technical-Event In-Charge or Administrator can alter department policies.');
      return;
    }

    if (threshold < 50 || threshold > 100) {
      error('Invalid Threshold', 'Attendance threshold must be between 50% and 100%.');
      return;
    }

    if (stalenessDays < 7 || stalenessDays > 180) {
      error('Invalid Staleness', 'Data staleness window must be between 7 and 180 days.');
      return;
    }

    setIsSaving(true);
    try {
      eventPassStore.updateDepartmentSettings(
        {
          attendanceThreshold: Number(threshold),
          dataStalenessDays: Number(stalenessDays),
          academicYear,
        },
        currentUser
      );

      success(
        'Policy Settings Updated',
        `Threshold updated to ${threshold}%. Pending request snapshots have been recalculated.`
      );
    } catch (err: any) {
      error('Failed to update settings', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Department Policy & System Configuration
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure institutional attendance cutoff limits and data freshness policies.
          </p>
        </div>
        <Badge size="lg" variant={canEdit ? 'primary' : 'secondary'}>
          Access: {canEdit ? 'Authorized Editor' : 'Read Only'}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings className="w-4 h-4 text-brand-600" />
            <span>Attendance Policy Engine Parameters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Minimum Attendance Threshold Percentage (%)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={50}
                  max={100}
                  step={1}
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  disabled={!canEdit}
                  className="w-32 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                />
                <span className="text-xs text-slate-500">
                  Default: <strong>75%</strong>. Students with attendance below this cutoff will be flagged as Ineligible.
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Attendance Data Freshness Window (Days)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={7}
                  max={180}
                  step={1}
                  value={stalenessDays}
                  onChange={(e) => setStalenessDays(Number(e.target.value))}
                  disabled={!canEdit}
                  className="w-32 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                />
                <span className="text-xs text-slate-500">
                  Default: <strong>30 days</strong>. Datasets older than this limit flag a verification warning and require re-import.
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Active Academic Year
              </label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                disabled={!canEdit}
                className="w-64 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
              />
            </div>

            <div className="p-4 rounded-2xl bg-brand-50/50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900 text-xs space-y-2 text-slate-600 dark:text-slate-300">
              <div className="font-bold flex items-center gap-1.5 text-brand-800 dark:text-brand-200">
                <ShieldCheck className="w-4 h-4 text-brand-600" />
                <span>Audited Policy Recalculation Behavior:</span>
              </div>
              <p className="leading-relaxed">
                When you update the attendance threshold, the engine automatically recalculates eligibility for all pending event requests. Finalized decisions retain their immutable historical snapshot evidence.
              </p>
              <div className="text-[11px] text-slate-400">
                Last updated by {currentSettings.updatedBy} on {new Date(currentSettings.updatedAt).toLocaleDateString()}.
              </div>
            </div>

            {canEdit && (
              <div className="pt-2 flex justify-end">
                <Button type="submit" variant="primary" isLoading={isSaving} leftIcon={<Save className="w-4 h-4" />}>
                  Save Policy Configuration
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
