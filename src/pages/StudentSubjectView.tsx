import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { getStudentSubmissions, getLabManuals, upsertStudentSubmission } from "../supabase/db";
import type { StudentSubmission, LabManual } from "../supabase/db";
import { uploadStudentSubmission } from "../supabase/storage";
import toast from "react-hot-toast";
import { ArrowLeft, UploadCloud, CheckCircle, Clock, FileArchive, Eye, EyeOff, Download, X, BookOpen } from "lucide-react";
import PdfViewer from "../components/PdfViewer";
import { subjects } from "../data/subjects";

const StudentSubjectView: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const { studentProfile, studentSubjects } = useAuthStore();
  
  const [submissions, setSubmissions] = useState<Record<number, StudentSubmission>>({});
  const [manuals, setManuals] = useState<LabManual[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewManualId, setPreviewManualId] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalWeek, setModalWeek] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const subjMeta = subjects.find(s => s.code.toLowerCase() === code?.toLowerCase() || s.id.toLowerCase() === code?.toLowerCase());
  const subjectId = subjMeta ? subjMeta.id : (code || "");

  let subject = studentSubjects.find(
    (s) => s.courseCode.toLowerCase() === code?.toLowerCase() || 
           s.id === code || 
           (subjMeta && s.courseCode.toLowerCase() === subjMeta.code.toLowerCase())
  );

  if (!subject && subjMeta) {
    subject = {
      courseCode: subjMeta.code,
      subjectName: subjMeta.name,
      credits: 1.5,
      isLab: true,
      engineeringYear: studentProfile?.engineeringYear || "E3",
      semester: studentProfile?.semester || "Sem1",
      branch: studentProfile?.branch || "CSE"
    };
  }

  const fetchData = async () => {
    if (!studentProfile || !code) return;
    setLoading(true);
    try {
      const targetCode = subject?.courseCode || code;
      const [subs, mList] = await Promise.all([
        getStudentSubmissions(studentProfile.id!, targetCode),
        getLabManuals(subjectId)
      ]);

      const subsMap: Record<number, StudentSubmission> = {};
      subs.forEach(s => subsMap[s.week_number] = s);
      setSubmissions(subsMap);

      setManuals(mList);
    } catch (error: any) {
      toast.error("Failed to load subject and submissions data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [studentProfile, code, subjectId]);

  if (!subject) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-slate-800">Subject Not Found</h2>
        <p className="text-slate-500 mt-2">You are not enrolled in this subject.</p>
        <Link to="/student/dashboard" className="mt-4 text-indigo-600 hover:underline">Go back to Dashboard</Link>
      </div>
    );
  }

  const completeManual = manuals.find(m => m.manualType === "complete");

  const handleOpenSubmitModal = (week: number) => {
    const manual = manuals.find(m => m.manualType === "weekly" && m.weekNumber === week);
    if (manual) {
      // Check release date
      const releaseDate = manual.releaseDate?.toDate();
      if (releaseDate && new Date() < releaseDate) {
        toast.error("This task is not released yet.");
        return;
      }

      // Check due date
      const dueDate = manual.dueDate?.toDate();
      const submission = submissions[week];
      if (dueDate && new Date() > dueDate && !submission) {
        toast.error("Deadline has passed. Submissions are disabled.");
        return;
      }
    }

    setModalWeek(week);
    setSelectedFile(null);
    setUploadProgress(0);
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || modalWeek === null) return;

    const manual = manuals.find(m => m.manualType === "weekly" && m.weekNumber === modalWeek);
    const allowedTypes = manual?.allowedFileTypes || ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.zip'];
    const maxSizeMb = manual?.maxFileSizeMb || 20;
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedTypes.includes(fileExt)) {
      toast.error(`Only ${allowedTypes.join(', ')} files are allowed.`);
      e.target.value = '';
      return;
    }

    if (file.size > maxSizeMb * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSizeMb}MB.`);
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile || modalWeek === null || !studentProfile || !code) return;

    const manual = manuals.find(m => m.manualType === "weekly" && m.weekNumber === modalWeek);

    setUploading(true);
    setUploadProgress(20);
    const toastId = toast.loading(`Uploading Week ${modalWeek} Submission...`);

    try {
      setUploadProgress(50);
      const targetCode = subject?.courseCode || code;
      const { path, url } = await uploadStudentSubmission(selectedFile, targetCode, modalWeek, studentProfile.rollNumber);
      
      setUploadProgress(80);

      const deadlineDate = manual?.dueDate?.toDate();
      const isLate = deadlineDate ? new Date() > deadlineDate : false;

      const { getFacultyForSubjectSection } = await import("../supabase/db");
      const mapping = await getFacultyForSubjectSection(targetCode, studentProfile.engineeringYear, studentProfile.branch, studentProfile.section);
      const facultyId = mapping?.id || null;

      const isResubmit = !!submissions[modalWeek];

      await upsertStudentSubmission({
        student_id: studentProfile.id!,
        subject_code: targetCode,
        week_number: modalWeek,
        storage_path: path,
        file_url: url,
        file_name: selectedFile.name,
        file_size_bytes: selectedFile.size,
        task_id: manual?.id || null,
        subject_id: targetCode,
        faculty_id: facultyId,
        student_name: studentProfile.name,
        roll_number: studentProfile.rollNumber,
        branch: studentProfile.branch,
        section: studentProfile.section,
        week: modalWeek,
        is_late: isLate
      });

      setUploadProgress(100);
      toast.success(isResubmit ? "Task Resubmitted Successfully" : "Task Submitted Successfully", { id: toastId });

      await fetchData();
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Submission failed. Please try again.", { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
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
                <p className="font-semibold text-slate-800 leading-tight">Task Submissions</p>
                <p className="text-xs">Submit required formats</p>
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
          <div className="space-y-6">
            
            {/* Complete Lab Manual Section if uploaded */}
            {completeManual && (
              <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-indigo-800/50">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
                    <BookOpen className="w-6 h-6 text-indigo-300" />
                  </div>
                  <div>
                    <span className="px-2.5 py-0.5 bg-indigo-500/30 text-indigo-200 text-xs font-semibold rounded-full border border-indigo-400/30 uppercase tracking-wider">
                      Complete Reference Manual
                    </span>
                    <h3 className="text-xl font-bold text-white mt-1">
                      {completeManual.title || `${subject.subjectName} — Full Manual`}
                    </h3>
                    <p className="text-xs text-indigo-200/70 mt-1 font-mono">
                      {completeManual.fileName} (v{completeManual.version}) &bull; Uploaded by {completeManual.uploadedBy}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => setPreviewManualId(previewManualId === completeManual.id ? null : completeManual.id)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-all border border-white/10"
                  >
                    {previewManualId === completeManual.id ? <><EyeOff className="w-4 h-4" /> Hide Preview</> : <><Eye className="w-4 h-4" /> Preview Manual</>}
                  </button>
                  <a
                    href={completeManual.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-500/30"
                  >
                    <Download className="w-4 h-4" /> Download PDF
                  </a>
                </div>
              </div>
            )}

            {previewManualId === completeManual?.id && (
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-600" /> Complete Lab Manual Preview
                  </h4>
                  <button 
                    onClick={() => setPreviewManualId(null)}
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <PdfViewer url={completeManual.fileUrl} loading={false} />
              </div>
            )}

            <h2 className="text-lg font-bold text-slate-800 mb-4">Weekly Lab Tasks</h2>
            
            {Array.from({ length: 12 }, (_, i) => i + 1).map((week) => {
              const submission = submissions[week];
              const manual = manuals.find(m => m.manualType === "weekly" && m.weekNumber === week);
              
              // Status calculations
              const releaseDate = manual?.releaseDate?.toDate();
              const isReleased = !manual || (!releaseDate || new Date() >= releaseDate);
              const dueDate = manual?.dueDate?.toDate();
              const isPastDeadline = dueDate && new Date() > dueDate;

              let statusText = submission ? (submission.is_late ? "Submitted (Late)" : "Submitted ✓") : (isPastDeadline ? "Deadline Passed" : "Pending");
              let statusBg = submission 
                ? (submission.is_late ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-emerald-100 text-emerald-800 border border-emerald-200")
                : (isPastDeadline ? "bg-red-100 text-red-800 border border-red-200" : "bg-blue-100 text-blue-800 border border-blue-200");

              const isPreviewing = previewManualId === manual?.id;
              const displayManual = manual || completeManual;

              return (
                <div key={week} className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm flex flex-col gap-4 transition-all hover:border-indigo-200 hover:shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1.5">
                        <h3 className="text-lg font-bold text-slate-800">Week {week}</h3>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBg}`}>
                          {statusText}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-700">
                          {manual?.title || (completeManual ? `Week ${week} Experiment & Lab Report` : `Week ${week} Task Submissions`)}
                        </p>
                        {dueDate ? (
                          <p className={`text-xs flex items-center gap-1.5 ${isPastDeadline && !submission ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                            <Clock className="w-3.5 h-3.5" />
                            Due: {dueDate.toLocaleString()}
                            {isPastDeadline && !submission && " (Overdue)"}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            Open Submission
                          </p>
                        )}
                      </div>

                      {submission && (
                        <div className="mt-3 text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center gap-4 text-slate-600">
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-slate-700">File:</span>
                            <a 
                              href={submission.file_url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-indigo-600 hover:underline flex items-center gap-1"
                            >
                              <FileArchive className="w-3.5 h-3.5" />
                              {submission.file_name}
                            </a>
                            <span className="text-slate-400 ml-1">
                              ({(submission.file_size_bytes / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-700">Submitted:</span>{" "}
                            {new Date(submission.submitted_at).toLocaleDateString()} at {new Date(submission.submitted_at).toLocaleTimeString()}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-slate-100 sm:pl-6 flex flex-wrap items-center gap-2">
                      {displayManual && (
                        <>
                          <button
                            onClick={() => setPreviewManualId(isPreviewing ? null : displayManual.id)}
                            className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2 rounded-xl hover:bg-slate-100 transition-colors"
                          >
                            {isPreviewing ? <><EyeOff className="w-4 h-4" /> Hide</> : <><Eye className="w-4 h-4" /> Preview</>}
                          </button>
                          <a
                            href={displayManual.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2 rounded-xl hover:bg-slate-100 transition-colors"
                          >
                            <Download className="w-4 h-4" /> Download
                          </a>
                        </>
                      )}

                      {(!submission || ((!manual || manual.allowResubmission) && !isPastDeadline)) ? (
                        <button
                          onClick={() => handleOpenSubmitModal(week)}
                          className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                            submission 
                              ? "bg-slate-100 text-slate-700 hover:bg-slate-200" 
                              : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-100"
                          }`}
                        >
                          <UploadCloud className="w-4 h-4" />
                          {submission ? "Resubmit" : "Submit Task"}
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Submitted
                        </span>
                      )}
                    </div>
                  </div>

                  {isPreviewing && displayManual && (
                    <div className="border-t border-slate-100 pt-4">
                      <PdfViewer url={displayManual.fileUrl} loading={false} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Submission Modal */}
      {isModalOpen && modalWeek !== null && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-100 shadow-2xl overflow-hidden relative">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800">Submit Task — Week {modalWeek}</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile Details */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Student Name</p>
                  <p className="font-bold text-slate-700 mt-0.5">{studentProfile?.name}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Roll Number</p>
                  <p className="font-bold text-slate-700 mt-0.5">{studentProfile?.rollNumber.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Branch & Section</p>
                  <p className="font-bold text-slate-700 mt-0.5">{studentProfile?.branch} - Sec {studentProfile?.section}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Subject</p>
                  <p className="font-bold text-slate-700 mt-0.5 truncate">{subject.subjectName}</p>
                </div>
              </div>

              {/* File Upload Selector */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Upload Submission File</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                    selectedFile 
                      ? "border-indigo-400 bg-indigo-50/20" 
                      : "border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/10"
                  }`}
                >
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept={(manuals.find(m => m.manualType === "weekly" && m.weekNumber === modalWeek)?.allowedFileTypes || ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.zip']).join(',')}
                  />
                  
                  {selectedFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <FileArchive className="w-10 h-10 text-indigo-600" />
                      <p className="font-bold text-slate-800 text-sm max-w-xs truncate">{selectedFile.name}</p>
                      <p className="text-xs text-slate-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                        }}
                        className="text-xs font-semibold text-red-500 hover:text-red-700 mt-2 flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" /> Remove file
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <UploadCloud className="w-10 h-10 text-slate-300" />
                      <p className="font-semibold text-slate-600 text-sm">Click to choose a file</p>
                      <p className="text-xs">
                        Allowed types: {(manuals.find(m => m.manualType === "weekly" && m.weekNumber === modalWeek)?.allowedFileTypes || ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.zip']).join(', ')}
                      </p>
                      <p className="text-xs">Max size: {manuals.find(m => m.manualType === "weekly" && m.weekNumber === modalWeek)?.maxFileSizeMb || 20} MB</p>
                    </div>
                  )}
                </div>
              </div>

              {uploading && (
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Uploading submission...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleUploadSubmit}
                disabled={!selectedFile || uploading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2"
              >
                {uploading ? "Submitting..." : "Submit File"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentSubjectView;

