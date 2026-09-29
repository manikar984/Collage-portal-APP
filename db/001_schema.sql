-- Helios Institute of Technology — Smart Campus schema
-- PostgreSQL 15+. The application role must be NOBYPASSRLS.
-- Do not connect the API as a superuser: superusers ignore row-level security.
--
-- Read/write split: payment and grade mutations go to the primary.
-- Result, timetable, circular, and PYQ reads may go to a replica, then Redis.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS campus;

-- ---------------------------------------------------------------------------
-- Identity
-- ---------------------------------------------------------------------------

CREATE TABLE campus.departments (
  department_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  overview text NOT NULL,
  labs text[] NOT NULL DEFAULT '{}',
  hod_name text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE campus.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roll_no text UNIQUE,
  faculty_id text UNIQUE,
  email text NOT NULL UNIQUE,
  phone text,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('STUDENT', 'FACULTY', 'WARDEN', 'EXAM_CELL', 'ADMIN', 'GUEST')),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'ALUMNI')),
  full_name text NOT NULL,
  mfa_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (roll_no IS NOT NULL OR faculty_id IS NOT NULL OR role = 'ADMIN')
);

CREATE TABLE campus.refresh_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES campus.users (id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  family_id uuid NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  replaced_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX refresh_tokens_family_idx ON campus.refresh_tokens (family_id);

CREATE TABLE campus.student_profiles (
  user_id uuid PRIMARY KEY REFERENCES campus.users (id) ON DELETE CASCADE,
  department_id uuid NOT NULL REFERENCES campus.departments (department_id),
  semester integer NOT NULL CHECK (semester BETWEEN 1 AND 8),
  section text NOT NULL,
  regulation text NOT NULL,
  batch_year integer NOT NULL,
  cgpa numeric(4, 2) NOT NULL DEFAULT 0,
  earned_credits integer NOT NULL DEFAULT 0,
  required_credits integer NOT NULL DEFAULT 160,
  hostel_resident boolean NOT NULL DEFAULT false,
  hostel_block text,
  room_no text,
  date_of_birth date,
  blood_group text,
  guardian_phone text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE campus.faculty_profiles (
  user_id uuid PRIMARY KEY REFERENCES campus.users (id) ON DELETE CASCADE,
  department_id uuid NOT NULL REFERENCES campus.departments (department_id),
  title text NOT NULL,
  research_areas text[] NOT NULL DEFAULT '{}',
  publications text[] NOT NULL DEFAULT '{}'
);

CREATE TABLE campus.faculty_assignments (
  assignment_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id uuid NOT NULL REFERENCES campus.users (id),
  course_code text NOT NULL,
  section text NOT NULL,
  semester integer NOT NULL,
  academic_year text NOT NULL
);

-- ---------------------------------------------------------------------------
-- Academics
-- ---------------------------------------------------------------------------

CREATE TABLE campus.courses (
  course_code text PRIMARY KEY,
  title text NOT NULL,
  credits integer NOT NULL CHECK (credits BETWEEN 0 AND 6),
  department_id uuid NOT NULL REFERENCES campus.departments (department_id),
  semester integer NOT NULL CHECK (semester BETWEEN 1 AND 8),
  is_elective boolean NOT NULL DEFAULT false,
  regulation text NOT NULL
);

CREATE TABLE campus.student_courses (
  student_id uuid NOT NULL REFERENCES campus.users (id) ON DELETE CASCADE,
  course_code text NOT NULL REFERENCES campus.courses (course_code),
  semester_taken integer NOT NULL,
  grade text,
  grade_points numeric(3, 1),
  status text NOT NULL CHECK (status IN ('ENROLLED', 'COMPLETED', 'BACKLOG')),
  cie_marks integer CHECK (cie_marks IS NULL OR cie_marks BETWEEN 0 AND 40),
  see_marks integer CHECK (see_marks IS NULL OR see_marks BETWEEN 0 AND 60),
  PRIMARY KEY (student_id, course_code, semester_taken)
);

CREATE TABLE campus.attendance_sessions (
  session_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code text NOT NULL REFERENCES campus.courses (course_code),
  section text NOT NULL,
  faculty_id uuid NOT NULL REFERENCES campus.users (id),
  held_on date NOT NULL,
  period integer NOT NULL CHECK (period BETWEEN 1 AND 8),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_code, section, held_on, period)
);

CREATE TABLE campus.attendance_records (
  session_id uuid NOT NULL REFERENCES campus.attendance_sessions (session_id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES campus.users (id) ON DELETE CASCADE,
  present boolean NOT NULL,
  PRIMARY KEY (session_id, student_id)
);

-- ---------------------------------------------------------------------------
-- Fees. Mutations are primary-only. Webhooks settle through a queue.
-- ---------------------------------------------------------------------------

CREATE TABLE campus.fee_invoices (
  invoice_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES campus.users (id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('TUITION', 'HOSTEL', 'EXAM', 'LIBRARY', 'MESS', 'LAB')),
  description text NOT NULL,
  amount_paise integer NOT NULL CHECK (amount_paise > 0),
  status text NOT NULL CHECK (status IN ('UNPAID', 'PAID', 'PENDING')),
  due_date date NOT NULL,
  gst_rate_bps integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX fee_invoices_student_idx ON campus.fee_invoices (student_id, status);

CREATE TABLE campus.payment_transactions (
  txn_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES campus.fee_invoices (invoice_id),
  student_id uuid NOT NULL REFERENCES campus.users (id),
  gateway text NOT NULL,
  gateway_ref text,
  amount_paise integer NOT NULL CHECK (amount_paise > 0),
  method text,
  status text NOT NULL CHECK (status IN ('CREATED', 'AUTHORIZED', 'SETTLED', 'FAILED')),
  idempotency_key text NOT NULL,
  receipt_no text UNIQUE,
  receipt_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  settled_at timestamptz
);

CREATE UNIQUE INDEX payment_one_open_intent
  ON campus.payment_transactions (invoice_id)
  WHERE status IN ('CREATED', 'AUTHORIZED', 'SETTLED');

CREATE TABLE campus.idempotency_keys (
  key text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES campus.users (id),
  scope text NOT NULL,
  request_hash text NOT NULL,
  response jsonb,
  status text NOT NULL CHECK (status IN ('IN_PROGRESS', 'COMPLETED')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Exams, papers, scholarships, hostel, circulars
-- ---------------------------------------------------------------------------

CREATE TABLE campus.hall_tickets (
  ticket_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES campus.users (id) ON DELETE CASCADE,
  exam_name text NOT NULL,
  center_name text NOT NULL,
  room_no text NOT NULL,
  bench_code text NOT NULL,
  exam_date date NOT NULL,
  reporting_time time NOT NULL,
  rules text NOT NULL,
  barcode_payload text NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, exam_name)
);

CREATE TABLE campus.question_papers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_code text NOT NULL REFERENCES campus.courses (course_code),
  regulation text NOT NULL,
  year integer NOT NULL,
  semester integer NOT NULL,
  exam_type text NOT NULL CHECK (exam_type IN ('MID', 'FINAL')),
  s3_file_key text NOT NULL,
  title text NOT NULL,
  download_count integer NOT NULL DEFAULT 0
);

CREATE TABLE campus.scholarships (
  scholarship_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  provider text NOT NULL,
  description text NOT NULL,
  checklist text[] NOT NULL DEFAULT '{}'
);

CREATE TABLE campus.scholarship_applications (
  application_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scholarship_id uuid NOT NULL REFERENCES campus.scholarships (scholarship_id),
  student_id uuid NOT NULL REFERENCES campus.users (id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('DRAFT', 'SUBMITTED', 'VERIFIED', 'DISBURSED', 'REJECTED')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scholarship_id, student_id)
);

CREATE TABLE campus.hostel_passes (
  pass_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES campus.users (id) ON DELETE CASCADE,
  reason text NOT NULL,
  leave_from timestamptz NOT NULL,
  leave_to timestamptz NOT NULL,
  destination text NOT NULL,
  status text NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'USED', 'EXPIRED')),
  warden_id uuid REFERENCES campus.users (id),
  gate_scanned_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE campus.circulars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL,
  target_department text,
  target_year integer,
  target_role text,
  attachment_key text,
  created_by uuid REFERENCES campus.users (id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX circulars_target_idx ON campus.circulars (target_department, target_year, created_at DESC);

-- ---------------------------------------------------------------------------
-- Public campus
-- ---------------------------------------------------------------------------

CREATE TABLE campus.placements (
  placement_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name text NOT NULL,
  batch_year integer NOT NULL,
  department_code text NOT NULL,
  company text NOT NULL,
  package_lpa numeric(6, 2) NOT NULL,
  role_title text NOT NULL,
  marquee boolean NOT NULL DEFAULT false
);

CREATE TABLE campus.placement_stats (
  academic_year text PRIMARY KEY,
  median_ctc_lpa numeric(6, 2) NOT NULL,
  highest_ctc_lpa numeric(6, 2) NOT NULL,
  offers integer NOT NULL,
  partners text[] NOT NULL DEFAULT '{}'
);

CREATE TABLE campus.alumni (
  alumni_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  batch_year integer NOT NULL,
  department_code text NOT NULL,
  current_role text NOT NULL,
  organization text NOT NULL,
  spotlight text,
  mentorship_open boolean NOT NULL DEFAULT false
);

CREATE TABLE campus.gallery_items (
  item_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  title text NOT NULL,
  caption text NOT NULL,
  accent text NOT NULL
);

CREATE TABLE campus.admission_leads (
  lead_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  program text NOT NULL,
  entrance_rank integer,
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE campus.audit_log (
  audit_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Service helpers used by the API inside a transaction after SET LOCAL.
CREATE OR REPLACE FUNCTION campus.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_touch BEFORE UPDATE ON campus.users
  FOR EACH ROW EXECUTE FUNCTION campus.touch_updated_at();
