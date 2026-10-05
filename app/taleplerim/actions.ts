"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/client";
import { branchAccessRequests } from "@/db/schema";
import { runAction } from "@/lib/action-result";
import { assertCanRequestBranchAccess, PermissionError } from "@/lib/permissions";
import { getOrCreateProfile } from "@/lib/profile";

/**
 * Asistan, kendi kurumundaki farklı bir daldaki (kendi seviyesinde) öğretmenleri
 * görmek için yöneticiye talep açar. Kurallar `assertCanRequestBranchAccess`'te.
 */
export async function createBranchRequestAction(institutionId: string, branchId: string) {
  return runAction(async () => {
    const user = await getOrCreateProfile();
    await assertCanRequestBranchAccess(user, institutionId, branchId);

    const [existing] = await db
      .select()
      .from(branchAccessRequests)
      .where(
        and(
          eq(branchAccessRequests.assistantId, user!.id),
          eq(branchAccessRequests.institutionId, institutionId),
          eq(branchAccessRequests.branchId, branchId),
        ),
      )
      .limit(1);

    if (!existing) {
      await db.insert(branchAccessRequests).values({ assistantId: user!.id, institutionId, branchId });
    } else if (existing.status === "rejected") {
      // Reddedilen talep yeniden açılabilir
      await db
        .update(branchAccessRequests)
        .set({ status: "pending", decidedAt: null, decidedBy: null, createdAt: new Date() })
        .where(eq(branchAccessRequests.id, existing.id));
    } else if (existing.status === "approved") {
      throw new PermissionError("Bu branş için zaten erişiminiz var.");
    } else {
      throw new PermissionError("Bu branş için bekleyen bir talebiniz zaten var.");
    }
    revalidatePath("/taleplerim");
    revalidatePath("/yonetim/talepler");
  });
}

/** Kendi bekleyen talebini geri çek. */
export async function cancelBranchRequestAction(requestId: string) {
  return runAction(async () => {
    const user = await getOrCreateProfile();
    if (!user || !user.isActive || user.role !== "assistant") {
      throw new PermissionError("Bu işlem için yetkiniz yok.");
    }
    await db
      .delete(branchAccessRequests)
      .where(
        and(
          eq(branchAccessRequests.id, requestId),
          eq(branchAccessRequests.assistantId, user.id),
          eq(branchAccessRequests.status, "pending"),
        ),
      );
    revalidatePath("/taleplerim");
    revalidatePath("/yonetim/talepler");
  });
}
