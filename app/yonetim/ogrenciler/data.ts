import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { assistantHeadTeachers, profiles, studentStudyDays, students } from "@/db/schema";

export type HeadTeacherOption = {
  id: string;
  firstName: string;
  lastName: string;
  assistantNames: string;
};

export async function getHeadTeacherOptions(): Promise<HeadTeacherOption[]> {
  const rows = await db
    .select({ id: profiles.id, firstName: profiles.firstName, lastName: profiles.lastName })
    .from(profiles)
    .where(eq(profiles.role, "head_teacher"))
    .orderBy(profiles.firstName);

  const links = await db
    .select({ assistant: profiles, headTeacherId: assistantHeadTeachers.headTeacherId })
    .from(assistantHeadTeachers)
    .innerJoin(profiles, eq(profiles.id, assistantHeadTeachers.assistantId));
  const assistantsByHeadTeacher = new Map<string, string[]>();
  for (const l of links) {
    const list = assistantsByHeadTeacher.get(l.headTeacherId) ?? [];
    list.push(`${l.assistant.firstName} ${l.assistant.lastName}`);
    assistantsByHeadTeacher.set(l.headTeacherId, list);
  }

  return rows.map((r) => ({ ...r, assistantNames: (assistantsByHeadTeacher.get(r.id) ?? []).join(", ") }));
}

export type AdminStudentRow = {
  id: string;
  fullName: string;
  className: string;
  headTeacherId: string;
  headTeacherName: string;
  assistantNames: string;
  isActive: boolean;
  days: number[];
};

export async function getAllStudentsAdmin(): Promise<AdminStudentRow[]> {
  const rows = await db
    .select({ student: students, headTeacher: profiles })
    .from(students)
    .innerJoin(profiles, eq(profiles.id, students.headTeacherId));

  const links = await db
    .select({ assistant: profiles, headTeacherId: assistantHeadTeachers.headTeacherId })
    .from(assistantHeadTeachers)
    .innerJoin(profiles, eq(profiles.id, assistantHeadTeachers.assistantId));
  const assistantsByHeadTeacher = new Map<string, string[]>();
  for (const l of links) {
    const list = assistantsByHeadTeacher.get(l.headTeacherId) ?? [];
    list.push(`${l.assistant.firstName} ${l.assistant.lastName}`);
    assistantsByHeadTeacher.set(l.headTeacherId, list);
  }

  const dayRows = await db.select().from(studentStudyDays);
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
      assistantNames: (assistantsByHeadTeacher.get(headTeacher.id) ?? []).join(", "),
      isActive: student.isActive,
      days: (daysByStudent.get(student.id) ?? []).sort((a, b) => a - b),
    }))
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "tr"));
}
