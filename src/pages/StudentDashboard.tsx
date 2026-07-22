import React from "react";
import { useAuthStore } from "../store/authStore";
import { Link } from "react-router-dom";
import { BookOpen, FlaskConical, LayoutDashboard } from "lucide-react";

const StudentDashboard: React.FC = () => {
  const { studentProfile, studentSubjects } = useAuthStore();

  if (!studentProfile) return null; // handled by ProtectedRoute

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/20 pb-16 pt-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
        
        {/* Header Profile Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row gap-6 items-center sm:items-start justify-between">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
              <span className="text-2xl font-bold text-white">
                {studentProfile.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 leading-snug">
                {studentProfile.name}
              </h1>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-md">
                  {studentProfile.rollNumber.toUpperCase()}
                </span>
                <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-md">
                  {studentProfile.branch} - Sec {studentProfile.section}
                </span>
                <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-md">
                  {studentProfile.engineeringYear} - Sem {studentProfile.semester}
                </span>
              </div>
            </div>
          </div>
          
          <div className="hidden sm:flex flex-col items-end justify-center bg-slate-50 p-4 rounded-xl border border-slate-100">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Enrolled Subjects</p>
            <p className="text-3xl font-black text-slate-700">{studentSubjects.length}</p>
          </div>
        </div>

        {/* Enrolled Subjects List */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <LayoutDashboard className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-800">My Subjects</h2>
          </div>

          {studentSubjects.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-700 mb-2">No subjects found</h3>
              <p className="text-slate-500 max-w-sm mx-auto">
                We couldn't find any subjects mapped to your current year and semester in the BoS curriculum.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {studentSubjects.map((subject) => (
                <Link
                  key={subject.id}
                  to={`/student/subject/${subject.courseCode}`}
                  className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-indigo-200 transition-all duration-300 flex flex-col"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-xl ${
                      subject.isLab 
                        ? "bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white" 
                        : "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white"
                    } transition-colors`}>
                      {subject.isLab ? (
                        <FlaskConical className="w-6 h-6" />
                      ) : (
                        <BookOpen className="w-6 h-6" />
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                      {subject.courseCode}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-lg text-slate-800 mb-1 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {subject.subjectName}
                  </h3>
                  
                  <div className="mt-auto pt-6 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-500">
                      {subject.credits} Credits
                    </span>
                    <span className="text-sm font-bold text-indigo-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      View Submissions
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;
