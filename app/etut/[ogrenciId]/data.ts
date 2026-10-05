import { and, desc, eq, lt } from "drizzle-orm";

import { db } from "@/db/client";
import { profiles, studentStudyDays, students, studyRecords, type Profile } from "@/db/schema";
import { canViewStudent } from "@/lib/permissions";
import { teacherDisplayName } from "@/lib/teacher-name";

export type StudentDetail = {
  id: string;
  fullName: string;
  className: string;
  headTeacherId: string;
  headTeacherName: string;
  studyDays: number[];
};

export async function getStudentDetail(user: Profile, studentId: string): Promise<StudentDetail | null> {
  if (!(await canViewStudent(user, studentId))) return null;

  const [row] = await db
    .select({ student: students, headTeacher: profiles })
    .from(students)
    .innerJoin(profiles, eq(profiles.id, students.headTeacherId))
    .where(eq(students.id, studentId))
    .limit(1);
  if (!row) return null;

  const days = await db
    .select({ weekday: studentStudyDays.weekday })
    .from(studentStudyDays)
    .where(eq(studentStudyDays.studentId, studentId));

  return {
    id: row.student.id,
    fullName: row.student.fullName,
    className: row.student.className,
    headTeacherId: row.headTeacher.id,
    headTeacherName: teacherDisplayName(row.headTeacher, user.role),
    studyDays: days.map((d) => d.weekday).sort((a, b) => a - b),
  };
}

export type PastRecord = {
  date: string;
  homework: "done" | "missing" | "not_done" | null;
  book: "brought" | "not_brought" | null;
  attendance: "came" | "absent" | null;
  note: string | null;
  headTeacherNote: string | null;
};

export async function getPastRecords(studentId: string, beforeDateISO: string, limit = 4): Promise<PastRecord[]> {
  const rows = await db
    .select()
    .from(studyRecords)
    .where(and(eq(studyRecords.studentId, studentId), lt(studyRecords.date, beforeDateISO)))
    .orderBy(desc(studyRecords.date))
    .limit(limit);
  return rows.map((r) => ({ date: r.date, homework: r.homework, book: r.book, attendance: r.attendance, note: r.note, headTeacherNote: r.headTeacherNote }));
}

export async function getTodayRecord(studentId: string, dateISO: string) {
  const [row] = await db
    .select()
    .from(studyRecords)
    .where(and(eq(studyRecords.studentId, studentId), eq(studyRecords.date, dateISO)))
    .limit(1);
  return row ?? null;
}
