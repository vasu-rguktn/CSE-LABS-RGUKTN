import React, { useState, useEffect } from "react";
import { supabase } from "../supabase/config";
import { LayoutDashboard, Users, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

interface FacultyAllocation {
  id: string;
  subject_code: string;
  batch_year: string;
  branch: string;
  section: string;
  faculty_name: string;
  faculty_email: string;
  co_faculty_name?: string;
}

interface SubjectMaster {
  id: string;
  course_code: string;
  subject_name: string;
  engineering_year: string;
  semester: string;
  branch: string;
  credits: number;
  is_lab: boolean;
}

const AdminAllocationsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"allocations" | "bos">("allocations");
  const [allocations, setAllocations] = useState<FacultyAllocation[]>([]);
  const [subjects, setSubjects] = useState<SubjectMaster[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "allocations") {
        const { data, error } = await supabase
          .from("faculty_subject_section")
          .select("*")
          .order("subject_code", { ascending: true });
        if (!error && data) {
          setAllocations(data);
        }
      } else {
        const { data, error } = await supabase
          .from("subjects_master")
          .select("*")
          .order("course_code", { ascending: true });
        if (!error && data) {
          setSubjects(data);
        }
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-indigo-600" />
            Admin Dashboard
          </h1>
          <p className="text-slate-500 mt-1">Manage BoS data and verify faculty allocations</p>
        </div>
        <Link 
          to="/faculty/dashboard"
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Back to Faculty Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab("allocations")}
            className={`flex-1 py-4 px-6 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
              activeTab === "allocations"
                ? "bg-indigo-50/50 text-indigo-700 border-b-2 border-indigo-600"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Users className="w-4 h-4" />
            Faculty Allocations
          </button>
          <button
            onClick={() => setActiveTab("bos")}
            className={`flex-1 py-4 px-6 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
              activeTab === "bos"
                ? "bg-indigo-50/50 text-indigo-700 border-b-2 border-indigo-600"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            BoS Subjects Data
          </button>
        </div>

        <div className="p-6 overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-slate-500 animate-pulse">Loading data...</div>
          ) : activeTab === "allocations" ? (
            allocations.length === 0 ? (
              <div className="py-12 text-center text-slate-500">No faculty allocations found.</div>
            ) : (
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                    <th className="p-3 font-semibold">Subject Code</th>
                    <th className="p-3 font-semibold">Year & Branch</th>
                    <th className="p-3 font-semibold">Section</th>
                    <th className="p-3 font-semibold">Faculty Name</th>
                    <th className="p-3 font-semibold">Email ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {allocations.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="p-3 font-medium text-slate-800">{a.subject_code}</td>
                      <td className="p-3 text-slate-600">{a.batch_year} - {a.branch}</td>
                      <td className="p-3 text-slate-600">{a.section}</td>
                      <td className="p-3 text-slate-800 font-medium">{a.faculty_name}</td>
                      <td className="p-3 text-slate-500">{a.faculty_email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            subjects.length === 0 ? (
              <div className="py-12 text-center text-slate-500">No BoS subject data found.</div>
            ) : (
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                    <th className="p-3 font-semibold">Code</th>
                    <th className="p-3 font-semibold">Subject Name</th>
                    <th className="p-3 font-semibold">Year & Sem</th>
                    <th className="p-3 font-semibold">Branch</th>
                    <th className="p-3 font-semibold">Credits</th>
                    <th className="p-3 font-semibold">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {subjects.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="p-3 font-medium text-indigo-600">{s.course_code}</td>
                      <td className="p-3 text-slate-800 font-medium max-w-xs truncate" title={s.subject_name}>{s.subject_name}</td>
                      <td className="p-3 text-slate-600">{s.engineering_year} - {s.semester}</td>
                      <td className="p-3 text-slate-600">{s.branch}</td>
                      <td className="p-3 text-slate-600">{s.credits}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${s.is_lab ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                          {s.is_lab ? "Lab" : "Theory"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAllocationsView;
