"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/client";
import { assistantHeadTeachers, profiles, students, studentStudyDays } from "@/db/schema";
import {
  canAddStudentForHeadTeacher,
  canEditStudentDays,
  canEditStudentInfo,
  PermissionError,
} from "@/lib/permissions";
import { getOrCreateProfile } from "@/lib/profile";

export type StudyDaysChange = { studentId: string; weekdays: number[] };

/**
 * Bir baş öğretmenin altına yeni öğrenci ekler. Asistan, henüz bağlı
 * olmadığı bir baş öğretmen için öğrenci eklerse, bu işlem aynı zamanda
 * asistan–baş öğretmen bağını da kurar; aksi halde asistan az önce kendi
 * eklediği öğrenciyi görüntüleyemez/düzenleyemez (bkz. `visibleStudentIds`).
 */
export async function addStudentAction(
  headTeacherId: string,
  fullName: string,
  className: string,
): Promise<{ id: string }> {
  const user = await getOrCreateProfile();
  if (!user || !(await canAddStudentForHeadTeacher(user, headTeacherId))) {
    throw new PermissionError("Bu baş öğretmen için öğrenci ekleme yetkiniz yok.");
  }

  const [target] = await db.select({ role: profiles.role }).from(profiles).where(eq(profiles.id, headTeacherId)).limit(1);
  if (target?.role !== "head_teacher") {
    throw new PermissionError("Seçilen kişi bir öğretmen değil.");
  }

  const [created] = await db
    .insert(students)
    .values({ fullName, className, headTeacherId, isActive: true })
    .returning({ id: students.id });

  if (user.role === "assistant") {
    await db
      .insert(assistantHeadTeachers)
      .values({ assistantId: user.id, headTeacherId })
      .onConflictDoNothing();
  }

  revalidatePath("/gruplar");
  revalidatePath("/etut");
  revalidatePath("/ogrencilerim");
  revalidatePath("/yonetim/ogrenciler");
  return created;
}

/**
 * Öğrencinin ad/sınıf/öğretmen bilgilerini düzenler. admin ve bağlı assistant
 * kullanabilir. Asistan öğrenciyi, henüz bağlı olmadığı bir öğretmene de
 * atayabilir; bu durumda (eklemede olduğu gibi) bağ otomatik kurulur, aksi
 * halde öğrenci asistanın listesinden kaybolurdu.
 */
export async function updateStudentInfoAction(
  studentId: string,
  patch: { fullName: string; className: string; headTeacherId: string },
) {
  const user = await getOrCreateProfile();
  if (!user || !(await canEditStudentInfo(user, studentId))) {
    throw new PermissionError("Bu öğrencinin bilgilerini düzenleme yetkiniz yok.");
  }
  if (!(await canAddStudentForHeadTeacher(user, patch.headTeacherId))) {
    throw new PermissionError("Öğrenciyi bu öğretmene atama yetkiniz yok.");
  }
  const [target] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, patch.headTeacherId))
    .limit(1);
  if (target?.role !== "head_teacher") {
    throw new PermissionError("Seçilen kişi bir öğretmen değil.");
  }

  await db.update(students).set(patch).where(eq(students.id, studentId));

  if (user.role === "assistant") {
    await db
      .insert(assistantHeadTeachers)
      .values({ assistantId: user.id, headTeacherId: patch.headTeacherId })
      .onConflictDoNothing();
  }

  revalidatePath("/gruplar");
  revalidatePath("/etut");
  revalidatePath("/ogrencilerim");
  revalidatePath("/yonetim/ogrenciler");
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
