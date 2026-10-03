import { desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { profiles, studentStudyDays, students, studyRecords, type Profile } from "@/db/schema";
import { canViewStudent } from "@/lib/permissions";
import type { Role } from "@/lib/roles";
import { teacherDisplayName } from "@/lib/teacher-name";

export type StudentDetail = {
  id: string;
  fullName: string;
  className: string;
  studyDays: number[];
};

export async function getStudentDetail(user: Profile, studentId: string): Promise<StudentDetail | null> {
  if (!(await canViewStudent(user, studentId))) return null;

  const [student] = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
  if (!student) return null;

  const days = await db
    .select({ weekday: studentStudyDays.weekday })
    .from(studentStudyDays)
    .where(eq(studentStudyDays.studentId, studentId));

  return {
    id: student.id,
    fullName: student.fullName,
    className: student.className,
    studyDays: days.map((d) => d.weekday).sort((a, b) => a - b),
  };
}

export type RecordWithAuthor = {
  date: string;
  homework: "done" | "missing" | null;
  book: "brought" | "not_brought" | null;
  attendance: "came" | "absent" | null;
  note: string | null;
  enteredBy: string;
};

export async function getAllRecords(studentId: string, viewerRole: Role): Promise<RecordWithAuthor[]> {
  const rows = await db
    .select({ record: studyRecords, author: profiles })
    .from(studyRecords)
    .innerJoin(profiles, eq(profiles.id, studyRecords.createdBy))
    .where(eq(studyRecords.studentId, studentId))
    .orderBy(desc(studyRecords.date));

  return rows.map(({ record, author }) => ({
    date: record.date,
    homework: record.homework,
    book: record.book,
    attendance: record.attendance,
    note: record.note,
    enteredBy: teacherDisplayName(author, viewerRole),
  }));
}
