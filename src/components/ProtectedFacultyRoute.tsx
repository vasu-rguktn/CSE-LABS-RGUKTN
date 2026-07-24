import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { Loader2 } from "lucide-react";
import { isStudentEmail } from "../supabase/auth";

interface ProtectedFacultyRouteProps {
  children: React.ReactNode;
}

const ProtectedFacultyRoute: React.FC<ProtectedFacultyRouteProps> = ({
  children,
}) => {
  const { user, loading, isAdmin, selectedRole } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-slate-500 text-sm">Checking authentication…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/faculty/login" replace />;
  }

  if (isStudentEmail(user.email)) {
    return <Navigate to="/student/dashboard" replace />;
  }

  if (isAdmin && !selectedRole) {
    return <Navigate to="/role-selection" replace />;
  }

  if (isAdmin && selectedRole === "admin") {
    return <Navigate to="/admin/import" replace />;
  }

  return <>{children}</>;
};

export default ProtectedFacultyRoute;
