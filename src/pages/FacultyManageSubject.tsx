import React, { useEffect, useState, useRef } from "react";
import { Navigate, useParams, Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { subjects } from "../data/subjects";
import { 
  getLabManuals, 
  saveLabManual, 
  deleteLabManual, 
  getSubmissionsForFaculty,
  getSectionsForFacultyEmail,
  getStudentsForSection
} from "../supabase/db";
import type { LabManual, FacultySubjectSection, StudentSubmission } from "../supabase/db";
import { uploadLabManual, deleteLabManualFile } from "../supabase/storage";
import { supabase } from "../supabase/config";
import PdfViewer from "../components/PdfViewer";
import toast from "react-hot-toast";
import JSZip from "jszip";
import * as XLSX from "xlsx";
import { Chart } from "chart.js/auto";
import {
  Upload,
  Download,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  X,
  BookOpen,
  AlertCircle,
  Info,
  Trash2,
  RefreshCw,
  Users,
  FolderArchive,
  BarChart2,
  Search,
  SlidersHorizontal,
  FileSpreadsheet,
  ArrowLeft,
  Clock,
  Settings
} from "lucide-react";

const FacultyManageSubject: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const subjectId = id!;
  const { user, facultySubjects } = useAuthStore();
  
  if (!facultySubjects.some(fs => fs.subjectId === subjectId)) {
    return <Navigate to="/faculty/dashboard" replace />;
  }
  const userEmail = user?.email ?? "unknown";

  const subject = subjects.find((s) => s.id === subjectId);
  const [manuals, setManuals] = useState<LabManual[]>([]);
  const [loadingManuals, setLoadingManuals] = useState(true);
  const [previewManualId, setPreviewManualId] = useState<string | null>(null);

  // Upload state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadType, setUploadType] = useState<"complete" | "weekly">("weekly");
  const [uploadWeek, setUploadWeek] = useState<number>(1);
  const [uploadTitle, setUploadTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Task settings state
  const [releaseDate, setReleaseDate] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [allowResubmission, setAllowResubmission] = useState<boolean>(true);
  const [allowedFileTypes, setAllowedFileTypes] = useState<string[]>([".pdf", ".doc", ".docx", ".ppt", ".pptx", ".zip"]);
  const [maxFileSizeMb, setMaxFileSizeMb] = useState<number>(20);

  // Navigation / Tabs state
  const [activeTab, setActiveTab] = useState<"manuals" | "submissions" | "analytics">("manuals");
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Sections, Students, Filters state
  const [mappedSections, setMappedSections] = useState<FacultySubjectSection[]>([]);
  const [sectionsList, setSectionsList] = useState<string[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>("A");
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  
  // Table Filters & Searching
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("rollNumber");
  const [previewSubId, setPreviewSubId] = useState<string | null>(null);

  // Analytics Canvas Refs
  const lineChartRef = useRef<HTMLCanvasElement | null>(null);
  const pieChartRef = useRef<HTMLCanvasElement | null>(null);
  const lineChartInstance = useRef<any>(null);
  const pieChartInstance = useRef<any>(null);

  const fetchManuals = async () => {
    setLoadingManuals(true);
    try {
      const data = await getLabManuals(subjectId);
      setManuals(data);
    } catch {
      toast.error("Could not load manuals.");
    } finally {
      setLoadingManuals(false);
    }
  };

  const fetchSubmissions = async () => {
    if (!subject) return;
    setLoadingSubmissions(true);
    try {
      const data = await getSubmissionsForFaculty(subject.code);
      setSubmissions(data);
    } catch {
      toast.error("Could not load student submissions.");
    } finally {
      setLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    fetchManuals();
    fetchSubmissions();
  }, [subjectId]);

  // Load section mapping & students
  useEffect(() => {
    const loadSectionsAndStudents = async () => {
      if (user?.email && subject) {
        try {
          const list = await getSectionsForFacultyEmail(user.email);
          const filtered = list.filter(s => s.subjectCode === subject.code);
          setMappedSections(filtered);
          
          let sections = filtered.map(s => s.section);
          if (sections.length === 0) {
            sections = ["A", "B", "C", "D"];
          }
          setSectionsList(sections);
          if (sections.length > 0 && !sections.includes(selectedSection)) {
            setSelectedSection(sections[0]);
          }
        } catch (e) {
          console.error("Failed to load sections", e);
        }
      }
    };
    loadSectionsAndStudents();
  }, [user, subject]);

  useEffect(() => {
    const loadStudents = async () => {
      if (!subject) return;
      setLoadingStudents(true);
      try {
        let year = "E3";
        let branch = "CSE";
        
        const currentMapping = mappedSections.find(m => m.section === selectedSection);
        if (currentMapping) {
          year = currentMapping.batchYear;
          branch = currentMapping.branch;
        } else {
          const { data } = await supabase
            .from("subjects_master")
            .select("engineering_year, branch")
            .eq("course_code", subject.code)
            .maybeSingle();
          if (data) {
            year = data.engineering_year;
            branch = data.branch;
          }
        }

        const list = await getStudentsForSection(year, branch, selectedSection);
        setStudents(list);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingStudents(false);
      }
    };
    loadStudents();
  }, [selectedSection, subject, mappedSections]);

  // Chart Rendering
  useEffect(() => {
    if (activeTab !== "analytics" || students.length === 0) return;

    if (lineChartInstance.current) lineChartInstance.current.destroy();
    if (pieChartInstance.current) pieChartInstance.current.destroy();

    const weeks = Array.from({ length: 12 }, (_, i) => i + 1);
    
    // Line Chart Trend
    const trendData = weeks.map(w => {
      const wSubs = submissions.filter(s => s.week_number === w && s.section === selectedSection);
      return students.length > 0 ? Math.round((wSubs.length / students.length) * 100) : 0;
    });

    if (lineChartRef.current) {
      lineChartInstance.current = new Chart(lineChartRef.current, {
        type: "line",
        data: {
          labels: weeks.map(w => `Week ${w}`),
          datasets: [{
            label: "Submission Rate (%)",
            data: trendData,
            borderColor: "rgb(79, 70, 229)",
            backgroundColor: "rgba(79, 70, 229, 0.1)",
            tension: 0.3,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { y: { min: 0, max: 100 } }
        }
      });
    }

    // Pie Chart Stats for selected week
    const weekSubs = submissions.filter(s => s.week_number === selectedWeek && s.section === selectedSection);
    const submittedCount = weekSubs.filter(s => !s.is_late).length;
    const lateCount = weekSubs.filter(s => s.is_late).length;
    const pendingCount = Math.max(0, students.length - (submittedCount + lateCount));

    if (pieChartRef.current) {
      pieChartInstance.current = new Chart(pieChartRef.current, {
        type: "pie",
        data: {
          labels: ["Submitted", "Late", "Pending"],
          datasets: [{
            data: [submittedCount, lateCount, pendingCount],
            backgroundColor: ["rgb(34, 197, 94)", "rgb(249, 115, 22)", "rgb(239, 68, 68)"]
          }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }

    return () => {
      if (lineChartInstance.current) lineChartInstance.current.destroy();
      if (pieChartInstance.current) pieChartInstance.current.destroy();
    };
  }, [activeTab, students, submissions, selectedWeek, selectedSection]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are accepted.");
      return;
    }
    if (file.size > maxFileSizeMb * 1024 * 1024) {
      toast.error(`File must be under ${maxFileSizeMb}MB.`);
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadProgress(20);
    const uploadToast = toast.loading("Uploading task...");
    try {
      const storagePath = uploadType === "complete"
        ? `${subjectId}/complete-manual.pdf`
        : `${subjectId}/week-${String(uploadWeek).padStart(2, '0')}.pdf`;

      setUploadProgress(50);
      const { fileUrl, fileName } = await uploadLabManual(storagePath, selectedFile, (p) => setUploadProgress(p));

      setUploadProgress(80);
      const existing = manuals.find(m => m.manualType === uploadType && (uploadType === "complete" || m.weekNumber === uploadWeek));
      
      await saveLabManual(
        subjectId, uploadType, uploadType === "weekly" ? uploadWeek : null, uploadTitle || null, storagePath, fileUrl, fileName, userEmail, existing?.version ?? 0,
        releaseDate ? new Date(releaseDate).toISOString() : null,
        dueDate ? new Date(dueDate).toISOString() : null,
        allowResubmission, allowedFileTypes, maxFileSizeMb
      );
      
      setUploadProgress(100);
      toast.success("Task Uploaded Successfully", { id: uploadToast });
      setSelectedFile(null);
      setUploadProgress(0);
      setUploadDialogOpen(false);
      setUploadTitle("");
      setReleaseDate(""); setDueDate(""); setAllowResubmission(true);
      setAllowedFileTypes([".pdf", ".doc", ".docx", ".ppt", ".pptx", ".zip"]);
      setMaxFileSizeMb(20);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await fetchManuals();
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed.", { id: uploadToast });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (manual: LabManual) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await deleteLabManualFile(manual.storagePath);
      await deleteLabManual(manual.id);
      toast.success("Deleted.");
      await fetchManuals();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const openReplaceDialog = (manual: LabManual) => {
    setUploadType(manual.manualType);
    if (manual.manualType === "weekly" && manual.weekNumber) setUploadWeek(manual.weekNumber);
    setUploadTitle(manual.title || "");
    setReleaseDate(manual.releaseDate?.toDate() ? new Date(manual.releaseDate.toDate().getTime() - new Date().getTimezoneOffset()*60000).toISOString().slice(0,16) : "");
    setDueDate(manual.dueDate?.toDate() ? new Date(manual.dueDate.toDate().getTime() - new Date().getTimezoneOffset()*60000).toISOString().slice(0,16) : "");
    setAllowResubmission(manual.allowResubmission ?? true);
    setAllowedFileTypes(manual.allowedFileTypes ?? [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".zip"]);
    setMaxFileSizeMb(manual.maxFileSizeMb ?? 20);
    setUploadDialogOpen(true);
  };

  const toggleFileType = (ext: string) => {
    setAllowedFileTypes(prev => prev.includes(ext) ? prev.filter(t => t !== ext) : [...prev, ext]);
  };

  const weekSubmissions = submissions.filter(s => s.week_number === selectedWeek && s.section === selectedSection);
  const studentsWithSubmissions = students.map(student => ({
    ...student,
    submission: weekSubmissions.find(s => s.roll_number?.toLowerCase() === student.rollNumber.toLowerCase()) || null
  }));

  const totalStudents = students.length;
  const submittedCount = studentsWithSubmissions.filter(s => s.submission !== null).length;
  const lateCount = studentsWithSubmissions.filter(s => s.submission !== null && s.submission.is_late).length;
  const pendingCount = Math.max(0, totalStudents - submittedCount);
  const submissionRate = totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0;

  const getProgressBarText = (submitted: number, total: number) => {
    if (total === 0) return "░░░░░░░░░░ 0% (0 / 0 Submitted)";
    const rate = Math.round((submitted / total) * 100);
    const filledBlocks = Math.round(rate / 10);
    const bar = "█".repeat(filledBlocks) + "░".repeat(10 - filledBlocks);
    return `${bar} ${rate}% (${submitted} / ${total} Submitted)`;
  };

  const filteredStudents = studentsWithSubmissions
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.rollNumber.toLowerCase().includes(searchQuery.toLowerCase());
      let matchesStatus = true;
      if (statusFilter === "submitted") matchesStatus = item.submission !== null;
      else if (statusFilter === "pending") matchesStatus = item.submission === null;
      else if (statusFilter === "late") matchesStatus = item.submission !== null && item.submission.is_late;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "rollNumber") return a.rollNumber.localeCompare(b.rollNumber);
      if (sortBy === "studentName") return a.name.localeCompare(b.name);
      if (sortBy === "submissionTime") {
        const timeA = a.submission ? new Date(a.submission.submitted_at).getTime() : 0;
        const timeB = b.submission ? new Date(b.submission.submitted_at).getTime() : 0;
        return timeB - timeA;
      }
      return 0;
    });

  const handleDownloadAllAsZip = async () => {
    const targetSubmissions = studentsWithSubmissions.filter(s => s.submission !== null);
    if (targetSubmissions.length === 0) return toast.error("No submissions.");
    const toastId = toast.loading("Downloading...");
    try {
      const zip = new JSZip();
      for (const item of targetSubmissions) {
        const sub = item.submission!;
        const res = await fetch(sub.file_url);
        zip.file(`${item.rollNumber.toUpperCase()}_${sub.file_name}`, await res.blob());
      }
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(zipBlob);
      const cleanSubjectName = subject?.name.replace(/[^a-zA-Z0-9]/g, "") || "Subject";
      link.download = `${cleanSubjectName}_Week${selectedWeek}_Section${selectedSection}.zip`;
      link.click();
      toast.success("Downloaded", { id: toastId });
    } catch (e: any) { toast.error("Error.", { id: toastId }); }
  };

  const handleExportExcel = () => {
    const data = filteredStudents.map(s => ({
      "Roll Number": s.rollNumber.toUpperCase(),
      "Student Name": s.name,
      "Status": s.submission ? (s.submission.is_late ? "Submitted (Late)" : "Submitted") : "Pending",
      "Submission Time": s.submission ? new Date(s.submission.submitted_at).toLocaleString() : "N/A",
      "File Name": s.submission ? s.submission.file_name : "N/A"
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `${subject?.shortName || "Subject"}_Week${selectedWeek}_Section${selectedSection}_Report.xlsx`);
  };

  const handleExportCSV = () => {
    const headers = ["Roll Number", "Student Name", "Status", "Submission Time", "File Name"];
    const rows = filteredStudents.map(s => {
      const status = s.submission ? (s.submission.is_late ? "Submitted (Late)" : "Submitted") : "Pending";
      const time = s.submission ? new Date(s.submission.submitted_at).toLocaleString() : "N/A";
      const fileName = s.submission ? s.submission.file_name : "N/A";
      return [s.rollNumber.toUpperCase(), s.name, status, time, fileName];
    });
    const csv = [headers, ...rows].map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${subject?.shortName || "Subject"}_Week${selectedWeek}_Section${selectedSection}_Report.csv`;
    link.click();
  };

  const isPreviewable = (fileName: string) => /\.(pdf|png|jpg|jpeg|gif)$/i.test(fileName);

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <Link to="/faculty/dashboard" className="text-sm text-slate-500 hover:text-blue-600 flex items-center gap-1 mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-100">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 leading-snug">{subject?.name}</h1>
                <p className="text-slate-500 font-mono text-sm uppercase mt-0.5">{subject?.code}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setUploadType("weekly");
                setUploadWeek(1);
                setUploadTitle("");
                setSelectedFile(null);
                setReleaseDate("");
                setDueDate("");
                setAllowResubmission(true);
                setAllowedFileTypes([".pdf", ".doc", ".docx", ".ppt", ".pptx", ".zip"]);
                setMaxFileSizeMb(20);
                setUploadDialogOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-1.5"
            >
              <Upload className="w-4 h-4" /> Upload Manual / Task
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-8">
        {/* Tabs */}
        <div className="flex space-x-1 bg-white p-1 rounded-xl mb-6 shadow-sm border border-slate-200 w-fit">
          {(["manuals", "submissions", "analytics"] as const).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5 ${
                activeTab === t ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {t === "manuals" && <BookOpen className="w-4 h-4" />}
              {t === "submissions" && <Users className="w-4 h-4" />}
              {t === "analytics" && <BarChart2 className="w-4 h-4" />}
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Tab 1: Manuals */}
        {activeTab === "manuals" && (
          <div className="space-y-6">
            {uploadDialogOpen && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="font-bold text-lg text-slate-800 flex items-center gap-1.5">
                    <Settings className="w-5 h-5 text-blue-600" />
                    Configure Task Settings
                  </h3>
                  <button onClick={() => setUploadDialogOpen(false)} className="p-1 hover:bg-slate-100 rounded-xl text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Manual Type</label>
                    <select 
                      value={uploadType} 
                      onChange={(e) => setUploadType(e.target.value as any)} 
                      className="w-full border p-2.5 rounded-xl bg-slate-50 outline-none"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="complete">Complete Manual</option>
                    </select>
                  </div>
                  {uploadType === "weekly" && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Week Number</label>
                      <select 
                        value={uploadWeek} 
                        onChange={(e) => setUploadWeek(Number(e.target.value))} 
                        className="w-full border p-2.5 rounded-xl bg-slate-50 outline-none"
                      >
                        {[...Array(12)].map((_, i) => (
                          <option key={i} value={i+1}>Week {i+1}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
                    <input 
                      type="text" 
                      value={uploadTitle} 
                      onChange={(e) => setUploadTitle(e.target.value)} 
                      placeholder="e.g., Programming Basics" 
                      className="w-full border p-2.5 rounded-xl bg-slate-50 outline-none"
                    />
                  </div>
                  
                  {uploadType === "weekly" && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Release Date</label>
                        <input 
                          type="datetime-local" 
                          value={releaseDate} 
                          onChange={(e) => setReleaseDate(e.target.value)} 
                          className="w-full border p-2.5 rounded-xl bg-slate-50 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Due Date</label>
                        <input 
                          type="datetime-local" 
                          value={dueDate} 
                          onChange={(e) => setDueDate(e.target.value)} 
                          className="w-full border p-2.5 rounded-xl bg-slate-50 outline-none"
                        />
                      </div>
                      <div className="sm:col-span-2 flex items-center gap-2 py-1">
                        <input 
                          type="checkbox" 
                          id="allowResub" 
                          checked={allowResubmission} 
                          onChange={(e) => setAllowResubmission(e.target.checked)} 
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <label htmlFor="allowResub" className="text-sm font-semibold text-slate-700">Allow resubmissions</label>
                      </div>
                      
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Allowed Formats</label>
                        <div className="flex flex-wrap gap-2">
                          {[".pdf", ".doc", ".docx", ".ppt", ".pptx", ".zip"].map(ext => (
                            <button
                              key={ext}
                              onClick={() => toggleFileType(ext)}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                                allowedFileTypes.includes(ext)
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "bg-slate-50 text-slate-600 border-slate-200"
                              }`}
                            >
                              {ext.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Max File Size (MB)</label>
                        <input 
                          type="number" 
                          value={maxFileSizeMb} 
                          onChange={(e) => setMaxFileSizeMb(Number(e.target.value))} 
                          className="w-full border p-2.5 rounded-xl bg-slate-50 outline-none"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                    selectedFile ? "border-blue-400 bg-blue-50/20" : "border-slate-200 hover:border-blue-400 hover:bg-blue-50/10"
                  }`}
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="application/pdf" />
                  {selectedFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="w-10 h-10 text-blue-600" />
                      <p className="font-bold text-slate-800 text-sm">{selectedFile.name}</p>
                      <p className="text-xs text-slate-400">{(selectedFile.size/1024/1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Upload className="w-10 h-10 text-slate-300" />
                      <p className="font-bold text-slate-600 text-sm">Upload Manual Document (PDF)</p>
                    </div>
                  )}
                </div>

                {uploading && (
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}

                <button 
                  onClick={handleUpload} 
                  disabled={!selectedFile || uploading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-3.5 rounded-2xl transition-all shadow-md shadow-blue-100 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                  {uploading ? "Uploading..." : "Save Settings & Upload"}
                </button>
              </div>
            )}

            {loadingManuals ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
            ) : manuals.length > 0 ? (
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800">Uploaded Manuals</h3>
                {manuals.map(m => {
                  const isPreviewing = previewManualId === m.id;
                  return (
                    <div key={m.id} className="bg-white p-5 rounded-2xl border flex flex-col gap-4 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h4 className="font-black text-slate-800 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-indigo-500" />
                            {m.manualType === "complete" ? "Complete Manual" : `Week ${m.weekNumber}`} {m.title ? `— ${m.title}` : ""}
                          </h4>
                          <p className="text-xs text-slate-400 mt-1 font-mono">{m.fileName} (v{m.version})</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setPreviewManualId(isPreviewing ? null : m.id)} className="text-slate-600 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl font-bold text-xs hover:bg-slate-100 flex items-center gap-1">
                            {isPreviewing ? <><EyeOff className="w-3.5 h-3.5" /> Hide</> : <><Eye className="w-3.5 h-3.5" /> Preview</>}
                          </button>
                          <button onClick={() => openReplaceDialog(m)} className="text-amber-700 bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-xl font-bold text-xs hover:bg-amber-100 flex items-center gap-1">
                            <RefreshCw className="w-3.5 h-3.5" /> Settings
                          </button>
                          <button onClick={() => handleDelete(m)} className="text-red-700 bg-red-50 border border-red-200 px-3.5 py-1.5 rounded-xl font-bold text-xs hover:bg-red-100 flex items-center gap-1">
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      </div>
                      {isPreviewing && <PdfViewer url={m.fileUrl} />}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-3xl border text-center text-slate-400 font-semibold flex flex-col items-center gap-2">
                <AlertCircle className="w-8 h-8 text-amber-500" />
                No manuals uploaded yet.
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Submissions */}
        {activeTab === "submissions" && (
          <div className="space-y-6">
            {/* Filter Box */}
            <div className="bg-white border rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                <span>Filters & Actions</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Week</label>
                  <select 
                    value={selectedWeek} 
                    onChange={(e) => setSelectedWeek(Number(e.target.value))}
                    className="w-full bg-slate-50 border rounded-xl px-3 py-2 outline-none font-semibold text-slate-700"
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i} value={i+1}>Week {i+1}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Section</label>
                  <select 
                    value={selectedSection} 
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="w-full bg-slate-50 border rounded-xl px-3 py-2 outline-none font-semibold text-slate-700"
                  >
                    {sectionsList.map(sec => (
                      <option key={sec} value={sec}>Section {sec}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Status</label>
                  <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-slate-50 border rounded-xl px-3 py-2 outline-none font-semibold text-slate-700"
                  >
                    <option value="all">All</option>
                    <option value="submitted">Submitted</option>
                    <option value="pending">Pending</option>
                    <option value="late">Late Submission</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Sort By</label>
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-slate-50 border rounded-xl px-3 py-2 outline-none font-semibold text-slate-700"
                  >
                    <option value="rollNumber">Roll Number</option>
                    <option value="studentName">Student Name</option>
                    <option value="submissionTime">Submission Time</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input 
                    type="text" 
                    placeholder="Search name or roll number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border rounded-xl pl-9 pr-4 py-2 text-sm outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button onClick={handleDownloadAllAsZip} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm">
                    <FolderArchive className="w-4 h-4" /> ZIP Class
                  </button>
                  <button onClick={handleExportExcel} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm">
                    <FileSpreadsheet className="w-4 h-4" /> Excel
                  </button>
                  <button onClick={handleExportCSV} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-slate-600 hover:bg-slate-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm">
                    <FileText className="w-4 h-4" /> CSV
                  </button>
                </div>
              </div>
            </div>

            {/* Dashboard counters */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div className="bg-white border rounded-2xl p-4 text-center">
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Enrolled</p>
                  <p className="text-2xl font-black text-slate-800 mt-1">{totalStudents}</p>
                </div>
                <div className="bg-white border rounded-2xl p-4 text-center">
                  <p className="text-emerald-600 text-xs font-semibold uppercase tracking-wider">Submitted</p>
                  <p className="text-2xl font-black text-emerald-700 mt-1">{submittedCount}</p>
                </div>
                <div className="bg-white border rounded-2xl p-4 text-center">
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Pending</p>
                  <p className="text-2xl font-black text-slate-600 mt-1">{pendingCount}</p>
                </div>
                <div className="bg-white border rounded-2xl p-4 text-center">
                  <p className="text-amber-600 text-xs font-semibold uppercase tracking-wider">Late</p>
                  <p className="text-2xl font-black text-amber-700 mt-1">{lateCount}</p>
                </div>
                <div className="bg-white border rounded-2xl p-4 text-center col-span-2 sm:col-span-1">
                  <p className="text-blue-600 text-xs font-semibold uppercase tracking-wider">Sub Rate</p>
                  <p className="text-2xl font-black text-blue-700 mt-1">{submissionRate}%</p>
                </div>
              </div>
              
              <div className="font-mono text-center text-sm font-bold bg-indigo-50 border border-indigo-100 p-3 rounded-2xl text-indigo-700 tracking-wider">
                {getProgressBarText(submittedCount, totalStudents)}
              </div>
            </div>

            {/* Submissions table */}
            {loadingSubmissions || loadingStudents ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
            ) : filteredStudents.length === 0 ? (
              <div className="bg-white p-12 text-center border rounded-3xl font-semibold text-slate-400">No submissions match the search.</div>
            ) : (
              <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b text-slate-500 text-xs font-bold uppercase tracking-wider">
                      <th className="p-4 pl-6">Roll Number</th>
                      <th className="p-4">Student Name</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Submitted At</th>
                      <th className="p-4 pr-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredStudents.map(item => {
                      const sub = item.submission;
                      const isPreviewing = previewSubId === sub?.id;
                      
                      let badge = "Pending";
                      let badgeStyle = "bg-slate-100 text-slate-600 border border-slate-200";
                      if (sub) {
                        badge = sub.is_late ? "Submitted (Late)" : "Submitted";
                        badgeStyle = sub.is_late ? "bg-amber-100 text-amber-800 border-amber-200" : "bg-emerald-100 text-emerald-800 border-emerald-200";
                      }
                      
                      return (
                        <React.Fragment key={item.rollNumber}>
                          <tr className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 pl-6 font-mono font-bold text-slate-700 uppercase">{item.rollNumber}</td>
                            <td className="p-4 font-semibold text-slate-800">{item.name}</td>
                            <td className="p-4">
                              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyle}`}>{badge}</span>
                            </td>
                            <td className="p-4 text-xs text-slate-500">{sub ? new Date(sub.submitted_at).toLocaleString() : "—"}</td>
                            <td className="p-4 pr-6 text-right space-x-2">
                              {sub && (
                                <>
                                  {isPreviewable(sub.file_name) && (
                                    <button 
                                      onClick={() => setPreviewSubId(isPreviewing ? null : sub.id)}
                                      className="inline-flex items-center gap-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100 shadow-sm flex-inline items-center gap-1"
                                    >
                                      {isPreviewing ? <><EyeOff className="w-3.5 h-3.5" /> Hide</> : <><Eye className="w-3.5 h-3.5" /> View</>}
                                    </button>
                                  )}
                                  <a href={sub.file_url} target="_blank" rel="noreferrer" download className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50 shadow-sm">
                                    <Download className="w-3.5 h-3.5" /> Download
                                  </a>
                                </>
                              )}
                            </td>
                          </tr>
                          {isPreviewing && sub && (
                            <tr>
                              <td colSpan={5} className="p-6 bg-slate-50/40">
                                <div className="max-w-3xl mx-auto">
                                  {sub.file_name.toLowerCase().endsWith(".pdf") ? (
                                    <PdfViewer url={sub.file_url} />
                                  ) : (
                                    <img src={sub.file_url} alt="submission preview" className="max-h-[500px] object-contain mx-auto rounded-2xl border" />
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Analytics */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="bg-white border rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-4">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-1.5">
                    <BarChart2 className="w-5 h-5 text-indigo-600" />
                    Performance Analytics
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Section {selectedSection} · Submission Statistics</p>
                </div>
                <div className="flex items-center gap-3">
                  <select 
                    value={selectedSection} 
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="bg-slate-50 border rounded-xl px-3 py-1.5 outline-none text-xs font-semibold text-slate-700"
                  >
                    {sectionsList.map(sec => (
                      <option key={sec} value={sec}>Section {sec}</option>
                    ))}
                  </select>
                  <select 
                    value={selectedWeek} 
                    onChange={(e) => setSelectedWeek(Number(e.target.value))}
                    className="bg-slate-50 border rounded-xl px-3 py-1.5 outline-none text-xs font-semibold text-slate-700"
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i} value={i+1}>Week {i+1}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col items-center">
                  <h4 className="font-bold text-slate-600 text-xs uppercase tracking-wider mb-4 flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400" /> Weekly Submission Trend</h4>
                  <div className="w-full h-64"><canvas ref={lineChartRef} /></div>
                </div>
                <div className="flex flex-col items-center">
                  <h4 className="font-bold text-slate-600 text-xs uppercase tracking-wider mb-4 flex items-center gap-1"><Info className="w-3.5 h-3.5 text-slate-400" /> Week {selectedWeek} Distribution</h4>
                  <div className="w-full h-64"><canvas ref={pieChartRef} /></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyManageSubject;
