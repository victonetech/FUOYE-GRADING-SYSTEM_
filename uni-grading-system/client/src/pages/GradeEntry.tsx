/*
 * Grade Entry Page — FUOYE Grading System
 * Core grading interface: CA1 + CA2 → Total CA + Exam → Final Grade
 * Features: bulk CSV/Excel import, print, manual cell editing
 */
import { useState, useMemo, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Upload, Download, Printer, X } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import {
  getDepartments,
  getCourses,
  getStudents,
  getGrades,
  updateGrade,
  generateId,
  applyRounding,
  calculateGrade,
  calculateTotalCa,
  calculateTotal,
  type Student,
  type GradeEntry,
} from '@/lib/storage';

export default function GradeEntry() {
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Bulk import state
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importPreview, setImportPreview] = useState<Array<{ matricNumber: string; ca1: string; ca2: string; exam: string }>>([]);
  const [importStats, setImportStats] = useState({ matched: 0, unmatched: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const departments = getDepartments();
  const { session, semester } = useSession();
  const courses = getCourses(session);
  const students = getStudents(session);
  const grades = getGrades(session, semester);

  const deptCourses = useMemo(
    () => courses.filter((c) => c.departmentId === selectedDept && c.semester === semester),
    [courses, selectedDept, semester]
  );

  const courseStudents = useMemo(() => {
    const selected = courses.find((c) => c.id === selectedCourse);
    return students
      .filter((s) => s.departmentId === selectedDept)
      .filter((s) => !selected || s.level === selected.level)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [students, selectedDept, selectedCourse, courses]);

  const courseGrades = useMemo(
    () => grades.filter((g) => g.courseId === selectedCourse),
    [grades, selectedCourse]
  );

  const getStudentGrade = (studentId: string) =>
    courseGrades.find((g) => g.studentId === studentId);

  const handleCellEdit = (studentId: string, field: 'ca1' | 'ca2' | 'exam') => {
    const key = `${studentId}-${field}`;
    setEditingCell(key);
    const grade = getStudentGrade(studentId);
    setEditValue(String(grade?.[field] ?? ''));
  };

  const handleCellSave = (
    studentId: string,
    field: 'ca1' | 'ca2' | 'exam'
  ) => {
    const value = parseFloat(editValue);
    const key = `${studentId}-${field}`;

    if (isNaN(value) || value < 0) {
      setEditingCell(null);
      return;
    }

    const maxVal = field === 'exam' ? 70 : 15;
    if (value > maxVal) {
      toast.error(`Maximum value for ${field.toUpperCase()} is ${maxVal}`);
      setEditingCell(null);
      return;
    }

    const existing =
      getStudentGrade(studentId) || {
        id: generateId(),
        courseId: selectedCourse,
        studentId,
        session,
        semester,
        ca1: null,
        ca2: null,
        totalCa: null,
        exam: null,
        total: null,
        grade: null,
        remark: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

    const updated = { ...existing, updatedAt: new Date().toISOString() };
    updated[field] = value;
    updated.totalCa = calculateTotalCa(updated.ca1, updated.ca2);
    updated.total = calculateTotal(updated.totalCa, updated.exam);

    if (updated.total !== null) {
      const { grade, remark } = calculateGrade(updated.total);
      updated.grade = grade;
      updated.remark = remark;
    }

    updateGrade(updated);
    setEditingCell(null);
    toast.success(`${field.toUpperCase()} saved`);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    studentId: string,
    field: 'ca1' | 'ca2' | 'exam'
  ) => {
    if (e.key === 'Enter') handleCellSave(studentId, field);
    else if (e.key === 'Escape') setEditingCell(null);
  };

  const selectedCourseData = courses.find((c) => c.id === selectedCourse);

  // ─── Bulk Import ────────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    const processRows = (
      rows: Array<{ matricNumber: string; ca1: string; ca2: string; exam: string }>
    ) => {
      const matched: typeof rows = [];
      const unmatched: typeof rows = [];

      rows.forEach((row) => {
        const student = students.find(
          (s) =>
            s.matricNumber.toLowerCase() === row.matricNumber.toLowerCase()
        );
        if (student) {
          matched.push(row);
        } else {
          unmatched.push(row);
        }
      });

      setImportPreview(matched);
      setImportStats({
        matched: matched.length,
        unmatched: unmatched.length,
        total: rows.length,
      });
      setShowImportDialog(true);

      if (unmatched.length > 0) {
        toast.warning(
          `${unmatched.length} student(s) not found. Check matric numbers.`
        );
      }
    };

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = event.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet =
            workbook.Sheets[workbook.SheetNames[0]];
          const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(
            firstSheet,
            { defval: '' }
          );
          if (rows.length === 0) {
            toast.error('File is empty');
            return;
          }
          const parsed = rows.map((row) => {
            const keys = Object.keys(row);
            const matricKey = keys.find(
              (k) =>
                k.toLowerCase().includes('matric') ||
                k.toLowerCase().includes('reg') ||
                k.toLowerCase() === 'id' ||
                k.toLowerCase().includes('student')
            );
            const ca1Key = keys.find(
              (k) =>
                k.toLowerCase().includes('ca1') ||
                k.toLowerCase().includes('ca_1') ||
                k.toLowerCase().includes('test 1') ||
                k.toLowerCase().includes('test1')
            );
            const ca2Key = keys.find(
              (k) =>
                k.toLowerCase().includes('ca2') ||
                k.toLowerCase().includes('ca_2') ||
                k.toLowerCase().includes('test 2') ||
                k.toLowerCase().includes('test2')
            );
            const examKey = keys.find(
              (k) =>
                k.toLowerCase().includes('exam') ||
                k.toLowerCase().includes('final')
            );
            return {
              matricNumber: String(row[matricKey || ''] || '').trim(),
              ca1: String(row[ca1Key || ''] || '').trim(),
              ca2: String(row[ca2Key || ''] || '').trim(),
              exam: String(row[examKey || ''] || '').trim(),
            };
          });
          processRows(parsed);
        } catch {
          toast.error('Failed to read file');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l.length > 0);
        if (lines.length < 2) {
          toast.error('File is empty');
          return;
        }
        const header = lines[0]
          .toLowerCase()
          .split(',')
          .map((h) => h.trim());
        const matricIdx = header.findIndex(
          (h) =>
            h.includes('matric') ||
            h.includes('reg') ||
            h === 'id' ||
            h.includes('student')
        );
        const ca1Idx = header.findIndex(
          (h) =>
            h.includes('ca1') ||
            h.includes('ca_1') ||
            h.includes('test 1') ||
            h.includes('test1')
        );
        const ca2Idx = header.findIndex(
          (h) =>
            h.includes('ca2') ||
            h.includes('ca_2') ||
            h.includes('test 2') ||
            h.includes('test2')
        );
        const examIdx = header.findIndex(
          (h) => h.includes('exam') || h.includes('final')
        );

        if (matricIdx === -1) {
          toast.error('CSV must have a Matric No column');
          return;
        }

        const parsed = lines.slice(1).map((line) => {
          const cols = line
            .split(',')
            .map((c) => c.trim().replace(/^"|"$/g, ''));
          return {
            matricNumber: cols[matricIdx] || '',
            ca1: ca1Idx >= 0 ? cols[ca1Idx] || '' : '',
            ca2: ca2Idx >= 0 ? cols[ca2Idx] || '' : '',
            exam: examIdx >= 0 ? cols[examIdx] || '' : '',
          };
        });
        processRows(parsed);
      };
      reader.readAsText(file);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImportConfirm = () => {
    let count = 0;
    importPreview.forEach((row) => {
      const student = students.find(
        (s) =>
          s.matricNumber.toLowerCase() === row.matricNumber.toLowerCase()
      );
      if (!student) return;

      const existing = getStudentGrade(student.id);
      const grade: GradeEntry = existing || {
        id: generateId(),
        courseId: selectedCourse,
        studentId: student.id,
        session,
        semester,
        ca1: null,
        ca2: null,
        totalCa: null,
        exam: null,
        total: null,
        grade: null,
        remark: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const ca1Val = parseFloat(row.ca1);
      const ca2Val = parseFloat(row.ca2);
      const examVal = parseFloat(row.exam);

      if (!isNaN(ca1Val) && ca1Val >= 0 && ca1Val <= 15)
        grade.ca1 = ca1Val;
      if (!isNaN(ca2Val) && ca2Val >= 0 && ca2Val <= 15)
        grade.ca2 = ca2Val;
      if (!isNaN(examVal) && examVal >= 0 && examVal <= 70)
        grade.exam = examVal;

      grade.totalCa = calculateTotalCa(grade.ca1, grade.ca2);
      grade.total = calculateTotal(grade.totalCa, grade.exam);

      if (grade.total !== null) {
        const { grade: g, remark } = calculateGrade(grade.total);
        grade.grade = g;
        grade.remark = remark;
      }

      grade.updatedAt = new Date().toISOString();
      updateGrade(grade);
      count++;
    });

    toast.success(`${count} grade(s) imported successfully`);
    setShowImportDialog(false);
    setImportPreview([]);
  };

  const downloadTemplate = () => {
    const headers = ['Matric No', 'CA1', 'CA2', 'Exam'];
    const csv = [
      headers.join(','),
      '2024/CSC/001,12,13,55',
      '2024/CSC/002,14,11,48',
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grade_template_${selectedCourseData?.code || 'course'}_${session}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Template downloaded');
  };

  const handlePrint = () => {
    const printContent = document.getElementById('grade-table');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${selectedCourseData?.code || 'Grades'} - ${session} ${semester === 'first' ? '1st' : '2nd'} Semester</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 20px; color: #1a2d45; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1a2d45; padding-bottom: 10px; }
          .header h1 { font-size: 18px; margin-bottom: 4px; }
          .header p { font-size: 13px; color: #64748b; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px 10px; text-align: center; font-weight: 600; text-transform: uppercase; font-size: 11px; }
          td { border: 1px solid #e2e8f0; padding: 6px 10px; text-align: center; }
          .text-left { text-align: left; }
          .font-bold { font-weight: 700; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>FEDERAL UNIVERSITY OYE-EKITI</h1>
          <p>Department of ${departments.find(d => d.id === selectedDept)?.name || ''}</p>
          <p>${selectedCourseData?.code || ''} — ${selectedCourseData?.title || ''} | ${selectedCourseData?.level || ''} Level | ${session} ${semester === 'first' ? '1st' : '2nd'} Semester</p>
        </div>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <main className="ml-64 p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1a2d45]">Grade Entry</h1>
          <p className="text-sm text-slate-500 mt-1">
            Enter CA and exam scores.
          </p>
        </div>

        {/* Selectors */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select
                value={selectedDept}
                onValueChange={(v) => {
                  setSelectedDept(v);
                  setSelectedCourse('');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Course</Label>
              <Select
                value={selectedCourse}
                onValueChange={setSelectedCourse}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {deptCourses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.code} — {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Grading Table */}
        {selectedCourse && selectedCourseData ? (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            {/* Table Header Bar */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="font-semibold text-[#1a2d45]">
                    {selectedCourseData.code}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedCourseData.title} •{' '}
                    {selectedCourseData.level} Level •{' '}
                    {selectedCourseData.semester === 'first' ? '1st' : '2nd'}{' '}
                    Semester • {session}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadTemplate}
                    className="text-xs"
                  >
                    <Download size={14} className="mr-1" /> Template
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs"
                  >
                    <Upload size={14} className="mr-1" /> Import Grades
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handlePrint}
                    className="text-xs bg-[#1a2d45] hover:bg-[#1a2d45]/90"
                  >
                    <Printer size={14} className="mr-1" /> Print
                  </Button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto" id="grade-table">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-8">
                      #
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Matric No.
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-amber-600 uppercase tracking-wider">
                      CA1
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-amber-600 uppercase tracking-wider">
                      CA2
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Total CA
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Exam
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-[#1a2d45] uppercase tracking-wider">
                      Total
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-[#1a2d45] uppercase tracking-wider">
                      Grade
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {courseStudents.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-6 py-12 text-center text-slate-400 text-sm"
                      >
                        No students in this department. Add students first.
                      </td>
                    </tr>
                  ) : (
                    courseStudents.map((student, idx) => {
                      const grade = getStudentGrade(student.id);
                      const isEditingCa1 =
                        editingCell === `${student.id}-ca1`;
                      const isEditingCa2 =
                        editingCell === `${student.id}-ca2`;
                      const isEditingExam =
                        editingCell === `${student.id}-exam`;

                      return (
                        <tr
                          key={student.id}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-4 py-3 text-xs text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-3 font-mono text-sm font-medium text-[#1a2d45]">
                            {student.matricNumber}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700">
                            {student.name}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isEditingCa1 ? (
                              <Input
                                type="number"
                                min="0"
                                max="15"
                                value={editValue}
                                onChange={(e) =>
                                  setEditValue(e.target.value)
                                }
                                onKeyDown={(e) =>
                                  handleKeyDown(
                                    e,
                                    student.id,
                                    'ca1'
                                  )
                                }
                                onBlur={() =>
                                  handleCellSave(student.id, 'ca1')
                                }
                                autoFocus
                                className="w-14 h-7 text-center font-mono text-sm mx-auto"
                              />
                            ) : (
                              <button
                                onClick={() =>
                                  handleCellEdit(student.id, 'ca1')
                                }
                                className="font-mono text-sm text-amber-700 hover:bg-amber-50 px-2 py-1 rounded transition-colors"
                              >
                                {grade?.ca1 != null ? grade.ca1 : '—'}
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isEditingCa2 ? (
                              <Input
                                type="number"
                                min="0"
                                max="15"
                                value={editValue}
                                onChange={(e) =>
                                  setEditValue(e.target.value)
                                }
                                onKeyDown={(e) =>
                                  handleKeyDown(
                                    e,
                                    student.id,
                                    'ca2'
                                  )
                                }
                                onBlur={() =>
                                  handleCellSave(student.id, 'ca2')
                                }
                                autoFocus
                                className="w-14 h-7 text-center font-mono text-sm mx-auto"
                              />
                            ) : (
                              <button
                                onClick={() =>
                                  handleCellEdit(student.id, 'ca2')
                                }
                                className="font-mono text-sm text-amber-700 hover:bg-amber-50 px-2 py-1 rounded transition-colors"
                              >
                                {grade?.ca2 != null ? grade.ca2 : '—'}
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center font-mono text-sm text-slate-600">
                            {grade?.totalCa != null
                              ? grade.totalCa
                              : '—'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isEditingExam ? (
                              <Input
                                type="number"
                                min="0"
                                max="70"
                                value={editValue}
                                onChange={(e) =>
                                  setEditValue(e.target.value)
                                }
                                onKeyDown={(e) =>
                                  handleKeyDown(
                                    e,
                                    student.id,
                                    'exam'
                                  )
                                }
                                onBlur={() =>
                                  handleCellSave(student.id, 'exam')
                                }
                                autoFocus
                                className="w-14 h-7 text-center font-mono text-sm mx-auto"
                              />
                            ) : (
                              <button
                                onClick={() =>
                                  handleCellEdit(student.id, 'exam')
                                }
                                className="font-mono text-sm text-slate-700 hover:bg-slate-100 px-2 py-1 rounded transition-colors"
                              >
                                {grade?.exam != null
                                  ? grade.exam
                                  : '—'}
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center font-mono text-sm font-bold text-[#1a2d45]">
                            {grade?.total != null ? grade.total : '—'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {grade?.grade ? (
                              <span
                                className={`grade-badge grade-${grade.grade}`}
                              >
                                {grade.grade}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <p className="text-slate-400 text-sm">
              Select a department and course to begin entering grades.
            </p>
          </div>
        )}
      </main>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Preview</DialogTitle>
            <DialogDescription>
              {importStats.matched} matched out of {importStats.total}{' '}
              rows.
              {importStats.unmatched > 0 &&
                ` ${importStats.unmatched} unmatched.`}
            </DialogDescription>
          </DialogHeader>

          {importPreview.length > 0 && (
            <div className="overflow-auto max-h-80 border rounded-md">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">
                      Matric No
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500">
                      CA1
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500">
                      CA2
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500">
                      Exam
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">
                      Name
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {importPreview.map((row, i) => {
                    const student = students.find(
                      (s) =>
                        s.matricNumber.toLowerCase() ===
                        row.matricNumber.toLowerCase()
                    );
                    return (
                      <tr key={i} className="border-b">
                        <td className="px-3 py-2 font-mono text-xs">
                          {row.matricNumber}
                        </td>
                        <td className="px-3 py-2 text-center text-xs">
                          {row.ca1}
                        </td>
                        <td className="px-3 py-2 text-center text-xs">
                          {row.ca2}
                        </td>
                        <td className="px-3 py-2 text-center text-xs">
                          {row.exam}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-700">
                          {student?.name || (
                            <span className="text-red-500">
                              Not found
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowImportDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImportConfirm}
              className="bg-[#1a2d45] hover:bg-[#1a2d45]/90"
            >
              Import {importPreview.length} Grades
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
