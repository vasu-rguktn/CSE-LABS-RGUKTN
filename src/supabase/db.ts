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
  subjectId: string;
  fileUrl: string;
  fileName: string;
  uploadedBy: string;
  uploadedAt: SupabaseTimestamp | null;
  version: number;
}

// ─── Faculty Subjects ─────────────────────────────────────────────────────────

export const getFacultySubject = async (
  uid: string
): Promise<FacultySubject | null> => {
  const { data, error } = await supabase
    .from("faculty_subjects")
    .select("*")
    .eq("uid", uid)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    uid: data.uid,
    email: data.email,
    subjectId: data.subject_id,
    assignedAt: data.assigned_at ? new SupabaseTimestamp(data.assigned_at) : null,
  };
};

export const saveFacultySubject = async (
  uid: string,
  email: string,
  subjectId: string
): Promise<void> => {
  const { error } = await supabase
    .from("faculty_subjects")
    .insert({ uid, email, subject_id: subjectId });

  if (error) throw error;
};

// ─── Lab Manuals ──────────────────────────────────────────────────────────────

export const getLabManual = async (
  subjectId: string
): Promise<LabManual | null> => {
  const { data, error } = await supabase
    .from("lab_manuals")
    .select("*")
    .eq("subject_id", subjectId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    subjectId: data.subject_id,
    fileUrl: data.file_url,
    fileName: data.file_name,
    uploadedBy: data.uploaded_by,
    uploadedAt: data.uploaded_at ? new SupabaseTimestamp(data.uploaded_at) : null,
    version: data.version,
  };
};

export const saveLabManual = async (
  subjectId: string,
  fileUrl: string,
  fileName: string,
  uploadedBy: string,
  currentVersion: number
): Promise<void> => {
  const { error } = await supabase
    .from("lab_manuals")
    .upsert(
      {
        subject_id: subjectId,
        file_url: fileUrl,
        file_name: fileName,
        uploaded_by: uploadedBy,
        uploaded_at: new Date().toISOString(),
        version: currentVersion + 1,
      },
      { onConflict: "subject_id" }
    );

  if (error) throw error;
};
