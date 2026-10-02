"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/db/client";
import { bookStatusEnum, homeworkStatusEnum, studyRecords } from "@/db/schema";
import { canWriteRecord, PermissionError } from "@/lib/permissions";
import { getOrCreateProfile } from "@/lib/profile";

type Homework = (typeof homeworkStatusEnum.enumValues)[number];
type Book = (typeof bookStatusEnum.enumValues)[number];

async function requireWriteAccess(studentId: string) {
  const user = await getOrCreateProfile();
  if (!(await canWriteRecord(user, studentId))) {
    throw new PermissionError("Bu öğrenciye kayıt girme yetkiniz yok.");
  }
  return user!;
}

async function upsertRecord(
  studentId: string,
  dateISO: string,
  patch: { homework?: Homework; book?: Book; note?: string | null },
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
  const user = await requireWriteAccess(studentId);
  await upsertRecord(studentId, dateISO, { homework: value }, user.id);
  revalidatePath("/etut");
  revalidatePath(`/etut/${studentId}`);
}

export async function setBookAction(studentId: string, dateISO: string, value: Book) {
  const user = await requireWriteAccess(studentId);
  await upsertRecord(studentId, dateISO, { book: value }, user.id);
  revalidatePath("/etut");
  revalidatePath(`/etut/${studentId}`);
}

export async function saveRecordAction(
  studentId: string,
  dateISO: string,
  patch: { homework: Homework | null; book: Book | null; note: string | null },
) {
  const user = await requireWriteAccess(studentId);
  await upsertRecord(
    studentId,
    dateISO,
    { homework: patch.homework ?? undefined, book: patch.book ?? undefined, note: patch.note },
    user.id,
  );
  revalidatePath("/etut");
  revalidatePath(`/etut/${studentId}`);
}
