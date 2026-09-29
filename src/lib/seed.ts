import { scryptSync } from "crypto";
import { DEMO_PASSWORD, ID } from "./ids";
import { gradePoints } from "./pure";

export function demoPasswordHash(password = DEMO_PASSWORD) {
  return scryptSync(password, "helios-demo-salt", 32).toString("hex");
}

const hash = demoPasswordHash();

export type Role = "STUDENT" | "FACULTY" | "WARDEN" | "EXAM_CELL" | "ADMIN" | "GUEST";

export type User = {
  id: string;
  rollNo: string | null;
  facultyId: string | null;
  email: string;
  phone: string;
  passwordHash: string;
  role: Role;
  status: "ACTIVE" | "SUSPENDED" | "ALUMNI";
  fullName: string;
};

export type CourseRow = {
  studentId: string;
  courseCode: string;
  title: string;
  credits: number;
  semesterTaken: number;
  grade: string | null;
  status: "ENROLLED" | "COMPLETED" | "BACKLOG";
  elective: boolean;
};

function course(
  studentId: string,
  courseCode: string,
  title: string,
  credits: number,
  semesterTaken: number,
  grade: string | null,
  status: CourseRow["status"],
  elective = false,
): CourseRow {
  return { studentId, courseCode, title, credits, semesterTaken, grade, status, elective };
}

export function buildSeed() {
  const users: User[] = [
    { id: ID.ananya, rollNo: "21CSE0142", facultyId: null, email: "ananya.rao@helios.edu", phone: "+91 98480 11042", passwordHash: hash, role: "STUDENT", status: "ACTIVE", fullName: "Ananya Rao" },
    { id: ID.rohan, rollNo: "21ECE0088", facultyId: null, email: "rohan.iyer@helios.edu", phone: "+91 98480 22088", passwordHash: hash, role: "STUDENT", status: "ACTIVE", fullName: "Rohan Iyer" },
    { id: ID.meera, rollNo: null, facultyId: "FAC1024", email: "meera.krishnan@helios.edu", phone: "+91 98480 31024", passwordHash: hash, role: "FACULTY", status: "ACTIVE", fullName: "Dr. Meera Krishnan" },
    { id: ID.warden, rollNo: null, facultyId: "WAR2001", email: "warden.blockc@helios.edu", phone: "+91 98480 42001", passwordHash: hash, role: "WARDEN", status: "ACTIVE", fullName: "Lakshmi Reddy" },
    { id: ID.exam, rollNo: null, facultyId: "EXM3001", email: "examcell@helios.edu", phone: "+91 98480 53001", passwordHash: hash, role: "EXAM_CELL", status: "ACTIVE", fullName: "Exam Cell Desk" },
    { id: ID.admin, rollNo: null, facultyId: "ADM0001", email: "registrar@helios.edu", phone: "+91 98480 60001", passwordHash: hash, role: "ADMIN", status: "ACTIVE", fullName: "Registrar Office" },
  ];

  const departments = [
    { id: ID.cse, code: "CSE", name: "Computer Science & Engineering", overview: "Systems, intelligent computing, and a placement cell that treats internships as coursework.", labs: ["Systems Lab", "AI Studio", "Networks Lab"], hod: "Dr. Meera Krishnan", email: "cse@helios.edu" },
    { id: ID.ece, code: "ECE", name: "Electronics & Communication", overview: "VLSI, embedded systems, and a signal lab that stays open past the last bus.", labs: ["VLSI Lab", "Communication Lab"], hod: "Dr. S. Patel", email: "ece@helios.edu" },
    { id: ID.eee, code: "EEE", name: "Electrical & Electronics", overview: "Power systems, drives, and a high-voltage lab with its own safety desk.", labs: ["Machines Lab", "Power Systems Lab"], hod: "Dr. K. Menon", email: "eee@helios.edu" },
    { id: ID.me, code: "ME", name: "Mechanical Engineering", overview: "Thermal sciences, design, and a workshop that still smells of cutting oil.", labs: ["CAD Lab", "Thermal Lab"], hod: "Dr. R. Das", email: "mech@helios.edu" },
    { id: ID.ce, code: "CE", name: "Civil Engineering", overview: "Structures, water, and field studios along the campus canal.", labs: ["Structures Lab", "Survey Studio"], hod: "Dr. A. Shah", email: "civil@helios.edu" },
    { id: ID.it, code: "IT", name: "Information Technology", overview: "Platforms, security, and the team that keeps the campus network honest.", labs: ["Security Lab", "Cloud Lab"], hod: "Dr. N. Banerjee", email: "it@helios.edu" },
  ];

  const profiles = [
    { userId: ID.ananya, departmentId: ID.cse, semester: 6, section: "B", regulation: "R20", batchYear: 2021, hostelResident: true, hostelBlock: "C", roomNo: "C-214", dob: "2003-08-14", bloodGroup: "B+", guardianPhone: "+91 98480 10001", requiredCredits: 160 },
    { userId: ID.rohan, departmentId: ID.ece, semester: 6, section: "A", regulation: "R20", batchYear: 2021, hostelResident: false, hostelBlock: null, roomNo: null, dob: "2003-02-02", bloodGroup: "O+", guardianPhone: "+91 98480 10002", requiredCredits: 160 },
  ];

  const ananyaCourses: CourseRow[] = [
    course(ID.ananya, "CS301", "Operating Systems", 4, 5, "A", "COMPLETED"),
    course(ID.ananya, "CS302", "Computer Networks", 4, 5, "A+", "COMPLETED"),
    course(ID.ananya, "CS303", "Database Systems", 4, 5, "O", "COMPLETED"),
    course(ID.ananya, "MA301", "Probability & Statistics", 3, 5, "B+", "COMPLETED"),
    course(ID.ananya, "CS210", "Discrete Mathematics", 4, 3, "F", "BACKLOG"),
    course(ID.ananya, "CS401", "Machine Learning", 4, 6, null, "ENROLLED", true),
    course(ID.ananya, "CS402", "Compiler Design", 4, 6, null, "ENROLLED"),
    course(ID.ananya, "CS403", "Information Security", 3, 6, null, "ENROLLED"),
    course(ID.ananya, "HS401", "Engineering Ethics", 2, 6, null, "ENROLLED"),
  ];
  const rohanCourses: CourseRow[] = [
    course(ID.rohan, "EC301", "Digital Signal Processing", 4, 5, "A", "COMPLETED"),
    course(ID.rohan, "EC401", "VLSI Design", 4, 6, null, "ENROLLED"),
  ];

  const invoices = [
    { invoiceId: "inv-tuition-21cse0142", studentId: ID.ananya, type: "TUITION", description: "Tuition, semester 6", amountPaise: 8750000, status: "PAID" as const, dueDate: "2026-07-15" },
    { invoiceId: "inv-hostel-21cse0142", studentId: ID.ananya, type: "HOSTEL", description: "Block C accommodation, odd semester", amountPaise: 4200000, status: "UNPAID" as const, dueDate: "2026-10-12" },
    { invoiceId: "inv-exam-21cse0142", studentId: ID.ananya, type: "EXAM", description: "Mid-semester examination fee", amountPaise: 185000, status: "UNPAID" as const, dueDate: "2026-10-05" },
    { invoiceId: "inv-library-21cse0142", studentId: ID.ananya, type: "LIBRARY", description: "Overdue fine, two titles", amountPaise: 24000, status: "UNPAID" as const, dueDate: "2026-10-01" },
    { invoiceId: "inv-mess-21cse0142", studentId: ID.ananya, type: "MESS", description: "Mess, odd semester", amountPaise: 1850000, status: "UNPAID" as const, dueDate: "2026-10-12" },
    { invoiceId: "inv-tuition-21ece0088", studentId: ID.rohan, type: "TUITION", description: "Tuition, semester 6", amountPaise: 8750000, status: "UNPAID" as const, dueDate: "2026-10-12" },
  ];

  const attendance = [
    { studentId: ID.ananya, courseCode: "CS401", title: "Machine Learning", attended: 18, held: 22 },
    { studentId: ID.ananya, courseCode: "CS402", title: "Compiler Design", attended: 14, held: 20 },
    { studentId: ID.ananya, courseCode: "CS403", title: "Information Security", attended: 16, held: 18 },
    { studentId: ID.ananya, courseCode: "HS401", title: "Engineering Ethics", attended: 8, held: 10 },
    { studentId: ID.rohan, courseCode: "EC401", title: "VLSI Design", attended: 17, held: 20 },
  ];

  const roster = [
    { studentId: ID.ananya, rollNo: "21CSE0142", name: "Ananya Rao", present: true },
    { studentId: "stu-cse-02", rollNo: "21CSE0148", name: "Dev Patel", present: true },
    { studentId: "stu-cse-03", rollNo: "21CSE0155", name: "Sana Qureshi", present: false },
    { studentId: "stu-cse-04", rollNo: "21CSE0160", name: "Karthik Nair", present: true },
    { studentId: "stu-cse-05", rollNo: "21CSE0166", name: "Ishita Bose", present: true },
  ];

  return {
    users,
    departments,
    profiles,
    courses: [...ananyaCourses, ...rohanCourses],
    invoices,
    attendance,
    roster,
    payments: [
      {
        txnId: "txn-tuition-settled",
        invoiceId: "inv-tuition-21cse0142",
        studentId: ID.ananya,
        gateway: "razorpay",
        gatewayRef: "pay_demo_tuition",
        amountPaise: 8750000,
        method: "UPI",
        status: "SETTLED" as const,
        idempotencyKey: "seed-tuition",
        receiptNo: "HIT-2026-1042",
        receiptHash: "seeded",
        createdAt: "2026-07-02T09:12:00.000Z",
      },
    ],
    hallTickets: [
      {
        ticketId: "ht-mid-ananya",
        studentId: ID.ananya,
        examName: "Mid-semester, odd 2026",
        centerName: "Helios Academic Block, Hall 2",
        roomNo: "AB-214",
        benchCode: "B-18",
        examDate: "2026-10-16",
        reportingTime: "09:15",
        rules: "Carry this ticket and the college ID. No smart watches. Reach the hall 20 minutes before the paper.",
        barcodePayload: "HIT|21CSE0142|MID2026|B-18",
      },
    ],
    papers: [
      { id: "pyq-1", subjectCode: "CS301", title: "Operating Systems", regulation: "R20", year: 2024, semester: 5, examType: "FINAL" as const, fileKey: "pyq/r20/cs301-2024-final.pdf", downloadCount: 0 },
      { id: "pyq-2", subjectCode: "CS302", title: "Computer Networks", regulation: "R20", year: 2025, semester: 5, examType: "MID" as const, fileKey: "pyq/r20/cs302-2025-mid.pdf" },
      { id: "pyq-3", subjectCode: "CS303", title: "Database Systems", regulation: "R20", year: 2023, semester: 5, examType: "FINAL" as const, fileKey: "pyq/r20/cs303-2023-final.pdf" },
      { id: "pyq-4", subjectCode: "CS210", title: "Discrete Mathematics", regulation: "R20", year: 2024, semester: 3, examType: "FINAL" as const, fileKey: "pyq/r20/cs210-2024-final.pdf" },
    ],
    scholarships: [
      { id: "sch-1", name: "State Fee Reimbursement", provider: "State government", description: "Tuition reimbursement for eligible residents.", checklist: ["Income certificate", "Caste or income category proof", "Previous semester memo", "Bank passbook"] },
      { id: "sch-2", name: "Central Merit Scholarship", provider: "Central government", description: "Merit award for CGPA 8.5 and above.", checklist: ["CGPA memo", "Aadhaar", "Bonafide"] },
    ],
    applications: [
      { id: "app-1", scholarshipId: "sch-1", studentId: ID.ananya, status: "VERIFIED" as const },
    ],
    passes: [
      { id: "pass-1", studentId: ID.ananya, reason: "Family function in Warangal", leaveFrom: "2026-10-03T16:00:00.000Z", leaveTo: "2026-10-05T20:00:00.000Z", destination: "Warangal", status: "PENDING" as const },
    ],
    circulars: [
      { id: "cir-1", title: "Mid-semester timetable published", content: "Hall tickets open on 8 October. Fee defaulters will not be seated.", category: "Exams", targetDepartment: "CSE", targetYear: 2021, targetRole: "STUDENT", createdAt: "2026-09-26T08:00:00.000Z" },
      { id: "cir-2", title: "Block C water shutdown", content: "Water supply in Block C stops from 10:00 to 14:00 on Sunday for tank cleaning.", category: "Hostel", targetDepartment: null, targetYear: null, targetRole: "STUDENT", createdAt: "2026-09-27T06:30:00.000Z" },
      { id: "cir-3", title: "Holiday: campus foundation day", content: "The campus is closed on 2 October. Labs reopen 3 October at 08:30.", category: "Holiday", targetDepartment: null, targetYear: null, targetRole: null, createdAt: "2026-09-20T04:00:00.000Z" },
    ],
    placements: [
      { name: "Aisha Khan", batch: 2025, dept: "CSE", company: "Atlassian", lpa: 52, role: "Software Engineer", marquee: true },
      { name: "Vikram Sethi", batch: 2025, dept: "ECE", company: "Texas Instruments", lpa: 28, role: "Analog Intern-to-FTE", marquee: true },
      { name: "Neel Joshi", batch: 2025, dept: "IT", company: "Razorpay", lpa: 24, role: "Backend Engineer", marquee: false },
      { name: "Pooja Menon", batch: 2024, dept: "CSE", company: "Microsoft", lpa: 46, role: "SWE", marquee: true },
    ],
    stats: { year: "2025", median: 8.4, highest: 52, offers: 612, partners: ["Microsoft", "Atlassian", "Texas Instruments", "Razorpay", "L&T", "Deloitte"] },
    alumni: [
      { name: "Farhan Ali", batch: 2014, dept: "CSE", role: "Staff Engineer", org: "Stripe", spotlight: "Mentors final-year students on distributed systems, Fridays.", quote: "Bring a design, not a resume. Fridays after 4.", open: true },
      { name: "Divya Rao", batch: 2016, dept: "ECE", role: "Hardware Lead", org: "Qualcomm", spotlight: "Runs the January VLSI reading group.", quote: "The reading group is notes and a whiteboard, not a webinar.", open: true },
    ],
    gallery: [
      { category: "Fests", title: "Astra night", caption: "Main quad, three stages, one very late bus.", accent: "#c2542f" },
      { category: "Sports", title: "Inter-college cricket", caption: "The canal ground, March heat, a last-over win.", accent: "#1c6b4a" },
      { category: "Hackathons", title: "48-hour lab lock-in", caption: "AI Studio, whiteboards, and too much filter coffee.", accent: "#b8893d" },
      { category: "Convocation", title: "Class of 2025", caption: "Brass medals, parents in the shade of the banyan.", accent: "#17211c" },
    ],
    faculty: [
      { departmentCode: "CSE", name: "Dr. Meera Krishnan", title: "Professor and Head", email: "meera.krishnan@helios.edu", publications: ["Lab compilers for undergraduate courses, 2024", "Why attendance models should not guess, 2023"] },
      { departmentCode: "CSE", name: "Arun Varghese", title: "Associate Professor", email: "arun.varghese@helios.edu", publications: ["Query plans students can read, 2022"] },
      { departmentCode: "ECE", name: "Dr. S. Patel", title: "Professor and Head", email: "ece@helios.edu", publications: ["A signal lab that stays open past the last bus, 2021"] },
      { departmentCode: "EEE", name: "Dr. K. Menon", title: "Professor and Head", email: "eee@helios.edu", publications: ["High-voltage desk notes, 2020"] },
      { departmentCode: "ME", name: "Dr. R. Das", title: "Professor and Head", email: "mech@helios.edu", publications: ["Thermal lab routines, 2019"] },
      { departmentCode: "CE", name: "Dr. A. Shah", title: "Professor and Head", email: "civil@helios.edu", publications: ["Canal-side survey studio, 2018"] },
      { departmentCode: "IT", name: "Dr. N. Banerjee", title: "Professor and Head", email: "it@helios.edu", publications: ["Keeping the campus network honest, 2024"] },
    ],
    leads: [] as { id: string; name: string; phone: string; email: string; program: string; rank: number | null; message: string; createdAt: string }[],
    gradePoints,
  };
}
