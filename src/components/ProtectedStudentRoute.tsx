import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { isStudentEmail } from "../supabase/auth";

interface ProtectedStudentRouteProps {
  children: React.ReactNode;
}

const ProtectedStudentRoute: React.FC<ProtectedStudentRouteProps> = ({ children }) => {
  const { user, loading, studentProfile } = useAuthStore();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || !isStudentEmail(user.email)) {
    return <Navigate to="/student/login" state={{ from: location }} replace />;
  }
  
  if (!studentProfile) {
    // They logged in with a valid student email pattern, but they aren't in the students_master database!
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Not Registered</h2>
        <p className="text-slate-600 max-w-md mx-auto">
          Your email address ({user.email}) is not registered in the Student Master database. 
          Please contact your faculty or admin to have your details uploaded.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedStudentRoute;
