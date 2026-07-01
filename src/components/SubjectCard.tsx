import React from "react";
import { useNavigate } from "react-router-dom";
import type { Subject } from "../data/subjects";
import { BookOpen, ArrowRight } from "lucide-react";

interface SubjectCardProps {
  subject: Subject;
  hasManual?: boolean;
}

const SubjectCard: React.FC<SubjectCardProps> = ({
  subject,
  hasManual = false,
}) => {
  const navigate = useNavigate();

  return (
    <article
      onClick={() => navigate(`/subject/${subject.id}`)}
      className="group relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
      aria-label={`View ${subject.shortName} lab manual`}
    >
      {/* Accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="p-6">
        {/* Icon + badge row */}
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
            <BookOpen className="w-6 h-6 text-blue-600" />
          </div>
          {hasManual ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Available
            </span>
          ) : (
            <span className="inline-flex items-center text-xs font-medium bg-slate-50 text-slate-400 border border-slate-200 px-2.5 py-1 rounded-full">
              Pending
            </span>
          )}
        </div>

        {/* Subject info */}
        <h3 className="font-semibold text-slate-800 text-base leading-snug mb-1 group-hover:text-blue-700 transition-colors line-clamp-2">
          {subject.name}
        </h3>
        <p className="text-sm text-slate-500">{subject.shortName}</p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-50">
          <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg">
            {subject.code}
          </span>
          <span className="text-blue-600 flex items-center gap-1 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            View <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </article>
  );
};

export default SubjectCard;
