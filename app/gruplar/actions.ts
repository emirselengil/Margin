"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/client";
import { students, studentStudyDays } from "@/db/schema";
import { canAddStudentForHeadTeacher, canEditStudentDays, PermissionError } from "@/lib/permissions";
import { getOrCreateProfile } from "@/lib/profile";

export type StudyDaysChange = { studentId: string; weekdays: number[] };

/** Bağlı olduğu bir baş öğretmenin altına yeni öğrenci ekler. */
export async function addStudentAction(
  headTeacherId: string,
  fullName: string,
  className: string,
): Promise<{ id: string }> {
  const user = await getOrCreateProfile();
  if (!(await canAddStudentForHeadTeacher(user, headTeacherId))) {
    throw new PermissionError("Bu baş öğretmen için öğrenci ekleme yetkiniz yok.");
  }

  const [created] = await db
    .insert(students)
    .values({ fullName, className, headTeacherId, isActive: true })
    .returning({ id: students.id });

  revalidatePath("/gruplar");
  revalidatePath("/etut");
  revalidatePath("/ogrencilerim");
  revalidatePath("/yonetim/ogrenciler");
  return created;
}

export async function saveStudyDaysAction(changes: StudyDaysChange[]) {
  const user = await getOrCreateProfile();

  for (const change of changes) {
    if (!(await canEditStudentDays(user, change.studentId))) {
      throw new PermissionError("Bu öğrencinin etüt günlerini düzenleme yetkiniz yok.");
    }
  }

  await db.transaction(async (tx) => {
    for (const change of changes) {
      await tx.delete(studentStudyDays).where(eq(studentStudyDays.studentId, change.studentId));
      if (change.weekdays.length > 0) {
        await tx
          .insert(studentStudyDays)
          .values(change.weekdays.map((weekday) => ({ studentId: change.studentId, weekday })));
      }
    }
  });

  revalidatePath("/gruplar");
  revalidatePath("/etut");
}
