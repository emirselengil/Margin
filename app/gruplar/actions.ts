"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/client";
import { studentStudyDays } from "@/db/schema";
import { canEditStudentDays, PermissionError } from "@/lib/permissions";
import { getOrCreateProfile } from "@/lib/profile";

export type StudyDaysChange = { studentId: string; weekdays: number[] };

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
