import React, { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { subjects } from "../data/subjects";
import { getLabManuals, getSectionsForFacultyEmail } from "../supabase/db";
import type { LabManual, FacultySubjectSection } from "../supabase/db";
import { BookOpen, Plus, FileText, Calendar, AlertCircle } from "lucide-react";

const FacultyDashboard: React.FC = () => {
  const { user, facultySubjects, isAdmin } = useAuthStore();
  const [manualsMap, setManualsMap] = useState<Record<string, LabManual[]>>({});
  const [complianceStats, setComplianceStats] = useState<Record<string, { totalEnrolled: number, totalSubmitted: number, hasMissing: boolean }>>({});
  const [mappedSections, setMappedSections] = useState<FacultySubjectSection[]>([]);

  useEffect(() => {
    const fetchAllData = async () => {
      // We'll collect all unique subject IDs from both sources
      const subjectIdsToFetch = new Set<string>();
      facultySubjects.forEach(fs => subjectIdsToFetch.add(fs.subjectId));

      let fetchedSections: FacultySubjectSection[] = [];
      // 1. Fetch mapped sections for this faculty's email
      if (user?.email) {
        try {
          fetchedSections = await getSectionsForFacultyEmail(user.email);
          setMappedSections(fetchedSections);
          fetchedSections.forEach(sec => {
            const subj = subjects.find(s => s.code === sec.subjectCode);
            if (subj) subjectIdsToFetch.add(subj.id);
          });
        } catch (e) {
          console.error("Failed to fetch mapped sections", e);
        }
      }

      // 2. Fetch manuals and compliance stats for all unique subjects
      const newMap: Record<string, LabManual[]> = {};
      const newStats: Record<string, { totalEnrolled: number, totalSubmitted: number, hasMissing: boolean }> = {};
      
      for (const sId of Array.from(subjectIdsToFetch)) {
        try {
          const mList = await getLabManuals(sId);
          newMap[sId] = mList;
          
          // Compute compliance stats for subjects mapped via sections
          const subject = subjects.find(s => s.id === sId);
          if (subject) {
            const mappedForThisSubject = fetchedSections.filter(sec => sec.subjectCode === subject.code);
            if (mappedForThisSubject.length > 0) {
              const { getSectionEnrollmentCount, getSubjectDeadlines, getSubmissionsForFaculty } = await import("../supabase/db");
              const deadlines = await getSubjectDeadlines(subject.code);
              const submissions = await getSubmissionsForFaculty(subject.code);
              
              let totalEnrolled = 0;
              let totalSubmitted = 0;
              let hasMissing = false;
              
              if (deadlines.length > 0) {
                // Check latest deadline
                const latestDeadline = deadlines.sort((a, b) => new Date(b.deadline_at).getTime() - new Date(a.deadline_at).getTime())[0];
                
                for (const sec of mappedForThisSubject) {
                  const enrolled = await getSectionEnrollmentCount(sec.batchYear, sec.branch, sec.section);
                  totalEnrolled += enrolled;
                  
                  // Filter submissions for this section and week
                  const secSubmissions = submissions.filter(sub => 
                    sub.week_number === latestDeadline.week_number && 
                    sub.students_master.section === sec.section
                  );
                  totalSubmitted += secSubmissions.length;
                }
                
                if (totalSubmitted < totalEnrolled) {
                  hasMissing = true;
                }
              }
              newStats[sId] = { totalEnrolled, totalSubmitted, hasMissing };
            }
          }
        } catch {
          newMap[sId] = [];
        }
      }
      setManualsMap(newMap);
      setComplianceStats(newStats);
    };
    
    if (user) {
      fetchAllData();
    }
  }, [facultySubjects, user]);

  // We allow rendering if they have either legacy self-claims OR new mappings
  if ((!facultySubjects || facultySubjects.length === 0) && mappedSections.length === 0) {
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
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Link
                  to="/admin/allocations"
                  className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-100 transition-colors"
                >
                  <BookOpen className="w-4 h-4" /> Allocations & BoS Data
                </Link>
              )}
              <Link
                to="/faculty/select-subject"
                className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors"
              >
                <Plus className="w-4 h-4" /> Assign Another Subject
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(() => {
            const combinedSubjectIds = new Set<string>();
            facultySubjects.forEach((fs) => combinedSubjectIds.add(fs.subjectId));
            mappedSections.forEach((sec) => {
              const subj = subjects.find(s => s.code === sec.subjectCode);
              if (subj) combinedSubjectIds.add(subj.id);
            });

            return Array.from(combinedSubjectIds).map((subjectId) => {
              const subject = subjects.find((s) => s.id === subjectId);
              const mList = manualsMap[subjectId] || [];
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
                  {complianceStats[subject.id] && complianceStats[subject.id].totalEnrolled > 0 && (
                    <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${complianceStats[subject.id].hasMissing ? 'text-red-600 bg-red-50' : 'text-emerald-600 bg-emerald-50'}`}>
                      <AlertCircle className="w-4 h-4" />
                      {complianceStats[subject.id].totalSubmitted} of {complianceStats[subject.id].totalEnrolled} submitted
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
            });
          })()}
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
