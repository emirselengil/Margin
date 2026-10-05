// Sunucudaki /api/mobile uçlarının döndürdüğü şekiller (web tarafındaki
// app/**/data.ts tipleriyle aynı).
export type Role = "admin" | "head_teacher" | "assistant" | "pending";
export type Homework = "done" | "missing";
export type Book = "brought" | "not_brought";
export type Attendance = "came" | "absent";

export type Me = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  isActive: boolean;
};

export type StudentForDay = {
  id: string;
  fullName: string;
  className: string;
  headTeacherId: string;
  headTeacherName: string;
  homework: Homework | null;
  book: Book | null;
  attendance: Attendance | null;
  note: string | null;
};

export type HeadTeacherSummary = { id: string; name: string; studentCount: number };

export type EtutResponse = {
  date: string;
  today: string;
  students: StudentForDay[];
  weekdayCounts: number[];
  headTeachers: HeadTeacherSummary[];
};

export type PastRecord = {
  date: string;
  homework: Homework | null;
  book: Book | null;
  attendance: Attendance | null;
  note: string | null;
  headTeacherNote: string | null;
};

export type StudentDetailResponse = {
  date: string;
  student: {
    id: string;
    fullName: string;
    className: string;
    headTeacherId: string;
    headTeacherName: string;
    studyDays: number[];
  };
  scheduled: boolean;
  record: {
    homework: Homework | null;
    book: Book | null;
    attendance: Attendance | null;
    note: string | null;
    headTeacherNote: string | null;
  } | null;
  pastRecords: PastRecord[];
  sameDayStudentIds: string[];
};

export type GroupStudent = {
  id: string;
  fullName: string;
  className: string;
  headTeacherId: string;
  headTeacherName: string;
  days: number[];
};
export type TeacherOption = { id: string; name: string };
export type GruplarResponse = { students: GroupStudent[]; allHeadTeachers: TeacherOption[] };

export type MyStudentListRow = {
  id: string;
  fullName: string;
  className: string;
  days: number[];
  latest: {
    date: string;
    homework: Homework | null;
    book: Book | null;
    attendance: Attendance | null;
    note: string | null;
  } | null;
};

export type EtutlerStudent = {
  id: string;
  fullName: string;
  className: string;
  homework: Homework | null;
  book: Book | null;
  attendance: Attendance | null;
  note: string | null;
  last4Homework: (Homework | null)[];
};
export type EtutlerResponse = {
  date: string;
  today: string;
  students: EtutlerStudent[];
  weekdayCounts: number[];
  totalStudents: number;
  assistants: { id: string; name: string }[];
};

export type OwnRecord = PastRecord & { enteredBy: string };
export type OwnStudentDetailResponse = {
  student: { id: string; fullName: string; className: string; studyDays: number[] };
  records: OwnRecord[];
};

export type ActionResult = { ok: boolean; message: string };
