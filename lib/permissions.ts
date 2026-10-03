import { and, eq, inArray, ne } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";

import { db as defaultDb } from "@/db/client";
import * as schema from "@/db/schema";
import { assistantHeadTeachers, profiles, studentStudyDays, students } from "@/db/schema";
import { weekdayOfISODate } from "@/lib/date";
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

/** `dateISO`'nun haftanın günü, öğrencinin atandığı etüt günlerinden biri mi? */
export async function isStudentScheduledOn(
  studentId: string,
  dateISO: string,
  database: Database = defaultDb,
): Promise<boolean> {
  const weekday = weekdayOfISODate(dateISO);
  const rows = await database
    .select({ weekday: studentStudyDays.weekday })
    .from(studentStudyDays)
    .where(and(eq(studentStudyDays.studentId, studentId), eq(studentStudyDays.weekday, weekday)));
  return rows.length > 0;
}

/**
 * `headTeacherId`'ye bağlı yeni bir öğrenci ekleyebilir mi?
 * - admin: her zaman
 * - head_teacher: yalnızca kendi altına (kendi id'si verilmişse)
 * - assistant: herhangi bir baş öğretmene — yeni öğrenci eklemek, henüz
 *   bağlı olmadığı bir baş öğretmenle ilk ilişkiyi kurmanın yolu olabilir,
 *   bu yüzden bu tek işlemde bağlı olma şartı aranmaz (yalnızca head_teacher
 *   rolündeki aktif bir kullanıcıya atanabilir; bunu veritabanı FK'si zaten
 *   garanti eder)
 */
export async function canAddStudentForHeadTeacher(
  user: CurrentUser | null,
  headTeacherId: string,
): Promise<boolean> {
  if (!user || !user.isActive) return false;
  if (user.role === "admin" || user.role === "assistant") return true;
  if (user.role === "head_teacher") return user.id === headTeacherId;
  return false;
}

// --- Yönetici hesap yönetimi kuralları ---
// "Bir yönetici kendi rolünü düşüremesin, kendi hesabını silemesin;
// en az bir aktif yönetici kalsın."

/** Yönetici kendi rolünü admin dışında bir şeye düşüremez. */
export function assertNotSelfRoleDemotion(actingUserId: string, targetId: string, newRole: Role) {
  if (actingUserId === targetId && newRole !== "admin") {
    throw new PermissionError("Kendi rolünüzü düşüremezsiniz.");
  }
}

/** Yönetici kendi hesabını silemez. */
export function assertNotSelfDelete(actingUserId: string, targetId: string) {
  if (actingUserId === targetId) {
    throw new PermissionError("Kendi hesabınızı silemezsiniz.");
  }
}

/**
 * `targetId` dışındaki aktif yönetici sayısını döner. Bir yöneticinin
 * rolünü değiştirmeden / devre dışı bırakmadan / silmeden önce, bu sayının
 * en az 1 olduğu (yani en az bir BAŞKA aktif yönetici kaldığı) ya da işlemin
 * targetId'yi yönetici-dışı bırakmadığı doğrulanmalıdır.
 */
async function countOtherActiveAdmins(
  database: Database,
  targetId: string,
): Promise<number> {
  const rows = await database
    .select({ id: profiles.id })
    .from(profiles)
    .where(and(eq(profiles.role, "admin"), eq(profiles.isActive, true), ne(profiles.id, targetId)));
  return rows.length;
}

/**
 * `targetId`'nin yönetici+aktif durumunu kaybetmesine yol açacak bir işlemden
 * (rol değişikliği, devre dışı bırakma, silme) önce çağrılır. Bu, sistemde
 * en az bir aktif yönetici kalmasını garanti eder.
 */
export async function assertKeepsOneActiveAdmin(
  targetId: string,
  database: Database = defaultDb,
): Promise<void> {
  const others = await countOtherActiveAdmins(database, targetId);
  if (others === 0) {
    throw new PermissionError("Sistemde en az bir aktif yönetici kalmalı.");
  }
}
