import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { GraduationCap } from "lucide-react";

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { user, studentProfile } = useAuthStore();

  useEffect(() => {
    if (user) {
      import("../supabase/auth").then(({ isStudentEmail }) => {
        if (isStudentEmail(user.email)) {
          navigate("/student/dashboard", { replace: true });
        } else {
          navigate("/faculty/dashboard", { replace: true });
        }
      });
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 flex items-center justify-center p-4">
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-200 mb-8">
          <GraduationCap className="w-10 h-10 text-white" />
        </div>
        
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          <GraduationCap className="w-4 h-4" />
          RGUKT Nuzvid — CSE Department
        </div>
        
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-5">
          CSE - <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Digitalized Labs</span>
        </h1>
        
        <p className="text-lg text-slate-500 max-w-xl mx-auto mb-10 leading-relaxed">
          Welcome to the centralized portal for CSE lab manuals and submissions. 
          Please log in with your RGUKT credentials to access your dashboard.
        </p>

        {user ? (
          <button 
            onClick={() => navigate(studentProfile ? "/student/dashboard" : "/faculty/dashboard")}
            className="px-8 py-3.5 bg-blue-600 text-white rounded-xl font-semibold shadow-sm hover:shadow-md hover:bg-blue-700 transition-all text-lg"
          >
            Go to Dashboard
          </button>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => navigate('/student/login')} 
              className="w-full sm:w-auto px-8 py-3.5 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-semibold hover:border-blue-400 hover:text-blue-600 transition-all shadow-sm"
            >
              Student Login
            </button>
            <button 
              onClick={() => navigate('/faculty/login')} 
              className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 text-white rounded-xl font-semibold shadow-sm hover:shadow-md hover:bg-blue-700 transition-all"
            >
              Faculty Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Landing;
