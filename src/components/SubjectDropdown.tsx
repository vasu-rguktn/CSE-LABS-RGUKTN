import React from "react";
import { useNavigate } from "react-router-dom";
import { subjects } from "../data/subjects";
import { ChevronDown } from "lucide-react";

const SubjectDropdown: React.FC = () => {
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value) {
      navigate(`/subject/${e.target.value}`);
    }
  };

  return (
    <div className="relative inline-block w-full max-w-sm">
      <select
        onChange={handleChange}
        defaultValue=""
        className="w-full appearance-none pl-4 pr-10 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-700 cursor-pointer transition-all"
        aria-label="Select a subject from dropdown"
      >
        <option value="" disabled>
          — Or browse all subjects —
        </option>
        {subjects.map((s) => (
          <option key={s.id} value={s.id}>
            {s.shortName} ({s.code})
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    </div>
  );
};

export default SubjectDropdown;
