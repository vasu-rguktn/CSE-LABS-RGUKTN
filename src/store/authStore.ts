import { create } from "zustand";
import type { PortalUser } from "../supabase/auth";
import type { FacultySubject, StudentMaster, SubjectMaster } from "../supabase/db";

interface AuthState {
  user: PortalUser | null;
  loading: boolean;
  facultySubjects: FacultySubject[];
  studentProfile: StudentMaster | null;
  studentSubjects: SubjectMaster[];
  isAdmin: boolean;
  selectedRole: 'admin' | 'faculty' | null;
  setUser: (user: PortalUser | null) => void;
  setLoading: (loading: boolean) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  setSelectedRole: (role: 'admin' | 'faculty' | null) => void;
  setFacultySubjects: (subjects: FacultySubject[]) => void;
  setStudentProfile: (profile: StudentMaster | null) => void;
  setStudentSubjects: (subjects: SubjectMaster[]) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  isAdmin: false,
  selectedRole: null,
  facultySubjects: [],
  studentProfile: null,
  studentSubjects: [],
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setIsAdmin: (isAdmin) => set({ isAdmin }),
  setSelectedRole: (selectedRole) => set({ selectedRole }),
  setFacultySubjects: (facultySubjects) => set({ facultySubjects }),
  setStudentProfile: (studentProfile) => set({ studentProfile }),
  setStudentSubjects: (studentSubjects) => set({ studentSubjects }),
  reset: () => set({ user: null, loading: false, isAdmin: false, selectedRole: null, facultySubjects: [], studentProfile: null, studentSubjects: [] }),
}));
