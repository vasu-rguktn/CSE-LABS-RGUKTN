import React, { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { subjects } from "../data/subjects";
import { getLabManuals } from "../supabase/db";
import type { LabManual } from "../supabase/db";
import { BookOpen, Plus, FileText, Calendar, AlertCircle } from "lucide-react";

const FacultyDashboard: React.FC = () => {
  const { user, facultySubjects } = useAuthStore();
  const [manualsMap, setManualsMap] = useState<Record<string, LabManual[]>>({});

  useEffect(() => {
    const fetchAllManuals = async () => {
      const newMap: Record<string, LabManual[]> = {};
      for (const fs of facultySubjects) {
        try {
          const mList = await getLabManuals(fs.subjectId);
          newMap[fs.subjectId] = mList;
        } catch {
          newMap[fs.subjectId] = [];
        }
      }
      setManualsMap(newMap);
    };
    if (facultySubjects.length > 0) {
      fetchAllManuals();
    }
  }, [facultySubjects]);

  if (!facultySubjects || facultySubjects.length === 0) {
    return <Navigate to="/faculty/select-subject" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/20 pb-16">
      <div className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-200">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-0.5">
                  Welcome, {user?.email}
                </p>
                <h1 className="text-2xl font-extrabold text-slate-900 leading-snug">
                  My Assigned Subjects
                </h1>
              </div>
            </div>
            <Link
              to="/faculty/select-subject"
              className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors"
            >
              <Plus className="w-4 h-4" /> Assign Another Subject
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {facultySubjects.map((fs) => {
            const subject = subjects.find((s) => s.id === fs.subjectId);
            const mList = manualsMap[fs.subjectId] || [];
            if (!subject) return null;

            const latestManual = mList.length > 0 
              ? [...mList].sort((a, b) => {
                  const dateA = a.updatedAt?.toDate()?.getTime() || 0;
                  const dateB = b.updatedAt?.toDate()?.getTime() || 0;
                  return dateB - dateA;
                })[0]
              : null;

            const formattedLatestDate = latestManual?.updatedAt?.toDate
              ? latestManual.updatedAt.toDate().toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : null;

            return (
              <Link
                to={`/faculty/subject/${subject.id}`}
                key={subject.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-lg font-bold text-slate-800 line-clamp-2 pr-4">
                      {subject.name}
                    </h2>
                    <span className="shrink-0 bg-slate-100 text-slate-600 text-xs font-mono px-2 py-1 rounded-md">
                      {subject.code}
                    </span>
                  </div>
                  
                  {mList.length > 0 ? (
                    <div className="inline-flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full text-sm font-medium">
                      <FileText className="w-4 h-4" />
                      {mList.length} Manual{mList.length !== 1 ? 's' : ''} Uploaded
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full text-sm font-medium">
                      <AlertCircle className="w-4 h-4" />
                      No Manual Uploaded Yet
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
                  <div className="flex items-center gap-1.5">
                    {mList.length > 0 && formattedLatestDate ? (
                      <>
                        <Calendar className="w-4 h-4" />
                        <span>Updated {formattedLatestDate}</span>
                      </>
                    ) : (
                      <span className="text-slate-400">Action Required</span>
                    )}
                  </div>
                  <span className="text-blue-600 font-medium">Open Subject &rarr;</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
