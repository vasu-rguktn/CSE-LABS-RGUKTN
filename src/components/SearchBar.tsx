import React, { useState, useRef, useEffect } from "react";
import Fuse from "fuse.js";
import { useNavigate } from "react-router-dom";
import { subjects } from "../data/subjects";
import type { Subject } from "../data/subjects";
import { Search, X } from "lucide-react";

const fuse = new Fuse(subjects, {
  keys: ["name", "shortName", "code"],
  threshold: 0.35,
  includeScore: true,
});

interface SearchBarProps {
  autoFocus?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ autoFocus = false }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Subject[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setHighlighted(-1);
    if (val.trim().length === 0) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    const found = fuse.search(val).map((r) => r.item);
    setResults(found);
    setIsOpen(true);
  };

  const selectSubject = (subject: Subject) => {
    setQuery(subject.shortName);
    setIsOpen(false);
    navigate(`/subject/${subject.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && highlighted >= 0) {
      selectSubject(results[highlighted]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const clearQuery = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative flex items-center">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim() && setIsOpen(true)}
          placeholder="Search by subject name, short name, or code..."
          className="w-full pl-12 pr-12 py-4 text-base rounded-2xl border border-slate-200 bg-white/90 backdrop-blur shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400 text-slate-700"
          aria-label="Search subjects"
          aria-autocomplete="list"
          aria-controls="search-listbox"
          aria-expanded={isOpen}
          role="combobox"
        />
        {query && (
          <button
            onClick={clearQuery}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Clear search"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul
          id="search-listbox"
          ref={listRef}
          role="listbox"
          className="absolute top-full mt-2 left-0 right-0 z-50 bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden divide-y divide-slate-50"
        >
          {results.map((subject, idx) => (
            <li
              key={subject.id}
              role="option"
              aria-selected={highlighted === idx}
              onClick={() => selectSubject(subject)}
              onMouseEnter={() => setHighlighted(idx)}
              className={`flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-colors ${
                highlighted === idx ? "bg-blue-50" : "hover:bg-slate-50"
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 truncate">
                  {subject.shortName}
                </p>
                <p className="text-sm text-slate-500 truncate">{subject.name}</p>
              </div>
              <span className="shrink-0 text-xs font-mono bg-slate-100 text-slate-500 px-2 py-1 rounded-lg">
                {subject.code}
              </span>
            </li>
          ))}
        </ul>
      )}

      {isOpen && results.length === 0 && query.trim() && (
        <div className="absolute top-full mt-2 left-0 right-0 z-50 bg-white rounded-2xl border border-slate-100 shadow-2xl p-5 text-center text-slate-500">
          No subjects found for &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  );
};

export default SearchBar;
