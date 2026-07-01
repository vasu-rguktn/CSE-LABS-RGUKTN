import React, { useEffect } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { supabase } from "./supabase/config";
import { mapSupabaseUser, isAllowedEmail } from "./supabase/auth";
import { getFacultySubject } from "./supabase/db";
import { useAuthStore } from "./store/authStore";
import Navbar from "./components/Navbar";
import ProtectedFacultyRoute from "./components/ProtectedFacultyRoute";
import Landing from "./pages/Landing";
import SubjectPage from "./pages/SubjectPage";
import FacultyLogin from "./pages/FacultyLogin";
import FacultySelectSubject from "./pages/FacultySelectSubject";
import FacultyDashboard from "./pages/FacultyDashboard";

const App: React.FC = () => {
  const { setUser, setLoading, setFacultySubject } = useAuthStore();

  // Bootstrap auth state on app load
  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const user = mapSupabaseUser(session?.user ?? null);

      if (user && !isAllowedEmail(user.email)) {
        await supabase.auth.signOut();
        setUser(null);
        setLoading(false);
        return;
      }

      setUser(user);
      if (user) {
        try {
          const fs = await getFacultySubject(user.uid);
          setFacultySubject(fs);
        } catch {
          setFacultySubject(null);
        }
      }
      setLoading(false);
    });

    // Listen for future changes (sign-in redirect return, sign-out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = mapSupabaseUser(session?.user ?? null);

      if (user && !isAllowedEmail(user.email)) {
        await supabase.auth.signOut();
        setUser(null);
        setFacultySubject(null);
        return;
      }

      setUser(user);
      if (user) {
        try {
          const fs = await getFacultySubject(user.uid);
          setFacultySubject(fs);
        } catch {
          setFacultySubject(null);
        }
      } else {
        setFacultySubject(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setUser, setLoading, setFacultySubject]);

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/subject/:id" element={<SubjectPage />} />
            <Route path="/faculty/login" element={<FacultyLogin />} />
            <Route
              path="/faculty/select-subject"
              element={
                <ProtectedFacultyRoute>
                  <FacultySelectSubject />
                </ProtectedFacultyRoute>
              }
            />
            <Route
              path="/faculty/dashboard"
              element={
                <ProtectedFacultyRoute>
                  <FacultyDashboard />
                </ProtectedFacultyRoute>
              }
            />
            {/* 404 fallback */}
            <Route
              path="*"
              element={
                <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
                  <p className="text-7xl mb-4">🗒️</p>
                  <h1 className="text-3xl font-extrabold text-slate-800 mb-2">
                    Page not found
                  </h1>
                  <p className="text-slate-500 mb-6">
                    The page you&apos;re looking for doesn&apos;t exist.
                  </p>
                  <a
                    href="/"
                    className="bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-800 transition-colors"
                  >
                    Go Home
                  </a>
                </div>
              }
            />
          </Routes>
        </main>
      </div>

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            borderRadius: "14px",
            background: "#1e293b",
            color: "#f1f5f9",
            fontSize: "14px",
            fontWeight: 500,
          },
          success: {
            iconTheme: { primary: "#22c55e", secondary: "#fff" },
          },
          error: {
            iconTheme: { primary: "#ef4444", secondary: "#fff" },
          },
        }}
      />
    </HashRouter>
  );
};

export default App;
