"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/db/client";
import { attendanceStatusEnum, bookStatusEnum, homeworkStatusEnum, studyRecords } from "@/db/schema";
import { canWriteRecord, isStudentScheduledOn, PermissionError } from "@/lib/permissions";
import { getOrCreateProfile } from "@/lib/profile";

type Homework = (typeof homeworkStatusEnum.enumValues)[number];
type Book = (typeof bookStatusEnum.enumValues)[number];
type Attendance = (typeof attendanceStatusEnum.enumValues)[number];

/** Öğrenciye yalnızca etüde geldiği günler için kayıt eklenebilir. */
async function requireWriteAccess(studentId: string, dateISO: string) {
  const user = await getOrCreateProfile();
  if (!(await canWriteRecord(user, studentId))) {
    throw new PermissionError("Bu öğrenciye kayıt girme yetkiniz yok.");
  }
  if (!(await isStudentScheduledOn(studentId, dateISO))) {
    throw new PermissionError("Öğrenci bu gün için etüde atanmamış, kayıt eklenemez.");
  }
  return user!;
}

async function upsertRecord(
  studentId: string,
  dateISO: string,
  patch: { homework?: Homework; book?: Book; attendance?: Attendance; note?: string | null },
  createdBy: string,
) {
  await db
    .insert(studyRecords)
    .values({ studentId, date: dateISO, createdBy, ...patch })
    .onConflictDoUpdate({
      target: [studyRecords.studentId, studyRecords.date],
      set: { ...patch, updatedAt: new Date() },
    });
}

export async function setHomeworkAction(studentId: string, dateISO: string, value: Homework) {
  const user = await requireWriteAccess(studentId, dateISO);
  await upsertRecord(studentId, dateISO, { homework: value }, user.id);
  revalidatePath("/etut");
  revalidatePath(`/etut/${studentId}`);
}

export async function setBookAction(studentId: string, dateISO: string, value: Book) {
  const user = await requireWriteAccess(studentId, dateISO);
  await upsertRecord(studentId, dateISO, { book: value }, user.id);
  revalidatePath("/etut");
  revalidatePath(`/etut/${studentId}`);
}

export async function setAttendanceAction(studentId: string, dateISO: string, value: Attendance) {
  const user = await requireWriteAccess(studentId, dateISO);
  await upsertRecord(studentId, dateISO, { attendance: value }, user.id);
  revalidatePath("/etut");
  revalidatePath(`/etut/${studentId}`);
}

export async function saveRecordAction(
  studentId: string,
  dateISO: string,
  patch: {
    homework: Homework | null;
    book: Book | null;
    attendance: Attendance | null;
    note: string | null;
  },
) {
  const user = await requireWriteAccess(studentId, dateISO);
  await upsertRecord(
    studentId,
    dateISO,
    {
      homework: patch.homework ?? undefined,
      book: patch.book ?? undefined,
      attendance: patch.attendance ?? undefined,
      note: patch.note,
    },
    user.id,
  );
  revalidatePath("/etut");
  revalidatePath(`/etut/${studentId}`);
}
