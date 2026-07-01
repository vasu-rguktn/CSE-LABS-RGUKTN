import { create } from "zustand";
import type { PortalUser } from "../supabase/auth";
import type { FacultySubject } from "../supabase/db";

interface AuthState {
  user: PortalUser | null;
  loading: boolean;
  facultySubject: FacultySubject | null;
  setUser: (user: PortalUser | null) => void;
  setLoading: (loading: boolean) => void;
  setFacultySubject: (fs: FacultySubject | null) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  facultySubject: null,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setFacultySubject: (facultySubject) => set({ facultySubject }),
  reset: () => set({ user: null, loading: false, facultySubject: null }),
}));
