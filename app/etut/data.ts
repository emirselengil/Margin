import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db/client";
import {
  assistantHeadTeachers,
  profiles,
  studentStudyDays,
  students,
  studyRecords,
  type Profile,
} from "@/db/schema";
import { visibleStudentIds } from "@/lib/permissions";
import { weekdayOfISODate } from "@/lib/date";
import { teacherDisplayName } from "@/lib/teacher-name";

export type HeadTeacherSummary = {
  id: string;
  name: string;
  studentCount: number;
};

/** Asistanın bağlı olduğu baş öğretmenler, her birinin aktif öğrenci sayısıyla. */
export async function getLinkedHeadTeachers(assistant: Profile): Promise<HeadTeacherSummary[]> {
  const links = await db
    .select({ headTeacher: profiles })
    .from(assistantHeadTeachers)
    .innerJoin(profiles, eq(profiles.id, assistantHeadTeachers.headTeacherId))
    .where(eq(assistantHeadTeachers.assistantId, assistant.id));

  const result: HeadTeacherSummary[] = [];
  for (const { headTeacher } of links) {
    if (!headTeacher.isActive) continue;
    const rows = await db
      .select({ id: students.id })
      .from(students)
      .where(and(eq(students.headTeacherId, headTeacher.id), eq(students.isActive, true)));
    result.push({
      id: headTeacher.id,
      name: `${headTeacher.firstName} ${headTeacher.lastName}`,
      studentCount: rows.length,
    });
  }
  return result;
}

export type StudentForDay = {
  id: string;
  fullName: string;
  className: string;
  headTeacherId: string;
  headTeacherName: string;
  homework: "done" | "missing" | null;
  book: "brought" | "not_brought" | null;
  attendance: "came" | "absent" | null;
  note: string | null;
};

/** Belirli bir tarihte (haftanın gününe göre) etüde gelecek, görünür öğrenciler. */
export async function getStudentsForDate(user: Profile, dateISO: string): Promise<StudentForDay[]> {
  const ids = await visibleStudentIds(user);
  if (ids.length === 0) return [];

  const weekday = weekdayOfISODate(dateISO);
  const scheduled = await db
    .select({ studentId: studentStudyDays.studentId })
    .from(studentStudyDays)
    .where(and(inArray(studentStudyDays.studentId, ids), eq(studentStudyDays.weekday, weekday)));
  const scheduledIds = scheduled.map((s) => s.studentId);
  if (scheduledIds.length === 0) return [];

  const rows = await db
    .select({ student: students, headTeacher: profiles })
    .from(students)
    .innerJoin(profiles, eq(profiles.id, students.headTeacherId))
    .where(inArray(students.id, scheduledIds));

  const records = await db
    .select()
    .from(studyRecords)
    .where(and(inArray(studyRecords.studentId, scheduledIds), eq(studyRecords.date, dateISO)));
  const recordByStudent = new Map(records.map((r) => [r.studentId, r]));

  return rows
    .map(({ student, headTeacher }) => {
      const record = recordByStudent.get(student.id);
      return {
        id: student.id,
        fullName: student.fullName,
        className: student.className,
        headTeacherId: headTeacher.id,
        headTeacherName: teacherDisplayName(headTeacher, user.role),
        homework: record?.homework ?? null,
        book: record?.book ?? null,
        attendance: record?.attendance ?? null,
        note: record?.note ?? null,
      };
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "tr"));
}

/** Bugün etüde gelecek ama henüz kaydı tamamlanmamış (ödev+kitap) öğrenci sayısı. */
export async function getTodayPendingCount(user: Profile, todayISO: string): Promise<number> {
  const todayStudents = await getStudentsForDate(user, todayISO);
  return todayStudents.filter((s) => !s.homework || !s.book).length;
}

/**
 * Haftanın her günü için görünür, etüde gelecek öğrenci sayısı. Haftalık
 * program sabit bir desen olduğundan hangi takvim haftasına bakıldığından
 * bağımsızdır.
 */
export async function getWeekdayCounts(user: Profile): Promise<number[]> {
  const ids = await visibleStudentIds(user);
  if (ids.length === 0) return [0, 0, 0, 0, 0, 0, 0];

  const rows = await db
    .select({ weekday: studentStudyDays.weekday })
    .from(studentStudyDays)
    .where(inArray(studentStudyDays.studentId, ids));

  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const r of rows) counts[r.weekday]++;
  return counts;
}
