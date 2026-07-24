import { supabase } from "./config";

// ─── Timestamp compatibility wrapper ──────────────────────────────────────────
// Supabase returns ISO strings for timestamps. Pages call `.toDate()` on the
// Firebase Timestamp type. This thin wrapper bridges that gap so zero page code
// changes are needed.

class SupabaseTimestamp {
  private iso: string;
  constructor(iso: string) {
    this.iso = iso;
  }
  toDate(): Date {
    return new Date(this.iso);
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FacultySubject {
  uid: string;
  email: string;
  subjectId: string;
  assignedAt: SupabaseTimestamp | null;
}

export interface LabManual {
  id: string;
  subjectId: string;
  manualType: "complete" | "weekly";
  weekNumber: number | null;
  title: string | null;
  storagePath: string;
  fileUrl: string;
  fileName: string;
  uploadedBy: string;
  uploadedAt: SupabaseTimestamp | null;
  updatedAt: SupabaseTimestamp | null;
  version: number;
}

// ─── Faculty Subjects ─────────────────────────────────────────────────────────

export const getFacultySubjects = async (
  uid: string
): Promise<FacultySubject[]> => {
  const { data, error } = await supabase
    .from("faculty_subjects")
    .select("*")
    .eq("uid", uid);

  if (error) throw error;
  if (!data) return [];

  return data.map((row) => ({
    uid: row.uid,
    email: row.email,
    subjectId: row.subject_id,
    assignedAt: row.assigned_at ? new SupabaseTimestamp(row.assigned_at) : null,
  }));
};

import { subjects } from "../data/subjects";

export const saveFacultySubject = async (
  uid: string,
  email: string,
  subjectId: string
): Promise<void> => {
  const isValid = subjects.some(s => s.id === subjectId);
  if (!isValid) throw new Error(`Invalid subject ID: ${subjectId}`);

  const { error } = await supabase
    .from("faculty_subjects")
    .insert({ uid, email, subject_id: subjectId });

  if (error) throw error;
};

// ─── Lab Manuals ──────────────────────────────────────────────────────────────

export const getLabManuals = async (
  subjectId: string
): Promise<LabManual[]> => {
  const { data, error } = await supabase
    .from("lab_manuals")
    .select("*")
    .eq("subject_id", subjectId);

  if (error) throw error;
  if (!data) return [];

  // Sort: complete first, then weekly by weekNumber
  const mapped = data.map((data) => ({
    id: data.id,
    subjectId: data.subject_id,
    manualType: data.manual_type,
    weekNumber: data.week_number,
    title: data.title,
    storagePath: data.storage_path,
    fileUrl: data.file_url,
    fileName: data.file_name,
    uploadedBy: data.uploaded_by,
    uploadedAt: data.uploaded_at ? new SupabaseTimestamp(data.uploaded_at) : null,
    updatedAt: data.updated_at ? new SupabaseTimestamp(data.updated_at) : null,
    version: data.version,
  }));

  return mapped.sort((a, b) => {
    if (a.manualType === "complete" && b.manualType !== "complete") return -1;
    if (a.manualType !== "complete" && b.manualType === "complete") return 1;
    return (a.weekNumber || 0) - (b.weekNumber || 0);
  });
};

export const saveLabManual = async (
  subjectId: string,
  manualType: "complete" | "weekly",
  weekNumber: number | null,
  title: string | null,
  storagePath: string,
  fileUrl: string,
  fileName: string,
  uploadedBy: string,
  currentVersion: number
): Promise<void> => {
  const isValid = subjects.some(s => s.id === subjectId);
  if (!isValid) throw new Error(`Invalid subject ID: ${subjectId}`);

  const { error } = await supabase
    .from("lab_manuals")
    .upsert(
      {
        subject_id: subjectId,
        manual_type: manualType,
        week_number: weekNumber,
        title,
        storage_path: storagePath,
        file_url: fileUrl,
        file_name: fileName,
        uploaded_by: uploadedBy,
        updated_at: new Date().toISOString(),
        version: currentVersion + 1,
      },
      { onConflict: "subject_id, manual_type, week_number" }
    );

  if (error) throw error;
};

export const deleteLabManual = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from("lab_manuals")
    .delete()
    .eq("id", id);
    
  if (error) throw error;
};

export interface SubjectMaster {
  id?: string;
  courseCode: string;
  subjectName: string;
  engineeringYear: string;
  semester: string;
  branch: string;
  credits: number;
  isLab: boolean;
}

export interface StudentMaster {
  id?: string;
  rollNumber: string;
  name: string;
  branch: string;
  section: string;
  engineeringYear: string;
  semester: string;
  emailId: string;
}

export const upsertSubjectsMaster = async (subjects: SubjectMaster[]) => {
  // Deduplicate by courseCode (keep the last occurrence)
  const dedupedSubjects = Object.values(
    subjects.reduce((acc, curr) => {
      acc[curr.courseCode] = curr;
      return acc;
    }, {} as Record<string, SubjectMaster>)
  );

  const payload = dedupedSubjects.map(s => ({
    course_code: s.courseCode,
    subject_name: s.subjectName,
    engineering_year: s.engineeringYear,
    semester: s.semester,
    branch: s.branch,
    credits: s.credits,
    is_lab: s.isLab
  }));
  
  const { error } = await supabase
    .from('subjects_master')
    .upsert(payload, { onConflict: 'course_code' });
    
  if (error) throw error;
};

export const upsertStudentsMaster = async (students: StudentMaster[]) => {
  // Deduplicate by rollNumber (keep the last occurrence)
  const dedupedStudents = Object.values(
    students.reduce((acc, curr) => {
      acc[curr.rollNumber.toLowerCase()] = curr;
      return acc;
    }, {} as Record<string, StudentMaster>)
  );

  const payload = dedupedStudents.map(s => ({
    roll_number: s.rollNumber.toLowerCase(),
    name: s.name,
    branch: s.branch,
    section: s.section,
    engineering_year: s.engineeringYear,
    semester: s.semester,
    email_id: s.emailId.toLowerCase()
  }));

  const { error } = await supabase
    .from('students_master')
    .upsert(payload, { onConflict: 'roll_number' });
    
  if (error) throw error;
};

export const getStudentMasterByEmail = async (email: string): Promise<StudentMaster | null> => {
  const { data, error } = await supabase
    .from('students_master')
    .select('*')
    .eq('email_id', email.trim().toLowerCase())
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    rollNumber: data.roll_number,
    name: data.name,
    branch: data.branch,
    section: data.section,
    engineeringYear: data.engineering_year,
    semester: data.semester,
    emailId: data.email_id
  };
};

export const getStudentSubjects = async (engineeringYear: string, semester: string, branch: string): Promise<SubjectMaster[]> => {
  const { data, error } = await supabase
    .from('subjects_master')
    .select('*')
    .ilike('branch', branch);

  if (error) throw error;

  const normalizeSemester = (sem: string) => {
    let s = (sem || '').replace(/\s+/g, '').toLowerCase();
    if (s === '1' || s === 's1' || s === 'sem1' || s === 'sem-1' || s === 'semester1') return 'Sem-1';
    if (s === '2' || s === 's2' || s === 'sem2' || s === 'sem-2' || s === 'semester2') return 'Sem-2';
    return sem;
  };

  const normalizeYear = (year: string) => {
     let y = (year || '').replace(/\s+/g, '').toUpperCase();
     if (y === 'E1' || y === 'E-1' || y === '1') return 'E1';
     if (y === 'E2' || y === 'E-2' || y === '2') return 'E2';
     if (y === 'E3' || y === 'E-3' || y === '3') return 'E3';
     if (y === 'E4' || y === 'E-4' || y === '4') return 'E4';
     if (y === 'P1' || y === 'PUC1' || y === 'P-1') return 'P1';
     if (y === 'P2' || y === 'PUC2' || y === 'P-2') return 'P2';
     return (year || '').toUpperCase();
  };

  const targetYear = normalizeYear(engineeringYear);
  const targetSem = normalizeSemester(semester);

  const filtered = (data || []).filter(s => 
    normalizeYear(s.engineering_year) === targetYear && 
    normalizeSemester(s.semester) === targetSem
  );

  return filtered.map(s => ({
    id: s.id,
    courseCode: s.course_code,
    subjectName: s.subject_name,
    engineeringYear: s.engineering_year,
    semester: s.semester,
    branch: s.branch,
    credits: s.credits,
    isLab: s.is_lab
  }));
};

export interface StudentSubmission {
  id: string;
  student_id: string;
  subject_code: string;
  week_number: number;
  storage_path: string;
  file_url: string;
  file_name: string;
  file_size_bytes: number;
  status: string;
  submitted_at: string;
}

export interface SubjectWeekDeadline {
  subject_code: string;
  week_number: number;
  deadline_at: string;
}

export const getStudentSubmissions = async (studentId: string, subjectCode: string): Promise<StudentSubmission[]> => {
  const { data, error } = await supabase
    .from('student_submissions')
    .select('*')
    .eq('student_id', studentId)
    .eq('subject_code', subjectCode);

  if (error) throw error;
  return data || [];
};

export const getSubjectDeadlines = async (subjectCode: string): Promise<SubjectWeekDeadline[]> => {
  const { data, error } = await supabase
    .from('subject_week_deadlines')
    .select('*')
    .eq('subject_code', subjectCode);

  if (error) throw error;
  return data || [];
};

export const upsertStudentSubmission = async (submission: Omit<StudentSubmission, 'id' | 'submitted_at' | 'status'>) => {
  const { error } = await supabase
    .from('student_submissions')
    .upsert({
      ...submission,
      status: 'submitted',
      submitted_at: new Date().toISOString()
    }, { onConflict: 'student_id,subject_code,week_number' });

  if (error) throw error;
};

export const getSubmissionsForFaculty = async (subjectCode: string) => {
  const { data, error } = await supabase
    .from('student_submissions')
    .select(`
      *,
      students_master (
        roll_number,
        name,
        section
      )
    `)
    .eq('subject_code', subjectCode);

  if (error) throw error;
  return data || [];
};

// ─── Phase 2b.5: Faculty-Subject-Section Mapping ──────────────────────────────

export interface FacultySubjectSection {
  id?: string;
  subjectCode: string;
  batchYear: string;
  branch: string;
  section: string;
  facultyName: string | null;
  facultyEmail: string | null;
  coFacultyName: string | null;
  notes: string | null;
}

export const upsertFacultySubjectSections = async (mappings: FacultySubjectSection[]) => {
  // Deduplicate by the unique constraint
  const dedupedMappings = Object.values(
    mappings.reduce((acc, curr) => {
      const key = `${curr.subjectCode}_${curr.batchYear}_${curr.branch}_${curr.section}`;
      acc[key] = curr;
      return acc;
    }, {} as Record<string, FacultySubjectSection>)
  );

  const payload = dedupedMappings.map(m => ({
    subject_code: m.subjectCode,
    batch_year: m.batchYear,
    branch: m.branch,
    section: m.section,
    faculty_name: m.facultyName,
    faculty_email: m.facultyEmail,
    co_faculty_name: m.coFacultyName,
    notes: m.notes
  }));

  const subjectCodes = Array.from(new Set(payload.map(p => p.subject_code)));

  if (subjectCodes.length > 0) {
    // Clear existing mappings for these subjects to avoid duplicates
    await supabase
      .from('faculty_subject_section')
      .delete()
      .in('subject_code', subjectCodes);
  }

  const { error } = await supabase
    .from('faculty_subject_section')
    .insert(payload);
    
  if (error) throw error;
};

export const getFacultyForSubjectSection = async (
  subjectCode: string,
  batchYear: string,
  branch: string,
  section: string
): Promise<FacultySubjectSection | null> => {
  const { data, error } = await supabase
    .from('faculty_subject_section')
    .select('*')
    .eq('subject_code', subjectCode)
    .eq('batch_year', batchYear)
    .eq('branch', branch)
    .eq('section', section)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    subjectCode: data.subject_code,
    batchYear: data.batch_year,
    branch: data.branch,
    section: data.section,
    facultyName: data.faculty_name,
    facultyEmail: data.faculty_email,
    coFacultyName: data.co_faculty_name,
    notes: data.notes
  };
};

export const getSectionsForFacultyEmail = async (email: string): Promise<FacultySubjectSection[]> => {
  const { data, error } = await supabase
    .from('faculty_subject_section')
    .select('*')
    .eq('faculty_email', email.toLowerCase());

  if (error) throw error;
  
  return (data || []).map(row => ({
    id: row.id,
    subjectCode: row.subject_code,
    batchYear: row.batch_year,
    branch: row.branch,
    section: row.section,
    facultyName: row.faculty_name,
    facultyEmail: row.faculty_email,
    coFacultyName: row.co_faculty_name,
    notes: row.notes
  }));
};



// --- Phase 3: Admin & Compliance ----------------------------------------------

export const isAdminUser = async (email: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('admin_users')
    .select('email')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (error) return false;
  return !!data;
};

export const getSectionEnrollmentCount = async (batchYear: string, branch: string, section: string): Promise<number> => {
  const { count, error } = await supabase
    .from('students_master')
    .select('*', { count: 'exact', head: true })
    .eq('engineering_year', batchYear)
    .eq('branch', branch)
    .eq('section', section);
    
  if (error) return 0;
  return count || 0;
};

