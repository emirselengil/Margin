"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/client";
import { assistantHeadTeachers, branches, institutions, profiles, teacherInstitutions } from "@/db/schema";
import { runAction } from "@/lib/action-result";
import { auth } from "@/lib/auth/server";
import {
  assertKeepsOneActiveAdmin,
  assertNotSelfDelete,
  assertNotSelfRoleDemotion,
  PermissionError,
  requireRole,
} from "@/lib/permissions";
import { getOrCreateProfile } from "@/lib/profile";
import type { Role } from "@/lib/roles";

async function requireAdmin() {
  const user = await getOrCreateProfile();
  return requireRole(user, "admin");
}

export async function approvePendingAction(targetId: string, role: Exclude<Role, "pending">) {
  await requireAdmin();
  await db.update(profiles).set({ role, isActive: true }).where(eq(profiles.id, targetId));
  revalidatePath("/yonetim/ogretmenler");
}

export async function rejectPendingAction(targetId: string) {
  await requireAdmin();
  // Profil satırı silinmez; kalıcı reddedildi olarak işaretlenir (pending +
  // pasif), böylece kişi tekrar giriş yapsa bile otomatik olarak yeniden
  // "onay bekliyor" durumuna dönmez.
  await db.update(profiles).set({ isActive: false }).where(eq(profiles.id, targetId));
  revalidatePath("/yonetim/ogretmenler");
}

export async function setRoleAction(targetId: string, role: Exclude<Role, "pending">) {
  const admin = await requireAdmin();
  assertNotSelfRoleDemotion(admin.id, targetId, role);

  const [target] = await db.select().from(profiles).where(eq(profiles.id, targetId)).limit(1);
  if (!target) throw new PermissionError("Öğretmen bulunamadı.");
  if (target.role === "admin" && target.isActive && role !== "admin") {
    await assertKeepsOneActiveAdmin(targetId);
  }

  await db.transaction(async (tx) => {
    await tx.update(profiles).set({ role }).where(eq(profiles.id, targetId));
    if (role !== "assistant") {
      await tx.delete(assistantHeadTeachers).where(eq(assistantHeadTeachers.assistantId, targetId));
    }
  });
  revalidatePath("/yonetim/ogretmenler");
}

export async function setActiveAction(targetId: string, isActive: boolean) {
  await requireAdmin();
  if (!isActive) {
    const [target] = await db.select().from(profiles).where(eq(profiles.id, targetId)).limit(1);
    if (target?.role === "admin" && target.isActive) {
      await assertKeepsOneActiveAdmin(targetId);
    }
  }
  await db.update(profiles).set({ isActive }).where(eq(profiles.id, targetId));
  revalidatePath("/yonetim/ogretmenler");
}

export async function setAssistantLinksAction(assistantId: string, headTeacherIds: string[]) {
  await requireAdmin();
  await db.transaction(async (tx) => {
    await tx.delete(assistantHeadTeachers).where(eq(assistantHeadTeachers.assistantId, assistantId));
    if (headTeacherIds.length > 0) {
      await tx
        .insert(assistantHeadTeachers)
        .values(headTeacherIds.map((headTeacherId) => ({ assistantId, headTeacherId })));
    }
  });
  revalidatePath("/yonetim/ogretmenler");
}

async function requireTeacher(teacherId: string) {
  const [target] = await db.select().from(profiles).where(eq(profiles.id, teacherId)).limit(1);
  if (!target || (target.role !== "head_teacher" && target.role !== "assistant")) {
    throw new PermissionError("Dal ve kurum yalnızca öğretmenlere atanabilir.");
  }
  return target;
}

/** Öğretmenin dalını (branş + seviye) yalnızca yönetici atar. null = dal yok. */
export async function setTeacherBranchAction(teacherId: string, branchId: string | null) {
  return runAction(async () => {
    await requireAdmin();
    await requireTeacher(teacherId);
    if (branchId !== null) {
      const [branch] = await db.select({ id: branches.id }).from(branches).where(eq(branches.id, branchId)).limit(1);
      if (!branch) throw new PermissionError("Dal bulunamadı.");
    }
    await db.update(profiles).set({ branchId }).where(eq(profiles.id, teacherId));
    revalidatePath("/yonetim/ogretmenler");
    revalidatePath("/yonetim/kurumlar");
    revalidatePath("/gruplar");
  });
}

/** Öğretmenin kurumlarını (birden fazla olabilir) yalnızca yönetici atar. */
export async function setTeacherInstitutionsAction(teacherId: string, institutionIds: string[]) {
  return runAction(async () => {
    await requireAdmin();
    await requireTeacher(teacherId);
    const unique = Array.from(new Set(institutionIds));
    if (unique.length > 0) {
      const found = await db.select({ id: institutions.id }).from(institutions).where(inArray(institutions.id, unique));
      if (found.length !== unique.length) throw new PermissionError("Seçilen kurumlardan biri bulunamadı.");
    }
    await db.transaction(async (tx) => {
      await tx.delete(teacherInstitutions).where(eq(teacherInstitutions.teacherId, teacherId));
      if (unique.length > 0) {
        await tx.insert(teacherInstitutions).values(unique.map((institutionId) => ({ teacherId, institutionId })));
      }
    });
    revalidatePath("/yonetim/ogretmenler");
    revalidatePath("/yonetim/kurumlar");
    revalidatePath("/gruplar");
  });
}

export async function deleteTeacherAction(targetId: string) {
  const admin = await requireAdmin();
  assertNotSelfDelete(admin.id, targetId);

  const [target] = await db.select().from(profiles).where(eq(profiles.id, targetId)).limit(1);
  if (!target) throw new PermissionError("Öğretmen bulunamadı.");
  if (target.role === "admin" && target.isActive) {
    await assertKeepsOneActiveAdmin(targetId);
  }

  await db
    .update(profiles)
    .set({ isActive: false, deletedAt: new Date() })
    .where(eq(profiles.id, targetId));
  revalidatePath("/yonetim/ogretmenler");
}

export async function sendPasswordResetAction(email: string): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  try {
    const { error } = await auth.requestPasswordReset({ email, redirectTo: "/giris" });
    if (error) return { ok: false, message: "Şifre sıfırlama bağlantısı gönderilemedi." };
    return { ok: true, message: "Şifre sıfırlama bağlantısı gönderildi." };
  } catch {
    return { ok: false, message: "Şifre sıfırlama bağlantısı gönderilemedi." };
  }
}
