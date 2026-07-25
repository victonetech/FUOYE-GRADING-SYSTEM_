/*
 * Reports Page — Bureaucratic Modern
 * Export grade reports as Excel/PDF
 * Shows summary stats and allows downloading
 */
import { useState, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import {
  getDepartments, getCourses, getStudents, getGrades,
} from '@/lib/storage';

export default function Reports() {
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');

  const departments = getDepartments();
  const courses = getCourses();
  const students = getStudents();
  const grades = getGrades();

  const deptCourses = useMemo(() =>
    courses.filter(c => c.departmentId === selectedDept),
    [courses, selectedDept]
  );

  const courseStudents = useMemo(() =>
    students.filter(s => s.departmentId === selectedDept).sort((a, b) => a.name.localeCompare(b.name)),
    [students, selectedDept]
  );

  const courseGrades = useMemo(() =>
    grades.filter(g => g.courseId === selectedCourse),
    [grades, selectedCourse]
  );

  const selectedCourseData = courses.find(c => c.id === selectedCourse);
  const selectedDeptData = departments.find(d => d.id === selectedDept);

  // Stats
  const gradedCount = courseGrades.filter(g => g.grade !== null).length;
  const passCount = courseGrades.filter(g => g.grade && g.grade !== 'F').length;
  const failCount = courseGrades.filter(g => g.grade === 'F').length;

  const generateExcel = () => {
    if (!selectedCourse || courseStudents.length === 0) {
      toast.error('Select a course with students to export');
      return;
    }

    const data = courseStudents.map((student, idx) => {
      const grade = courseGrades.find(g => g.studentId === student.id);
      return {
        'S/N': idx + 1,
        'Matric No.': student.matricNumber,
        'Full Name': student.name,
        'Level': student.level,
        'Total CA': grade?.totalCa ?? '',
        'Exam': grade?.exam ?? '',
        'Total Score': grade?.total ?? '',
        'Grade': grade?.grade ?? '',
      };
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 5 }, { wch: 14 }, { wch: 25 }, { wch: 6 },
      { wch: 8 }, { wch: 6 }, { wch: 10 }, { wch: 6 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, selectedCourseData?.code || 'Grades');
    
    const fileName = `${selectedCourseData?.code || 'grades'}_${selectedDeptData?.name || 'department'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success('Excel file downloaded');
  };

  const getDeptName = (deptId: string) => {
    return departments.find(d => d.id === deptId)?.name || 'Unknown';
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <main className="ml-64 p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1a2d45]">Reports & Export</h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate and export grade reports.
          </p>
        </div>

        {/* Selectors */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={selectedDept} onValueChange={(v) => { setSelectedDept(v); setSelectedCourse(''); }}>
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  {departments.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Course</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                <SelectContent>
                  {deptCourses.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.code} — {c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        {selectedCourse && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <p className="text-xs text-slate-500 mb-1">Total Students</p>
              <p className="text-2xl font-bold font-mono text-[#1a2d45]">{courseStudents.length}</p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <p className="text-xs text-slate-500 mb-1">Graded</p>
              <p className="text-2xl font-bold font-mono text-blue-700">{gradedCount}</p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <p className="text-xs text-slate-500 mb-1">Passed</p>
              <p className="text-2xl font-bold font-mono text-emerald-700">{passCount}</p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <p className="text-xs text-slate-500 mb-1">Failed</p>
              <p className="text-2xl font-bold font-mono text-red-700">{failCount}</p>
            </div>
          </div>
        )}

        {/* Export Actions */}
        {selectedCourse && (
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="font-semibold text-[#1a2d45] mb-4">Export Options</h3>
            <div className="flex gap-3">
              <Button onClick={generateExcel} className="bg-[#1a2d45] hover:bg-[#243a58]">
                <FileSpreadsheet size={16} className="mr-2" />
                Export to Excel
              </Button>
            </div>
            <p className="text-xs text-slate-400 mt-3">
              Exported files include: Student ID, Name, Level, Total CA, Exam, Total Score, Grade, and Remark.
              CA1 and CA2 are excluded from exports.
            </p>
          </div>
        )}

        {/* Grade Distribution */}
        {selectedCourse && gradedCount > 0 && (
          <div className="mt-6 bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="font-semibold text-[#1a2d45] mb-4">Grade Distribution</h3>
            <div className="grid grid-cols-6 gap-2">
              {['A', 'B', 'C', 'D', 'E', 'F'].map(grade => {
                const count = courseGrades.filter(g => g.grade === grade).length;
                const percentage = gradedCount > 0 ? Math.round((count / gradedCount) * 100) : 0;
                return (
                  <div key={grade} className="text-center">
                    <div className={`grade-badge grade-${grade} mx-auto mb-2`}>{grade}</div>
                    <p className="text-lg font-bold font-mono text-[#1a2d45]">{count}</p>
                    <p className="text-xs text-slate-400">{percentage}%</p>
                    <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-current rounded-full" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
