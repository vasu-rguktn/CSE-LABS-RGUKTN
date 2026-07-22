import React from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { supabase } from "../supabase/config";

const RoleSelection: React.FC = () => {
  const { user, setSelectedRole } = useAuthStore();
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const handleSelectRole = (role: "admin" | "faculty") => {
    setSelectedRole(role);
    if (role === "admin") {
      navigate("/admin/import");
    } else {
      navigate("/faculty/dashboard");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Welcome Back!</h1>
        <p className="text-slate-600 mb-8">
          Your account has dual roles. Please choose how you want to continue for this session.
        </p>

        <div className="space-y-4 mb-6">
          <button
            onClick={() => handleSelectRole("admin")}
            className="w-full flex items-center justify-between px-6 py-4 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-xl transition-colors font-medium"
          >
            <div className="flex items-center space-x-3">
              <span className="text-xl">🛡️</span>
              <span>Continue as Admin</span>
            </div>
            <span className="text-purple-400">→</span>
          </button>

          <button
            onClick={() => handleSelectRole("faculty")}
            className="w-full flex items-center justify-between px-6 py-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl transition-colors font-medium"
          >
            <div className="flex items-center space-x-3">
              <span className="text-xl">👨‍🏫</span>
              <span>Continue as Faculty</span>
            </div>
            <span className="text-blue-400">→</span>
          </button>
        </div>
        
        <div className="text-center">
          <button
            onClick={handleLogout}
            className="text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
