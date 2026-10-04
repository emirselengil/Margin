import { eq, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { branches, institutionBranches, institutions, profiles, teacherInstitutions } from "@/db/schema";

export type InstitutionRow = { id: string; name: string; teacherCount: number; branchIds: string[] };
export type BranchRow = { id: string; name: string; level: string; teacherCount: number };

export async function getInstitutions(): Promise<InstitutionRow[]> {
  const rows = await db
    .select({
      id: institutions.id,
      name: institutions.name,
      teacherCount: sql<number>`count(${teacherInstitutions.teacherId})::int`,
    })
    .from(institutions)
    .leftJoin(teacherInstitutions, eq(teacherInstitutions.institutionId, institutions.id))
    .groupBy(institutions.id)
    .orderBy(institutions.name, institutions.createdAt);

  const links = await db.select().from(institutionBranches);
  const byInstitution = new Map<string, string[]>();
  for (const l of links) {
    const list = byInstitution.get(l.institutionId) ?? [];
    list.push(l.branchId);
    byInstitution.set(l.institutionId, list);
  }
  return rows.map((r) => ({ ...r, branchIds: byInstitution.get(r.id) ?? [] }));
}

export async function getBranches(): Promise<BranchRow[]> {
  const rows = await db
    .select({
      id: branches.id,
      name: branches.name,
      level: branches.level,
      teacherCount: sql<number>`count(${profiles.id})::int`,
    })
    .from(branches)
    .leftJoin(profiles, eq(profiles.branchId, branches.id))
    .groupBy(branches.id)
    .orderBy(branches.level, branches.name);
  return rows;
}
