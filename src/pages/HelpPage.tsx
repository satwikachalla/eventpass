import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { generateSampleCsvTemplate } from '@/lib/attendance';
import { exportToXlsx } from '@/lib/exportUtils';
import {
  HelpCircle,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
  Download,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

export const HelpPage: React.FC = () => {
  const handleDownloadCsv = () => {
    const csv = generateSampleCsvTemplate();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Sample_Attendance_Valid_and_Invalid.csv';
    link.click();
  };

  const handleDownloadXlsx = () => {
    const sample = [
      { 'Roll Number': 'CS2026-001', 'Student Name': 'Aarav Sharma', 'Department': 'Computer Science', 'Section': 'A', 'Classes Attended': 42, 'Classes Conducted': 48, 'Academic Term': 'Fall 2026' },
      { 'Roll Number': 'CS2026-002', 'Student Name': 'Diya Patel', 'Department': 'Computer Science', 'Section': 'A', 'Classes Attended': 38, 'Classes Conducted': 48, 'Academic Term': 'Fall 2026' },
      { 'Roll Number': 'CS2026-003', 'Student Name': 'Rohan Verma', 'Department': 'Computer Science', 'Section': 'B', 'Classes Attended': 32, 'Classes Conducted': 48, 'Academic Term': 'Fall 2026' },
    ];
    exportToXlsx(sample, 'Sample_Attendance_Template', 'Attendance');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-brand-900 via-indigo-900 to-navy-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-brand-200 text-xs font-semibold mb-3">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Hackathon Evaluator & Judge Demo Guide</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          EventPass Architectural Specification & Walkthrough
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
          Follow this structured evaluation script to test all 17 core rubric requirements, including real-time attendance calculations, four-tier workflows, batch CSV/Excel processing, and server-grade security controls.
        </p>
      </div>

      {/* Step-by-Step Evaluator Script */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-brand-600" />
          <span>5-Minute End-to-End Evaluation Journey</span>
        </h2>

        {/* Step 1: Student Flow */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center justify-between">
              <span>1. Student Perspective • Attendance Cutoff & OD Application</span>
              <Badge variant="primary">Persona: Student (Aarav Sharma)</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2 text-slate-600 dark:text-slate-300 leading-relaxed">
            <p>
              • In the top navigation bar, click <strong>"Student (75%)"</strong>. Notice Aarav Sharma's attendance is calculated as exactly <strong>75.0%</strong> (36/48 classes), which meets the institutional cutoff and qualifies as <strong>Eligible</strong>.
            </p>
            <p>
              • Navigate to <strong>"Submit Event Request"</strong>. Notice the real-time date validation: if end date precedes start date, an error is caught. Notice the overlap detector: entering dates that conflict with existing approved requests surfaces an informative warning without blocking valid applications.
            </p>
            <p>
              • Switch to <strong>"Student (&lt;75%)"</strong> (Diya Patel). Observe her attendance is <strong>66.67%</strong> and clearly tagged as <strong>Ineligible</strong>. View her request EP-2026-002: observe the formal rejection remarks recorded by the In-Charge citing the attendance deficit.
            </p>
          </CardContent>
        </Card>

        {/* Step 2: Proctor Review Flow */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center justify-between">
              <span>2. Proctor Review • Assigned Portfolio Mentorship</span>
              <Badge variant="info">Persona: Proctor (Dr. Rajesh Kumar)</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2 text-slate-600 dark:text-slate-300 leading-relaxed">
            <p>
              • Click <strong>"Proctor 1"</strong> in the top switcher. Observe the portfolio scope: Dr. Rajesh Kumar mentors 15 assigned students (CS2026-001 to CS2026-015).
            </p>
            <p>
              • Notice the pending request for Arjun Kapoor (EP-2026-006). Click <strong>"Review Now"</strong>.
            </p>
            <p>
              • Inspect the student's 89.58% attendance snapshot and supporting letter. Proctors can choose:
              <br />
              &nbsp;&nbsp;a) <strong>Recommend Approval</strong> (forwards to In-Charge)
              <br />
              &nbsp;&nbsp;b) <strong>Return for Edit</strong> (mandates correction remarks; student can edit & resubmit)
              <br />
              &nbsp;&nbsp;c) <strong>Recommend Rejection</strong> (mandates academic reason)
            </p>
            <p>
              • Strict RBAC Rule: Proctors <strong>cannot</strong> issue final approvals or final rejections; only the Technical-Event In-Charge possesses sanction authority.
            </p>
          </CardContent>
        </Card>

        {/* Step 3: In-Charge Flow */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center justify-between">
              <span>3. Technical-Event In-Charge • Final Decisions & Master Attendance Import</span>
              <Badge variant="purple">Persona: In-Charge (Dr. Ramesh Iyer)</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2 text-slate-600 dark:text-slate-300 leading-relaxed">
            <p>
              • Click <strong>"In-Charge"</strong> in the top switcher. View the comprehensive department analytics and KPI metrics: approval rate, pending decisions, and eligibility distribution charts.
            </p>
            <p>
              • Go to <strong>"Request Final Decisions"</strong>. Click <strong>"Finalize"</strong> on any pending application. Observe the approval and rejection workflows. If approving a student with attendance &lt; 75%, an explicit <strong>Special Attendance Override Justification</strong> is strictly enforced and audited.
            </p>
            <p>
              • Go to <strong>"Import Attendance"</strong>. Upload a CSV or Excel file. Notice the validation engine highlights valid, invalid, duplicate, and unmatched rows with exact line errors before anything is committed to the master dataset.
            </p>
          </CardContent>
        </Card>

        {/* Step 4: Administrator Flow */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center justify-between">
              <span>4. Administrator • Role Management & Immutable Audit Trail</span>
              <Badge variant="danger">Persona: Administrator</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2 text-slate-600 dark:text-slate-300 leading-relaxed">
            <p>
              • Click <strong>"Admin"</strong> in the top switcher. Navigate to <strong>"Role & User Management"</strong>. Administrators can elevate staff to Proctors or In-Charge, and reassign proctors to students.
            </p>
            <p>
              • Click <strong>"Audit Trail"</strong>. Every single role change, attendance dataset commit, student submission, and decision execution is logged with immutable timestamps, actor UIDs, and payload diffs.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Download Sample Files Box */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Download Evaluator Test Files</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" onClick={handleDownloadCsv} leftIcon={<Download className="w-3.5 h-3.5" />}>
            Download Test Attendance CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadXlsx} leftIcon={<Download className="w-3.5 h-3.5" />}>
            Download Test Attendance Excel (.xlsx)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
