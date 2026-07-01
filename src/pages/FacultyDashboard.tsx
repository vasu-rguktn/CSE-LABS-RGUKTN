import React, { useEffect, useState, useRef } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { subjects } from "../data/subjects";
import { getLabManual, saveLabManual } from "../supabase/db";
import type { LabManual } from "../supabase/db";
import { uploadLabManual, MAX_FILE_SIZE_MB } from "../supabase/storage";
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
} from "lucide-react";

// Inner dashboard component — only rendered when facultySubject is guaranteed non-null
const DashboardInner: React.FC<{ subjectId: string; userEmail: string }> = ({
  subjectId,
  userEmail,
}) => {
  const subject = subjects.find((s) => s.id === subjectId);
  const [manual, setManual] = useState<LabManual | null>(null);
  const [loadingManual, setLoadingManual] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchManual = async () => {
    setLoadingManual(true);
    try {
      const data = await getLabManual(subjectId);
      setManual(data);
    } catch {
      toast.error("Could not load current manual info.");
    } finally {
      setLoadingManual(false);
    }
  };

  useEffect(() => {
    fetchManual();
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
      const { fileUrl, fileName } = await uploadLabManual(
        subjectId,
        selectedFile,
        (p) => setUploadProgress(p)
      );
      await saveLabManual(
        subjectId,
        fileUrl,
        fileName,
        userEmail,
        manual?.version ?? 0
      );
      toast.success("Lab manual uploaded successfully!", { id: uploadToast });
      setSelectedFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await fetchManual();
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message ?? "Upload failed. Please try again.", {
        id: uploadToast,
      });
    } finally {
      setUploading(false);
    }
  };

  const formattedDate =
    manual?.uploadedAt?.toDate
      ? manual.uploadedAt.toDate().toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/20 pb-16">
      {/* Dashboard header */}
      <div className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-200">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-0.5">
                Faculty Dashboard
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
                    <span className="inline-flex items-center gap-1 text-xs font-medium bg-green-50 text-green-700 border border-green-100 px-2.5 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3" /> Subject Locked
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-slate-500">Unknown subject</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-8 space-y-6">
        {/* Current status card */}
        {loadingManual ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            <p className="text-slate-500 text-sm">Loading current manual…</p>
          </div>
        ) : manual ? (
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-emerald-800">
                    Manual uploaded
                  </p>
                  {formattedDate && (
                    <div className="flex items-center gap-1.5 text-sm text-emerald-600 mt-0.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Last updated {formattedDate}
                    </div>
                  )}
                  <p className="text-xs text-emerald-600 mt-0.5">
                    {manual.fileName} · Version {manual.version}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={manual.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  id="faculty-download-btn"
                  className="inline-flex items-center gap-1.5 text-sm font-medium bg-white border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl hover:bg-emerald-50 transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4" /> Download
                </a>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  id="faculty-preview-btn"
                  className="inline-flex items-center gap-1.5 text-sm font-medium bg-white border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl hover:bg-emerald-50 transition-colors shadow-sm"
                >
                  {showPreview ? (
                    <>
                      <EyeOff className="w-4 h-4" /> Hide Preview
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" /> Preview
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800">
                No manual uploaded yet
              </p>
              <p className="text-sm text-amber-600 mt-0.5">
                Use the upload section below to add a lab manual for your
                subject.
              </p>
            </div>
          </div>
        )}

        {/* PDF preview */}
        {showPreview && (
          <PdfViewer url={manual?.fileUrl ?? null} loading={false} />
        )}

        {/* Upload card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-slate-800">
              {manual ? "Replace Lab Manual" : "Upload Lab Manual"}
            </h2>
          </div>

          <div className="p-6 space-y-5">
            {/* Info note */}
            <div className="flex items-start gap-2 text-sm text-slate-500">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
              <p>
                PDF only · Max {MAX_FILE_SIZE_MB}MB · Uploading a new file will
                replace the existing manual for students.
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

        {/* Contact info */}
        <div className="text-center text-sm text-slate-400 pb-4">
          Need to change your assigned subject?{" "}
          <span className="text-slate-500 font-medium">
            Contact the department admin.
          </span>
        </div>
      </div>
    </div>
  );
};

// Outer component handles auth guard + redirect
const FacultyDashboard: React.FC = () => {
  const { user, facultySubject } = useAuthStore();

  if (!facultySubject) {
    return <Navigate to="/faculty/select-subject" replace />;
  }

  return (
    <DashboardInner
      subjectId={facultySubject.subjectId}
      userEmail={user?.email ?? "unknown"}
    />
  );
};

export default FacultyDashboard;
