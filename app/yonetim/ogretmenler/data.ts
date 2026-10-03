import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db/client";
import { assistantHeadTeachers, profiles, students } from "@/db/schema";

export type PendingTeacher = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
};

export async function getPendingTeachers(): Promise<PendingTeacher[]> {
  const rows = await db
    .select()
    .from(profiles)
    .where(and(eq(profiles.role, "pending"), eq(profiles.isActive, true)))
    .orderBy(profiles.createdAt);
  return rows.map((r) => ({
    id: r.id,
    firstName: r.firstName,
    lastName: r.lastName,
    email: r.email,
    createdAt: r.createdAt.toISOString(),
  }));
}

export type TeacherRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "admin" | "head_teacher" | "assistant";
  isActive: boolean;
  linkedHeadTeacherIds: string[];
  studentCount: number;
};

export async function getAllTeachers(): Promise<TeacherRow[]> {
  const rows = await db
    .select()
    .from(profiles)
    .where(and(isNull(profiles.deletedAt)))
    .orderBy(profiles.firstName);

  const teacherRows = rows.filter((r) => r.role !== "pending");

  const links = await db.select().from(assistantHeadTeachers);
  const linksByAssistant = new Map<string, string[]>();
  for (const l of links) {
    const list = linksByAssistant.get(l.assistantId) ?? [];
    list.push(l.headTeacherId);
    linksByAssistant.set(l.assistantId, list);
  }

  const studentRows = await db
    .select({ id: students.id, headTeacherId: students.headTeacherId })
    .from(students)
    .where(eq(students.isActive, true));
  const countByHeadTeacher = new Map<string, number>();
  for (const s of studentRows) {
    countByHeadTeacher.set(s.headTeacherId, (countByHeadTeacher.get(s.headTeacherId) ?? 0) + 1);
  }

  return teacherRows.map((r) => ({
    id: r.id,
    firstName: r.firstName,
    lastName: r.lastName,
    email: r.email,
    role: r.role as "admin" | "head_teacher" | "assistant",
    isActive: r.isActive,
    linkedHeadTeacherIds: linksByAssistant.get(r.id) ?? [],
    studentCount: countByHeadTeacher.get(r.id) ?? 0,
  }));
}
