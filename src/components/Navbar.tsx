import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { signOut } from "../supabase/auth";
import toast from "react-hot-toast";
import { GraduationCap, LogOut, User, Menu, X } from "lucide-react";

const Navbar: React.FC = () => {
  const { user, facultySubject } = useAuthStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully.");
      navigate("/");
    } catch {
      toast.error("Sign-out failed. Please try again.");
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 font-bold text-slate-800 hover:text-blue-700 transition-colors"
          aria-label="RGUKT-N Lab Manuals — Home"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-200">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="hidden sm:block">
            <span className="text-blue-700">RGUKT-N</span>{" "}
            <span className="font-medium text-slate-600">Lab Manuals</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-full px-4 py-2">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName ?? "Faculty"}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-3.5 h-3.5 text-blue-600" />
                  )}
                </div>
                <span className="font-medium truncate max-w-[160px]">
                  {user.displayName ?? user.email}
                </span>
              </div>
              {facultySubject && (
                <Link
                  to="/faculty/dashboard"
                  className="text-sm font-medium text-blue-700 hover:text-blue-800 transition-colors px-3 py-2 rounded-lg hover:bg-blue-50"
                >
                  My Dashboard
                </Link>
              )}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-red-600 transition-colors px-3 py-2 rounded-lg hover:bg-red-50"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </>
          ) : (
            <Link
              to="/faculty/login"
              className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-blue-200 hover:shadow-blue-300 transition-all"
              id="faculty-login-btn"
            >
              <User className="w-4 h-4" />
              Faculty Login
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-3">
          {user ? (
            <>
              <div className="flex items-center gap-2 text-sm text-slate-600 py-2">
                <User className="w-4 h-4 text-blue-600" />
                <span className="font-medium truncate">{user.email}</span>
              </div>
              {facultySubject && (
                <Link
                  to="/faculty/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-sm font-medium text-blue-700 py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  My Dashboard
                </Link>
              )}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 w-full text-sm font-medium text-red-600 py-2 px-3 rounded-lg hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </>
          ) : (
            <Link
              to="/faculty/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full bg-blue-700 text-white text-sm font-semibold py-3 px-5 rounded-xl"
            >
              <User className="w-4 h-4" />
              Faculty Login
            </Link>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
