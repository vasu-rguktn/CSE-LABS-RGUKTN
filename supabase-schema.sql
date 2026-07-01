-- ============================================================================
-- RGUKT-N Lab Manual Portal — Supabase Schema Setup
-- Run this SQL in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================================

-- ─── Faculty Subject Assignments (one-time, locked) ─────────────────────────

CREATE TABLE IF NOT EXISTS faculty_subjects (
  uid UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE faculty_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "faculty can read own assignment"
  ON faculty_subjects FOR SELECT
  USING (auth.uid() = uid);

CREATE POLICY "faculty can insert own assignment once"
  ON faculty_subjects FOR INSERT
  WITH CHECK (
    auth.uid() = uid
    AND auth.jwt() ->> 'email' LIKE '%@rguktn.ac.in'
    AND NOT EXISTS (SELECT 1 FROM faculty_subjects WHERE uid = auth.uid())
  );

-- No UPDATE/DELETE policies → selection is permanent

-- ─── Lab Manuals Metadata ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lab_manuals (
  subject_id TEXT PRIMARY KEY,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  version INT DEFAULT 1
);

ALTER TABLE lab_manuals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can read lab manuals"
  ON lab_manuals FOR SELECT
  USING (true);

CREATE POLICY "only assigned faculty can insert their subject manual"
  ON lab_manuals FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'email' LIKE '%@rguktn.ac.in'
    AND EXISTS (
      SELECT 1 FROM faculty_subjects
      WHERE uid = auth.uid() AND subject_id = lab_manuals.subject_id
    )
  );

CREATE POLICY "only assigned faculty can update their subject manual"
  ON lab_manuals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM faculty_subjects
      WHERE uid = auth.uid() AND subject_id = lab_manuals.subject_id
    )
  );

-- ─── Storage Bucket Policies ────────────────────────────────────────────────
-- NOTE: Create a PUBLIC bucket named 'lab-manuals' in Supabase Dashboard first,
-- then add these policies via Storage → Policies.
--
-- Policy 1: Public read
--   CREATE POLICY "public read lab manuals"
--     ON storage.objects FOR SELECT
--     USING (bucket_id = 'lab-manuals');
--
-- Policy 2: Faculty upload to own subject folder
--   CREATE POLICY "faculty upload own subject folder"
--     ON storage.objects FOR INSERT
--     WITH CHECK (
--       bucket_id = 'lab-manuals'
--       AND auth.jwt() ->> 'email' LIKE '%@rguktn.ac.in'
--       AND EXISTS (
--         SELECT 1 FROM faculty_subjects
--         WHERE uid = auth.uid()
--         AND subject_id = (storage.foldername(name))[1]
--       )
--     );
--
-- Policy 3: Faculty can update (re-upload) to own subject folder
--   CREATE POLICY "faculty update own subject folder"
--     ON storage.objects FOR UPDATE
--     USING (
--       bucket_id = 'lab-manuals'
--       AND auth.jwt() ->> 'email' LIKE '%@rguktn.ac.in'
--       AND EXISTS (
--         SELECT 1 FROM faculty_subjects
--         WHERE uid = auth.uid()
--         AND subject_id = (storage.foldername(name))[1]
--       )
--     );
