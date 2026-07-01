import React from "react";
import { FileText, Loader2, AlertCircle } from "lucide-react";

interface PdfViewerProps {
  url: string | null;
  loading?: boolean;
  error?: string | null;
}

const PdfViewer: React.FC<PdfViewerProps> = ({
  url,
  loading = false,
  error = null,
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] bg-slate-50 rounded-2xl border border-slate-100">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-slate-500 text-sm">Loading PDF preview…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] bg-red-50 rounded-2xl border border-red-100">
        <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
        <p className="text-red-600 font-medium text-sm">Failed to load PDF</p>
        <p className="text-red-400 text-xs mt-1">{error}</p>
      </div>
    );
  }

  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] bg-slate-50 rounded-2xl border border-dashed border-slate-200">
        <FileText className="w-12 h-12 text-slate-300 mb-3" />
        <p className="text-slate-500 font-medium">No lab manual uploaded yet</p>
        <p className="text-slate-400 text-sm mt-1">
          Check back soon — faculty will upload it here.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-slate-100 shadow-md bg-slate-50">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-b border-slate-100">
        <FileText className="w-4 h-4 text-blue-600" />
        <span className="text-xs text-slate-500 font-medium">PDF Preview</span>
        <span className="ml-auto text-xs text-slate-400">
          Scroll or zoom within the viewer
        </span>
      </div>
      <iframe
        src={`${url}#toolbar=1&navpanes=0&scrollbar=1`}
        title="Lab Manual PDF Preview"
        className="w-full h-[600px] sm:h-[750px]"
        allow="fullscreen"
        loading="lazy"
      />
    </div>
  );
};

export default PdfViewer;
