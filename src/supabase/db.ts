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
