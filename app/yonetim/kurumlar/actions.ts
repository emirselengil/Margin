"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/client";
import {
  branchAccessRequests,
  branches,
  institutionBranches,
  institutions,
  profiles,
  teacherInstitutions,
} from "@/db/schema";
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
    await db.transaction(async (tx) => {
      await tx.delete(institutionBranches).where(eq(institutionBranches.institutionId, id));
      await tx.delete(institutions).where(eq(institutions.id, id));
    });
    revalidatePath("/yonetim/kurumlar");
  });
}

/**
 * Kurumda hangi dalların bulunduğunu belirler (yalnızca yönetici). Asistanlar
 * bir kurumda yalnızca o kuruma atanmış dalları görebilir/talep edebilir.
 */
export async function setInstitutionBranchesAction(institutionId: string, branchIds: string[]) {
  return runAction(async () => {
    await requireAdmin();
    const [institution] = await db
      .select({ id: institutions.id })
      .from(institutions)
      .where(eq(institutions.id, institutionId))
      .limit(1);
    if (!institution) throw new PermissionError("Kurum bulunamadı.");

    const unique = Array.from(new Set(branchIds));
    if (unique.length > 0) {
      const found = await db.select({ id: branches.id }).from(branches).where(inArray(branches.id, unique));
      if (found.length !== unique.length) throw new PermissionError("Seçilen dallardan biri bulunamadı.");
    }
    await db.transaction(async (tx) => {
      await tx.delete(institutionBranches).where(eq(institutionBranches.institutionId, institutionId));
      if (unique.length > 0) {
        await tx.insert(institutionBranches).values(unique.map((branchId) => ({ institutionId, branchId })));
      }
    });
    revalidatePath("/yonetim/kurumlar");
    revalidatePath("/yonetim/talepler");
    revalidatePath("/taleplerim");
    revalidatePath("/gruplar");
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
    await db.transaction(async (tx) => {
      await tx.delete(institutionBranches).where(eq(institutionBranches.branchId, id));
      await tx.delete(branches).where(eq(branches.id, id));
    });
    revalidatePath("/yonetim/kurumlar");
  });
}
