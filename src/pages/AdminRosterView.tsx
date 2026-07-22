import React, { useState, useEffect } from "react";
import { supabase } from "../supabase/config";
import type { StudentMaster } from "../supabase/db";

const AdminRosterView: React.FC = () => {
  const [students, setStudents] = useState<StudentMaster[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [availableSections, setAvailableSections] = useState<string[]>([]);
  
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSection, setSelectedSection] = useState("");

  // Fetch unique years and sections on mount
  useEffect(() => {
    const fetchMetadata = async () => {
      const { data, error } = await supabase
        .from("students_master")
        .select("engineering_year, section");
        
      if (!error && data) {
        const years = Array.from(new Set(data.map(d => d.engineering_year))).sort();
        const secs = Array.from(new Set(data.map(d => d.section))).sort();
        
        setAvailableYears(years);
        setAvailableSections(secs);
        
        if (years.length > 0) setSelectedYear(years[0]);
        if (secs.length > 0) setSelectedSection(secs[0]);
      }
    };
    fetchMetadata();
  }, []);

  const fetchRoster = async () => {
    if (!selectedYear || !selectedSection) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("students_master")
      .select("*")
      .eq("engineering_year", selectedYear)
      .eq("section", selectedSection)
      .order("roll_number", { ascending: true });
      
    if (!error && data) {
      const mapped = data.map(d => ({
        id: d.id,
        rollNumber: d.roll_number,
        name: d.name,
        branch: d.branch,
        section: d.section,
        engineeringYear: d.engineering_year,
        semester: d.semester,
        emailId: d.email_id
      }));
      setStudents(mapped);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRoster();
  }, [selectedYear, selectedSection]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Class Roster</h1>
      
      <div className="flex gap-4 mb-8 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Engineering Year</label>
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-40 border border-slate-300 rounded-lg p-2 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Section</label>
          <select 
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="w-40 border border-slate-300 rounded-lg p-2 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {availableSections.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading roster...</div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No students found for this section.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-sm uppercase tracking-wider border-b border-slate-200">
                  <th className="p-4 font-medium">Rank / S.No</th>
                  <th className="p-4 font-medium">ID Number</th>
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Branch</th>
                  <th className="p-4 font-medium">Section</th>
                  <th className="p-4 font-medium">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student, index) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-slate-500">{index + 1}</td>
                    <td className="p-4 font-medium text-slate-800">{student.rollNumber.toUpperCase()}</td>
                    <td className="p-4 text-slate-700">{student.name}</td>
                    <td className="p-4 text-slate-600">{student.branch}</td>
                    <td className="p-4 text-slate-600">{student.section}</td>
                    <td className="p-4 text-slate-600 text-sm">{student.emailId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRosterView;
