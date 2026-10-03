import { and, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db/client";
import { assistantHeadTeachers, profiles, studentStudyDays, students, studyRecords, type Profile } from "@/db/schema";
import { weekdayOfISODate } from "@/lib/date";
import { visibleStudentIds } from "@/lib/permissions";

export async function getMyAssistants(headTeacher: Profile) {
  const rows = await db
    .select({ assistant: profiles })
    .from(assistantHeadTeachers)
    .innerJoin(profiles, eq(profiles.id, assistantHeadTeachers.assistantId))
    .where(eq(assistantHeadTeachers.headTeacherId, headTeacher.id));
  return rows.map((r) => r.assistant);
}

export type MyStudentRow = {
  id: string;
  fullName: string;
  className: string;
  homework: "done" | "missing" | null;
  book: "brought" | "not_brought" | null;
  attendance: "came" | "absent" | null;
  note: string | null;
  last4Homework: ("done" | "missing" | null)[];
};

export async function getStudentsForDate(user: Profile, dateISO: string): Promise<MyStudentRow[]> {
  const ids = await visibleStudentIds(user);
  if (ids.length === 0) return [];

  const weekday = weekdayOfISODate(dateISO);
  const scheduled = await db
    .select({ studentId: studentStudyDays.studentId })
    .from(studentStudyDays)
    .where(and(inArray(studentStudyDays.studentId, ids), eq(studentStudyDays.weekday, weekday)));
  const scheduledIds = scheduled.map((s) => s.studentId);
  if (scheduledIds.length === 0) return [];

  const rows = await db.select().from(students).where(inArray(students.id, scheduledIds));

  const todayRecords = await db
    .select()
    .from(studyRecords)
    .where(and(inArray(studyRecords.studentId, scheduledIds), eq(studyRecords.date, dateISO)));
  const todayByStudent = new Map(todayRecords.map((r) => [r.studentId, r]));

  const result: MyStudentRow[] = [];
  for (const s of rows) {
    const past = await db
      .select({ homework: studyRecords.homework })
      .from(studyRecords)
      .where(eq(studyRecords.studentId, s.id))
      .orderBy(desc(studyRecords.date))
      .limit(4);
    const today = todayByStudent.get(s.id);
    result.push({
      id: s.id,
      fullName: s.fullName,
      className: s.className,
      homework: today?.homework ?? null,
      book: today?.book ?? null,
      attendance: today?.attendance ?? null,
      note: today?.note ?? null,
      last4Homework: past.map((p) => p.homework).reverse(),
    });
  }
  return result.sort((a, b) => a.fullName.localeCompare(b.fullName, "tr"));
}

export type MyStudentListRow = {
  id: string;
  fullName: string;
  className: string;
  days: number[];
  latest: {
    date: string;
    homework: "done" | "missing" | null;
    book: "brought" | "not_brought" | null;
    attendance: "came" | "absent" | null;
    note: string | null;
  } | null;
};

/** Baş öğretmenin tüm (aktif) öğrencileri; etüt günleri ve en son kaydıyla. */
export async function getAllMyStudents(user: Profile): Promise<MyStudentListRow[]> {
  const ids = await visibleStudentIds(user);
  if (ids.length === 0) return [];

  const [rows, dayRows, latestRows] = await Promise.all([
    db.select().from(students).where(inArray(students.id, ids)),
    db.select().from(studentStudyDays).where(inArray(studentStudyDays.studentId, ids)),
    db
      .selectDistinctOn([studyRecords.studentId])
      .from(studyRecords)
      .where(inArray(studyRecords.studentId, ids))
      .orderBy(studyRecords.studentId, desc(studyRecords.date)),
  ]);

  const daysByStudent = new Map<string, number[]>();
  for (const d of dayRows) {
    const list = daysByStudent.get(d.studentId) ?? [];
    list.push(d.weekday);
    daysByStudent.set(d.studentId, list);
  }
  const latestByStudent = new Map(latestRows.map((r) => [r.studentId, r]));

  return rows
    .map((s) => {
      const latest = latestByStudent.get(s.id);
      return {
        id: s.id,
        fullName: s.fullName,
        className: s.className,
        days: (daysByStudent.get(s.id) ?? []).sort((a, b) => a - b),
        latest: latest
          ? {
              date: latest.date,
              homework: latest.homework,
              book: latest.book,
              attendance: latest.attendance,
              note: latest.note,
            }
          : null,
      };
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "tr"));
}

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
