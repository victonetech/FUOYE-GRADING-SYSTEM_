/*
 * Sidebar — FUOYE Grading System
 * Persistent left nav with Faculty/Department hierarchy
 * Navy background, clean sections, session selector
 */
import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  GraduationCap,
  Building2,
  BookOpen,
  Users,
  ClipboardList,
  Download,
  FolderOpen,
  Moon,
  Sun,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useSession } from '@/contexts/SessionContext';
import { getDepartments } from '@/lib/storage';
import { cn } from '@/lib/utils';

const SESSIONS = [
  '2023/2024',
  '2024/2025',
  '2025/2026',
  '2026/2027',
];

export default function Sidebar() {
  const [location] = useLocation();
  const departments = getDepartments();

  const { session, semester, setSession, setSemester } = useSession();

  const handleSessionChange = (s: string) => {
    setSession(s);
  };

  const handleSemesterChange = (sm: string) => {
    setSemester(sm);
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: FolderOpen },
    { path: '/faculties', label: 'Faculties', icon: Building2 },
    { path: '/departments', label: 'Departments', icon: GraduationCap },
    { path: '/courses', label: 'Courses', icon: BookOpen },
    { path: '/students', label: 'Students', icon: Users },
    { path: '/grades', label: 'Grade Entry', icon: ClipboardList },
    { path: '/reports', label: 'Reports', icon: Download },
  ];

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-30 flex flex-col w-64 bg-[#1a2d45] text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-accent/20 shrink-0 text-white font-bold text-sm">
            FG
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="font-bold text-sm tracking-tight text-white">FUOYE</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">GRADING SYSTEM</span>
          </div>
        </div>
        <ThemeToggle />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
        {navItems.map(item => {
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <div
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-100',
                  'hover:bg-white/10',
                  isActive
                    ? 'bg-accent/20 text-white border-l-2 border-accent'
                    : 'text-slate-300'
                )}
              >
                <item.icon className="w-4.5 h-4.5 shrink-0" size={18} />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Session / Semester Selector */}
      <div className="border-t border-slate-700/50 px-3 py-3 space-y-2">
        <div className="px-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Academic Session
        </div>
        <select
          value={session}
          onChange={(e) => handleSessionChange(e.target.value)}
          className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-accent"
        >
          {SESSIONS.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <div className="px-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Semester
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => handleSemesterChange('first')}
            className={cn(
              'flex-1 text-xs py-1.5 rounded transition-colors',
              semester === 'first'
                ? 'bg-accent text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            )}
          >
            1st
          </button>
          <button
            onClick={() => handleSemesterChange('second')}
            className={cn(
              'flex-1 text-xs py-1.5 rounded transition-colors',
              semester === 'second'
                ? 'bg-accent text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            )}
          >
            2nd
          </button>
        </div>
      </div>

      {/* Department Quick Access */}
      {departments.length > 0 && (
        <div className="border-t border-slate-700/50 px-2 py-3 max-h-48 overflow-y-auto">
          <div className="px-3 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Departments
          </div>
          {departments.map(dept => (
            <Link key={dept.id} href={`/students?dept=${dept.id}`}>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded text-xs text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                <span className="truncate">{dept.name}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </aside>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {theme === 'light' ? (
        <Moon size={18} />
      ) : (
        <Sun size={18} />
      )}
    </button>
  );
}
