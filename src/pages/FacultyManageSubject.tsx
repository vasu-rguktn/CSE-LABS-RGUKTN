import React, { useEffect, useState, useRef } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { subjects } from "../data/subjects";
import { getLabManuals, saveLabManual, deleteLabManual, getSubmissionsForFaculty } from "../supabase/db";
import type { LabManual } from "../supabase/db";
import { uploadLabManual, deleteLabManualFile, MAX_FILE_SIZE_MB } from "../supabase/storage";
import JSZip from "jszip";
import PdfViewer from "../components/PdfViewer";
import toast from "react-hot-toast";
import {
  Upload,
  Download,
  Eye,
  EyeOff,
  FileText,
  Calendar,
  CheckCircle,
  Loader2,
  X,
  BookOpen,
  AlertCircle,
  Info,
  Trash2,
  RefreshCw,
  Users,
  FolderArchive
} from "lucide-react";

import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const FacultyManageSubject: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const subjectId = id!;
  const { user, facultySubjects } = useAuthStore();
  
  // Guard
  if (!facultySubjects.some(fs => fs.subjectId === subjectId)) {
    return <Navigate to="/faculty/dashboard" replace />;
  }
  const userEmail = user?.email ?? "unknown";

  const subject = subjects.find((s) => s.id === subjectId);
  const [manuals, setManuals] = useState<LabManual[]>([]);
  const [loadingManuals, setLoadingManuals] = useState(true);
  
  const [previewManualId, setPreviewManualId] = useState<string | null>(null);

  // Upload state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadType, setUploadType] = useState<"complete" | "weekly">("weekly");
  const [uploadWeek, setUploadWeek] = useState<number>(1);
  const [uploadTitle, setUploadTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<"manuals" | "submissions">("manuals");
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [isDownloadingBulk, setIsDownloadingBulk] = useState(false);

  const fetchManuals = async () => {
    setLoadingManuals(true);
    try {
      const data = await getLabManuals(subjectId);
      setManuals(data);
    } catch {
      toast.error("Could not load manuals.");
    } finally {
      setLoadingManuals(false);
    }
  };

  const fetchSubmissions = async () => {
    setLoadingSubmissions(true);
    try {
      const data = await getSubmissionsForFaculty(subjectId);
      setSubmissions(data);
    } catch {
      toast.error("Could not load student submissions.");
    } finally {
      setLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    fetchManuals();
    fetchSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are accepted.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`File must be under ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);
    const uploadToast = toast.loading("Uploading lab manual…");
    try {
      const storagePath = uploadType === "complete"
        ? `${subjectId}/complete-manual.pdf`
        : `${subjectId}/week-${String(uploadWeek).padStart(2, '0')}.pdf`;

      const { fileUrl, fileName } = await uploadLabManual(
        storagePath,
        selectedFile,
        (p) => setUploadProgress(p)
      );

      // find existing to get version
      const existing = manuals.find(m => m.manualType === uploadType && (uploadType === "complete" || m.weekNumber === uploadWeek));
      
      await saveLabManual(
        subjectId,
        uploadType,
        uploadType === "weekly" ? uploadWeek : null,
        uploadTitle || null,
        storagePath,
        fileUrl,
        fileName,
        userEmail,
        existing?.version ?? 0
      );
      
      toast.success("Lab manual uploaded successfully!", { id: uploadToast });
      setSelectedFile(null);
      setUploadProgress(0);
      setUploadDialogOpen(false);
      setUploadTitle("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      await fetchManuals();
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message ?? "Upload failed. Please try again.", {
        id: uploadToast,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (manual: LabManual) => {
    if (!window.confirm("Are you sure you want to delete this manual?")) return;
    const delToast = toast.loading("Deleting manual...");
    try {
      await deleteLabManualFile(manual.storagePath);
      await deleteLabManual(manual.id);
      toast.success("Manual deleted.", { id: delToast });
      if (previewManualId === manual.id) setPreviewManualId(null);
      await fetchManuals();
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message ?? "Delete failed.", { id: delToast });
    }
  };

  const openReplaceDialog = (manual: LabManual) => {
    setUploadType(manual.manualType);
    if (manual.manualType === "weekly" && manual.weekNumber) {
      setUploadWeek(manual.weekNumber);
    }
    setUploadTitle(manual.title || "");
    setUploadDialogOpen(true);
  };

  const handleBulkDownload = async () => {
    if (submissions.length === 0) return;
    
    setIsDownloadingBulk(true);
    const toastId = toast.loading("Bundling submissions...");
    
    try {
      const zip = new JSZip();
      
      // We will create folders for each week and section
      // e.g. Week 1 / CSE1 / 19KQ1A0501.zip
      for (const sub of submissions) {
        const url = sub.file_url;
        const weekFolder = `Week ${sub.week_number}`;
        const sectionFolder = sub.students_master.section;
        const fileName = `${sub.students_master.roll_number}.zip`;
        
        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error("Failed to fetch file");
          const blob = await response.blob();
          
          zip.folder(weekFolder)?.folder(sectionFolder)?.file(fileName, blob);
        } catch (e) {
          console.error(`Failed to download ${fileName}`, e);
          // We can optionally notify about failed files
        }
      }
      
      const content = await zip.generateAsync({ type: "blob" });
      
      // Create a download link
      const blobUrl = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${subject?.code || "Subject"}_All_Submissions.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      
      toast.success("Download started!", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Failed to create bundle", { id: toastId });
    } finally {
      setIsDownloadingBulk(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/20 pb-16">
      {/* Dashboard header */}
      <div className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <Link to="/faculty/dashboard" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-200">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-0.5">
                  Manage Subject
                </p>
                {subject ? (
                  <>
                    <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
                      {subject.name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="text-sm text-slate-500">
                        {subject.shortName}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
                        {subject.code}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-slate-500">Unknown subject</p>
                )}
              </div>
            </div>
            
            <button
              onClick={() => {
                setUploadType("weekly");
                setUploadWeek(1);
                setUploadTitle("");
                setSelectedFile(null);
                setUploadDialogOpen(true);
              }}
              className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-4 py-2 rounded-xl shadow-md transition-all"
            >
              <Upload className="w-4 h-4" />
              Upload Manual
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-8">
        {/* Tabs */}
        <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl mb-6 max-w-sm">
          <button
            onClick={() => setActiveTab("manuals")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === "manuals"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Manuals
          </button>
          <button
            onClick={() => setActiveTab("submissions")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === "submissions"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            <Users className="w-4 h-4" />
            Submissions
          </button>
        </div>

        {activeTab === "manuals" ? (
          <div className="space-y-6">
            {/* Upload Dialog */}
            {uploadDialogOpen && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-lg overflow-hidden relative mb-8">
                <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-blue-600" />
                    <h2 className="font-semibold text-slate-800">
                      Upload Lab Manual
                    </h2>
                  </div>
                  <button onClick={() => setUploadDialogOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Manual Type</label>
                      <select 
                        value={uploadType} 
                        onChange={(e) => setUploadType(e.target.value as "complete" | "weekly")}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="weekly">Weekly Manual</option>
                        <option value="complete">Complete Lab Manual</option>
                      </select>
                    </div>
                    {uploadType === "weekly" && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Week Number</label>
                        <select 
                          value={uploadWeek} 
                          onChange={(e) => setUploadWeek(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                          {Array.from({length: 12}, (_, i) => i + 1).map(w => (
                            <option key={w} value={w}>Week {w}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Title (Optional)</label>
                      <input 
                        type="text" 
                        value={uploadTitle}
                        onChange={(e) => setUploadTitle(e.target.value)}
                        placeholder="e.g. Introduction to React"
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Info note */}
                  <div className="flex items-start gap-2 text-sm text-slate-500">
                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
                    <p>
                      PDF only · Max {MAX_FILE_SIZE_MB}MB · Uploading a file for an existing week will replace the previous one.
                    </p>
                  </div>

                  {/* File picker */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                      selectedFile
                        ? "border-blue-300 bg-blue-50"
                        : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/50"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="pdf-file-input"
                    />
                    {selectedFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="w-10 h-10 text-blue-500" />
                        <p className="font-medium text-slate-800">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 mt-1"
                        >
                          <X className="w-3.5 h-3.5" /> Remove
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <Upload className="w-10 h-10" />
                        <p className="font-medium text-slate-600">
                          Click to pick a PDF file
                        </p>
                        <p className="text-sm">or drag and drop</p>
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  {uploading && (
                    <div>
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Uploading…</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Upload button */}
                  <button
                    onClick={handleUpload}
                    disabled={!selectedFile || uploading}
                    id="upload-submit-btn"
                    className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-2xl shadow-md shadow-blue-200 hover:shadow-blue-300 transition-all"
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {uploading
                      ? `Uploading… ${uploadProgress}%`
                      : "Upload Lab Manual"}
                  </button>
                </div>
              </div>
            )}

            {/* Current status card */}
            {loadingManuals ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                <p className="text-slate-500 text-sm">Loading manuals…</p>
              </div>
            ) : manuals.length > 0 ? (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-800 mb-2">Uploaded Manuals</h2>
                {manuals.map((manual) => {
                  const formattedDate = manual.updatedAt?.toDate()?.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  });

                  const isPreviewing = previewManualId === manual.id;

                  return (
                    <div key={manual.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-800 text-base">
                              {manual.manualType === "complete" ? "Complete Lab Manual" : `Week ${manual.weekNumber}`}
                              {manual.title ? `: ${manual.title}` : ""}
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 mt-1">
                              {formattedDate && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {formattedDate}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5" />
                                v{manual.version}
                              </span>
                              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                {manual.fileName}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                          <button
                            onClick={() => setPreviewManualId(isPreviewing ? null : manual.id)}
                            className="inline-flex items-center justify-center gap-1.5 text-sm font-medium bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
                          >
                            {isPreviewing ? <><EyeOff className="w-4 h-4" /> Hide</> : <><Eye className="w-4 h-4" /> Preview</>}
                          </button>
                          <a
                            href={manual.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="inline-flex items-center justify-center gap-1.5 text-sm font-medium bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
                          >
                            <Download className="w-4 h-4" /> Download
                          </a>
                          <button
                            onClick={() => openReplaceDialog(manual)}
                            className="inline-flex items-center justify-center gap-1.5 text-sm font-medium bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2 rounded-xl hover:bg-amber-100 transition-colors"
                          >
                            <RefreshCw className="w-4 h-4" /> Replace
                          </button>
                          <button
                            onClick={() => handleDelete(manual)}
                            className="inline-flex items-center justify-center gap-1.5 text-sm font-medium bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        </div>
                      </div>
                      
                      {/* Inline PDF Preview */}
                      {isPreviewing && (
                        <div className="mt-4 border-t border-slate-100 pt-4">
                          <PdfViewer url={manual.fileUrl} loading={false} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-800">
                    No manuals uploaded yet
                  </p>
                  <p className="text-sm text-amber-600 mt-0.5">
                    Use the "Upload Manual" button above to add a weekly or complete lab manual.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-slate-800">Student Submissions</h2>
              
              {submissions.length > 0 && (
                <button
                  onClick={handleBulkDownload}
                  disabled={isDownloadingBulk}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold px-4 py-2 rounded-xl shadow-sm transition-all"
                >
                  {isDownloadingBulk ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {isDownloadingBulk ? "Creating Bundle..." : "Bulk Download (All)"}
                </button>
              )}
            </div>

            {loadingSubmissions ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                <p className="text-slate-500 text-sm">Loading student submissions…</p>
              </div>
            ) : submissions.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                <FolderArchive className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-700 mb-2">No Submissions Yet</h3>
                <p className="text-slate-500 max-w-sm mx-auto">
                  Students have not uploaded any ZIP files for this subject. Check back later once the deadline approaches.
                </p>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                        <th className="px-6 py-4">Student</th>
                        <th className="px-6 py-4">Section</th>
                        <th className="px-6 py-4">Week</th>
                        <th className="px-6 py-4">Submitted At</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {submissions.map((sub: any) => (
                        <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-800">
                              {sub.students_master.name}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5 uppercase tracking-wide font-mono">
                              {sub.students_master.roll_number}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-600 font-medium">
                            {sub.students_master.section}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                              Week {sub.week_number}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">
                            {new Date(sub.submitted_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <a
                              href={sub.file_url}
                              target="_blank"
                              rel="noreferrer"
                              download
                              className="inline-flex items-center gap-1.5 text-sm font-medium bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                            >
                              <Download className="w-4 h-4" />
                              <span className="hidden sm:inline">ZIP</span>
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyManageSubject;
