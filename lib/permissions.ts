import { and, eq, inArray, isNull, ne } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";

import { db as defaultDb } from "@/db/client";
import * as schema from "@/db/schema";
import {
  assistantHeadTeachers,
  branchAccessRequests,
  branches,
  institutionBranches,
  profiles,
  studentStudyDays,
  students,
  teacherInstitutions,
} from "@/db/schema";
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

/**
 * Etüt kaydındaki "baş öğretmen notu"nu yazabilir/düzenleyebilir mi? Yalnızca
 * admin ve öğrencinin KENDİ baş öğretmeni. Asistan bu notu görür ama değiştiremez.
 */
export async function canWriteHeadTeacherNote(
  user: CurrentUser | null,
  studentId: string,
  database: Database = defaultDb,
): Promise<boolean> {
  if (!user || !user.isActive) return false;
  if (user.role === "admin") return true;
  if (user.role !== "head_teacher") return false;
  const [row] = await database
    .select({ headTeacherId: students.headTeacherId })
    .from(students)
    .where(eq(students.id, studentId))
    .limit(1);
  return row?.headTeacherId === user.id;
}

/** Bu öğrencinin etüt günlerini düzenleyebilir mi? admin ve bağlı assistant. */
export async function canEditStudentDays(
  user: CurrentUser | null,
  studentId: string,
  database: Database = defaultDb,
): Promise<boolean> {
  return canWriteRecord(user, studentId, database);
}

/** Bu öğrencinin ad/sınıf bilgilerini düzenleyebilir mi? admin ve bağlı assistant. */
export async function canEditStudentInfo(
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
 * Kullanıcının görebileceği / seçebileceği baş öğretmenler (öğretmen
 * listeleri ve seçim kutuları için; öğrencilerin görünürlüğünü etkilemez).
 *
 * - admin: tüm aktif baş öğretmenler
 * - assistant: bir baş öğretmen ancak şu koşulların HEPSİ doğruysa görünür:
 *   1. asistanın ve öğretmenin branşı vardır ve SEVİYELERİ aynıdır
 *      (lise öğretmeni ortaokul öğretmenini göremez; talep bunu aşamaz),
 *   2. en az bir ortak kurumları vardır,
 *   3. branşları aynıdır VEYA asistan, öğretmenin branşı için o ortak kurumda
 *      yönetici tarafından ONAYLANMIŞ bir erişim talebine sahiptir.
 * - diğerleri: hiçbiri
 */
export async function visibleHeadTeacherIds(
  user: CurrentUser | null,
  database: Database = defaultDb,
): Promise<string[]> {
  if (!user || !user.isActive) return [];

  const activeHeadTeachers = and(
    eq(profiles.role, "head_teacher"),
    eq(profiles.isActive, true),
    isNull(profiles.deletedAt),
  );

  if (user.role === "admin") {
    const rows = await database.select({ id: profiles.id }).from(profiles).where(activeHeadTeachers);
    return rows.map((r) => r.id);
  }
  if (user.role !== "assistant") return [];

  const [me] = await database
    .select({ branchId: profiles.branchId, level: branches.level })
    .from(profiles)
    .innerJoin(branches, eq(branches.id, profiles.branchId))
    .where(eq(profiles.id, user.id))
    .limit(1);
  if (!me?.branchId) return [];

  const myInstitutions = (
    await database
      .select({ institutionId: teacherInstitutions.institutionId })
      .from(teacherInstitutions)
      .where(eq(teacherInstitutions.teacherId, user.id))
  ).map((r) => r.institutionId);
  if (myInstitutions.length === 0) return [];

  const candidates = await database
    .select({ id: profiles.id, branchId: profiles.branchId })
    .from(profiles)
    .innerJoin(branches, eq(branches.id, profiles.branchId))
    .where(and(activeHeadTeachers, eq(branches.level, me.level)));
  if (candidates.length === 0) return [];

  const shared = await database
    .select({ teacherId: teacherInstitutions.teacherId, institutionId: teacherInstitutions.institutionId })
    .from(teacherInstitutions)
    .where(
      and(
        inArray(
          teacherInstitutions.teacherId,
          candidates.map((c) => c.id),
        ),
        inArray(teacherInstitutions.institutionId, myInstitutions),
      ),
    );
  const sharedByTeacher = new Map<string, Set<string>>();
  for (const row of shared) {
    const set = sharedByTeacher.get(row.teacherId) ?? new Set<string>();
    set.add(row.institutionId);
    sharedByTeacher.set(row.teacherId, set);
  }

  const approvedRows = await database
    .select({ institutionId: branchAccessRequests.institutionId, branchId: branchAccessRequests.branchId })
    .from(branchAccessRequests)
    .where(and(eq(branchAccessRequests.assistantId, user.id), eq(branchAccessRequests.status, "approved")));

  // Onaylı talep, branş hâlâ o kuruma atanmışsa geçerlidir (yönetici branşı kurumdan çıkarırsa erişim de kalkar).
  const assignedRows = await database
    .select({ institutionId: institutionBranches.institutionId, branchId: institutionBranches.branchId })
    .from(institutionBranches)
    .where(inArray(institutionBranches.institutionId, myInstitutions));
  const assigned = new Set(assignedRows.map((r) => `${r.institutionId}:${r.branchId}`));
  const approved = approvedRows.filter((a) => assigned.has(`${a.institutionId}:${a.branchId}`));

  return candidates
    .filter((c) => {
      const common = sharedByTeacher.get(c.id);
      if (!common || common.size === 0) return false;
      if (c.branchId === me.branchId) return true;
      return approved.some((a) => a.branchId === c.branchId && common.has(a.institutionId));
    })
    .map((c) => c.id);
}

/**
 * Asistan, kendi kurumundaki farklı bir branş için erişim talebi açabilir mi?
 * Kurallar: aktif asistan; branşı vardır; kurum kendisinin kurumlarından biri
 * (başka kurum adına talep açılamaz); hedef branş o kuruma atanmış, kendi
 * seviyesinde ve kendi dalından farklı. Uymazsa Türkçe hata.
 */
export async function assertCanRequestBranchAccess(
  user: CurrentUser | null,
  institutionId: string,
  branchId: string,
  database: Database = defaultDb,
): Promise<void> {
  if (!user || !user.isActive || user.role !== "assistant") {
    throw new PermissionError("Branş erişim talebini yalnızca asistan öğretmenler açabilir.");
  }
  const [me] = await database
    .select({ branchId: profiles.branchId, level: branches.level })
    .from(profiles)
    .innerJoin(branches, eq(branches.id, profiles.branchId))
    .where(eq(profiles.id, user.id))
    .limit(1);
  if (!me?.branchId) {
    throw new PermissionError("Talep açabilmek için yöneticinin size bir branş atamış olması gerekir.");
  }
  const [membership] = await database
    .select({ institutionId: teacherInstitutions.institutionId })
    .from(teacherInstitutions)
    .where(and(eq(teacherInstitutions.teacherId, user.id), eq(teacherInstitutions.institutionId, institutionId)))
    .limit(1);
  if (!membership) {
    throw new PermissionError("Yalnızca kendi kurumlarınız için talep açabilirsiniz.");
  }
  const [target] = await database.select().from(branches).where(eq(branches.id, branchId)).limit(1);
  if (!target) throw new PermissionError("Branş bulunamadı.");
  if (target.level !== me.level) {
    throw new PermissionError("Yalnızca kendi seviyenizdeki branşlar için talep açabilirsiniz.");
  }
  if (target.id === me.branchId) {
    throw new PermissionError("Bu zaten sizin dalınız.");
  }
  const [offered] = await database
    .select({ branchId: institutionBranches.branchId })
    .from(institutionBranches)
    .where(and(eq(institutionBranches.institutionId, institutionId), eq(institutionBranches.branchId, branchId)))
    .limit(1);
  if (!offered) {
    throw new PermissionError("Bu branş seçtiğiniz kurumda tanımlı değil.");
  }
}

/**
 * `headTeacherId`'ye bağlı yeni bir öğrenci ekleyebilir / öğrenciyi ona atayabilir mi?
 * - admin: her zaman
 * - head_teacher: yalnızca kendi altına (kendi id'si verilmişse)
 * - assistant: yalnızca GÖREBİLDİĞİ baş öğretmenlere (`visibleHeadTeacherIds`:
 *   aynı kurum, aynı seviye, aynı branş ya da onaylı branş talebi). Öğrenci eklemek,
 *   henüz bağlı olmadığı bir baş öğretmenle ilk ilişkiyi kurmanın yolu olabilir
 *   (bkz. addStudentAction), bu yüzden mevcut asistan bağı aranmaz.
 */
export async function canAddStudentForHeadTeacher(
  user: CurrentUser | null,
  headTeacherId: string,
  database: Database = defaultDb,
): Promise<boolean> {
  if (!user || !user.isActive) return false;
  if (user.role === "admin") return true;
  if (user.role === "assistant") {
    return (await visibleHeadTeacherIds(user, database)).includes(headTeacherId);
  }
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
