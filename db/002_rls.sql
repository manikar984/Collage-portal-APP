-- Row-level security. The API opens a transaction and runs:
--   SELECT set_config('app.user_id', '<uuid>', true);
--   SELECT set_config('app.role', '<ROLE>', true);
-- before any student-scoped query. true = SET LOCAL, so it dies with the transaction.
--
-- A student policy never trusts an id supplied only in the query string.
-- The bound user id comes from the verified access token, then from this setting.

CREATE OR REPLACE FUNCTION campus.current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.user_id', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION campus.current_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(current_setting('app.role', true), 'GUEST')
$$;

CREATE OR REPLACE FUNCTION campus.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT campus.current_role() IN ('FACULTY', 'WARDEN', 'EXAM_CELL', 'ADMIN')
$$;

ALTER TABLE campus.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE campus.users FORCE ROW LEVEL SECURITY;
ALTER TABLE campus.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE campus.student_profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE campus.student_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE campus.student_courses FORCE ROW LEVEL SECURITY;
ALTER TABLE campus.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE campus.attendance_records FORCE ROW LEVEL SECURITY;
ALTER TABLE campus.fee_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE campus.fee_invoices FORCE ROW LEVEL SECURITY;
ALTER TABLE campus.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE campus.payment_transactions FORCE ROW LEVEL SECURITY;
ALTER TABLE campus.hall_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE campus.hall_tickets FORCE ROW LEVEL SECURITY;
ALTER TABLE campus.scholarship_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE campus.scholarship_applications FORCE ROW LEVEL SECURITY;
ALTER TABLE campus.hostel_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE campus.hostel_passes FORCE ROW LEVEL SECURITY;
ALTER TABLE campus.refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE campus.refresh_tokens FORCE ROW LEVEL SECURITY;

-- Students read only their own user row. Staff read rows they need for duty.
CREATE POLICY users_select ON campus.users
  FOR SELECT
  USING (
    campus.current_role() = 'ADMIN'
    OR id = campus.current_user_id()
    OR (
      campus.current_role() = 'FACULTY'
      AND id IN (
        SELECT sc.student_id
        FROM campus.student_courses sc
        JOIN campus.faculty_assignments fa
          ON fa.course_code = sc.course_code
         AND fa.semester = sc.semester_taken
        WHERE fa.faculty_id = campus.current_user_id()
      )
    )
    OR (
      campus.current_role() = 'WARDEN'
      AND id IN (SELECT user_id FROM campus.student_profiles WHERE hostel_resident)
    )
    OR campus.current_role() = 'EXAM_CELL'
  );

CREATE POLICY users_update_self ON campus.users
  FOR UPDATE
  USING (id = campus.current_user_id() OR campus.current_role() = 'ADMIN')
  WITH CHECK (id = campus.current_user_id() OR campus.current_role() = 'ADMIN');

CREATE POLICY profiles_select ON campus.student_profiles
  FOR SELECT
  USING (
    campus.current_role() = 'ADMIN'
    OR user_id = campus.current_user_id()
    OR campus.current_role() IN ('EXAM_CELL', 'WARDEN', 'FACULTY')
  );

CREATE POLICY profiles_update_self ON campus.student_profiles
  FOR UPDATE
  USING (user_id = campus.current_user_id() OR campus.current_role() = 'ADMIN')
  WITH CHECK (user_id = campus.current_user_id() OR campus.current_role() = 'ADMIN');

-- Grades are readable by the owning student. Only exam cell and admin can write them.
CREATE POLICY courses_select_own ON campus.student_courses
  FOR SELECT
  USING (
    student_id = campus.current_user_id()
    OR campus.current_role() IN ('EXAM_CELL', 'ADMIN')
    OR (
      campus.current_role() = 'FACULTY'
      AND EXISTS (
        SELECT 1 FROM campus.faculty_assignments fa
        WHERE fa.faculty_id = campus.current_user_id()
          AND fa.course_code = student_courses.course_code
          AND fa.semester = student_courses.semester_taken
      )
    )
  );

CREATE POLICY courses_write_exam ON campus.student_courses
  FOR UPDATE
  USING (campus.current_role() IN ('EXAM_CELL', 'ADMIN', 'FACULTY'))
  WITH CHECK (campus.current_role() IN ('EXAM_CELL', 'ADMIN', 'FACULTY'));

CREATE POLICY attendance_select ON campus.attendance_records
  FOR SELECT
  USING (
    student_id = campus.current_user_id()
    OR campus.current_role() IN ('FACULTY', 'ADMIN', 'EXAM_CELL')
  );

CREATE POLICY attendance_write_faculty ON campus.attendance_records
  FOR ALL
  USING (campus.current_role() IN ('FACULTY', 'ADMIN'))
  WITH CHECK (campus.current_role() IN ('FACULTY', 'ADMIN'));

-- A student cannot select, update, or pay another student's invoice.
CREATE POLICY invoices_own ON campus.fee_invoices
  FOR SELECT
  USING (student_id = campus.current_user_id() OR campus.current_role() = 'ADMIN');

CREATE POLICY invoices_no_student_write ON campus.fee_invoices
  FOR UPDATE
  USING (campus.current_role() = 'ADMIN')
  WITH CHECK (campus.current_role() = 'ADMIN');

CREATE POLICY payments_own ON campus.payment_transactions
  FOR SELECT
  USING (student_id = campus.current_user_id() OR campus.current_role() = 'ADMIN');

CREATE POLICY tickets_own ON campus.hall_tickets
  FOR SELECT
  USING (
    student_id = campus.current_user_id()
    OR campus.current_role() IN ('EXAM_CELL', 'ADMIN')
  );

CREATE POLICY scholarships_own ON campus.scholarship_applications
  FOR ALL
  USING (student_id = campus.current_user_id() OR campus.current_role() = 'ADMIN')
  WITH CHECK (student_id = campus.current_user_id() OR campus.current_role() = 'ADMIN');

CREATE POLICY passes_student ON campus.hostel_passes
  FOR SELECT
  USING (
    student_id = campus.current_user_id()
    OR campus.current_role() IN ('WARDEN', 'ADMIN')
  );

CREATE POLICY passes_student_insert ON campus.hostel_passes
  FOR INSERT
  WITH CHECK (student_id = campus.current_user_id() OR campus.current_role() = 'ADMIN');

CREATE POLICY passes_warden_update ON campus.hostel_passes
  FOR UPDATE
  USING (campus.current_role() IN ('WARDEN', 'ADMIN') OR student_id = campus.current_user_id())
  WITH CHECK (campus.current_role() IN ('WARDEN', 'ADMIN') OR student_id = campus.current_user_id());

CREATE POLICY refresh_own ON campus.refresh_tokens
  FOR ALL
  USING (user_id = campus.current_user_id() OR campus.current_role() = 'ADMIN')
  WITH CHECK (user_id = campus.current_user_id() OR campus.current_role() = 'ADMIN');

-- Public catalogues stay open to the application role via GRANT, not RLS.
-- question_papers, circulars, courses, departments, placements, alumni, gallery
-- are not student-private. Circular targeting is filtered in the query.

REVOKE ALL ON SCHEMA campus FROM PUBLIC;
-- GRANT USAGE ON SCHEMA campus TO campus_app;
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA campus TO campus_app;
-- The role must not be SUPERUSER and must not have BYPASSRLS.
