"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/client";
import { branchAccessRequests, branches, institutions, profiles, teacherInstitutions } from "@/db/schema";
import { runAction } from "@/lib/action-result";
import { isLevel } from "@/lib/levels";
import { PermissionError, requireRole } from "@/lib/permissions";
import { getOrCreateProfile } from "@/lib/profile";

async function requireAdmin() {
  const user = await getOrCreateProfile();
  return requireRole(user, "admin");
}

function cleanName(name: string, label: string): string {
  const value = typeof name === "string" ? name.trim() : "";
  if (!value) throw new PermissionError(`${label} adı gerekli.`);
  if (value.length > 100) throw new PermissionError(`${label} adı en fazla 100 karakter olabilir.`);
  return value;
}

/** Yeni kurum: yalnızca yönetici. Aynı adlı kurum olabilir; ayırt eden id'dir. */
export async function createInstitutionAction(name: string) {
  return runAction(async () => {
    await requireAdmin();
    const [created] = await db
      .insert(institutions)
      .values({ name: cleanName(name, "Kurum") })
      .returning({ id: institutions.id });
    revalidatePath("/yonetim/kurumlar");
    revalidatePath("/yonetim/ogretmenler");
    return created;
  });
}

export async function renameInstitutionAction(id: string, name: string) {
  return runAction(async () => {
    await requireAdmin();
    await db.update(institutions).set({ name: cleanName(name, "Kurum") }).where(eq(institutions.id, id));
    revalidatePath("/yonetim/kurumlar");
    revalidatePath("/yonetim/ogretmenler");
  });
}

/** Yalnızca hiçbir öğretmene ve talebe bağlı olmayan kurum silinebilir. */
export async function deleteInstitutionAction(id: string) {
  return runAction(async () => {
    await requireAdmin();
    const [member] = await db
      .select({ teacherId: teacherInstitutions.teacherId })
      .from(teacherInstitutions)
      .where(eq(teacherInstitutions.institutionId, id))
      .limit(1);
    const [request] = await db
      .select({ id: branchAccessRequests.id })
      .from(branchAccessRequests)
      .where(eq(branchAccessRequests.institutionId, id))
      .limit(1);
    if (member || request) {
      throw new PermissionError("Bu kuruma bağlı öğretmen veya talep var; önce onları kaldırın.");
    }
    await db.delete(institutions).where(eq(institutions.id, id));
    revalidatePath("/yonetim/kurumlar");
  });
}

/** Yeni dal (branş + seviye): yalnızca yönetici. */
export async function createBranchAction(name: string, level: string) {
  return runAction(async () => {
    await requireAdmin();
    const cleaned = cleanName(name, "Dal");
    if (!isLevel(level)) throw new PermissionError("Geçerli bir seviye seçin.");

    const [existing] = await db
      .select({ id: branches.id })
      .from(branches)
      .where(and(eq(branches.name, cleaned), eq(branches.level, level)))
      .limit(1);
    if (existing) throw new PermissionError("Bu dal (aynı branş ve seviye) zaten tanımlı.");

    const [created] = await db.insert(branches).values({ name: cleaned, level }).returning({ id: branches.id });
    revalidatePath("/yonetim/kurumlar");
    revalidatePath("/yonetim/ogretmenler");
    return created;
  });
}

/** Yalnızca hiçbir öğretmene ve talebe bağlı olmayan dal silinebilir. */
export async function deleteBranchAction(id: string) {
  return runAction(async () => {
    await requireAdmin();
    const [teacher] = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.branchId, id)).limit(1);
    const [request] = await db
      .select({ id: branchAccessRequests.id })
      .from(branchAccessRequests)
      .where(eq(branchAccessRequests.branchId, id))
      .limit(1);
    if (teacher || request) {
      throw new PermissionError("Bu dala bağlı öğretmen veya talep var; önce onları kaldırın.");
    }
    await db.delete(branches).where(eq(branches.id, id));
    revalidatePath("/yonetim/kurumlar");
  });
}
