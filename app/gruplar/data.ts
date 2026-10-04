import { eq, inArray } from "drizzle-orm";

import { db } from "@/db/client";
import { profiles, studentStudyDays, students, type Profile } from "@/db/schema";
import { visibleHeadTeacherIds, visibleStudentIds } from "@/lib/permissions";
import { teacherDisplayName } from "@/lib/teacher-name";

export type StudentWithDays = {
  id: string;
  fullName: string;
  className: string;
  headTeacherId: string;
  headTeacherName: string;
  days: number[];
};

export async function getStudentsWithDays(user: Profile): Promise<StudentWithDays[]> {
  const ids = await visibleStudentIds(user);
  if (ids.length === 0) return [];

  const rows = await db
    .select({ student: students, headTeacher: profiles })
    .from(students)
    .innerJoin(profiles, eq(profiles.id, students.headTeacherId))
    .where(inArray(students.id, ids));

  const dayRows = await db
    .select()
    .from(studentStudyDays)
    .where(inArray(studentStudyDays.studentId, ids));
  const daysByStudent = new Map<string, number[]>();
  for (const d of dayRows) {
    const list = daysByStudent.get(d.studentId) ?? [];
    list.push(d.weekday);
    daysByStudent.set(d.studentId, list);
  }

  return rows
    .map(({ student, headTeacher }) => ({
      id: student.id,
      fullName: student.fullName,
      className: student.className,
      headTeacherId: headTeacher.id,
      headTeacherName: teacherDisplayName(headTeacher, user.role),
      days: (daysByStudent.get(student.id) ?? []).sort((a, b) => a - b),
    }))
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "tr"));
}

export type HeadTeacherOption = { id: string; name: string };

/**
 * Kullanıcının seçebileceği / görebileceği baş öğretmenler (asistan için:
 * aynı kurum + aynı seviye + aynı dal ya da onaylı talep; bkz.
 * `visibleHeadTeacherIds`). Yeni öğrenci eklerken ve öğrenciyi başka
 * öğretmene atarken seçim listesi olarak kullanılır.
 */
export async function getAllHeadTeachers(user: Profile): Promise<HeadTeacherOption[]> {
  const ids = await visibleHeadTeacherIds(user);
  if (ids.length === 0) return [];
  const rows = await db
    .select({ id: profiles.id, firstName: profiles.firstName, lastName: profiles.lastName })
    .from(profiles)
    .where(inArray(profiles.id, ids))
    .orderBy(profiles.firstName);
  return rows.map((r) => ({ id: r.id, name: `${r.firstName} ${r.lastName}` }));
}
