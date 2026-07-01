import { supabase } from "./config";

export const MAX_FILE_SIZE_MB = 20;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const BUCKET = "lab-manuals";

/**
 * uploadLabManual — uploads a PDF to Supabase Storage.
 *
 * Preserves the same signature as the Firebase version:
 *   (subjectId, file, onProgress) → { fileUrl, fileName }
 *
 * Supabase's JS client doesn't expose real-time progress events for uploads,
 * so we emit synthetic 0→50→100 progress ticks so the UI progress bar still
 * works without any changes.
 */
export const uploadLabManual = (
  subjectId: string,
  file: File,
  onProgress: (progress: number) => void
): Promise<{ fileUrl: string; fileName: string }> => {
  return new Promise(async (resolve, reject) => {
    if (file.type !== "application/pdf") {
      reject(new Error("Only PDF files are allowed."));
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      reject(new Error(`File size must be under ${MAX_FILE_SIZE_MB}MB.`));
      return;
    }

    onProgress(0);

    const path = `${subjectId}/manual.pdf`;

    try {
      onProgress(30);

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
          upsert: true,
          contentType: "application/pdf",
        });

      if (error) {
        reject(error);
        return;
      }

      onProgress(80);

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

      // Append a cache-buster so browsers always fetch the latest version
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

      onProgress(100);
      resolve({ fileUrl: publicUrl, fileName: file.name });
    } catch (err) {
      reject(err);
    }
  });
};

export const getLabManualUrl = async (
  subjectId: string
): Promise<string | null> => {
  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(`${subjectId}/manual.pdf`);

  // The public URL is always generated even if the file doesn't exist.
  // Do a HEAD check to confirm the file is actually there.
  try {
    const res = await fetch(data.publicUrl, { method: "HEAD" });
    return res.ok ? data.publicUrl : null;
  } catch {
    return null;
  }
};
