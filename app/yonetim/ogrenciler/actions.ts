"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/client";
import { studentStudyDays, students } from "@/db/schema";
import { requireRole } from "@/lib/permissions";
import { getOrCreateProfile } from "@/lib/profile";

async function requireAdmin() {
  const user = await getOrCreateProfile();
  return requireRole(user, "admin");
}

export async function addStudentAction(headTeacherId: string): Promise<{ id: string }> {
  await requireAdmin();
  const [created] = await db
    .insert(students)
    .values({ fullName: "Yeni öğrenci", className: "5-A", headTeacherId, isActive: true })
    .returning({ id: students.id });
  revalidatePath("/yonetim/ogrenciler");
  revalidatePath("/etut");
  revalidatePath("/ogrencilerim");
  return created;
}

export async function updateStudentAction(
  studentId: string,
  patch: { fullName?: string; className?: string; headTeacherId?: string },
) {
  await requireAdmin();
  await db.update(students).set(patch).where(eq(students.id, studentId));
  revalidatePath("/yonetim/ogrenciler");
  revalidatePath("/etut");
  revalidatePath("/ogrencilerim");
}

export async function setStudentDaysAction(studentId: string, weekdays: number[]) {
  await requireAdmin();
  await db.transaction(async (tx) => {
    await tx.delete(studentStudyDays).where(eq(studentStudyDays.studentId, studentId));
    if (weekdays.length > 0) {
      await tx.insert(studentStudyDays).values(weekdays.map((weekday) => ({ studentId, weekday })));
    }
  });
  revalidatePath("/yonetim/ogrenciler");
  revalidatePath("/etut");
  revalidatePath("/gruplar");
}

export async function deleteStudentAction(studentId: string) {
  await requireAdmin();
  // Yumuşak silme: geçmiş kayıtlar ve istatistikler korunur, öğrenci yalnızca
  // aktif listelerden/etüt akışından kaybolur.
  await db.update(students).set({ isActive: false }).where(eq(students.id, studentId));
  revalidatePath("/yonetim/ogrenciler");
  revalidatePath("/etut");
  revalidatePath("/ogrencilerim");
}
