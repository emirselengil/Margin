"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/client";
import { studyRecords, students } from "@/db/schema";
import { canAddStudentForHeadTeacher, canWriteHeadTeacherNote, PermissionError } from "@/lib/permissions";
import { getOrCreateProfile } from "@/lib/profile";

/** Baş öğretmen kendi altına yeni bir öğrenci ekler. */
export async function addMyStudentAction(fullName: string, className: string): Promise<{ id: string }> {
  const user = await getOrCreateProfile();
  if (!user || !(await canAddStudentForHeadTeacher(user, user.id))) {
    throw new PermissionError("Öğrenci ekleme yetkiniz yok.");
  }

  const [created] = await db
    .insert(students)
    .values({ fullName, className, headTeacherId: user.id, isActive: true })
    .returning({ id: students.id });

  revalidatePath("/ogrencilerim");
  revalidatePath("/yonetim/ogrenciler");
  revalidatePath("/gruplar");
  return created;
}

export type HeadTeacherNoteResult = { ok: true } | { ok: false; message: string };

const HEAD_TEACHER_NOTE_MAX = 1000;

/**
 * Etüt kaydına baş öğretmen notu yazar/siler (boş = sil). Not yalnızca asistanın
 * zaten girdiği bir kayda eklenir; kayıt yoksa reddedilir. Beklenen hatalar
 * (üretimde maskelenmesin diye) fırlatılmaz, sonuç olarak döner.
 */
export async function setHeadTeacherNoteAction(
  studentId: string,
  dateISO: string,
  note: string | null,
): Promise<HeadTeacherNoteResult> {
  try {
    const user = await getOrCreateProfile();
    if (!(await canWriteHeadTeacherNote(user, studentId))) {
      throw new PermissionError("Bu öğrenci için not yazma yetkiniz yok.");
    }
    const value = typeof note === "string" && note.trim() ? note.trim() : null;
    if (value && value.length > HEAD_TEACHER_NOTE_MAX) {
      throw new PermissionError(`Not en fazla ${HEAD_TEACHER_NOTE_MAX} karakter olabilir.`);
    }
    const updated = await db
      .update(studyRecords)
      .set({ headTeacherNote: value })
      .where(and(eq(studyRecords.studentId, studentId), eq(studyRecords.date, dateISO)))
      .returning({ id: studyRecords.id });
    if (updated.length === 0) {
      throw new PermissionError("Bu gün için henüz etüt kaydı girilmemiş; kayıt girilince not ekleyebilirsiniz.");
    }
    revalidatePath(`/ogrencilerim/${studentId}`);
    revalidatePath(`/etut/${studentId}`);
    revalidatePath("/yonetim/kayitlar");
    return { ok: true };
  } catch (e) {
    if (e instanceof PermissionError) return { ok: false, message: e.message };
    throw e;
  }
}
