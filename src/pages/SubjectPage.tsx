import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { subjects } from "../data/subjects";
import { getLabManuals, getFacultyForSubjectSection } from "../supabase/db";
import type { LabManual } from "../supabase/db";
import PdfViewer from "../components/PdfViewer";
import { useAuthStore } from "../store/authStore";
import {
  Download,
  ArrowLeft,
  Calendar,
  User,
  FileText,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle
} from "lucide-react";

const SubjectPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const subject = subjects.find((s) => s.id === id);
  const [manuals, setManuals] = useState<LabManual[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [previewManualId, setPreviewManualId] = useState<string | null>(null);
  
  const { studentProfile } = useAuthStore();
  const [facultyMapping, setFacultyMapping] = useState<{ facultyName: string | null, coFacultyName: string | null } | null>(null);

  const fetchManualsAndFaculty = async () => {
    if (!id || !subject) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getLabManuals(id);
      setManuals(data);
      
      // Fetch faculty mapping for this specific student's section
      if (studentProfile && subject.code) {
        const mapping = await getFacultyForSubjectSection(
          subject.code,
          studentProfile.engineeringYear,
          studentProfile.branch,
          studentProfile.section
        );
        if (mapping) {
          setFacultyMapping({
            facultyName: mapping.facultyName,
            coFacultyName: mapping.coFacultyName
          });
        }
      }
    } catch {
      setError("Failed to load data. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManualsAndFaculty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, subject, studentProfile]);

  if (!subject) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <p className="text-6xl mb-4">🔍</p>
          <h1 className="text-2xl font-bold text-slate-700 mb-2">
            Subject not found
          </h1>
          <p className="text-slate-500 mb-6">
            That subject ID doesn&apos;t exist in our catalogue.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Find the latest updated date to show at the top
  const latestManual = manuals.length > 0 
    ? [...manuals].sort((a, b) => {
        const dateA = a.updatedAt?.toDate()?.getTime() || 0;
        const dateB = b.updatedAt?.toDate()?.getTime() || 0;
        return dateB - dateA;
      })[0]
    : null;

  const formattedLatestDate = latestManual?.updatedAt?.toDate
    ? latestManual.updatedAt.toDate().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/20 pb-16">
      {/* Page header */}
      <div className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-700 transition-colors mb-5"
          >
            <ArrowLeft className="w-4 h-4" /> Back to all subjects
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="inline-block font-mono text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100 mb-2">
                {subject.code}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug">
                {subject.name}
              </h1>
              <p className="text-slate-500 mt-1">{subject.shortName}</p>
            </div>
          </div>

          {/* Meta info & Faculty */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mt-5 pt-5 border-t border-slate-100">
            <div className="flex flex-wrap gap-4">
              {formattedLatestDate && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  Last updated: <span className="font-medium text-slate-700">{formattedLatestDate}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <FileText className="w-4 h-4 text-slate-400" />
                Total manuals: <span className="font-medium text-slate-700">{manuals.length}</span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                <User className="w-4 h-4 text-blue-600" /> Faculty
              </div>
              <div className="text-sm text-slate-600">
                {facultyMapping ? (
                  <>
                    {facultyMapping.facultyName || "Not assigned"}
                    {facultyMapping.coFacultyName && ` & ${facultyMapping.coFacultyName}`}
                  </>
                ) : (
                  "Faculty not yet assigned"
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8">
        {error ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
            <p className="text-red-600 font-medium mb-3">{error}</p>
            <button
              onClick={fetchManualsAndFaculty}
              className="inline-flex items-center gap-2 text-sm font-medium text-red-700 hover:text-red-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Try again
            </button>
          </div>
        ) : loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-medium">Loading manuals...</p>
          </div>
        ) : manuals.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Available Lab Manuals</h2>
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
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <CheckCircle className="w-5 h-5 text-blue-600" />
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
                          {manual.uploadedBy && (
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5" />
                              {manual.uploadedBy}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewManualId(isPreviewing ? null : manual.id)}
                        className="inline-flex items-center justify-center gap-1.5 text-sm font-medium bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl hover:bg-slate-100 transition-colors"
                      >
                        {isPreviewing ? <><EyeOff className="w-4 h-4" /> Hide Preview</> : <><Eye className="w-4 h-4" /> Preview</>}
                      </button>
                      <a
                        href={manual.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="inline-flex items-center justify-center gap-1.5 text-sm font-medium bg-blue-700 text-white px-4 py-2.5 rounded-xl shadow-md hover:bg-blue-800 transition-all"
                      >
                        <Download className="w-4 h-4" /> Download
                      </a>
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
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
            <AlertCircle className="w-10 h-10 text-amber-500 mb-3" />
            <h2 className="text-lg font-semibold text-amber-800 mb-1">
              No manuals available
            </h2>
            <p className="text-amber-600 max-w-sm">
              The faculty has not uploaded any lab manuals for this subject yet. Please check back later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubjectPage;
