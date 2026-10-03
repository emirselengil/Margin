"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/client";
import { attendanceStatusEnum, bookStatusEnum, homeworkStatusEnum, recordHistory, studyRecords } from "@/db/schema";
import { PermissionError, requireRole } from "@/lib/permissions";
import { getOrCreateProfile } from "@/lib/profile";

type Homework = (typeof homeworkStatusEnum.enumValues)[number];
type Book = (typeof bookStatusEnum.enumValues)[number];
type Attendance = (typeof attendanceStatusEnum.enumValues)[number];

async function requireAdmin() {
  const user = await getOrCreateProfile();
  return requireRole(user, "admin");
}

async function applyAdminEdit(
  recordId: string,
  patch: { homework?: Homework; book?: Book; attendance?: Attendance; note?: string | null },
  adminId: string,
) {
  await db.transaction(async (tx) => {
    const [before] = await tx.select().from(studyRecords).where(eq(studyRecords.id, recordId)).limit(1);
    if (!before) throw new PermissionError("Kayıt bulunamadı.");

    const [after] = await tx
      .update(studyRecords)
      .set({ ...patch, editedByAdmin: true, updatedAt: new Date() })
      .where(eq(studyRecords.id, recordId))
      .returning();

    await tx.insert(recordHistory).values({
      recordId,
      changedBy: adminId,
      before: { homework: before.homework, book: before.book, attendance: before.attendance, note: before.note },
      after: { homework: after.homework, book: after.book, attendance: after.attendance, note: after.note },
    });
  });
  revalidatePath("/yonetim/kayitlar");
  revalidatePath("/etut");
  revalidatePath("/ogrencilerim");
}

export async function adminSetHomeworkAction(recordId: string, value: Homework) {
  const admin = await requireAdmin();
  await applyAdminEdit(recordId, { homework: value }, admin.id);
}

export async function adminSetBookAction(recordId: string, value: Book) {
  const admin = await requireAdmin();
  await applyAdminEdit(recordId, { book: value }, admin.id);
}

export async function adminSetAttendanceAction(recordId: string, value: Attendance) {
  const admin = await requireAdmin();
  await applyAdminEdit(recordId, { attendance: value }, admin.id);
}

export async function adminUpdateNoteAction(recordId: string, note: string | null) {
  const admin = await requireAdmin();
  await applyAdminEdit(recordId, { note }, admin.id);
}

export async function adminDeleteRecordAction(recordId: string) {
  await requireAdmin();
  await db.delete(studyRecords).where(eq(studyRecords.id, recordId));
  revalidatePath("/yonetim/kayitlar");
  revalidatePath("/etut");
  revalidatePath("/ogrencilerim");
}
