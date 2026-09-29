-- Demo campus for Helios Institute of Technology.
-- Apply as a migration role with BYPASSRLS. campus_app cannot insert
-- through FORCE ROW LEVEL SECURITY, and it must not be given that bypass.
-- Password for every account is campus-demo (scrypt, salt helios-demo-salt).
-- Do not reuse this hash outside the demo.

BEGIN;

INSERT INTO campus.departments (department_id, code, name, overview, labs, hod_name, email) VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'CSE', 'Computer Science & Engineering', 'Systems, intelligent computing, and a placement cell that treats internships as coursework.', ARRAY['Systems Lab', 'AI Studio', 'Networks Lab'], 'Dr. Meera Krishnan', 'cse@helios.edu'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'ECE', 'Electronics & Communication', 'VLSI, embedded systems, and a signal lab that stays open past the last bus.', ARRAY['VLSI Lab', 'Communication Lab'], 'Dr. S. Patel', 'ece@helios.edu'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', 'EEE', 'Electrical & Electronics', 'Power systems, drives, and a high-voltage lab with its own safety desk.', ARRAY['Machines Lab', 'Power Systems Lab'], 'Dr. K. Menon', 'eee@helios.edu'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', 'ME', 'Mechanical Engineering', 'Thermal sciences, design, and a workshop that still smells of cutting oil.', ARRAY['CAD Lab', 'Thermal Lab'], 'Dr. R. Das', 'mech@helios.edu'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5', 'CE', 'Civil Engineering', 'Structures, water, and field studios along the campus canal.', ARRAY['Structures Lab', 'Survey Studio'], 'Dr. A. Shah', 'civil@helios.edu'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6', 'IT', 'Information Technology', 'Platforms, security, and the team that keeps the campus network honest.', ARRAY['Security Lab', 'Cloud Lab'], 'Dr. N. Banerjee', 'it@helios.edu');

INSERT INTO campus.users (id, roll_no, faculty_id, email, phone, password_hash, role, status, full_name) VALUES
  ('11111111-1111-4111-8111-111111111111', '21CSE0142', NULL, 'ananya.rao@helios.edu', '+91 98480 11042', '79fed627bd85c7e9558d219f833ae9626ebf59303373865dcd550bef86ce12d7', 'STUDENT', 'ACTIVE', 'Ananya Rao'),
  ('22222222-2222-4222-8222-222222222222', '21ECE0088', NULL, 'rohan.iyer@helios.edu', '+91 98480 22088', '79fed627bd85c7e9558d219f833ae9626ebf59303373865dcd550bef86ce12d7', 'STUDENT', 'ACTIVE', 'Rohan Iyer'),
  ('33333333-3333-4333-8333-333333333333', NULL, 'FAC1024', 'meera.krishnan@helios.edu', '+91 98480 31024', '79fed627bd85c7e9558d219f833ae9626ebf59303373865dcd550bef86ce12d7', 'FACULTY', 'ACTIVE', 'Dr. Meera Krishnan'),
  ('44444444-4444-4444-8444-444444444444', NULL, 'WAR2001', 'warden.blockc@helios.edu', '+91 98480 42001', '79fed627bd85c7e9558d219f833ae9626ebf59303373865dcd550bef86ce12d7', 'WARDEN', 'ACTIVE', 'Lakshmi Reddy'),
  ('55555555-5555-4555-8555-555555555555', NULL, 'EXM3001', 'examcell@helios.edu', '+91 98480 53001', '79fed627bd85c7e9558d219f833ae9626ebf59303373865dcd550bef86ce12d7', 'EXAM_CELL', 'ACTIVE', 'Exam Cell Desk'),
  ('66666666-6666-4666-8666-666666666666', NULL, 'ADM0001', 'registrar@helios.edu', '+91 98480 60001', '79fed627bd85c7e9558d219f833ae9626ebf59303373865dcd550bef86ce12d7', 'ADMIN', 'ACTIVE', 'Registrar Office');

INSERT INTO campus.student_profiles (user_id, department_id, semester, section, regulation, batch_year, cgpa, earned_credits, required_credits, hostel_resident, hostel_block, room_no, date_of_birth, blood_group, guardian_phone) VALUES
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 6, 'B', 'R20', 2021, 8.60, 15, 160, true, 'C', 'C-214', '2003-08-14', 'B+', '+91 98480 10001'),
  ('22222222-2222-4222-8222-222222222222', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 6, 'A', 'R20', 2021, 8.00, 4, 160, false, NULL, NULL, '2003-02-02', 'O+', '+91 98480 10002');

INSERT INTO campus.faculty_profiles (user_id, department_id, title, research_areas, publications) VALUES
  ('33333333-3333-4333-8333-333333333333', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'Professor', ARRAY['Machine learning', 'Compilers'], ARRAY[]::text[]);

INSERT INTO campus.courses (course_code, title, credits, department_id, semester, is_elective, regulation) VALUES
  ('CS210', 'Discrete Mathematics', 4, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 3, false, 'R20'),
  ('CS301', 'Operating Systems', 4, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 5, false, 'R20'),
  ('CS302', 'Computer Networks', 4, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 5, false, 'R20'),
  ('CS303', 'Database Systems', 4, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 5, false, 'R20'),
  ('MA301', 'Probability & Statistics', 3, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 5, false, 'R20'),
  ('CS401', 'Machine Learning', 4, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 6, true, 'R20'),
  ('CS402', 'Compiler Design', 4, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 6, false, 'R20'),
  ('CS403', 'Information Security', 3, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 6, false, 'R20'),
  ('HS401', 'Engineering Ethics', 2, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 6, false, 'R20'),
  ('EC301', 'Digital Signal Processing', 4, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 5, false, 'R20'),
  ('EC401', 'VLSI Design', 4, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 6, false, 'R20');

INSERT INTO campus.faculty_assignments (faculty_id, course_code, section, semester, academic_year) VALUES
  ('33333333-3333-4333-8333-333333333333', 'CS401', 'B', 6, '2026-27'),
  ('33333333-3333-4333-8333-333333333333', 'CS402', 'B', 6, '2026-27'),
  ('33333333-3333-4333-8333-333333333333', 'CS403', 'B', 6, '2026-27'),
  ('33333333-3333-4333-8333-333333333333', 'HS401', 'B', 6, '2026-27');

INSERT INTO campus.student_courses (student_id, course_code, semester_taken, grade, grade_points, status) VALUES
  ('11111111-1111-4111-8111-111111111111', 'CS301', 5, 'A', 8, 'COMPLETED'),
  ('11111111-1111-4111-8111-111111111111', 'CS302', 5, 'A+', 9, 'COMPLETED'),
  ('11111111-1111-4111-8111-111111111111', 'CS303', 5, 'O', 10, 'COMPLETED'),
  ('11111111-1111-4111-8111-111111111111', 'MA301', 5, 'B+', 7, 'COMPLETED'),
  ('11111111-1111-4111-8111-111111111111', 'CS210', 3, 'F', 0, 'BACKLOG'),
  ('11111111-1111-4111-8111-111111111111', 'CS401', 6, NULL, NULL, 'ENROLLED'),
  ('11111111-1111-4111-8111-111111111111', 'CS402', 6, NULL, NULL, 'ENROLLED'),
  ('11111111-1111-4111-8111-111111111111', 'CS403', 6, NULL, NULL, 'ENROLLED'),
  ('11111111-1111-4111-8111-111111111111', 'HS401', 6, NULL, NULL, 'ENROLLED'),
  ('22222222-2222-4222-8222-222222222222', 'EC301', 5, 'A', 8, 'COMPLETED'),
  ('22222222-2222-4222-8222-222222222222', 'EC401', 6, NULL, NULL, 'ENROLLED');

INSERT INTO campus.fee_invoices (invoice_id, student_id, type, description, amount_paise, status, due_date) VALUES
  ('71111111-1111-4111-8111-111111111101', '11111111-1111-4111-8111-111111111111', 'TUITION', 'Tuition, semester 6', 8750000, 'PAID', '2026-07-15'),
  ('71111111-1111-4111-8111-111111111102', '11111111-1111-4111-8111-111111111111', 'HOSTEL', 'Block C accommodation, odd semester', 4200000, 'UNPAID', '2026-10-12'),
  ('71111111-1111-4111-8111-111111111103', '11111111-1111-4111-8111-111111111111', 'EXAM', 'Mid-semester examination fee', 185000, 'UNPAID', '2026-10-05'),
  ('71111111-1111-4111-8111-111111111104', '11111111-1111-4111-8111-111111111111', 'LIBRARY', 'Overdue fine, two titles', 24000, 'UNPAID', '2026-10-01'),
  ('71111111-1111-4111-8111-111111111105', '11111111-1111-4111-8111-111111111111', 'MESS', 'Mess, odd semester', 1850000, 'UNPAID', '2026-10-12'),
  ('72222222-2222-4222-8222-222222222201', '22222222-2222-4222-8222-222222222222', 'TUITION', 'Tuition, semester 6', 8750000, 'UNPAID', '2026-10-12');

INSERT INTO campus.payment_transactions (txn_id, invoice_id, student_id, gateway, gateway_ref, amount_paise, method, status, idempotency_key, receipt_no, receipt_hash, settled_at) VALUES
  ('81111111-1111-4111-8111-111111111111', '71111111-1111-4111-8111-111111111101', '11111111-1111-4111-8111-111111111111', 'razorpay', 'pay_demo_tuition', 8750000, 'UPI', 'SETTLED', 'seed-tuition', 'HIT-2026-1042', 'seeded', '2026-07-02T09:12:00Z');

INSERT INTO campus.hall_tickets (student_id, exam_name, center_name, room_no, bench_code, exam_date, reporting_time, rules, barcode_payload) VALUES
  ('11111111-1111-4111-8111-111111111111', 'Mid-semester, odd 2026', 'Helios Academic Block, Hall 2', 'AB-214', 'B-18', '2026-10-16', '09:15', 'Carry this ticket and the college ID. No smart watches. Reach the hall 20 minutes before the paper.', 'HIT|21CSE0142|MID2026|B-18');

INSERT INTO campus.question_papers (subject_code, regulation, year, semester, exam_type, s3_file_key, title) VALUES
  ('CS301', 'R20', 2024, 5, 'FINAL', 'pyq/r20/cs301-2024-final.pdf', 'Operating Systems'),
  ('CS302', 'R20', 2025, 5, 'MID', 'pyq/r20/cs302-2025-mid.pdf', 'Computer Networks'),
  ('CS303', 'R20', 2023, 5, 'FINAL', 'pyq/r20/cs303-2023-final.pdf', 'Database Systems'),
  ('CS210', 'R20', 2024, 3, 'FINAL', 'pyq/r20/cs210-2024-final.pdf', 'Discrete Mathematics');

INSERT INTO campus.scholarships (scholarship_id, name, provider, description, checklist) VALUES
  ('91111111-1111-4111-8111-111111111111', 'State Fee Reimbursement', 'State government', 'Tuition reimbursement for eligible residents.', ARRAY['Income certificate', 'Caste or income category proof', 'Previous semester memo', 'Bank passbook']),
  ('91111111-1111-4111-8111-111111111112', 'Central Merit Scholarship', 'Central government', 'Merit award for CGPA 8.5 and above.', ARRAY['CGPA memo', 'Aadhaar', 'Bonafide']);

INSERT INTO campus.scholarship_applications (scholarship_id, student_id, status) VALUES
  ('91111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'VERIFIED');

INSERT INTO campus.hostel_passes (student_id, reason, leave_from, leave_to, destination, status) VALUES
  ('11111111-1111-4111-8111-111111111111', 'Family function in Warangal', '2026-10-03T16:00:00Z', '2026-10-05T20:00:00Z', 'Warangal', 'PENDING');

INSERT INTO campus.circulars (title, content, category, target_department, target_year, target_role, created_by) VALUES
  ('Mid-semester timetable published', 'Hall tickets open on 8 October. Fee defaulters will not be seated.', 'Exams', 'CSE', 2021, 'STUDENT', '55555555-5555-4555-8555-555555555555'),
  ('Block C water shutdown', 'Water supply in Block C stops from 10:00 to 14:00 on Sunday for tank cleaning.', 'Hostel', NULL, NULL, 'STUDENT', '44444444-4444-4444-8444-444444444444'),
  ('Holiday: campus foundation day', 'The campus is closed on 2 October. Labs reopen 3 October at 08:30.', 'Holiday', NULL, NULL, NULL, '66666666-6666-4666-8666-666666666666');

INSERT INTO campus.placements (student_name, batch_year, department_code, company, package_lpa, role_title, marquee) VALUES
  ('Aisha Khan', 2025, 'CSE', 'Atlassian', 52, 'Software Engineer', true),
  ('Vikram Sethi', 2025, 'ECE', 'Texas Instruments', 28, 'Analog Intern-to-FTE', true),
  ('Neel Joshi', 2025, 'IT', 'Razorpay', 24, 'Backend Engineer', false),
  ('Pooja Menon', 2024, 'CSE', 'Microsoft', 46, 'SWE', true);

INSERT INTO campus.placement_stats (academic_year, median_ctc_lpa, highest_ctc_lpa, offers, partners) VALUES
  ('2025', 8.4, 52, 612, ARRAY['Microsoft', 'Atlassian', 'Texas Instruments', 'Razorpay', 'L&T', 'Deloitte']);

INSERT INTO campus.alumni (name, batch_year, department_code, current_role, organization, spotlight, mentorship_open) VALUES
  ('Farhan Ali', 2014, 'CSE', 'Staff Engineer', 'Stripe', 'Mentors final-year students on distributed systems, Fridays.', true),
  ('Divya Rao', 2016, 'ECE', 'Hardware Lead', 'Qualcomm', 'Runs the January VLSI reading group.', true);

INSERT INTO campus.gallery_items (category, title, caption, accent) VALUES
  ('Fests', 'Astra night', 'Main quad, three stages, one very late bus.', '#c2542f'),
  ('Sports', 'Inter-college cricket', 'The canal ground, March heat, a last-over win.', '#1c6b4a'),
  ('Hackathons', '48-hour lab lock-in', 'AI Studio, whiteboards, and too much filter coffee.', '#b8893d'),
  ('Convocation', 'Class of 2025', 'Brass medals, parents in the shade of the banyan.', '#17211c');

COMMIT;
