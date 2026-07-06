import { create } from "zustand";
import type { PortalUser } from "../supabase/auth";
import type { FacultySubject } from "../supabase/db";

interface AuthState {
  user: PortalUser | null;
  loading: boolean;
  facultySubjects: FacultySubject[];
  setUser: (user: PortalUser | null) => void;
  setLoading: (loading: boolean) => void;
  setFacultySubjects: (subjects: FacultySubject[]) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  facultySubjects: [],
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setFacultySubjects: (facultySubjects) => set({ facultySubjects }),
  reset: () => set({ user: null, loading: false, facultySubjects: [] }),
}));
