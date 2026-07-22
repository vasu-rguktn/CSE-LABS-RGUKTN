-- ============================================================================
-- RGUKT-N Lab Manual Portal — Supabase Schema Setup
-- Run this SQL in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================================

-- ─── Faculty Subject Assignments (one-time, locked) ─────────────────────────

CREATE TABLE IF NOT EXISTS public.faculty_subjects (
  uid UUID NOT NULL REFERENCES auth.users(id),
  email TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (uid, subject_id)
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id TEXT NOT NULL,
  manual_type TEXT NOT NULL CHECK (manual_type IN ('complete', 'weekly')),
  week_number INT, -- 1 to 12 if weekly, null/0 if complete
  title TEXT, -- optional title
  storage_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version INT DEFAULT 1,
  UNIQUE(subject_id, manual_type, week_number)
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

CREATE POLICY "only assigned faculty can delete their subject manual"
  ON lab_manuals FOR DELETE
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
--
-- Policy 4: Faculty can delete from own subject folder
--   CREATE POLICY "faculty delete own subject folder"
--     ON storage.objects FOR DELETE
--     USING (
--       bucket_id = 'lab-manuals'
--       AND auth.jwt() ->> 'email' LIKE '%@rguktn.ac.in'
--       AND EXISTS (
--         SELECT 1 FROM faculty_subjects
--         WHERE uid = auth.uid()
--         AND subject_id = (storage.foldername(name))[1]
--       )
--     );

-- ============================================================================
-- Phase 2: Student Submission Module Schema
-- ============================================================================

-- --- Subject Master (From BoS Excel) ----------------------------------------

CREATE TABLE IF NOT EXISTS public.subjects_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code TEXT UNIQUE NOT NULL, 
  subject_name TEXT NOT NULL,
  engineering_year TEXT NOT NULL, 
  semester TEXT NOT NULL,         
  branch TEXT NOT NULL,           
  credits INT,
  is_lab BOOLEAN NOT NULL DEFAULT false, 
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE subjects_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY "everyone can read subjects_master"
  ON subjects_master FOR SELECT
  USING (true);

-- Only admins/faculty should be able to insert/update during import, but 
-- to keep it additive and simple for now, we'll restrict to rguktn domain
CREATE POLICY "faculty can manage subjects_master"
  ON subjects_master FOR ALL
  USING (auth.jwt() ->> 'email' LIKE '%@rguktn.ac.in')
  WITH CHECK (auth.jwt() ->> 'email' LIKE '%@rguktn.ac.in');

-- --- Student Master (From Student Master Excel) -----------------------------

CREATE TABLE IF NOT EXISTS public.students_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roll_number TEXT UNIQUE NOT NULL, 
  name TEXT NOT NULL,
  branch TEXT NOT NULL,             
  section TEXT NOT NULL,            
  engineering_year TEXT NOT NULL,   
  semester TEXT NOT NULL,           
  email_id TEXT UNIQUE NOT NULL,    
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE students_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY "everyone can read students_master"
  ON students_master FOR SELECT
  USING (true);

CREATE POLICY "faculty can manage students_master"
  ON students_master FOR ALL
  USING (auth.jwt() ->> 'email' LIKE '%@rguktn.ac.in')
  WITH CHECK (auth.jwt() ->> 'email' LIKE '%@rguktn.ac.in');

-- --- Weekly Submissions -----------------------------------------------------

CREATE TABLE IF NOT EXISTS public.student_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students_master(id) ON DELETE CASCADE,
  subject_code TEXT NOT NULL REFERENCES subjects_master(course_code) ON DELETE CASCADE,
  week_number INT NOT NULL,
  storage_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted', 
  submitted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, subject_code, week_number)
);

ALTER TABLE student_submissions ENABLE ROW LEVEL SECURITY;

-- Students can read their own submissions
CREATE POLICY "students can read own submissions"
  ON student_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students_master 
      WHERE students_master.id = student_submissions.student_id 
      AND students_master.email_id = auth.jwt() ->> 'email'
    )
  );

-- Faculty can read submissions for subjects they are assigned to
-- Note: Assuming faculty_subjects will still use string IDs for now, or match course_code.
-- For now, we allow any faculty to read them, or we could strict match.
CREATE POLICY "faculty can read all submissions"
  ON student_submissions FOR SELECT
  USING (auth.jwt() ->> 'email' LIKE '%@rguktn.ac.in');

-- Students can insert/update their own submissions
CREATE POLICY "students can manage own submissions"
  ON student_submissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM students_master 
      WHERE students_master.id = student_submissions.student_id 
      AND students_master.email_id = auth.jwt() ->> 'email'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students_master 
      WHERE students_master.id = student_submissions.student_id 
      AND students_master.email_id = auth.jwt() ->> 'email'
    )
  );

-- --- Weekly Deadlines -------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.subject_week_deadlines (
  subject_code TEXT NOT NULL REFERENCES subjects_master(course_code) ON DELETE CASCADE,
  week_number INT NOT NULL,
  deadline_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (subject_code, week_number)
);

ALTER TABLE subject_week_deadlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "everyone can read deadlines"
  ON subject_week_deadlines FOR SELECT
  USING (true);

CREATE POLICY "faculty can manage deadlines"
  ON subject_week_deadlines FOR ALL
  USING (auth.jwt() ->> 'email' LIKE '%@rguktn.ac.in')
  WITH CHECK (auth.jwt() ->> 'email' LIKE '%@rguktn.ac.in');

-- ============================================================================
-- Phase 2b.5: Faculty-Subject-Section Mapping
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.faculty_subject_section (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_code TEXT NOT NULL REFERENCES subjects_master(course_code) ON DELETE CASCADE,
  batch_year TEXT NOT NULL,
  branch TEXT NOT NULL,
  section TEXT NOT NULL,
  faculty_name TEXT,
  faculty_email TEXT, -- Storing email if known, helps with matching logged in faculty
  co_faculty_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE faculty_subject_section ENABLE ROW LEVEL SECURITY;

CREATE POLICY "everyone can read faculty_subject_section"
  ON faculty_subject_section FOR SELECT
  USING (true);

CREATE POLICY "faculty can manage faculty_subject_section"
  ON faculty_subject_section FOR ALL
  USING (auth.jwt() ->> 'email' LIKE '%@rguktn.ac.in')
  WITH CHECK (auth.jwt() ->> 'email' LIKE '%@rguktn.ac.in');


-- ============================================================================
-- Phase 3: Admin Role & Faculty Roster
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_users (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "everyone can read admin_users"
  ON admin_users FOR SELECT
  USING (true);

-- Bypasses RLS internally because it runs with the privileges of its owner
-- (the table owner), breaking the recursive policy evaluation.
CREATE OR REPLACE FUNCTION public.is_admin(check_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users WHERE email = lower(check_email)
  );
$$;

CREATE POLICY "admins can manage admin_users"
  ON admin_users FOR ALL
  USING (is_admin(auth.jwt() ->> 'email'))
  WITH CHECK (is_admin(auth.jwt() ->> 'email'));

-- Seed Admin Users
INSERT INTO admin_users (email) VALUES 
('cseoffice@rguktn.ac.in'),
('hodcse@rguktn.ac.in'),
('vasuch9959@rguktn.ac.in')
ON CONFLICT (email) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.faculty_roster (
  email TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE faculty_roster ENABLE ROW LEVEL SECURITY;

CREATE POLICY "everyone can read faculty_roster"
  ON faculty_roster FOR SELECT
  USING (true);

CREATE POLICY "admins can manage faculty_roster"
  ON faculty_roster FOR ALL
  USING (is_admin(auth.jwt() ->> 'email'))
  WITH CHECK (is_admin(auth.jwt() ->> 'email'));

-- Seed Faculty Roster
INSERT INTO faculty_roster (email, display_name) VALUES 
('krishnasingh@rguktn.ac.in', 'K.K.Singh'),
('chandra.indra@rguktn.ac.in', 'Chandrasheker T'),
('uday@rguktn.ac.in', 'Udaya Kumar Ambati'),
('devi.duvvuri@rguktn.ac.in', 'Nagarjana Devi Duvvuri'),
('rayalaupendar@rguktn.ac.in', '(Dept of CSE)'),
('schiranjeevi@rguktn.ac.in', 'Chiranjeevi Sadu'),
('kumaranurupam@rguktn.ac.in', '(Dept of CSE)'),
('bhanucse@rguktn.ac.in', '(Dept of CSE)'),
('dsrilakshmi@rguktn.ac.in', '(Dept of CSE)'),
('sampathsarnala@rguktn.ac.in', 'Sarnala Sampath'),
('nswathi@rguktn.ac.in', 'N Swathi'),
('k.lakshmikanth@rguktn.ac.in', '(Dept of CSE)'),
('sravan.kalapala@rguktn.ac.in', 'Kalapala Sravan Kumar'),
('padmabai@rguktn.ac.in', 'B.Padma Bai'),
('jayakrishna0005@rguktn.ac.in', '(Dept of CSE)'),
('krishnapriyavaliveti@rguktn.ac.in', 'Kona Krishna Priya'),
('mjblessy.m@rguktn.ac.in', 'M.J.Blessy'),
('rama572krishna@rguktn.ac.in', '(Dept of CSE)'),
('manupatijyothi418@rguktn.ac.in', 'Jyothi Manupati'),
('mlr.rao1237@rguktn.ac.in', 'Mahalakshmi Rao Bhatraju'),
('vasuch9959@rguktn.ac.in', 'Srinivasu Challapalli'),
('kalavathiyarrapati111@rguktn.ac.in', 'Kalavathi Y'),
('prathap.motakatla@rguktn.ac.in', 'Prathap Motakatla'),
('cseoffice@rguktn.ac.in', 'CSE Office'),
('hodcse@rguktn.ac.in', 'HOD CSE')
ON CONFLICT (email) DO NOTHING;

