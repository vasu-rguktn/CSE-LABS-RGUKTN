import React, { useState } from "react";
import { useAuthStore } from "../store/authStore";
import { Navigate } from "react-router-dom";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import { upsertSubjectsMaster, upsertStudentsMaster, upsertFacultySubjectSections } from "../supabase/db";
import type { SubjectMaster, StudentMaster, FacultySubjectSection } from "../supabase/db";
import { Upload, FileSpreadsheet, AlertTriangle, Database, Users } from "lucide-react";

const FacultyAdminImport: React.FC = () => {
  const { user } = useAuthStore();
  const [importingBoS, setImportingBoS] = useState(false);
  const [importingStudents, setImportingStudents] = useState(false);
  const [globalSemester, setGlobalSemester] = useState("Sem-1");
  
  // Faculty Mapping States
  const [importingFacultyMapping, setImportingFacultyMapping] = useState(false);

  // If not a faculty (email restriction is already on protected route), we might want to restrict this to admins later
  if (!user) {
    return <Navigate to="/faculty/login" replace />;
  }

  // --- BoS Curriculum Import ---
  const handleBoSFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportingBoS(true);
    const toastId = toast.loading("Processing BoS file...");

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

      const subjects: SubjectMaster[] = [];

      for (const row of jsonData) {
        if (!row["Course Code"] || !row["Subject Name"] || !row["Engineering Year"] || !row["Semester"] || !row["Branch"]) {
          continue; // Skip invalid rows
        }

        const ltp = row["L-T-P"]?.toString() || "0-0-0";
        const parts = ltp.split('-');
        let isLab = false;
        
        // P component > 0 or "Lab" in name
        if (parts.length === 3 && parseInt(parts[2], 10) > 0) {
          isLab = true;
        } else if (row["Subject Name"].toLowerCase().includes("lab")) {
          isLab = true;
        }

        const normalizeSemester = (sem: string) => {
          let s = sem.replace(/\s+/g, '').toLowerCase();
          if (s === '1' || s === 's1' || s === 'sem1' || s === 'sem-1' || s === 'semester1') return 'Sem-1';
          if (s === '2' || s === 's2' || s === 'sem2' || s === 'sem-2' || s === 'semester2') return 'Sem-2';
          return sem;
        };

        const normalizeYear = (year: string) => {
           let y = year.replace(/\s+/g, '').toUpperCase();
           if (y === 'E1' || y === 'E-1' || y === '1') return 'E1';
           if (y === 'E2' || y === 'E-2' || y === '2') return 'E2';
           if (y === 'E3' || y === 'E-3' || y === '3') return 'E3';
           if (y === 'E4' || y === 'E-4' || y === '4') return 'E4';
           if (y === 'P1' || y === 'PUC1' || y === 'P-1') return 'P1';
           if (y === 'P2' || y === 'PUC2' || y === 'P-2') return 'P2';
           return year.toUpperCase();
        };

        subjects.push({
          courseCode: row["Course Code"].toString().trim(),
          subjectName: row["Subject Name"].toString().trim(),
          engineeringYear: normalizeYear(row["Engineering Year"].toString().trim()),
          semester: normalizeSemester(row["Semester"].toString().trim()),
          branch: row["Branch"].toString().trim().toUpperCase(),
          credits: parseInt(row["Credits"]) || 0,
          isLab
        });
      }

      if (subjects.length === 0) {
        throw new Error("No valid subjects found. Check column headers.");
      }

      await upsertSubjectsMaster(subjects);
      toast.success(`Successfully imported ${subjects.length} subjects!`, { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Failed to import BoS file.", { id: toastId });
    } finally {
      setImportingBoS(false);
      if (e.target) e.target.value = "";
    }
  };

  // --- Student Master Import ---
  const handleStudentFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportingStudents(true);
    const toastId = toast.loading("Processing Student Master file...");

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

      const students: StudentMaster[] = [];
      let missingEmailCount = 0;

      for (const row of jsonData) {
        if (!row["ID Number"] || !row["Name"] || !row["Branch"] || !row["SECTION"]) {
          continue; 
        }

        let emailId = row["email"]?.trim();
        if (!emailId) {
          // Fallback guess: n220034@rguktn.ac.in
          emailId = `${row["ID Number"].toLowerCase()}@rguktn.ac.in`;
          missingEmailCount++;
        }

        const rawSection = row["SECTION"]?.toString().trim() || "";
        
        // Parse E1CSE1 -> E1, CSE, 1
        let engYear = "Unknown";
        let parsedBranch = row["Branch"] || "Unknown";
        let parsedSection = rawSection;
        
        const secMatch = rawSection.match(/^(E[1-4])([A-Z&]+)(\d+)$/i);
        if (secMatch) {
          engYear = secMatch[1].toUpperCase();
          parsedBranch = secMatch[2].toUpperCase();
          parsedSection = secMatch[0].toUpperCase(); // Keep full section string like E1CSE1
        }

        students.push({
          rollNumber: row["ID Number"].toString().trim(),
          name: row["Name"].toString().trim(),
          branch: parsedBranch,
          section: parsedSection,
          engineeringYear: engYear,
          semester: globalSemester,
          emailId
        });
      }

      if (students.length === 0) {
        throw new Error("No valid students found. Check column headers.");
      }

      await upsertStudentsMaster(students);
      toast.success(`Imported ${students.length} students. ${missingEmailCount > 0 ? `(Guessed ${missingEmailCount} emails)` : ''}`, { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Failed to import Student Master file.", { id: toastId });
    } finally {
      setImportingStudents(false);
      if (e.target) e.target.value = "";
    }
  };

  // --- Faculty-Subject-Section Mapping Import ---
  const handleFacultyMappingFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportingFacultyMapping(true);
    const toastId = toast.loading(`Processing Faculty Mapping...`);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

      const mappings: FacultySubjectSection[] = [];

      for (const row of jsonData) {
        const courseCode = row["Course Code"]?.toString().trim();
        const sectionsRaw = row["Sections"]?.toString().trim();
        const facultyRaw = row["Faculty Name(s)"]?.toString().trim() || "";
        const facultyEmail = row["faculty email"]?.toString().trim() || null;

        if (!courseCode || !sectionsRaw) {
          continue; // Skip invalid
        }

        // Parse sections: split by comma
        const sections = sectionsRaw.split(',').map((s: string) => s.trim()).filter(Boolean);

        // Parse faculty names & notes
        let notes = null;
        let facultyName = null;
        let coFacultyName = null;
        
        let cleanedFaculty = facultyRaw;
        
        // Extract parenthetical notes (e.g. "Name (Note)")
        const noteMatch = facultyRaw.match(/\((.*?)\)/);
        if (noteMatch) {
          notes = noteMatch[1].trim();
          cleanedFaculty = facultyRaw.replace(/\(.*?\)/g, '').trim();
        }

        if (cleanedFaculty) {
          const facultyParts = cleanedFaculty.split('&').map((f: string) => f.trim());
          facultyName = facultyParts[0] || null;
          if (facultyParts.length > 1) {
            coFacultyName = facultyParts[1] || null;
          }
        }

        // For each section, add a mapping row
        for (const sec of sections) {
          // Parse E1CSE1 -> E1, CSE, 1
          let batchYear = "Unknown";
          let branch = "Unknown";
          let parsedSection = sec;
          
          const secMatch = sec.match(/^(E[1-4])([A-Z&]+)(\d+)$/i);
          if (secMatch) {
            batchYear = secMatch[1].toUpperCase();
            branch = secMatch[2].toUpperCase();
            parsedSection = secMatch[0].toUpperCase();
          }
          
          mappings.push({
            subjectCode: courseCode,
            batchYear,
            branch,
            section: parsedSection,
            facultyName,
            facultyEmail: facultyEmail, 
            coFacultyName,
            notes
          });
        }
      }

      if (mappings.length === 0) {
        throw new Error("No valid mapping rows found. Check column headers.");
      }

      await upsertFacultySubjectSections(mappings);
      toast.success(`Successfully imported mappings for ${mappings.length} sections!`, { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Failed to import Faculty Mapping file.", { id: toastId });
    } finally {
      setImportingFacultyMapping(false);
      if (e.target) e.target.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/20 pb-16 pt-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        
        <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-md">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 leading-snug">
              Data Import & Admin
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Upload master Excel files to populate the database. Ensure columns match the required templates exactly.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* BoS Import Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-800">BoS Curriculum</h2>
            </div>
            <p className="text-sm text-slate-600 mb-6 flex-1">
              Upload the BoS curriculum Excel to populate the <strong>Subjects Master</strong>.
              <br/><br/>
              Required columns: <code>Course Code, Subject Name, Engineering Year, Semester, Branch, Credits, L-T-P</code>.
            </p>
            
            <div className="relative">
              <input 
                type="file" 
                accept=".xlsx, .xls, .csv" 
                onChange={handleBoSFile}
                disabled={importingBoS}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <div className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
                importingBoS ? "bg-slate-100 text-slate-400" : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
              }`}>
                <Upload className="w-4 h-4" />
                {importingBoS ? "Processing..." : "Upload BoS Excel"}
              </div>
            </div>
          </div>

          {/* Student Master Import Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-800">Student Master</h2>
            </div>
            <p className="text-sm text-slate-600 mb-4 flex-1">
              Upload the Student Master Excel to enroll students.
              <br/><br/>
              Required columns: <code>ID Number, Name, Branch, SECTION, class room, email</code>.
            </p>
            
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-500 mb-1">Global Semester (applied to all imported students)</label>
              <select 
                value={globalSemester}
                onChange={(e) => setGlobalSemester(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Sem-1">Sem-1</option>
                <option value="Sem-2">Sem-2</option>
              </select>
            </div>

            <div className="relative">
              <input 
                type="file" 
                accept=".xlsx, .xls, .csv" 
                onChange={handleStudentFile}
                disabled={importingStudents}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <div className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
                importingStudents ? "bg-slate-100 text-slate-400" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
              }`}>
                <Upload className="w-4 h-4" />
                {importingStudents ? "Processing..." : "Upload Student Master Excel"}
              </div>
            </div>
          </div>

          {/* Faculty-Subject-Section Mapping Import Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-fuchsia-600" />
              <h2 className="text-lg font-bold text-slate-800">Faculty Assignments</h2>
            </div>
            <p className="text-sm text-slate-600 mb-4 flex-1">
              Upload the Faculty-Subject-Section mapping Excel.
              <br/><br/>
              Required columns: <code>Course Code, Subject, Sections, Faculty Name(s), faculty email</code>.
            </p>
            
            <div className="relative">
              <input 
                type="file" 
                accept=".xlsx, .xls, .csv" 
                onChange={handleFacultyMappingFile}
                disabled={importingFacultyMapping}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <div className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
                importingFacultyMapping ? "bg-slate-100 text-slate-400" : "bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100 border border-fuchsia-200"
              }`}>
                <Upload className="w-4 h-4" />
                {importingFacultyMapping ? "Processing..." : "Upload Mapping Excel"}
              </div>
            </div>
          </div>

        </div>
        
        {/* Important Notes */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold mb-1">Important Implementation Notes:</p>
            <ul className="list-disc pl-4 space-y-1 text-amber-700">
              <li>Re-uploading the same file will <strong>update existing records</strong> rather than creating duplicates.</li>
              <li>Students are automatically enrolled into subjects by matching their Year, Semester, and Branch with the BoS curriculum.</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};

export default FacultyAdminImport;
