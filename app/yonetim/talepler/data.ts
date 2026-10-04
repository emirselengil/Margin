import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "@/db/client";
import { branchAccessRequests, branches, institutions, profiles } from "@/db/schema";
import { institutionLabels } from "@/lib/institutions";

export type AdminRequestRow = {
  id: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  assistantId: string;
  assistantName: string;
  institutionName: string;
  branchName: string;
  level: string;
};

export async function getBranchRequests(): Promise<AdminRequestRow[]> {
  const assistant = alias(profiles, "assistant_profile");
  const rows = await db
    .select({ request: branchAccessRequests, assistant, institution: institutions, branch: branches })
    .from(branchAccessRequests)
    .innerJoin(assistant, eq(assistant.id, branchAccessRequests.assistantId))
    .innerJoin(institutions, eq(institutions.id, branchAccessRequests.institutionId))
    .innerJoin(branches, eq(branches.id, branchAccessRequests.branchId))
    .orderBy(desc(branchAccessRequests.createdAt));

  const labels = institutionLabels(await db.select({ id: institutions.id, name: institutions.name }).from(institutions));

  return rows.map(({ request, assistant: a, institution, branch }) => ({
    id: request.id,
    status: request.status,
    createdAt: request.createdAt.toISOString(),
    assistantId: a.id,
    assistantName: `${a.firstName} ${a.lastName}`,
    institutionName: labels[institution.id] ?? institution.name,
    branchName: branch.name,
    level: branch.level,
  }));
}

export async function countPendingBranchRequests(): Promise<number> {
  const rows = await db
    .select({ id: branchAccessRequests.id })
    .from(branchAccessRequests)
    .where(eq(branchAccessRequests.status, "pending"));
  return rows.length;
}
