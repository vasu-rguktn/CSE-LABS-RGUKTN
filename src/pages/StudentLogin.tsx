import React, { useEffect, useState } from "react";
import { signInWithGoogle } from "../supabase/auth";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const StudentLogin: React.FC = () => {
  const { user, studentProfile, loading } = useAuthStore();
  const navigate = useNavigate();
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (!loading && user && studentProfile) {
      navigate("/student/dashboard", { replace: true });
    }
  }, [user, studentProfile, loading, navigate]);

  const handleLogin = async () => {
    setIsSigningIn(true);
    const { error } = await signInWithGoogle();
    
    if (error) {
      toast.error(error);
      setIsSigningIn(false);
    }
    // If no error, the page will redirect to Google
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0v6m0-6l-9 5-9-5-9 5 9 5zm0 0l-9 5-9-5-9 5 9 5z" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-2">Student Portal</h2>
          <p className="text-blue-100 text-sm">
            Sign in with your RGUKT student email
          </p>
        </div>

        <div className="p-8">
          <button
            onClick={handleLogin}
            disabled={isSigningIn}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 text-slate-700 px-4 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-colors focus:ring-4 focus:ring-slate-100 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSigningIn ? (
              <span className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></span>
            ) : (
              <img 
                src="https://www.google.com/favicon.ico" 
                alt="Google" 
                className="w-5 h-5"
              />
            )}
            Sign in with Google
          </button>
          
          <div className="mt-6 text-center text-sm text-slate-500">
            Make sure to use your university email address (e.g., n220034@rguktn.ac.in).
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;
