import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { getStudentSubmissions, getSubjectDeadlines, upsertStudentSubmission } from "../supabase/db";
import type { StudentSubmission, SubjectWeekDeadline } from "../supabase/db";
import { uploadStudentSubmission } from "../supabase/storage";
import JSZip from "jszip";
import toast from "react-hot-toast";
import { ArrowLeft, UploadCloud, CheckCircle, Clock, FileArchive } from "lucide-react";

const StudentSubjectView: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const { studentProfile, studentSubjects } = useAuthStore();
  
  const [submissions, setSubmissions] = useState<Record<number, StudentSubmission>>({});
  const [deadlines, setDeadlines] = useState<Record<number, SubjectWeekDeadline>>({});
  const [loading, setLoading] = useState(true);
  const [uploadingWeek, setUploadingWeek] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  const subject = studentSubjects.find((s) => s.courseCode === code);

  useEffect(() => {
    if (!studentProfile || !code) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [subs, dls] = await Promise.all([
          getStudentSubmissions(studentProfile.id!, code),
          getSubjectDeadlines(code)
        ]);

        const subsMap: Record<number, StudentSubmission> = {};
        subs.forEach(s => subsMap[s.week_number] = s);
        setSubmissions(subsMap);

        const dlsMap: Record<number, SubjectWeekDeadline> = {};
        dls.forEach(d => dlsMap[d.week_number] = d);
        setDeadlines(dlsMap);
      } catch (error: any) {
        toast.error("Failed to load submissions data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentProfile, code]);

  if (!subject) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-slate-800">Subject Not Found</h2>
        <p className="text-slate-500 mt-2">You are not enrolled in this subject.</p>
        <Link to="/student/dashboard" className="mt-4 text-indigo-600 hover:underline">Go back to Dashboard</Link>
      </div>
    );
  }

  const validateZipContents = async (file: File): Promise<boolean> => {
    try {
      const zip = new JSZip();
      const contents = await zip.loadAsync(file);
      
      let hasPdf = false;
      let hasCode = false;

      // Accepted code file extensions (expand as needed)
      const codeExts = ['.c', '.cpp', '.java', '.py', '.js', '.html', '.css', '.sql', '.php'];

      contents.forEach((_, zipEntry) => {
        if (zipEntry.dir) return; // ignore directories
        
        const lowerName = zipEntry.name.toLowerCase();
        
        // ignore hidden files (like __MACOSX)
        if (lowerName.includes('__macosx') || lowerName.split('/').pop()?.startsWith('.')) {
          return;
        }

        if (lowerName.endsWith('.pdf')) hasPdf = true;
        if (codeExts.some(ext => lowerName.endsWith(ext))) hasCode = true;
      });

      if (!hasPdf) {
        toast.error("Invalid ZIP: Missing a PDF file.");
        return false;
      }
      if (!hasCode) {
        toast.error("Invalid ZIP: Missing source code files.");
        return false;
      }

      return true;
    } catch (e) {
      toast.error("Failed to read ZIP file. Ensure it is a valid zip archive.");
      return false;
    }
  };

  const handleUploadClick = (week: number) => {
    setSelectedWeek(week);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const week = selectedWeek;
    
    if (!file || week === null || !studentProfile || !code) return;

    if (!file.name.toLowerCase().endsWith('.zip')) {
      toast.error("Only ZIP files are allowed.");
      e.target.value = '';
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      toast.error("File size must be less than 25MB.");
      e.target.value = '';
      return;
    }

    const toastId = toast.loading(`Validating and uploading Week ${week}...`);
    setUploadingWeek(week);

    try {
      // 1. Validate Client-side
      const isValid = await validateZipContents(file);
      if (!isValid) throw new Error("Validation failed");

      // 2. Upload to Storage
      const { path, url } = await uploadStudentSubmission(file, code, week, studentProfile.rollNumber);

      // 3. Upsert to DB
      await upsertStudentSubmission({
        student_id: studentProfile.id!,
        subject_code: code,
        week_number: week,
        storage_path: path,
        file_url: url,
        file_name: file.name,
        file_size_bytes: file.size
      });

      // 4. Update local state
      setSubmissions(prev => ({
        ...prev,
        [week]: {
          id: 'temp-id', // will be re-fetched on reload anyway
          student_id: studentProfile.id!,
          subject_code: code,
          week_number: week,
          storage_path: path,
          file_url: url,
          file_name: file.name,
          file_size_bytes: file.size,
          status: 'submitted',
          submitted_at: new Date().toISOString()
        }
      }));

      toast.success(`Week ${week} submitted successfully!`, { id: toastId });
    } catch (err: any) {
      if (err.message !== "Validation failed") {
        toast.error(err.message || "Upload failed. Please try again.", { id: toastId });
      } else {
        toast.dismiss(toastId); // Error already shown in validator
      }
    } finally {
      setUploadingWeek(null);
      setSelectedWeek(null);
      e.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Hidden file input */}
      <input 
        type="file" 
        accept=".zip" 
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden" 
      />

      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <Link
            to="/student/dashboard"
            className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-100 uppercase tracking-wider">
                  {subject.courseCode}
                </span>
                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100">
                  {subject.credits} Credits
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {subject.subjectName}
              </h1>
            </div>
            
            <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 text-sm text-slate-600 flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <FileArchive className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 leading-tight">ZIP Format Required</p>
                <p className="text-xs">1 PDF + Source Code</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8">
        
        {loading ? (
          <div className="flex justify-center items-center h-48">
             <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Weekly Submissions</h2>
            
            {/* Generate 12 weeks */}
            {Array.from({ length: 12 }, (_, i) => i + 1).map((week) => {
              const submission = submissions[week];
              const deadline = deadlines[week];
              const isPastDeadline = deadline && new Date() > new Date(deadline.deadline_at);
              const isUploading = uploadingWeek === week;

              return (
                <div key={week} className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4 transition-all hover:border-indigo-200 hover:shadow-md">
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-slate-800">Week {week}</h3>
                      {submission ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Submitted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          Pending
                        </span>
                      )}
                    </div>
                    
                    {deadline ? (
                      <p className={`text-sm flex items-center gap-1.5 ${isPastDeadline && !submission ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
                        <Clock className="w-4 h-4" />
                        Due: {new Date(deadline.deadline_at).toLocaleString()}
                        {isPastDeadline && !submission && " (Overdue)"}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        No deadline set
                      </p>
                    )}

                    {submission && (
                      <div className="mt-3 text-sm flex items-center gap-3">
                        <a 
                          href={submission.file_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                        >
                          <FileArchive className="w-4 h-4" />
                          {submission.file_name}
                        </a>
                        <span className="text-slate-400 text-xs">
                          {(submission.file_size_bytes / 1024 / 1024).toFixed(2)} MB
                        </span>
                        <span className="text-slate-400 text-xs">
                          {new Date(submission.submitted_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-slate-100 sm:pl-6 flex items-center">
                    <button
                      onClick={() => handleUploadClick(week)}
                      disabled={isUploading}
                      className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
                        submission 
                          ? "bg-slate-100 text-slate-700 hover:bg-slate-200" 
                          : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg shadow-indigo-200"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isUploading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <UploadCloud className="w-5 h-5" />
                      )}
                      {submission ? "Replace Submission" : "Upload ZIP"}
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentSubjectView;
