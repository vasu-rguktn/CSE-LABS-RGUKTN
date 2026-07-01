import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { signInWithGoogle } from "../supabase/auth";
import { getFacultySubject } from "../supabase/db";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";
import { GraduationCap, LogIn, Shield, Loader2 } from "lucide-react";

const FacultyLogin: React.FC = () => {
  const { user, setUser, setFacultySubject } = useAuthStore();
  const [signingIn, setSigningIn] = useState(false);
  const navigate = useNavigate();

  // Already authenticated — redirect
  if (user) return <Navigate to="/faculty/dashboard" replace />;

  const handleLogin = async () => {
    setSigningIn(true);
    const { user: signedInUser, error } = await signInWithGoogle();
    if (error) {
      toast.error(error);
      setSigningIn(false);
      return;
    }
    if (!signedInUser) {
      setSigningIn(false);
      return; // popup closed
    }
    setUser(signedInUser);

    try {
      const fs = await getFacultySubject(signedInUser.uid);
      setFacultySubject(fs);
      if (fs) {
        navigate("/faculty/dashboard", { replace: true });
      } else {
        navigate("/faculty/select-subject", { replace: true });
      }
    } catch {
      toast.error("Could not load your profile. Please try again.");
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-blue-100 border border-slate-100 p-8 sm:p-10">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-200 mb-4">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
              Faculty Portal
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              RGUKT Nuzvid — CSE Department
            </p>
          </div>

          {/* Sign-in button */}
          <button
            onClick={handleLogin}
            disabled={signingIn}
            id="google-signin-btn"
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 hover:border-blue-400 text-slate-700 font-semibold py-3.5 px-6 rounded-2xl shadow-sm hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {signingIn ? (
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            {signingIn ? "Signing in…" : "Continue with Google"}
          </button>

          {/* Restriction notice */}
          <div className="mt-6 flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-4">
            <Shield className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-700">Restricted Access</p>
              <p className="text-amber-600 mt-0.5">
                Only <strong>@rguktn.ac.in</strong> Google accounts are
                permitted. Other accounts will be rejected immediately.
              </p>
            </div>
          </div>

          {/* Footer link */}
          <p className="text-center text-xs text-slate-400 mt-6">
            Student?{" "}
            <a href="/" className="text-blue-600 hover:underline">
              Browse manuals without logging in →
            </a>
          </p>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <LogIn className="w-4 h-4 text-slate-400 shrink-0" />
          <p className="text-xs text-slate-400">
            Your sign-in is secured by Supabase Authentication &amp; Google
            OAuth 2.0. We never store your password.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FacultyLogin;
