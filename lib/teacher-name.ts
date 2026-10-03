import type { Role } from "@/lib/roles";

export const HIDDEN_TEACHER_NAME = "—";

/**
 * Pasif (devre dışı bırakılmış) öğretmenlerin adını yönetici dışında kimseye
 * göstermeyiz; onun yerine boş bir işaret döner.
 */
export function teacherDisplayName(
  teacher: { firstName: string; lastName: string; isActive: boolean },
  viewerRole: Role,
): string {
  if (!teacher.isActive && viewerRole !== "admin") return HIDDEN_TEACHER_NAME;
  return `${teacher.firstName} ${teacher.lastName}`;
}
