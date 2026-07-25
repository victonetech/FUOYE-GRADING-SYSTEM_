/*
 * Faculties Page — Bureaucratic Modern
 * Manage university faculties: add, edit, delete
 * Clean table layout with inline actions
 */
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { getFaculties, getDepartments, addFaculty, updateFaculty, deleteFaculty, generateId, type Faculty } from '@/lib/storage';

export default function Faculties() {
  const [faculties, setFaculties] = useState<Faculty[]>(getFaculties());
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<Faculty | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Faculty | null>(null);
  const [form, setForm] = useState({ name: '', code: '' });

  const departments = getDepartments();

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', code: '' });
    setShowDialog(true);
  };

  const openEdit = (faculty: Faculty) => {
    setEditing(faculty);
    setForm({ name: faculty.name, code: faculty.code });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.code.trim()) {
      toast.error('Faculty name and code are required');
      return;
    }

    if (editing) {
      updateFaculty(editing.id, { name: form.name.trim(), code: form.code.trim() });
      toast.success('Faculty updated successfully');
    } else {
      addFaculty({
        id: generateId(),
        name: form.name.trim(),
        code: form.code.trim(),
        createdAt: new Date().toISOString(),
      });
      toast.success('Faculty added successfully');
    }

    setFaculties(getFaculties());
    setShowDialog(false);
    setForm({ name: '', code: '' });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const deptCount = departments.filter(d => d.facultyId === deleteTarget.id).length;
    if (deptCount > 0) {
      toast.error(`Cannot delete: ${deptCount} department(s) belong to this faculty`);
      setDeleteTarget(null);
      return;
    }
    deleteFaculty(deleteTarget.id);
    setFaculties(getFaculties());
    toast.success('Faculty deleted');
    setDeleteTarget(null);
  };

  const filtered = faculties.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1a2d45]">Faculties</h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage university faculties and their departments
            </p>
          </div>
          <Button onClick={openCreate} className="bg-[#1a2d45] hover:bg-[#243a58]">
            <Plus size={16} className="mr-2" />
            Add Faculty
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search faculties..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-400 text-sm">
                {search ? 'No faculties match your search' : 'No faculties added yet. Click "Add Faculty" to begin.'}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Code</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Faculty Name</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Departments</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date Added</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((f, i) => (
                  <tr key={f.id} className="hover:bg-slate-50 transition-colors" style={{ animationDelay: `${i * 30}ms` }}>
                    <td className="px-6 py-4 font-mono text-sm font-medium text-[#1a2d45]">{f.code}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{f.name}</td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-500">
                      {departments.filter(d => d.facultyId === f.id).length}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(f.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(f)}
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(f)}
                          className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                        >
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

        {/* Create/Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-[#1a2d45]">
                {editing ? 'Edit Faculty' : 'Add New Faculty'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="faculty-code">Faculty Code</Label>
                <Input
                  id="faculty-code"
                  placeholder="e.g., FST, FMH, FSS"
                  value={form.code}
                  onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="faculty-name">Faculty Name</Label>
                <Input
                  id="faculty-name"
                  placeholder="e.g., Faculty of Science and Technology"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button onClick={handleSave} className="bg-[#1a2d45] hover:bg-[#243a58]">
                {editing ? 'Update' : 'Add Faculty'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Faculty</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
