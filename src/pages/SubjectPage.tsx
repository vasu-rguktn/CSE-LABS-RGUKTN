import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { subjects } from "../data/subjects";
import { getLabManual } from "../supabase/db";
import type { LabManual } from "../supabase/db";
import PdfViewer from "../components/PdfViewer";
import {
  Download,
  ArrowLeft,
  Calendar,
  User,
  FileText,
  RefreshCw,
} from "lucide-react";

const SubjectPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const subject = subjects.find((s) => s.id === id);
  const [manual, setManual] = useState<LabManual | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchManual = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getLabManual(id);
      setManual(data);
    } catch {
      setError("Failed to load manual info. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManual();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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

  const formattedDate =
    manual?.uploadedAt?.toDate
      ? manual.uploadedAt.toDate().toLocaleDateString("en-IN", {
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

            {manual?.fileUrl && (
              <a
                href={manual.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                id={`download-${subject.id}`}
                className="inline-flex items-center gap-2 shrink-0 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-5 py-3 rounded-xl shadow-md shadow-blue-200 hover:shadow-blue-300 transition-all"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </a>
            )}
          </div>

          {/* Meta info */}
          {manual && (
            <div className="flex flex-wrap gap-4 mt-5 pt-5 border-t border-slate-100">
              {formattedDate && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  Last updated: <span className="font-medium text-slate-700">{formattedDate}</span>
                </div>
              )}
              {manual.uploadedBy && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <User className="w-4 h-4 text-slate-400" />
                  Uploaded by:{" "}
                  <span className="font-medium text-slate-700">
                    {manual.uploadedBy}
                  </span>
                </div>
              )}
              {manual.version && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <FileText className="w-4 h-4 text-slate-400" />
                  Version: <span className="font-medium text-slate-700">v{manual.version}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* PDF viewer */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8">
        {error ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
            <p className="text-red-600 font-medium mb-3">{error}</p>
            <button
              onClick={fetchManual}
              className="inline-flex items-center gap-2 text-sm font-medium text-red-700 hover:text-red-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Try again
            </button>
          </div>
        ) : (
          <PdfViewer url={manual?.fileUrl ?? null} loading={loading} />
        )}
      </div>
    </div>
  );
};

export default SubjectPage;
