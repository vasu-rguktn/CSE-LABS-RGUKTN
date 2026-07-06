import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Fuse from "fuse.js";
import { subjects } from "../data/subjects";
import { saveFacultySubject } from "../supabase/db";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";
import {
  BookOpen,
  Search,
  CheckCircle,
  Loader2,
  AlertTriangle,
  Lock,
} from "lucide-react";
import type { Subject } from "../data/subjects";

const fuse = new Fuse(subjects, {
  keys: ["name", "shortName", "code"],
  threshold: 0.4,
});

const FacultySelectSubject: React.FC = () => {
  const { user, facultySubjects, setFacultySubjects } = useAuthStore();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const searchResults =
    query.trim().length > 0
      ? fuse.search(query).map((r) => r.item)
      : subjects;

  const handleSelect = (subject: Subject) => {
    setSelectedSubject(subject);
    setQuery(subject.shortName);
    setDropdownOpen(false);
  };

  const handleConfirm = async () => {
    if (!selectedSubject || !user) return;
    
    // Prevent adding the same subject twice
    if (facultySubjects.some((fs) => fs.subjectId === selectedSubject.id)) {
      toast.error(`You are already assigned to ${selectedSubject.shortName}.`);
      return;
    }

    setSaving(true);
    try {
      await saveFacultySubject(user.uid, user.email!, selectedSubject.id);
      const fs = {
        uid: user.uid,
        email: user.email!,
        subjectId: selectedSubject.id,
        assignedAt: null,
      };
      setFacultySubjects([...facultySubjects, fs]);
      toast.success(`Subject assigned: ${selectedSubject.shortName}`);
      navigate("/faculty/dashboard"); // no replace, so they can go back
    } catch {
      toast.error("Failed to save subject. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-3xl shadow-2xl shadow-blue-100 border border-slate-100 p-8 sm:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 mb-4">
              <BookOpen className="w-7 h-7 text-blue-700" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Assign a Subject
            </h1>
            <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto">
              Choose a lab subject you teach. You can assign yourself to multiple subjects.
            </p>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-6">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700">
              <strong>One-time selection.</strong> You can only pick one subject
              and cannot change it yourself later.
            </p>
          </div>

          {/* Search input */}
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedSubject(null);
                setDropdownOpen(true);
              }}
              onFocus={() => setDropdownOpen(true)}
              placeholder="Search subjects…"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              aria-label="Search and select your subject"
            />
            {dropdownOpen && (
              <ul className="absolute top-full mt-1.5 left-0 right-0 z-50 bg-white rounded-xl border border-slate-100 shadow-2xl max-h-60 overflow-y-auto divide-y divide-slate-50">
                {searchResults.length === 0 ? (
                  <li className="px-4 py-3 text-sm text-slate-400 text-center">
                    No subjects found
                  </li>
                ) : (
                  searchResults.map((subject) => (
                    <li
                      key={subject.id}
                      onClick={() => handleSelect(subject)}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 text-sm truncate">
                          {subject.shortName}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {subject.name}
                        </p>
                      </div>
                      <span className="text-xs font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md shrink-0">
                        {subject.code}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>

          {/* Selected subject display */}
          {selectedSubject && (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6">
              <CheckCircle className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <p className="font-semibold text-blue-800">
                  {selectedSubject.shortName}
                </p>
                <p className="text-xs text-blue-600">{selectedSubject.name}</p>
              </div>
              <span className="ml-auto text-xs font-mono bg-blue-100 text-blue-700 px-2 py-1 rounded-lg">
                {selectedSubject.code}
              </span>
            </div>
          )}

          {/* Confirm button */}
          <button
            onClick={handleConfirm}
            disabled={!selectedSubject || saving}
            id="confirm-subject-btn"
            className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-2xl shadow-md shadow-blue-200 hover:shadow-blue-300 transition-all"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
            {saving ? "Saving…" : "Confirm & Lock In Subject"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FacultySelectSubject;
