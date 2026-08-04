/*
 * Dashboard — Bureaucratic Modern
 * Overview of faculties, departments, students, courses, and recent grading activity
 * Clean stat cards, minimal decoration, data-first layout
 */
import Sidebar from '@/components/Sidebar';
import { useSession } from '@/contexts/SessionContext';
import {
  getFaculties,
  getDepartments,
  getCourses,
  getStudents,
  getGrades,
} from '@/lib/storage';
import {
  Building2,
  GraduationCap,
  BookOpen,
  Users,
  ClipboardList,
  AlertTriangle,
} from 'lucide-react';
import { Link } from 'wouter';

export default function Home() {
  const { session, semester } = useSession();
  const faculties = getFaculties();
  const departments = getDepartments();
  const courses = getCourses(session);
  const students = getStudents(session);
  const grades = getGrades(session, semester);

  const gradedStudents = grades.filter(g => g.grade !== null).length;
  const pendingGrades = grades.filter(g => g.grade === null).length;
  const failedStudents = grades.filter(g => g.grade === 'F').length;

  const stats = [
    { label: 'Faculties', value: faculties.length, icon: Building2, color: 'bg-blue-50 text-blue-700', link: '/faculties' },
    { label: 'Departments', value: departments.length, icon: GraduationCap, color: 'bg-emerald-50 text-emerald-700', link: '/departments' },
    { label: 'Courses', value: courses.length, icon: BookOpen, color: 'bg-purple-50 text-purple-700', link: '/courses' },
    { label: 'Students', value: students.length, icon: Users, color: 'bg-amber-50 text-amber-700', link: '/students' },
    { label: 'Graded', value: gradedStudents, icon: ClipboardList, color: 'bg-green-50 text-green-700', link: '/grades' },
    { label: 'Pending', value: pendingGrades, icon: AlertTriangle, color: 'bg-orange-50 text-orange-700', link: '/grades' },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <main className="ml-64 p-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1a2d45]">Dashboard</h1>

        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {stats.map((stat) => (
            <Link key={stat.label} href={stat.link}>
              <div className="bg-white rounded-lg border border-slate-200 p-5 hover:shadow-md hover:border-slate-300 transition-all duration-150 cursor-pointer group">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                    <stat.icon size={20} />
                  </div>
                  <span className="text-3xl font-bold text-[#1a2d45] font-mono">
                    {stat.value}
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-600">{stat.label}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-[#1a2d45] mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link href="/faculties">
              <button className="w-full text-left px-4 py-3 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 text-sm font-medium text-slate-700 transition-colors">
                + Add Faculty
              </button>
            </Link>
            <Link href="/departments">
              <button className="w-full text-left px-4 py-3 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 text-sm font-medium text-slate-700 transition-colors">
                + Add Department
              </button>
            </Link>
            <Link href="/students">
              <button className="w-full text-left px-4 py-3 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 text-sm font-medium text-slate-700 transition-colors">
                + Add Student
              </button>
            </Link>
            <Link href="/grades">
              <button className="w-full text-left px-4 py-3 rounded-md bg-[#1a2d45] hover:bg-[#243a58] text-white text-sm font-medium transition-colors">
                Enter Grades →
              </button>
            </Link>
          </div>
        </div>

        {/* Failures Warning */}
        {failedStudents > 0 && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">
                {failedStudents} student(s) with failing grades detected
              </p>
              <p className="text-xs text-red-600 mt-1">
                Review the <Link href="/grades" className="underline hover:text-red-800">Grade Entry</Link> page to verify these results.
              </p>
            </div>
          </div>
        )}

        {/* Offline indicator */}
        <div className="mt-6 flex items-center gap-2 text-xs text-slate-400">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>All data stored locally — system works offline</span>
        </div>
      </main>
    </div>
  );
}
