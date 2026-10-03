"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/db/client";
import { students } from "@/db/schema";
import { canAddStudentForHeadTeacher, PermissionError } from "@/lib/permissions";
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
