import { eq, inArray } from "drizzle-orm";

import { db } from "@/db/client";
import { profiles, studentStudyDays, students, type Profile } from "@/db/schema";
import { visibleStudentIds } from "@/lib/permissions";

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
      headTeacherName: `${headTeacher.firstName} ${headTeacher.lastName}`,
      days: (daysByStudent.get(student.id) ?? []).sort((a, b) => a - b),
    }))
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "tr"));
}
