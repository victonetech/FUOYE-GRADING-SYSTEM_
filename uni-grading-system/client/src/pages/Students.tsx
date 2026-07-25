/*
 * Students Page — FUOYE Grading System
 * Manage student records with matriculation numbers, CSV/Excel bulk import/export
 * Multi-session support: students tagged by academic session
 */
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'wouter';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Search, Upload, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import {
  getDepartments, getStudents, getGrades,
  addStudent, updateStudent, deleteStudent, generateId, saveStudents,
  getCurrentSession,
  type Student,
} from '@/lib/storage';

const CSV_TEMPLATE = 'MatricNo,FullName,DepartmentCode,Level,Email\n2024/CSC/001,John Okafor,CSC,200,john@uni.edu\n2024/CSC/002,Ada Eze,CSC,200,ada@uni.edu';

export default function Students() {
  const [searchParams] = useSearchParams();
  const deptFilter = searchParams.get('dept') || '';
  const session = getCurrentSession();
  const [students, setStudents] = useState<Student[]>(getStudents(session));
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [form, setForm] = useState({ matricNumber: '', name: '', departmentId: '', level: '', email: '' });
  const [importPreview, setImportPreview] = useState<Array<{matricNumber: string; name: string; deptCode: string; level: string; email: string}>>([]);
  const [importDeptMap, setImportDeptMap] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const departments = getDepartments();
  const grades = getGrades(session);

  useEffect(() => {
    setStudents(getStudents(session));
  }, [session]);

  useEffect(() => {
    if (deptFilter) {
      setForm(prev => ({ ...prev, departmentId: deptFilter }));
    }
  }, [deptFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm({ matricNumber: '', name: '', departmentId: deptFilter, level: '', email: '' });
    setShowDialog(true);
  };

  const openEdit = (student: Student) => {
    setEditing(student);
    setForm({
      matricNumber: student.matricNumber,
      name: student.name,
      departmentId: student.departmentId,
      level: student.level,
      email: student.email || '',
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!form.matricNumber.trim() || !form.name.trim() || !form.departmentId || !form.level) {
      toast.error('All required fields must be filled');
      return;
    }

    if (editing) {
      updateStudent(editing.id, {
        matricNumber: form.matricNumber.trim(),
        name: form.name.trim(),
        departmentId: form.departmentId,
        level: form.level,
        email: form.email.trim(),
      });
      toast.success('Student updated');
    } else {
      addStudent({
        id: generateId(),
        matricNumber: form.matricNumber.trim(),
        name: form.name.trim(),
        departmentId: form.departmentId,
        level: form.level,
        email: form.email.trim(),
        session: session,
        createdAt: new Date().toISOString(),
      });
      toast.success('Student added');
    }

    setStudents(getStudents(session));
    setShowDialog(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const gradeCount = grades.filter(g => g.studentId === deleteTarget.id).length;
    if (gradeCount > 0) {
      toast.error(`Cannot delete: ${gradeCount} grade record(s) exist for this student`);
      setDeleteTarget(null);
      return;
    }
    deleteStudent(deleteTarget.id);
    setStudents(getStudents(session));
    toast.success('Student deleted');
    setDeleteTarget(null);
  };

  const parseSpreadsheetRows = (rows: Record<string, any>[]): Array<{matricNumber: string; name: string; deptCode: string; level: string; email: string}> => {
    if (rows.length === 0) return [];

    const matricCol = Object.keys(rows[0]).find(k => k.toLowerCase().includes('matric') || k.toLowerCase().includes('reg') || k.toLowerCase().includes('id'));
    const nameCol = Object.keys(rows[0]).find(k => k.toLowerCase().includes('name') || k.toLowerCase().includes('fullname'));
    const deptCol = Object.keys(rows[0]).find(k => k.toLowerCase().includes('dept') || k.toLowerCase().includes('department'));
    const levelCol = Object.keys(rows[0]).find(k => k.toLowerCase().includes('level') || k.toLowerCase().includes('year'));
    const emailCol = Object.keys(rows[0]).find(k => k.toLowerCase().includes('email'));

    if (!matricCol || !nameCol) {
      toast.error('File must have MatricNo and FullName columns');
      return [];
    }

    return rows.map(row => ({
      matricNumber: String(row[matricCol] || '').trim(),
      name: String(row[nameCol] || '').trim(),
      deptCode: deptCol ? String(row[deptCol] || '').trim() : '',
      level: levelCol ? String(row[levelCol] || '').trim() : '',
      email: emailCol ? String(row[emailCol] || '').trim() : '',
    })).filter(r => r.matricNumber && r.name);
  };

  const processImportRows = (rows: Array<{matricNumber: string; name: string; deptCode: string; level: string; email: string}>) => {
    if (rows.length === 0) return;

    const deptMap: Record<string, string> = {};
    rows.forEach(row => {
      if (row.deptCode) {
        const dept = departments.find(d => d.code.toLowerCase() === row.deptCode.toLowerCase());
        if (dept) deptMap[row.deptCode] = dept.id;
      }
    });

    setImportDeptMap(deptMap);
    setImportPreview(rows);
    setShowImport(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = event.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

          if (rows.length === 0) {
            toast.error('Excel file is empty or has no data rows');
            return;
          }

          const parsed = parseSpreadsheetRows(rows);
          if (parsed.length === 0) return;
          processImportRows(parsed);
        } catch {
          toast.error('Failed to read Excel file. Please check the format.');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        if (lines.length < 2) {
          toast.error('CSV file is empty or has no data rows');
          return;
        }

        const header = lines[0].toLowerCase().split(',').map(h => h.trim());
        const matricIdx = header.findIndex(h => h.includes('matric') || h.includes('reg') || h.includes('id'));
        const nameIdx = header.findIndex(h => h.includes('name') || h.includes('fullname'));
        const deptIdx = header.findIndex(h => h.includes('dept') || h.includes('department'));
        const levelIdx = header.findIndex(h => h.includes('level') || h.includes('year'));
        const emailIdx = header.findIndex(h => h.includes('email'));

        if (matricIdx === -1 || nameIdx === -1) {
          toast.error('CSV must have MatricNo and FullName columns');
          return;
        }

        const parsed = lines.slice(1).map(line => {
          const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          return {
            matricNumber: cols[matricIdx] || '',
            name: cols[nameIdx] || '',
            deptCode: deptIdx >= 0 ? cols[deptIdx] || '' : '',
            level: levelIdx >= 0 ? cols[levelIdx] || '' : '',
            email: emailIdx >= 0 ? cols[emailIdx] || '' : '',
          };
        }).filter(r => r.matricNumber && r.name);

        if (parsed.length === 0) {
          toast.error('No valid student rows found in CSV');
          return;
        }

        processImportRows(parsed);
      };
      reader.readAsText(file);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImportConfirm = () => {
    if (importPreview.length === 0) return;

    const currentStudents = getStudents(session);
    let added = 0;
    let skipped = 0;
    const newStudents: Student[] = [];

    importPreview.forEach(row => {
      const exists = currentStudents.some(s => s.matricNumber === row.matricNumber);
      if (exists) {
        skipped++;
        return;
      }

      let deptId = importDeptMap[row.deptCode];
      if (!deptId) {
        const dept = departments.find(d => d.code.toLowerCase() === row.deptCode.toLowerCase());
        if (dept) deptId = dept.id;
      }

      if (!deptId) {
        deptId = deptFilter || departments[0]?.id || '';
        if (!deptId) {
          skipped++;
          return;
        }
      }

      newStudents.push({
        id: generateId(),
        matricNumber: row.matricNumber,
        name: row.name,
        departmentId: deptId,
        level: row.level || '100',
        email: row.email || '',
        session: session,
        createdAt: new Date().toISOString(),
      });
      added++;
    });

    if (newStudents.length > 0) {
      const allStudents = getStudents(session);
      saveStudents([...allStudents, ...newStudents]);
      setStudents(getStudents(session));
      toast.success(`Imported ${added} student(s) for ${session}${skipped > 0 ? ` (${skipped} duplicates skipped)` : ''}`);
    } else {
      toast.error('No new students were imported');
    }

    setImportPreview([]);
    setImportDeptMap({});
    setShowImport(false);
  };

  const handleExportCSV = () => {
    const rows = filtered.map(s => ({
      MatricNo: s.matricNumber,
      FullName: s.name,
      Department: getDeptName(s.departmentId),
      Level: s.level,
      Email: s.email || '',
      Session: session,
    }));

    const headers = Object.keys(rows[0] || { MatricNo: '', FullName: '', Department: '', Level: '', Email: '' });
    const csvContent = [
      headers.join(','),
      ...rows.map(r => headers.map(h => `"${(r as any)[h] || ''}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `students_${session.replace(/\//g, '-')}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Students exported to CSV');
  };

  const downloadTemplate = (format: 'csv' | 'xlsx' = 'csv') => {
    if (format === 'xlsx') {
      const wb = XLSX.utils.book_new();
      const data = [
        { MatricNo: '2024/CSC/001', FullName: 'John Okafor', DepartmentCode: 'CSC', Level: '200', Email: 'john@uni.edu' },
        { MatricNo: '2024/CSC/002', FullName: 'Ada Eze', DepartmentCode: 'CSC', Level: '200', Email: 'ada@uni.edu' },
      ];
      const ws = XLSX.utils.json_to_sheet(data);
      ws['!cols'] = [{ wch: 16 }, { wch: 20 }, { wch: 16 }, { wch: 6 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Students');
      XLSX.writeFile(wb, 'students_import_template.xlsx');
      toast.success('Excel template downloaded');
    } else {
      const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'students_import_template.csv';
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Template downloaded');
    }
  };

  const filtered = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.matricNumber.toLowerCase().includes(search.toLowerCase());
    const matchDept = !deptFilter || s.departmentId === deptFilter;
    return matchSearch && matchDept;
  }).sort((a, b) => a.name.localeCompare(b.name));

  const getDeptName = (deptId: string) => {
    return departments.find(d => d.id === deptId)?.name || 'Unknown';
  };

  const resolveDeptName = (code: string) => {
    if (importDeptMap[code]) {
      return departments.find(d => d.id === importDeptMap[code])?.name || code;
    }
    const dept = departments.find(d => d.code.toLowerCase() === code.toLowerCase());
    return dept ? dept.name : code;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <main className="ml-64 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1a2d45]">Students</h1>
            <p className="text-sm text-slate-500 mt-1">
              {deptFilter ? `Students in ${getDeptName(deptFilter)} — ${session}` : `Session: ${session} — Manage student records`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => downloadTemplate('csv')} className="text-slate-600">
                <FileText size={14} className="mr-1.5" />
                CSV Template
              </Button>
              <Button variant="outline" size="sm" onClick={() => downloadTemplate('xlsx')} className="text-slate-600">
                <FileSpreadsheet size={14} className="mr-1.5" />
                Excel Template
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="text-slate-600" disabled={filtered.length === 0}>
              <Download size={14} className="mr-1.5" />
              Export CSV
            </Button>
            <Button size="sm" onClick={() => fileInputRef.current?.click()} className="bg-[#1a2d45] hover:bg-[#243a58]">
              <Upload size={14} className="mr-1.5" />
              Import File
            </Button>
            <Button onClick={openCreate} className="bg-[#1a2d45] hover:bg-[#243a58]">
              <Plus size={16} className="mr-2" />
              Add Student
            </Button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={handleFileUpload}
        />

        <div className="flex items-center gap-4 mb-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search by matric no or name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          {deptFilter && (
            <Button variant="outline" size="sm" onClick={() => { const base = import.meta.env.BASE_URL || ''; window.location.href = base + 'students'; }}>
              Clear filter
            </Button>
          )}
          <span className="text-xs text-slate-400">{filtered.length} student(s) — {session}</span>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-400 text-sm mb-3">
                {search ? 'No students match your search' : `No students added for ${session} yet.`}
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload size={14} className="mr-1.5" />
                  Bulk Import (CSV / Excel)
                </Button>
              </div>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Matric No.</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Level</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-sm font-medium text-[#1a2d45]">{s.matricNumber}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{s.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{getDeptName(s.departmentId)}</td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-500">{s.level}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{s.email || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteTarget(s)} className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Single Student Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-[#1a2d45]">{editing ? 'Edit Student' : 'Add New Student'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="student-matric">Matriculation Number</Label>
                  <Input id="student-matric" placeholder="e.g., 2024/CSC/001" value={form.matricNumber} onChange={(e) => setForm(prev => ({ ...prev, matricNumber: e.target.value }))} className="font-mono" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="student-level">Level</Label>
                  <Select value={form.level} onValueChange={(v) => setForm(prev => ({ ...prev, level: v }))}>
                    <SelectTrigger id="student-level"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {['100','200','300','400','500','600','700','800'].map(l => (
                        <SelectItem key={l} value={l}>{l} Level</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="student-name">Full Name</Label>
                <Input id="student-name" placeholder="e.g., John Okafor" value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="student-dept">Department</Label>
                <Select value={form.departmentId} onValueChange={(v) => setForm(prev => ({ ...prev, departmentId: v }))}>
                  <SelectTrigger id="student-dept"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {departments.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="student-email">Email (Optional)</Label>
                <Input id="student-email" type="email" placeholder="e.g., john@university.edu" value={form.email} onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))} />
              </div>
              <div className="px-3 py-2 bg-amber-50 rounded text-xs text-amber-700">
                Session: {session} — Students are saved for this session only.
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button onClick={handleSave} className="bg-[#1a2d45] hover:bg-[#243a58]">{editing ? 'Update' : 'Add Student'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* CSV/Excel Import Preview Dialog */}
        <Dialog open={showImport} onOpenChange={setShowImport}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-[#1a2d45]">Import Preview — {importPreview.length} student(s) for {session}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-slate-500 mb-3">
                Review the students below. Duplicates (matching matriculation number) will be skipped. Students will be added to the {session} session.
              </p>
              <div className="border border-slate-200 rounded-lg overflow-hidden max-h-80 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">#</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Matric No.</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Name</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Department</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Level</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {importPreview.map((row, idx) => {
                      const isDuplicate = students.some(s => s.matricNumber === row.matricNumber);
                      const hasDept = importDeptMap[row.deptCode] || departments.find(d => d.code.toLowerCase() === row.deptCode.toLowerCase());
                      return (
                        <tr key={idx} className={isDuplicate ? 'bg-red-50/50' : ''}>
                          <td className="px-3 py-2 text-xs text-slate-400">{idx + 1}</td>
                          <td className="px-3 py-2 font-mono text-xs">{row.matricNumber}</td>
                          <td className="px-3 py-2 text-xs">{row.name}</td>
                          <td className="px-3 py-2 text-xs text-slate-500">
                            {hasDept ? resolveDeptName(row.deptCode) : (
                              <span className="text-amber-600">No dept match — will use default</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs font-mono">{row.level || '100'}</td>
                          <td className="px-3 py-2">
                            {isDuplicate ? (
                              <span className="text-xs text-red-600 font-medium">Duplicate</span>
                            ) : (
                              <span className="text-xs text-emerald-600 font-medium">New</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowImport(false); setImportPreview([]); }}>Cancel</Button>
              <Button onClick={handleImportConfirm} className="bg-[#1a2d45] hover:bg-[#243a58]">
                <Upload size={14} className="mr-1.5" />
                Import Students
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Student</AlertDialogTitle>
              <AlertDialogDescription>Are you sure? This cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
