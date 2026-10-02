import { and, eq, inArray } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";

import { db as defaultDb } from "@/db/client";
import * as schema from "@/db/schema";
import { assistantHeadTeachers, students } from "@/db/schema";
import type { Role } from "@/lib/roles";

// Üretimde neon-serverless, testlerde PGlite sürücüsü kullanılıyor; ikisi de
// farklı bir QueryResultHKT'ye sahip olduğundan burada sürücüden bağımsız
// tutuyoruz (yalnızca schema'ya bağlı select/insert/update/delete kullanılıyor,
// sürücüye özgü ham sonuç tipine hiç ihtiyaç yok).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Database = PgDatabase<any, typeof schema>;

export type CurrentUser = {
  id: string;
  role: Role;
  isActive: boolean;
};

export class PermissionError extends Error {
  constructor(message = "Bu işlem için yetkiniz yok.") {
    super(message);
    this.name = "PermissionError";
  }
}

/**
 * Kullanıcının oturumda olup olmadığını, hesabının aktif olduğunu ve
 * verilen rollerden birine sahip olduğunu doğrular. Sağlanmazsa 403
 * anlamına gelen `PermissionError` fırlatır.
 */
export function requireRole(user: CurrentUser | null, ...roles: Role[]): CurrentUser {
  if (!user || !user.isActive) {
    throw new PermissionError("Hesabınız aktif değil veya oturumunuz yok.");
  }
  if (!roles.includes(user.role)) {
    throw new PermissionError("Bu işlem için yetkiniz yok.");
  }
  return user;
}

/**
 * Kullanıcının görebileceği tüm öğrenci kimlikleri. Listeler her zaman bu
 * fonksiyonla filtrelenir; arayüzde gizlemek yetmez.
 *
 * - admin: tüm öğrenciler (pasif olanlar dahil, yönetim ekranı için)
 * - head_teacher: yalnızca kendi öğrencileri (aktif olanlar)
 * - assistant: bağlı olduğu baş öğretmenlerin aktif öğrencileri
 * - pending / oturumsuz: hiçbiri
 */
export async function visibleStudentIds(
  user: CurrentUser | null,
  database: Database = defaultDb,
): Promise<string[]> {
  if (!user || !user.isActive) return [];

  if (user.role === "admin") {
    const rows = await database.select({ id: students.id }).from(students);
    return rows.map((r) => r.id);
  }

  if (user.role === "head_teacher") {
    const rows = await database
      .select({ id: students.id })
      .from(students)
      .where(and(eq(students.headTeacherId, user.id), eq(students.isActive, true)));
    return rows.map((r) => r.id);
  }

  if (user.role === "assistant") {
    const links = await database
      .select({ headTeacherId: assistantHeadTeachers.headTeacherId })
      .from(assistantHeadTeachers)
      .where(eq(assistantHeadTeachers.assistantId, user.id));
    const headTeacherIds = links.map((l) => l.headTeacherId);
    if (headTeacherIds.length === 0) return [];

    const rows = await database
      .select({ id: students.id })
      .from(students)
      .where(and(inArray(students.headTeacherId, headTeacherIds), eq(students.isActive, true)));
    return rows.map((r) => r.id);
  }

  return []; // pending
}

/** Kullanıcı bu öğrenciyi görebilir mi (kayıtları, geçmişi vb.)? */
export async function canViewStudent(
  user: CurrentUser | null,
  studentId: string,
  database: Database = defaultDb,
): Promise<boolean> {
  const ids = await visibleStudentIds(user, database);
  return ids.includes(studentId);
}

/** Bu öğrenciye kayıt ekleyebilir/düzenleyebilir mi? Yalnızca admin ve bağlı assistant. */
export async function canWriteRecord(
  user: CurrentUser | null,
  studentId: string,
  database: Database = defaultDb,
): Promise<boolean> {
  if (!user || !user.isActive) return false;
  if (user.role === "admin") return true;
  if (user.role !== "assistant") return false;
  return canViewStudent(user, studentId, database);
}

/** Bu öğrencinin etüt günlerini düzenleyebilir mi? admin ve bağlı assistant. */
export async function canEditStudentDays(
  user: CurrentUser | null,
  studentId: string,
  database: Database = defaultDb,
): Promise<boolean> {
  return canWriteRecord(user, studentId, database);
}
