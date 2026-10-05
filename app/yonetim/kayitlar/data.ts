import { between, desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "@/db/client";
import { profiles, students, studyRecords } from "@/db/schema";

export type AdminRecordRow = {
  id: string;
  date: string;
  studentId: string;
  studentName: string;
  className: string;
  headTeacherId: string;
  headTeacherName: string;
  homework: "done" | "missing" | "not_done" | null;
  book: "brought" | "not_brought" | null;
  attendance: "came" | "absent" | null;
  note: string | null;
  headTeacherNote: string | null;
  createdByName: string;
  editedByAdmin: boolean;
};

export type RecordFilters = { from: string; to: string };

/** Verilen tarih aralığındaki tüm kayıtlar. Baş öğretmen/eksik filtreleri istemci tarafında uygulanır. */
export async function getRecordsAdmin(filters: RecordFilters): Promise<AdminRecordRow[]> {
  const headTeacherProfile = alias(profiles, "head_teacher_profile");
  const creatorProfile = alias(profiles, "creator_profile");

  const rows = await db
    .select({ record: studyRecords, student: students, headTeacher: headTeacherProfile, creator: creatorProfile })
    .from(studyRecords)
    .innerJoin(students, eq(students.id, studyRecords.studentId))
    .innerJoin(headTeacherProfile, eq(headTeacherProfile.id, students.headTeacherId))
    .innerJoin(creatorProfile, eq(creatorProfile.id, studyRecords.createdBy))
    .where(between(studyRecords.date, filters.from, filters.to))
    .orderBy(desc(studyRecords.date));

  return rows.map(({ record, student, headTeacher, creator }) => ({
    id: record.id,
    date: record.date,
    studentId: student.id,
    studentName: student.fullName,
    className: student.className,
    headTeacherId: headTeacher.id,
    headTeacherName: `${headTeacher.firstName} ${headTeacher.lastName}`,
    homework: record.homework,
    book: record.book,
    attendance: record.attendance,
    note: record.note,
    headTeacherNote: record.headTeacherNote,
    createdByName: `${creator.firstName} ${creator.lastName}`,
    editedByAdmin: record.editedByAdmin,
  }));
}

export type HeadTeacherOption = { id: string; firstName: string; lastName: string };

export async function getHeadTeacherOptions(): Promise<HeadTeacherOption[]> {
  return db
    .select({ id: profiles.id, firstName: profiles.firstName, lastName: profiles.lastName })
    .from(profiles)
    .where(eq(profiles.role, "head_teacher"))
    .orderBy(profiles.firstName);
}
