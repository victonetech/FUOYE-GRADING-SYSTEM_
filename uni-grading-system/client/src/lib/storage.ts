// Local storage utility for offline data persistence
// All data is stored in browser localStorage for full offline operation
// Multi-session support: data is tagged by academic session + semester

const STORAGE_KEYS = {
  FACULTIES: 'ugs_faculties',
  DEPARTMENTS: 'ugs_departments',
  COURSES: 'ugs_courses',
  STUDENTS: 'ugs_students',
  GRADES: 'ugs_grades',
  SETTINGS: 'ugs_settings',
} as const;

export interface Faculty {
  id: string;
  name: string;
  code: string;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  facultyId: string;
  hod: string;
  createdAt: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  departmentId: string;
  level: '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800';
  semester: 'first' | 'second';
  session: string; // e.g. '2024/2025'
  creditUnits: number;
  createdAt: string;
}

export interface Student {
  id: string;
  matricNumber: string;
  name: string;
  departmentId: string;
  level: string;
  email?: string;
  session: string; // e.g. '2024/2025'
  createdAt: string;
}

export interface GradeEntry {
  id: string;
  courseId: string;
  studentId: string;
  session: string;   // e.g. '2024/2025'
  semester: string;  // 'first' or 'second'
  ca1: number | null;
  ca2: number | null;
  totalCa: number | null;
  exam: number | null;
  total: number | null;
  grade: string | null;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
}

function getData<T>(key: string, defaultValue: T[]): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setData<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Get current session from sidebar state
export function getCurrentSession(): string {
  return localStorage.getItem('ugs_session') || '2024/2025';
}

export function getCurrentSemester(): string {
  return localStorage.getItem('ugs_semester') || 'first';
}

// Faculty operations (not session-scoped — faculties are universal)
export function getFaculties(): Faculty[] {
  return getData<Faculty>(STORAGE_KEYS.FACULTIES, []);
}

export function saveFaculties(faculties: Faculty[]): void {
  setData(STORAGE_KEYS.FACULTIES, faculties);
}

export function addFaculty(faculty: Faculty): void {
  const faculties = getFaculties();
  faculties.push(faculty);
  saveFaculties(faculties);
}

export function updateFaculty(id: string, updates: Partial<Faculty>): void {
  const faculties = getFaculties().map(f =>
    f.id === id ? { ...f, ...updates } : f
  );
  saveFaculties(faculties);
}

export function deleteFaculty(id: string): void {
  saveFaculties(getFaculties().filter(f => f.id !== id));
}

// Department operations (not session-scoped — departments are universal)
export function getDepartments(): Department[] {
  return getData<Department>(STORAGE_KEYS.DEPARTMENTS, []);
}

export function saveDepartments(departments: Department[]): void {
  setData(STORAGE_KEYS.DEPARTMENTS, departments);
}

export function addDepartment(department: Department): void {
  const departments = getDepartments();
  departments.push(department);
  saveDepartments(departments);
}

export function updateDepartment(id: string, updates: Partial<Department>): void {
  const departments = getDepartments().map(d =>
    d.id === id ? { ...d, ...updates } : d
  );
  saveDepartments(departments);
}

export function deleteDepartment(id: string): void {
  saveDepartments(getDepartments().filter(d => d.id !== id));
}

// Course operations (session-scoped)
export function getCourses(session?: string): Course[] {
  const s = session || getCurrentSession();
  const allCourses = getData<Course>(STORAGE_KEYS.COURSES, []);
  return allCourses.filter(c => c.session === s);
}

export function getAllCourses(): Course[] {
  return getData<Course>(STORAGE_KEYS.COURSES, []);
}

export function saveCourses(courses: Course[]): void {
  setData(STORAGE_KEYS.COURSES, courses);
}

export function addCourse(course: Course): void {
  const allCourses = getAllCourses();
  allCourses.push(course);
  saveCourses(allCourses);
}

export function updateCourse(id: string, updates: Partial<Course>): void {
  const allCourses = getAllCourses().map(c =>
    c.id === id ? { ...c, ...updates } : c
  );
  saveCourses(allCourses);
}

export function deleteCourse(id: string): void {
  saveCourses(getAllCourses().filter(c => c.id !== id));
}

// Student operations (session-scoped)
export function getStudents(session?: string): Student[] {
  const s = session || getCurrentSession();
  const allStudents = getData<Student>(STORAGE_KEYS.STUDENTS, []);
  return allStudents.filter(st => st.session === s);
}

export function getAllStudents(): Student[] {
  return getData<Student>(STORAGE_KEYS.STUDENTS, []);
}

export function saveStudents(students: Student[]): void {
  // Replace all students (used during bulk import)
  const existing = getAllStudents();
  const otherSessions = existing.filter(s => s.session !== getCurrentSession());
  setData(STORAGE_KEYS.STUDENTS, [...otherSessions, ...students]);
}

export function addStudent(student: Student): void {
  const allStudents = getAllStudents();
  allStudents.push(student);
  setData(STORAGE_KEYS.STUDENTS, allStudents);
}

export function updateStudent(id: string, updates: Partial<Student>): void {
  const allStudents = getAllStudents().map(s =>
    s.id === id ? { ...s, ...updates } : s
  );
  setData(STORAGE_KEYS.STUDENTS, allStudents);
}

export function deleteStudent(id: string): void {
  setData(STORAGE_KEYS.STUDENTS, getAllStudents().filter(s => s.id !== id));
}

// Grade operations (session + semester scoped)
export function getGrades(session?: string, semester?: string): GradeEntry[] {
  const s = session || getCurrentSession();
  const sm = semester || getCurrentSemester();
  const allGrades = getData<GradeEntry>(STORAGE_KEYS.GRADES, []);
  return allGrades.filter(g => g.session === s && g.semester === sm);
}

export function getAllGrades(): GradeEntry[] {
  return getData<GradeEntry>(STORAGE_KEYS.GRADES, []);
}

export function getGradesForCourse(courseId: string, session?: string, semester?: string): GradeEntry[] {
  const s = session || getCurrentSession();
  const sm = semester || getCurrentSemester();
  const allGrades = getAllGrades();
  return allGrades.filter(g => g.courseId === courseId && g.session === s && g.semester === sm);
}

export function saveGrades(grades: GradeEntry[]): void {
  // Merge: keep grades from other sessions, replace grades for current session/semester
  const allGrades = getAllGrades();
  const s = getCurrentSession();
  const sm = getCurrentSemester();
  const otherGrades = allGrades.filter(g => !(g.session === s && g.semester === sm));
  setData(STORAGE_KEYS.GRADES, [...otherGrades, ...grades]);
}

export function updateGrade(entry: GradeEntry): void {
  const allGrades = getAllGrades();
  const idx = allGrades.findIndex(g => g.id === entry.id);
  if (idx >= 0) {
    allGrades[idx] = entry;
  } else {
    allGrades.push(entry);
  }
  setData(STORAGE_KEYS.GRADES, allGrades);
}

export function saveGradesBulk(entries: GradeEntry[], session: string, semester: string): void {
  const allGrades = getAllGrades();
  const otherGrades = allGrades.filter(g => !(g.session === session && g.semester === semester));
  setData(STORAGE_KEYS.GRADES, [...otherGrades, ...entries]);
}

// Utility: generate unique ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Grading logic
export interface RoundBoundary {
  threshold: number;
  roundTo: number;
}

const ROUND_BOUNDARIES: RoundBoundary[] = [
  { threshold: 29, roundTo: 30 },
  { threshold: 39, roundTo: 40 },
  { threshold: 59, roundTo: 60 },
  { threshold: 69, roundTo: 70 },
  { threshold: 79, roundTo: 80 },
  { threshold: 89, roundTo: 90 },
];

export function applyRounding(score: number): number {
  for (const boundary of ROUND_BOUNDARIES) {
    if (score === boundary.threshold) {
      return boundary.roundTo;
    }
  }
  return score;
}

export function calculateGrade(total: number): { grade: string; remark: string } {
  const rounded = applyRounding(total);
  if (rounded >= 70) return { grade: 'A', remark: 'EXCELLENT' };
  if (rounded >= 60) return { grade: 'B', remark: 'VERY GOOD' };
  if (rounded >= 50) return { grade: 'C', remark: 'GOOD' };
  if (rounded >= 45) return { grade: 'D', remark: 'PASS' };
  if (rounded >= 40) return { grade: 'E', remark: 'PASS' };
  return { grade: 'F', remark: 'FAIL' };
}

export function calculateTotalCa(ca1: number | null, ca2: number | null): number | null {
  if (ca1 === null || ca2 === null) return null;
  const total = applyRounding(ca1) + applyRounding(ca2);
  return Math.min(total, 30);
}

export function calculateTotal(totalCa: number | null, exam: number | null): number | null {
  if (totalCa === null || exam === null) return null;
  return totalCa + applyRounding(exam);
}
