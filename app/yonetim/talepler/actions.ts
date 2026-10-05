"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/client";
import { branchAccessRequests } from "@/db/schema";
import { runAction } from "@/lib/action-result";
import { PermissionError, requireRole } from "@/lib/permissions";
import { getOrCreateProfile } from "@/lib/profile";

async function requireAdmin() {
  const user = await getOrCreateProfile();
  return requireRole(user, "admin");
}

function refresh() {
  revalidatePath("/yonetim/talepler");
  revalidatePath("/taleplerim");
  revalidatePath("/gruplar");
}

/** Bekleyen branş erişim talebini onayla ya da reddet. */
export async function decideBranchRequestAction(requestId: string, decision: "approved" | "rejected") {
  return runAction(async () => {
    const admin = await requireAdmin();
    if (decision !== "approved" && decision !== "rejected") throw new PermissionError("Geçersiz karar.");
    const [request] = await db
      .select()
      .from(branchAccessRequests)
      .where(eq(branchAccessRequests.id, requestId))
      .limit(1);
    if (!request) throw new PermissionError("Talep bulunamadı.");
    if (request.status !== "pending") throw new PermissionError("Bu talep zaten karara bağlanmış.");

    await db
      .update(branchAccessRequests)
      .set({ status: decision, decidedAt: new Date(), decidedBy: admin.id })
      .where(eq(branchAccessRequests.id, requestId));
    refresh();
  });
}

/** Onaylanmış erişimi kaldır (talep silinir; asistan isterse yeniden talep açabilir). */
export async function revokeBranchRequestAction(requestId: string) {
  return runAction(async () => {
    await requireAdmin();
    await db.delete(branchAccessRequests).where(eq(branchAccessRequests.id, requestId));
    refresh();
  });
}
