import React, { useEffect, useState } from "react";
import { subjects } from "../data/subjects";
import { getLabManuals } from "../supabase/db";
import SearchBar from "../components/SearchBar";
import SubjectDropdown from "../components/SubjectDropdown";
import SubjectCard from "../components/SubjectCard";
import { BookOpen, GraduationCap, Users, Search } from "lucide-react";

const Landing: React.FC = () => {
  const [availableManuals, setAvailableManuals] = useState<Set<string>>(new Set());
  const [loadingManuals, setLoadingManuals] = useState(true);

  useEffect(() => {
    const fetchManuals = async () => {
      const results = await Promise.allSettled(
        subjects.map((s) => getLabManuals(s.id))
      );
      const available = new Set<string>();
      results.forEach((result, idx) => {
        if (result.status === "fulfilled" && result.value.length > 0) {
          available.add(subjects[idx].id);
        }
      });
      setAvailableManuals(available);
      setLoadingManuals(false);
    };
    fetchManuals();
  }, []);

  const uploadedCount = availableManuals.size;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgb(99 102 241) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <GraduationCap className="w-4 h-4" />
            RGUKT Nuzvid — CSE Department
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-5">
            Lab Manual{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Portal
            </span>
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto mb-10 leading-relaxed">
            Access all CSE lab manuals in one place. Search by subject name,
            code, or browse the full catalogue below.
          </p>

          {/* Search */}
          <div className="mb-5">
            <SearchBar autoFocus />
          </div>
          <SubjectDropdown />
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-white border-y border-slate-100 py-5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-wrap justify-center gap-8 sm:gap-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{subjects.length}</p>
              <p className="text-xs text-slate-500">Total Subjects</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Search className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {loadingManuals ? "–" : uploadedCount}
              </p>
              <p className="text-xs text-slate-500">Manuals Available</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">No Login</p>
              <p className="text-xs text-slate-500">Required for Students</p>
            </div>
          </div>
        </div>
      </section>

      {/* Subject cards grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-slate-800">All Subjects</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Click any card to view and download the lab manual
            </p>
          </div>
          {!loadingManuals && (
            <span className="text-sm text-slate-500 bg-white border border-slate-100 px-3 py-1.5 rounded-full shadow-sm">
              {uploadedCount} / {subjects.length} uploaded
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              hasManual={availableManuals.has(subject.id)}
            />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white py-8 mt-4">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center text-sm text-slate-400">
          <p>
            RGUKT Nuzvid — CSE Department Lab Manuals Portal &bull; Faculty
            login required for uploads &bull; Students can browse &amp;
            download freely
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
