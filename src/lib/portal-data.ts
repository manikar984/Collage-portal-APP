import { ID } from "./ids";
import { gradePoints } from "./pure";

export type SubjectRow = {
  semester: number;
  code: string;
  title: string;
  credits: number;
  faculty: string;
  kind: "REGULAR" | "HONORS" | "MINOR";
};

export type AttendanceRow = {
  semester: number;
  code: string;
  title: string;
  conducted: number;
  attended: number;
};

export type MarkRow = {
  semester: number;
  code: string;
  title: string;
  credits: number;
  kind: "REGULAR" | "HONORS" | "MINOR";
  examType: "MID1" | "MID2" | "INTERNAL" | "OVERALL";
  maxMarks: number;
  obtained: number | null;
  grade: string | null;
  gradePoints: number | null;
};

export type ExamRow = {
  semester: number;
  examType: "MID1" | "MID2" | "REGULAR" | "SUPPLEMENTARY";
  code: string;
  title: string;
  date: string;
  day: string;
  time: string;
  room: string;
};

export type FeeRow = {
  id: string;
  semester: number;
  academicYear: string;
  type: string;
  amountPaise: number;
  status: "Paid" | "Pending" | "Due";
  paidOn: string | null;
  reference: string | null;
  invoiceId: string | null;
  txnId?: string | null;
};

export type DownloadRow = {
  id: string;
  name: string;
  category: "hall" | "timetable" | "memo" | "certificates" | "academic" | "other";
  semester: number | null;
  exam: string;
  detail: string;
};

export type NoticeRow = {
  date: string;
  number: string;
  message: string;
};

export type PortalRecord = {
  student: {
    id: string;
    name: string;
    htno: string;
    course: string;
    branch: string;
    branchName: string;
    year: number;
    semester: number;
    section: string;
    academicYear: string;
    regulation: string;
    dob: string;
    email: string;
    phone: string;
    bloodGroup: string;
    guardianName: string;
    guardianPhone: string;
    hostel: string;
    photo: string;
  };
  subjects: SubjectRow[];
  attendance: AttendanceRow[];
  marks: MarkRow[];
  exams: ExamRow[];
  fees: FeeRow[];
  downloads: DownloadRow[];
  notifications: NoticeRow[];
  college: {
    name: string;
    address: string;
    phone: string;
    email: string;
    departments: { name: string; email: string; phone: string }[];
  };
};

type Tuple = [string, string, number, string];

const CSE: Record<number, Tuple[]> = {
  1: [["MA101", "Mathematics I", 4, "Dr. K. Rao"], ["PH101", "Engineering Physics", 4, "Dr. L. Menon"], ["CS101", "Programming for Problem Solving", 3, "Ms. P. Nair"], ["EN101", "English", 2, "Dr. A. Joseph"], ["ME101", "Engineering Drawing", 3, "Mr. R. Das"]],
  2: [["MA102", "Mathematics II", 4, "Dr. K. Rao"], ["CH101", "Engineering Chemistry", 4, "Dr. S. Iyer"], ["CS102", "Data Structures", 4, "Ms. P. Nair"], ["EC101", "Basic Electronics", 3, "Dr. S. Patel"], ["EN102", "Communication Skills", 2, "Dr. A. Joseph"]],
  3: [["MA201", "Mathematics III", 4, "Dr. K. Rao"], ["CS201", "Object Oriented Programming", 4, "Mr. Arun Varghese"], ["CS210", "Discrete Mathematics", 4, "Dr. Meera Krishnan"], ["CS202", "Computer Organization", 4, "Ms. N. Banerjee"], ["HS201", "Environmental Science", 2, "Dr. A. Shah"]],
  4: [["CS204", "Design and Analysis of Algorithms", 4, "Dr. Meera Krishnan"], ["CS205", "Software Engineering", 3, "Mr. Arun Varghese"], ["CS207", "Web Technologies", 3, "Ms. N. Banerjee"], ["CS208", "Formal Languages", 4, "Dr. Meera Krishnan"], ["HS202", "Constitution of India", 2, "Dr. A. Joseph"]],
  5: [["CS301", "Operating Systems", 4, "Dr. Meera Krishnan"], ["CS302", "Computer Networks", 4, "Ms. N. Banerjee"], ["CS303", "Database Systems", 4, "Mr. Arun Varghese"], ["MA301", "Probability and Statistics", 3, "Dr. K. Rao"], ["CS304", "Theory of Computation", 3, "Dr. Meera Krishnan"]],
  6: [["CS401", "Machine Learning", 4, "Dr. Meera Krishnan"], ["CS402", "Compiler Design", 4, "Mr. Arun Varghese"], ["CS403", "Information Security", 3, "Ms. N. Banerjee"], ["HS401", "Engineering Ethics", 2, "Dr. A. Joseph"], ["CS404", "Computer Graphics", 3, "Mr. Arun Varghese"]],
  7: [["CS501", "Distributed Systems", 4, "Dr. Meera Krishnan"], ["CS502", "Cloud Computing", 3, "Ms. N. Banerjee"], ["CS503", "Elective I", 3, "Mr. Arun Varghese"], ["CS504", "Project Phase I", 4, "Dr. Meera Krishnan"], ["HS501", "Managerial Economics", 2, "Dr. A. Shah"]],
  8: [["CS601", "Project Phase II", 8, "Dr. Meera Krishnan"], ["CS602", "Elective II", 3, "Mr. Arun Varghese"], ["CS603", "Elective III", 3, "Ms. N. Banerjee"], ["HS601", "Professional Practice", 2, "Dr. A. Joseph"]],
};

const ECE: Record<number, Tuple[]> = {
  1: [["MA101", "Mathematics I", 4, "Dr. K. Rao"], ["PH101", "Engineering Physics", 4, "Dr. L. Menon"], ["CH101", "Engineering Chemistry", 4, "Dr. S. Iyer"], ["EC151", "Electronic Devices", 3, "Dr. S. Patel"], ["EN101", "English", 2, "Dr. A. Joseph"]],
  2: [["MA102", "Mathematics II", 4, "Dr. K. Rao"], ["EC152", "Network Theory", 4, "Dr. S. Patel"], ["EC153", "Signals and Systems", 4, "Ms. R. Kulkarni"], ["CS102", "Programming for Problem Solving", 3, "Ms. P. Nair"], ["EN102", "Communication Skills", 2, "Dr. A. Joseph"]],
  3: [["MA201", "Mathematics III", 4, "Dr. K. Rao"], ["EC201", "Analog Circuits", 4, "Dr. S. Patel"], ["EC202", "Digital Logic Design", 4, "Ms. R. Kulkarni"], ["EC203", "Electromagnetic Fields", 3, "Dr. K. Menon"], ["HS201", "Environmental Science", 2, "Dr. A. Shah"]],
  4: [["EC204", "Analog Communication", 4, "Dr. S. Patel"], ["EC205", "Linear Integrated Circuits", 3, "Ms. R. Kulkarni"], ["EC206", "Control Systems", 4, "Dr. K. Menon"], ["MA202", "Complex Variables", 3, "Dr. K. Rao"], ["HS202", "Constitution of India", 2, "Dr. A. Joseph"]],
  5: [["EC301", "Digital Signal Processing", 4, "Dr. S. Patel"], ["EC302", "Microprocessors", 4, "Ms. R. Kulkarni"], ["EC303", "Digital Communication", 4, "Dr. S. Patel"], ["EC305", "Antennas and Wave Propagation", 3, "Dr. K. Menon"]],
  6: [["EC401", "VLSI Design", 4, "Dr. S. Patel"], ["EC402", "Embedded Systems", 4, "Ms. R. Kulkarni"], ["EC403", "Wireless Communication", 3, "Dr. S. Patel"], ["EC404", "Microwave Engineering", 3, "Dr. K. Menon"], ["HS401", "Engineering Ethics", 2, "Dr. A. Joseph"]],
  7: [["EC501", "Optical Communication", 3, "Dr. S. Patel"], ["EC502", "Elective I", 3, "Ms. R. Kulkarni"], ["EC503", "Project Phase I", 4, "Dr. S. Patel"], ["EC504", "Internet of Things", 3, "Ms. R. Kulkarni"], ["HS501", "Managerial Economics", 2, "Dr. A. Shah"]],
  8: [["EC601", "Project Phase II", 8, "Dr. S. Patel"], ["EC602", "Elective II", 3, "Dr. K. Menon"], ["EC603", "Elective III", 3, "Ms. R. Kulkarni"]],
};

const HONORS: Record<string, SubjectRow[]> = {
  [ID.ananya]: [
    { semester: 5, code: "HM401", title: "Advanced Algorithms", credits: 4, faculty: "Dr. Meera Krishnan", kind: "HONORS" },
    { semester: 6, code: "HM402", title: "Distributed Data Systems", credits: 3, faculty: "Mr. Arun Varghese", kind: "HONORS" },
  ],
};

const KNOWN: Record<string, Record<string, string>> = {
  [ID.ananya]: { CS301: "A", CS302: "A+", CS303: "O", MA301: "B+", CS210: "F", HM401: "A" },
  [ID.rohan]: { EC301: "A" },
};

const FROM_GRADE: Record<string, number> = { O: 94, "A+": 86, A: 76, "B+": 66, B: 58, C: 48, F: 31 };

const COLLEGE = {
  name: "Helios Institute of Technology",
  address: "Survey No. 42, Academic City, Hyderabad, Telangana 500090",
  phone: "+91 40 4000 2100",
  email: "registrar@helios.edu",
  departments: [
    { name: "Exam Cell", email: "examcell@helios.edu", phone: "+91 40 4000 2104" },
    { name: "Computer Science & Engineering", email: "cse@helios.edu", phone: "+91 40 4000 2111" },
    { name: "Electronics & Communication", email: "ece@helios.edu", phone: "+91 40 4000 2112" },
    { name: "Hostel, Block C", email: "warden.blockc@helios.edu", phone: "+91 40 4000 2144" },
  ],
};

function yearOf(semester: number) {
  return Math.ceil(semester / 2);
}

export function academicYearFor(batchYear: number, semester: number) {
  const start = batchYear + yearOf(semester) - 1;
  return `${start}-${String(start + 1).slice(2)}`;
}

function weekday(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" });
}

function examWhen(semester: number, examType: ExamRow["examType"], index: number) {
  const year = 2021 + yearOf(semester) - (semester % 2 === 0 ? 0 : 0);
  const month = examType === "SUPPLEMENTARY" ? "07" : semester % 2 === 1 ? "11" : "04";
  const day = 6 + index * 2 + (examType === "MID2" ? 12 : examType === "REGULAR" ? 0 : 0);
  const date = `${year}-${month}-${String(Math.min(day, 26)).padStart(2, "0")}`;
  const time = examType === "MID1" || examType === "MID2"
    ? (index % 2 === 0 ? "10:00 AM - 12:00 PM" : "02:00 PM - 04:00 PM")
    : (index % 2 === 0 ? "10:00 AM - 01:00 PM" : "02:00 PM - 05:00 PM");
  return { date, day: weekday(date), time, room: `AB-${200 + semester}${index + 1}` };
}

function pctScore(semester: number, index: number, salt: number) {
  return 62 + ((semester * 9 + index * 5 + salt * 4) % 31);
}

function clamp(value: number, max: number) {
  return Math.max(0, Math.min(max, value));
}

export function buildPortalRecord(input: {
  id: string;
  name: string;
  htno: string;
  branch: string;
  branchName: string;
  semester: number;
  section: string;
  regulation: string;
  batchYear: number;
  dob: string;
  email: string;
  phone: string;
  bloodGroup: string;
  guardianPhone: string;
  hostel: string;
}): PortalRecord {
  const board = input.branch === "ECE" ? ECE : CSE;
  const salt = input.id === ID.rohan ? 9 : 2;
  const known = KNOWN[input.id] || {};
  const subjects: SubjectRow[] = [];
  for (let semester = 1; semester <= 8; semester += 1) {
    for (const [code, title, credits, faculty] of board[semester]) {
      subjects.push({ semester, code, title, credits, faculty, kind: "REGULAR" });
    }
  }
  for (const row of HONORS[input.id] || []) subjects.push(row);

  const attendance: AttendanceRow[] = subjects
    .filter((row) => row.kind === "REGULAR")
    .map((row, index) => {
      if (row.semester > input.semester) return { semester: row.semester, code: row.code, title: row.title, conducted: 0, attended: 0 };
      const conducted = 40 + row.semester * 2 + (index % 5);
      const attended = Math.min(conducted, 26 + row.semester * 2 + ((index * 3 + salt) % 9));
      return { semester: row.semester, code: row.code, title: row.title, conducted, attended };
    });

  const marks: MarkRow[] = [];
  subjects.forEach((row, index) => {
    const future = row.semester > input.semester;
    const current = row.semester === input.semester;
    const overallPct = known[row.code] ? FROM_GRADE[known[row.code]] : pctScore(row.semester, index, salt);
    const grade = future || current ? null : known[row.code] || (overallPct >= 40 ? gradeFrom(overallPct) : "F");
    const overall = future || current ? null : known[row.code] === "F" ? 31 : overallPct;
    const mid1 = future ? null : 14 + ((row.semester * 3 + index + salt) % 13);
    const mid2 = future ? null : 12 + ((row.semester * 5 + index * 2 + salt) % 15);
    const internal = future ? null : clamp(Math.round(((mid1 || 0) + (mid2 || 0)) / 2) + (index % 2), 30);
    const common = { semester: row.semester, code: row.code, title: row.title, credits: row.credits, kind: row.kind };
    marks.push({ ...common, examType: "MID1", maxMarks: 30, obtained: mid1, grade: null, gradePoints: null });
    marks.push({ ...common, examType: "MID2", maxMarks: 30, obtained: mid2, grade: null, gradePoints: null });
    marks.push({ ...common, examType: "INTERNAL", maxMarks: 30, obtained: internal, grade: null, gradePoints: null });
    marks.push({ ...common, examType: "OVERALL", maxMarks: 100, obtained: overall, grade, gradePoints: gradePoints(grade) });
  });

  const exams: ExamRow[] = [];
  for (let semester = 1; semester <= 8; semester += 1) {
    const list = subjects.filter((row) => row.semester === semester && row.kind === "REGULAR");
    if (semester > input.semester + 1) continue;
    (["MID1", "MID2", "REGULAR"] as const).forEach((examType) => {
      if (semester > input.semester && examType !== "REGULAR") return;
      list.forEach((row, index) => {
        const when = examWhen(semester, examType, index);
        exams.push({ semester, examType, code: row.code, title: row.title, ...when });
      });
    });
  }
  const backlog = subjects.find((row) => row.code === "CS210" && known.CS210 === "F");
  if (backlog) {
    const when = examWhen(input.semester, "SUPPLEMENTARY", 1);
    exams.push({ semester: input.semester, examType: "SUPPLEMENTARY", code: backlog.code, title: backlog.title, ...when, room: "AB-214" });
  }

  const fees: FeeRow[] = [];
  for (let semester = 1; semester < input.semester; semester += 1) {
    fees.push({
      id: `hist-${input.htno}-sem${semester}`,
      semester,
      academicYear: academicYearFor(input.batchYear, semester),
      type: "Tuition",
      amountPaise: 8750000,
      status: "Paid",
      paidOn: `${academicYearFor(input.batchYear, semester).slice(0, 4)}-08-12`,
      reference: `HIT-${input.htno}-S${semester}`,
      invoiceId: null,
    });
  }

  const downloads: DownloadRow[] = [
    { id: "hall-ticket", name: "Digital Hall Ticket", category: "hall", semester: input.semester, exam: "Current examination", detail: "Room, bench, and reporting time" },
    { id: "timetable-current", name: "Exam Time Table", category: "timetable", semester: input.semester, exam: "Mid I / Regular", detail: "Current semester schedule" },
    { id: "bonafide", name: "Bonafide Certificate", category: "certificates", semester: null, exam: "Office", detail: "For bank or scholarship use" },
    { id: "conduct", name: "Conduct Certificate", category: "certificates", semester: null, exam: "Office", detail: "Issued by the principal's office" },
    { id: "regulations", name: "Academic Regulations", category: "academic", semester: null, exam: input.regulation, detail: "Credit and attendance rules" },
    { id: "fee-structure", name: "Fee Structure", category: "other", semester: input.semester, exam: academicYearFor(input.batchYear, input.semester), detail: "Tuition, hostel, and exam fee heads" },
  ];
  for (let semester = 1; semester < input.semester; semester += 1) {
    downloads.push({ id: `memo-${semester}`, name: `Marks Memo, Semester ${semester}`, category: "memo", semester, exam: "Regular", detail: "Semester result sheet" });
  }

  const branchNote = input.branch === "ECE" ? "ECE laboratory timetable is on the department notice board." : "CSE hall tickets open after the exam fee is cleared.";
  const notifications: NoticeRow[] = [
    { date: "2026-09-26", number: "HIT/EXM/2026/118", message: `Mid-semester timetable for semester ${input.semester} is published. ${branchNote}` },
    { date: "2026-09-20", number: "HIT/REG/2026/096", message: "Campus foundation day: the institute is closed on 2 October. Labs reopen on 3 October." },
    { date: "2026-09-12", number: "HIT/ACD/2026/074", message: `Attendance shortage lists for semester ${input.semester} will be frozen on 10 October.` },
    { date: "2026-08-28", number: "HIT/FEE/2026/051", message: "Exam fee defaulters will not be issued a hall ticket." },
    { date: "2026-08-04", number: "HIT/ADM/2026/033", message: `${input.name.split(" ")[0]}'s batch (${input.htno.slice(0, 2)}) must confirm elective choices before 15 August.` },
  ];

  return {
    student: {
      id: input.id,
      name: input.name,
      htno: input.htno,
      course: "B.Tech",
      branch: input.branch,
      branchName: input.branchName,
      year: yearOf(input.semester),
      semester: input.semester,
      section: input.section,
      academicYear: academicYearFor(input.batchYear, input.semester),
      regulation: input.regulation,
      dob: input.dob,
      email: input.email,
      phone: input.phone,
      bloodGroup: input.bloodGroup,
      guardianName: input.id === ID.rohan ? "Shri. Venkat Iyer" : "Smt. Lakshmi Rao",
      guardianPhone: input.guardianPhone,
      hostel: input.hostel,
      photo: input.id === ID.rohan ? "/students/rohan.svg" : "/students/ananya.svg",
    },
    subjects,
    attendance,
    marks,
    exams,
    fees,
    downloads,
    notifications,
    college: COLLEGE,
  };
}

function gradeFrom(pct: number) {
  if (pct >= 90) return "O";
  if (pct >= 80) return "A+";
  if (pct >= 70) return "A";
  if (pct >= 60) return "B+";
  if (pct >= 50) return "B";
  if (pct >= 40) return "C";
  return "F";
}

export function semesterSummary(record: PortalRecord, semester: number) {
  const rows = record.marks.filter((row) => row.semester === semester && row.examType === "OVERALL" && row.kind === "REGULAR");
  let points = 0;
  let credits = 0;
  let earned = 0;
  for (const row of rows) {
    if (row.obtained === null || !row.grade) continue;
    const gp = row.gradePoints || 0;
    points += gp * row.credits;
    credits += row.credits;
    if (gp > 0) earned += row.credits;
  }
  return {
    credits,
    earned,
    sgpa: credits === 0 ? null : Math.round((points / credits) * 100) / 100,
  };
}
