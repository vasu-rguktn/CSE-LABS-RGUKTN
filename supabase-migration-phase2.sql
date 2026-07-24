-- ============================================================================
-- Phase 2 Setup: Student Task Submission & Faculty Settings
-- ============================================================================

-- 1. Add settings columns to lab_manuals
ALTER TABLE public.lab_manuals
ADD COLUMN IF NOT EXISTS release_date TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS allow_resubmission BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS allowed_file_types TEXT[] DEFAULT ARRAY['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.zip']::text[],
ADD COLUMN IF NOT EXISTS max_file_size_mb INT DEFAULT 20;

-- 2. Add extra fields to student_submissions
ALTER TABLE public.student_submissions
ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES public.lab_manuals(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS subject_id TEXT,
ADD COLUMN IF NOT EXISTS faculty_id UUID,
ADD COLUMN IF NOT EXISTS student_name TEXT,
ADD COLUMN IF NOT EXISTS roll_number TEXT,
ADD COLUMN IF NOT EXISTS branch TEXT,
ADD COLUMN IF NOT EXISTS section TEXT,
ADD COLUMN IF NOT EXISTS week INT,
ADD COLUMN IF NOT EXISTS is_late BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Update existing submissions to link to tasks and populate metadata where possible
UPDATE public.student_submissions s
SET 
  week = s.week_number,
  subject_id = s.subject_code,
  student_name = st.name,
  roll_number = st.roll_number,
  branch = st.branch,
  section = st.section
FROM public.students_master st
WHERE s.student_id = st.id;

UPDATE public.student_submissions s
SET task_id = m.id
FROM public.lab_manuals m
WHERE m.subject_id = s.subject_code AND m.week_number = s.week_number AND m.manual_type = 'weekly';

-- 3. Storage Bucket Setup
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-submissions', 'student-submissions', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist to avoid conflict
DROP POLICY IF EXISTS "public select student-submissions" ON storage.objects;
DROP POLICY IF EXISTS "student upload submission" ON storage.objects;
DROP POLICY IF EXISTS "student update submission" ON storage.objects;
DROP POLICY IF EXISTS "faculty select submission folder" ON storage.objects;

-- RLS Policies for student-submissions bucket
CREATE POLICY "public select student-submissions"
ON storage.objects FOR SELECT
USING (bucket_id = 'student-submissions');

CREATE POLICY "student upload submission"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'student-submissions'
  AND auth.role() = 'authenticated'
  AND lower(storage.filename(name)) LIKE concat(lower(split_part(auth.jwt() ->> 'email', '@', 1)), '_%')
);

CREATE POLICY "student update submission"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'student-submissions'
  AND auth.role() = 'authenticated'
  AND lower(storage.filename(name)) LIKE concat(lower(split_part(auth.jwt() ->> 'email', '@', 1)), '_%')
);

CREATE POLICY "faculty select submission folder"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'student-submissions'
  AND auth.jwt() ->> 'email' LIKE '%@rguktn.ac.in'
);
