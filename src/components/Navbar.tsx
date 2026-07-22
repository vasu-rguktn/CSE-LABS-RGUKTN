import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { signOut, isStudentEmail } from "../supabase/auth";
import toast from "react-hot-toast";
import { GraduationCap, LogOut, User, Menu, X, Database } from "lucide-react";

const Navbar: React.FC = () => {
  const { user, isAdmin, selectedRole, setSelectedRole } = useAuthStore();
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

  const isStudent = user ? isStudentEmail(user.email) : false;

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
                      alt={user.displayName ?? "User"}
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
              
              {isAdmin && selectedRole === 'admin' && (
                <>
                  <Link
                    to="/admin/import"
                    className="flex items-center gap-1 text-sm font-medium text-indigo-700 hover:text-indigo-800 transition-colors px-3 py-2 rounded-lg hover:bg-indigo-50"
                    title="Admin Import"
                  >
                    <Database className="w-4 h-4" />
                    <span className="hidden md:inline">Import Data</span>
                  </Link>
                  <Link
                    to="/admin/roster"
                    className="flex items-center gap-1 text-sm font-medium text-indigo-700 hover:text-indigo-800 transition-colors px-3 py-2 rounded-lg hover:bg-indigo-50"
                    title="Admin Roster"
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden md:inline">Class Roster</span>
                  </Link>
                </>
              )}

              {(!isAdmin || selectedRole !== 'admin') && (
                <Link
                  to={isStudent ? "/student/dashboard" : "/faculty/dashboard"}
                  className="text-sm font-medium text-blue-700 hover:text-blue-800 transition-colors px-3 py-2 rounded-lg hover:bg-blue-50"
                >
                  My Dashboard
                </Link>
              )}

              {isAdmin && selectedRole === 'admin' && (
                <button
                  onClick={() => {
                    setSelectedRole('faculty');
                    navigate('/faculty/dashboard');
                  }}
                  className="text-sm font-medium text-slate-600 hover:text-blue-700 transition-colors px-3 py-2 rounded-lg hover:bg-slate-50"
                >
                  Switch to Faculty
                </button>
              )}
              {isAdmin && selectedRole !== 'admin' && (
                <button
                  onClick={() => {
                    setSelectedRole('admin');
                    navigate('/admin/import');
                  }}
                  className="text-sm font-medium text-slate-600 hover:text-indigo-700 transition-colors px-3 py-2 rounded-lg hover:bg-slate-50"
                >
                  Switch to Admin
                </button>
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
            <div className="flex items-center gap-2">
              <Link
                to="/student/login"
                className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all"
              >
                <User className="w-4 h-4" />
                Student Login
              </Link>
              <Link
                to="/faculty/login"
                className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-blue-200 hover:shadow-blue-300 transition-all"
                id="faculty-login-btn"
              >
                <User className="w-4 h-4" />
                Faculty Login
              </Link>
            </div>
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
              
              {isAdmin && selectedRole === 'admin' && (
                <>
                  <Link
                    to="/admin/import"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 w-full text-sm font-medium text-indigo-700 py-2 px-3 rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                    <Database className="w-4 h-4" />
                    Import Data
                  </Link>
                  <Link
                    to="/admin/roster"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 w-full text-sm font-medium text-indigo-700 py-2 px-3 rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Class Roster
                  </Link>
                </>
              )}

              {(!isAdmin || selectedRole !== 'admin') && (
                <Link
                  to={isStudent ? "/student/dashboard" : "/faculty/dashboard"}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-sm font-medium text-blue-700 py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  My Dashboard
                </Link>
              )}
              
              {isAdmin && selectedRole === 'admin' && (
                <button
                  onClick={() => {
                    setSelectedRole('faculty');
                    navigate('/faculty/dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full text-sm font-medium text-slate-600 py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <User className="w-4 h-4" />
                  Switch to Faculty
                </button>
              )}
              {isAdmin && selectedRole !== 'admin' && (
                <button
                  onClick={() => {
                    setSelectedRole('admin');
                    navigate('/admin/import');
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full text-sm font-medium text-slate-600 py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Database className="w-4 h-4" />
                  Switch to Admin
                </button>
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
            <div className="flex flex-col gap-2">
              <Link
                to="/student/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold py-3 px-5 rounded-xl transition-all"
              >
                <User className="w-4 h-4" />
                Student Login
              </Link>
              <Link
                to="/faculty/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full bg-blue-700 text-white text-sm font-semibold py-3 px-5 rounded-xl"
              >
                <User className="w-4 h-4" />
                Faculty Login
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
