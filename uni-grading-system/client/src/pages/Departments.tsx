/*
 * Departments Page — Bureaucratic Modern
 * Manage departments within faculties
 */
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import {
  getFaculties, getDepartments, getAllCourses, getAllStudents,
  addDepartment, updateDepartment, deleteDepartment, generateId,
  type Department,
} from '@/lib/storage';

export default function Departments() {
  const [departments, setDepartments] = useState<Department[]>(getDepartments());
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [form, setForm] = useState({ name: '', code: '', facultyId: '', hod: '' });

  const faculties = getFaculties();
  const courses = getAllCourses();
  const students = getAllStudents();

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', code: '', facultyId: '', hod: '' });
    setShowDialog(true);
  };

  const openEdit = (dept: Department) => {
    setEditing(dept);
    setForm({ name: dept.name, code: dept.code, facultyId: dept.facultyId, hod: dept.hod });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.code.trim() || !form.facultyId) {
      toast.error('All fields are required');
      return;
    }

    if (editing) {
      updateDepartment(editing.id, {
        name: form.name.trim(),
        code: form.code.trim(),
        facultyId: form.facultyId,
        hod: form.hod.trim(),
      });
      toast.success('Department updated');
    } else {
      addDepartment({
        id: generateId(),
        name: form.name.trim(),
        code: form.code.trim(),
        facultyId: form.facultyId,
        hod: form.hod.trim(),
        createdAt: new Date().toISOString(),
      });
      toast.success('Department added');
    }

    setDepartments(getDepartments());
    setShowDialog(false);
    setForm({ name: '', code: '', facultyId: '', hod: '' });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const courseCount = courses.filter(c => c.departmentId === deleteTarget.id).length;
    const studentCount = students.filter(s => s.departmentId === deleteTarget.id).length;
    if (courseCount > 0 || studentCount > 0) {
      toast.error(`Cannot delete: has ${courseCount} course(s) and ${studentCount} student(s)`);
      setDeleteTarget(null);
      return;
    }
    deleteDepartment(deleteTarget.id);
    setDepartments(getDepartments());
    toast.success('Department deleted');
    setDeleteTarget(null);
  };

  const filtered = departments.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.code.toLowerCase().includes(search.toLowerCase())
  );

  const getFacultyName = (facultyId: string) => {
    return faculties.find(f => f.id === facultyId)?.name || 'Unknown';
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <main className="ml-64 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1a2d45]">Departments</h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage departments within faculties
            </p>
          </div>
          <Button onClick={openCreate} className="bg-[#1a2d45] hover:bg-[#243a58]">
            <Plus size={16} className="mr-2" />
            Add Department
          </Button>
        </div>

        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search departments..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-400 text-sm">
                {search ? 'No departments match your search' : 'No departments added yet. Click "Add Department" to begin.'}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Code</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Faculty</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">HOD</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Courses</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((d, i) => (
                  <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm font-medium text-[#1a2d45]">{d.code}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{d.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{getFacultyName(d.facultyId)}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{d.hod || '—'}</td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-400">{courses.filter(c => c.departmentId === d.id).length}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(d)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteTarget(d)} className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
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

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-[#1a2d45]">{editing ? 'Edit Department' : 'Add New Department'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="dept-code">Department Code</Label>
                <Input id="dept-code" placeholder="e.g., CSC, MAT, PHY" value={form.code} onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))} className="font-mono" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dept-name">Department Name</Label>
                <Input id="dept-name" placeholder="e.g., Computer Science" value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dept-faculty">Faculty</Label>
                <Select value={form.facultyId} onValueChange={(v) => setForm(prev => ({ ...prev, facultyId: v }))}>
                  <SelectTrigger id="dept-faculty"><SelectValue placeholder="Select faculty" /></SelectTrigger>
                  <SelectContent>
                    {faculties.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dept-hod">Head of Department</Label>
                <Input id="dept-hod" placeholder="e.g., Prof. John Doe" value={form.hod} onChange={(e) => setForm(prev => ({ ...prev, hod: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button onClick={handleSave} className="bg-[#1a2d45] hover:bg-[#243a58]">{editing ? 'Update' : 'Add Department'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Department</AlertDialogTitle>
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
