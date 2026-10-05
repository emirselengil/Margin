import { desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db/client";
import {
  branchAccessRequests,
  branches,
  institutionBranches,
  institutions,
  profiles,
  teacherInstitutions,
} from "@/db/schema";
import { institutionLabels } from "@/lib/institutions";

export type MyRequestRow = {
  id: string;
  status: "pending" | "approved" | "rejected";
  institutionName: string;
  branchName: string;
  level: string;
};

export type MyOrgInfo = {
  branch: { id: string; name: string; level: string } | null;
  /** Kendi kurumları; her birinde talep açılabilecek branşlar (o kuruma atanmış, kendi seviyesinde, kendi branşı dışında) */
  institutions: {
    id: string;
    name: string;
    requestableBranches: { id: string; name: string; level: string }[];
  }[];
  requests: MyRequestRow[];
};

export async function getMyOrgInfo(assistantId: string): Promise<MyOrgInfo> {
  const [me] = await db.select({ branchId: profiles.branchId }).from(profiles).where(eq(profiles.id, assistantId)).limit(1);

  let branch: MyOrgInfo["branch"] = null;
  if (me?.branchId) {
    const [b] = await db.select().from(branches).where(eq(branches.id, me.branchId)).limit(1);
    if (b) branch = { id: b.id, name: b.name, level: b.level };
  }

  const memberships = await db
    .select({ id: institutions.id, name: institutions.name })
    .from(teacherInstitutions)
    .innerJoin(institutions, eq(institutions.id, teacherInstitutions.institutionId))
    .where(eq(teacherInstitutions.teacherId, assistantId))
    .orderBy(institutions.name);

  const offered =
    memberships.length > 0
      ? await db
          .select({ institutionId: institutionBranches.institutionId, branch: branches })
          .from(institutionBranches)
          .innerJoin(branches, eq(branches.id, institutionBranches.branchId))
          .where(
            inArray(
              institutionBranches.institutionId,
              memberships.map((m) => m.id),
            ),
          )
          .orderBy(branches.name)
      : [];

  const requestRows = await db
    .select({ request: branchAccessRequests, institution: institutions, branch: branches })
    .from(branchAccessRequests)
    .innerJoin(institutions, eq(institutions.id, branchAccessRequests.institutionId))
    .innerJoin(branches, eq(branches.id, branchAccessRequests.branchId))
    .where(eq(branchAccessRequests.assistantId, assistantId))
    .orderBy(desc(branchAccessRequests.createdAt));

  const labels = institutionLabels(await db.select({ id: institutions.id, name: institutions.name }).from(institutions));

  return {
    branch,
    institutions: memberships.map((m) => ({
      id: m.id,
      name: labels[m.id] ?? m.name,
      requestableBranches: branch
        ? offered
            .filter((o) => o.institutionId === m.id && o.branch.level === branch.level && o.branch.id !== branch.id)
            .map((o) => ({ id: o.branch.id, name: o.branch.name, level: o.branch.level }))
        : [],
    })),
    requests: requestRows.map(({ request, institution, branch: b }) => ({
      id: request.id,
      status: request.status,
      institutionName: labels[institution.id] ?? institution.name,
      branchName: b.name,
      level: b.level,
    })),
  };
}

