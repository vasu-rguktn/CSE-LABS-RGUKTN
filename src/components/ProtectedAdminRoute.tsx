import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

interface Props {
  children: React.ReactNode;
}

const ProtectedAdminRoute: React.FC<Props> = ({ children }) => {
  const { user, loading, isAdmin, selectedRole } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <p className="text-slate-500 font-medium">Checking access...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // If user is admin but hasn't selected a role yet, send to chooser
  if (!selectedRole) {
    return <Navigate to="/role-selection" replace />;
  }

  // If they selected faculty, they shouldn't be in the admin section
  if (selectedRole === "faculty") {
    return <Navigate to="/faculty/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedAdminRoute;
