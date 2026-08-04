/*
 * Courses Page — Bureaucratic Modern
 * Manage courses: add, edit, delete
 */
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import {
  getDepartments, getCourses, getGrades, getCurrentSession,
  addCourse, updateCourse, deleteCourse, generateId,
  type Course,
} from '@/lib/storage';

export default function Courses() {
  const { session } = useSession();
  const [courses, setCourses] = useState<Course[]>(getCourses(session));

  useEffect(() => {
    setCourses(getCourses(session));
  }, [session]);
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [form, setForm] = useState({ code: '', title: '', departmentId: '', level: '', semester: '', creditUnits: '' });

  const departments = getDepartments();
  const grades = getGrades();

  const openCreate = () => {
    setEditing(null);
    setForm({ code: '', title: '', departmentId: '', level: '', semester: '', creditUnits: '' });
    setShowDialog(true);
  };

  const openEdit = (course: Course) => {
    setEditing(course);
    setForm({
      code: course.code,
      title: course.title,
      departmentId: course.departmentId,
      level: course.level,
      semester: course.semester,
      creditUnits: String(course.creditUnits),
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!form.code.trim() || !form.title.trim() || !form.departmentId || !form.level || !form.semester || !form.creditUnits) {
      toast.error('All fields are required');
      return;
    }

    const creditUnits = parseInt(form.creditUnits);
    if (isNaN(creditUnits) || creditUnits < 1 || creditUnits > 12) {
      toast.error('Credit units must be between 1 and 12');
      return;
    }

    if (editing) {
      updateCourse(editing.id, {
        code: form.code.trim().toUpperCase(),
        title: form.title.trim(),
        departmentId: form.departmentId,
        level: form.level as Course['level'],
        semester: form.semester as Course['semester'],
        creditUnits,
      });
      toast.success('Course updated');
    } else {
      addCourse({
        id: generateId(),
        code: form.code.trim().toUpperCase(),
        title: form.title.trim(),
        departmentId: form.departmentId,
        level: form.level as Course['level'],
        semester: form.semester as Course['semester'],
        session: session,
        creditUnits,
        createdAt: new Date().toISOString(),
      });
      toast.success('Course added');
    }

    setCourses(getCourses());
    setShowDialog(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const gradeCount = grades.filter(g => g.courseId === deleteTarget.id).length;
    if (gradeCount > 0) {
      toast.error(`Cannot delete: ${gradeCount} grade record(s) exist for this course`);
      setDeleteTarget(null);
      return;
    }
    deleteCourse(deleteTarget.id);
    setCourses(getCourses());
    toast.success('Course deleted');
    setDeleteTarget(null);
  };

  const filtered = courses.filter(c =>
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const getDeptName = (deptId: string) => {
    return departments.find(d => d.id === deptId)?.name || 'Unknown';
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <main className="ml-64 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1a2d45]">Courses</h1>
            <p className="text-sm text-slate-500 mt-1">Manage course offerings across departments</p>
          </div>
          <Button onClick={openCreate} className="bg-[#1a2d45] hover:bg-[#243a58]">
            <Plus size={16} className="mr-2" />
            Add Course
          </Button>
        </div>

        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search courses..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-400 text-sm">
                {search ? 'No courses match your search' : 'No courses added yet.'}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Code</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Level</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Semester</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Units</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-sm font-medium text-[#1a2d45]">{c.code}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 max-w-[200px] truncate">{c.title}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{getDeptName(c.departmentId)}</td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-500">{c.level}</td>
                    <td className="px-4 py-3 text-sm capitalize text-slate-500">{c.semester}</td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-500">{c.creditUnits}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteTarget(c)} className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
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
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-[#1a2d45]">{editing ? 'Edit Course' : 'Add New Course'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="course-code">Course Code</Label>
                  <Input id="course-code" placeholder="e.g., CSC101" value={form.code} onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))} className="font-mono" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="course-units">Credit Units</Label>
                  <Input id="course-units" type="number" placeholder="e.g., 3" value={form.creditUnits} onChange={(e) => setForm(prev => ({ ...prev, creditUnits: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="course-title">Course Title</Label>
                <Input id="course-title" placeholder="e.g., Introduction to Computer Science" value={form.title} onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="course-dept">Department</Label>
                  <Select value={form.departmentId} onValueChange={(v) => setForm(prev => ({ ...prev, departmentId: v }))}>
                    <SelectTrigger id="course-dept"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {departments.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="course-level">Level</Label>
                  <Select value={form.level} onValueChange={(v) => setForm(prev => ({ ...prev, level: v }))}>
                    <SelectTrigger id="course-level"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {['100','200','300','400','500','600','700','800'].map(l => (
                        <SelectItem key={l} value={l}>{l} Level</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="course-semester">Semester</Label>
                <Select value={form.semester} onValueChange={(v) => setForm(prev => ({ ...prev, semester: v }))}>
                  <SelectTrigger id="course-semester"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="first">First Semester</SelectItem>
                    <SelectItem value="second">Second Semester</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button onClick={handleSave} className="bg-[#1a2d45] hover:bg-[#243a58]">{editing ? 'Update' : 'Add Course'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Course</AlertDialogTitle>
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
