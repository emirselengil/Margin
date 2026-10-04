import { and, eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createTestDb, type TestDb } from "@/db/test-utils";
import {
  assistantHeadTeachers,
  branchAccessRequests,
  branches,
  institutionBranches,
  institutions,
  profiles,
  studentStudyDays,
  students,
  teacherInstitutions,
} from "@/db/schema";
import { weekdayOfISODate } from "@/lib/date";
import {
  assertCanRequestBranchAccess,
  assertKeepsOneActiveAdmin,
  assertNotSelfDelete,
  assertNotSelfRoleDemotion,
  canAddStudentForHeadTeacher,
  canEditStudentDays,
  canEditStudentInfo,
  canViewStudent,
  canWriteRecord,
  isStudentScheduledOn,
  PermissionError,
  requireRole,
  visibleHeadTeacherIds,
  visibleStudentIds,
  type CurrentUser,
} from "@/lib/permissions";

let db: TestDb;

// Sabit kimlikler: her testte aynı kullanıcı/öğrenci kurulumunu kolayca kurmak için.
const ADMIN = "11111111-1111-1111-1111-111111111111";
const HEAD_A = "22222222-2222-2222-2222-222222222222";
const HEAD_B = "33333333-3333-3333-3333-333333333333";
const ASSISTANT_OF_A = "44444444-4444-4444-4444-444444444444";
const ASSISTANT_OF_NONE = "55555555-5555-5555-5555-555555555555";
const PENDING = "66666666-6666-6666-6666-666666666666";
const INACTIVE_ASSISTANT = "77777777-7777-7777-7777-777777777777";
const ADMIN_2 = "88888888-8888-8888-8888-888888888888";

async function seedBaseFixture(database: TestDb) {
  await database.insert(profiles).values([
    { id: ADMIN, firstName: "Ad", lastName: "Min", email: "admin@test.local", role: "admin", isActive: true },
    { id: HEAD_A, firstName: "Baş A", lastName: "Öğretmen", email: "head-a@test.local", role: "head_teacher", isActive: true },
    { id: HEAD_B, firstName: "Baş B", lastName: "Öğretmen", email: "head-b@test.local", role: "head_teacher", isActive: true },
    { id: ASSISTANT_OF_A, firstName: "Asistan", lastName: "A", email: "assistant-a@test.local", role: "assistant", isActive: true },
    { id: ASSISTANT_OF_NONE, firstName: "Asistan", lastName: "Bağsız", email: "assistant-none@test.local", role: "assistant", isActive: true },
    { id: PENDING, firstName: "Onay", lastName: "Bekleyen", email: "pending@test.local", role: "pending", isActive: true },
    { id: INACTIVE_ASSISTANT, firstName: "Pasif", lastName: "Asistan", email: "inactive@test.local", role: "assistant", isActive: false },
  ]);

  await database.insert(assistantHeadTeachers).values([{ assistantId: ASSISTANT_OF_A, headTeacherId: HEAD_A }]);

  const [studentOfA] = await database
    .insert(students)
    .values({ fullName: "A'nın Öğrencisi", className: "8-A", headTeacherId: HEAD_A, isActive: true })
    .returning({ id: students.id });
  const [studentOfB] = await database
    .insert(students)
    .values({ fullName: "B'nin Öğrencisi", className: "7-B", headTeacherId: HEAD_B, isActive: true })
    .returning({ id: students.id });
  const [inactiveStudentOfA] = await database
    .insert(students)
    .values({ fullName: "Pasif Öğrenci", className: "6-A", headTeacherId: HEAD_A, isActive: false })
    .returning({ id: students.id });

  return { studentOfA: studentOfA.id, studentOfB: studentOfB.id, inactiveStudentOfA: inactiveStudentOfA.id };
}

function user(id: string, role: CurrentUser["role"], isActive = true): CurrentUser {
  return { id, role, isActive };
}

beforeAll(async () => {
  db = await createTestDb();
});

beforeEach(async () => {
  // Her testten önce tabloları temizle (FK sırasına dikkat); PGlite
  // örneğini ve migration'ları test dosyası başına bir kez kurmak,
  // her testte sıfırdan Postgres ayağa kaldırmaktan çok daha hızlı.
  await db.delete(studentStudyDays);
  await db.delete(students);
  await db.delete(assistantHeadTeachers);
  await db.delete(branchAccessRequests);
  await db.delete(teacherInstitutions);
  await db.delete(institutionBranches);
  await db.delete(profiles);
  await db.delete(branches);
  await db.delete(institutions);
});

describe("requireRole", () => {
  it("rolü uyan aktif kullanıcıyı döner", () => {
    expect(requireRole(user(ADMIN, "admin"), "admin")).toEqual(user(ADMIN, "admin"));
  });

  it("oturum yoksa reddeder", () => {
    expect(() => requireRole(null, "admin")).toThrow(PermissionError);
  });

  it("is_active=false olan kullanıcıyı rolü uysa bile reddeder", () => {
    expect(() => requireRole(user(INACTIVE_ASSISTANT, "assistant", false), "assistant")).toThrow(
      PermissionError,
    );
  });

  it("rolü listede olmayan kullanıcıyı reddeder: baş öğretmen kayıt ekleyemez", () => {
    expect(() => requireRole(user(HEAD_A, "head_teacher"), "admin", "assistant")).toThrow(
      PermissionError,
    );
  });
});

describe("visibleStudentIds", () => {
  it("admin tüm öğrencileri görür (pasif olanlar dahil)", async () => {
    const { studentOfA, studentOfB, inactiveStudentOfA } = await seedBaseFixture(db);
    const ids = await visibleStudentIds(user(ADMIN, "admin"), db);
    expect(ids.sort()).toEqual([studentOfA, studentOfB, inactiveStudentOfA].sort());
  });

  it("baş öğretmen yalnızca kendi aktif öğrencilerini görür", async () => {
    const { studentOfA } = await seedBaseFixture(db);
    const ids = await visibleStudentIds(user(HEAD_A, "head_teacher"), db);
    expect(ids).toEqual([studentOfA]);
  });

  it("pasif öğrenci baş öğretmenin listesinde görünmez", async () => {
    const { inactiveStudentOfA } = await seedBaseFixture(db);
    const ids = await visibleStudentIds(user(HEAD_A, "head_teacher"), db);
    expect(ids).not.toContain(inactiveStudentOfA);
  });

  it("asistan bağlı olduğu baş öğretmenin öğrencilerini görür", async () => {
    const { studentOfA } = await seedBaseFixture(db);
    const ids = await visibleStudentIds(user(ASSISTANT_OF_A, "assistant"), db);
    expect(ids).toEqual([studentOfA]);
  });

  it("asistan bağlı olmadığı baş öğretmenin öğrencisini göremez", async () => {
    const { studentOfB } = await seedBaseFixture(db);
    const ids = await visibleStudentIds(user(ASSISTANT_OF_A, "assistant"), db);
    expect(ids).not.toContain(studentOfB);
  });

  it("hiçbir baş öğretmene bağlı olmayan asistan hiçbir öğrenci göremez", async () => {
    await seedBaseFixture(db);
    const ids = await visibleStudentIds(user(ASSISTANT_OF_NONE, "assistant"), db);
    expect(ids).toEqual([]);
  });

  it("pending kullanıcı hiçbir öğrenciyi göremez", async () => {
    await seedBaseFixture(db);
    const ids = await visibleStudentIds(user(PENDING, "pending"), db);
    expect(ids).toEqual([]);
  });

  it("is_active=false kullanıcı hiçbir öğrenciyi göremez", async () => {
    await seedBaseFixture(db);
    const ids = await visibleStudentIds(user(INACTIVE_ASSISTANT, "assistant", false), db);
    expect(ids).toEqual([]);
  });

  it("oturumsuz (null) kullanıcı hiçbir öğrenciyi göremez", async () => {
    await seedBaseFixture(db);
    const ids = await visibleStudentIds(null, db);
    expect(ids).toEqual([]);
  });
});

describe("canViewStudent", () => {
  it("baş öğretmen kendi öğrencisini görebilir", async () => {
    const { studentOfA } = await seedBaseFixture(db);
    expect(await canViewStudent(user(HEAD_A, "head_teacher"), studentOfA, db)).toBe(true);
  });

  it("baş öğretmen başka baş öğretmenin öğrencisini göremez", async () => {
    const { studentOfB } = await seedBaseFixture(db);
    expect(await canViewStudent(user(HEAD_A, "head_teacher"), studentOfB, db)).toBe(false);
  });
});

describe("canWriteRecord", () => {
  it("admin herhangi bir öğrenciye kayıt girebilir", async () => {
    const { studentOfA, studentOfB } = await seedBaseFixture(db);
    expect(await canWriteRecord(user(ADMIN, "admin"), studentOfA, db)).toBe(true);
    expect(await canWriteRecord(user(ADMIN, "admin"), studentOfB, db)).toBe(true);
  });

  it("bağlı asistan kayıt girebilir", async () => {
    const { studentOfA } = await seedBaseFixture(db);
    expect(await canWriteRecord(user(ASSISTANT_OF_A, "assistant"), studentOfA, db)).toBe(true);
  });

  it("bağlı olmayan asistan kayıt giremez", async () => {
    const { studentOfB } = await seedBaseFixture(db);
    expect(await canWriteRecord(user(ASSISTANT_OF_A, "assistant"), studentOfB, db)).toBe(false);
  });

  it("baş öğretmen kayıt ekleyemez (yalnızca görüntüler)", async () => {
    const { studentOfA } = await seedBaseFixture(db);
    expect(await canWriteRecord(user(HEAD_A, "head_teacher"), studentOfA, db)).toBe(false);
  });

  it("pending kullanıcı kayıt giremez", async () => {
    const { studentOfA } = await seedBaseFixture(db);
    expect(await canWriteRecord(user(PENDING, "pending"), studentOfA, db)).toBe(false);
  });
});

describe("canEditStudentDays", () => {
  it("admin ve bağlı asistan düzenleyebilir, baş öğretmen düzenleyemez", async () => {
    const { studentOfA } = await seedBaseFixture(db);
    expect(await canEditStudentDays(user(ADMIN, "admin"), studentOfA, db)).toBe(true);
    expect(await canEditStudentDays(user(ASSISTANT_OF_A, "assistant"), studentOfA, db)).toBe(true);
    expect(await canEditStudentDays(user(HEAD_A, "head_teacher"), studentOfA, db)).toBe(false);
  });
});

describe("canEditStudentInfo", () => {
  it("admin ve bağlı asistan düzenleyebilir, baş öğretmen ve bağlı olmayan asistan düzenleyemez", async () => {
    const { studentOfA } = await seedBaseFixture(db);
    expect(await canEditStudentInfo(user(ADMIN, "admin"), studentOfA, db)).toBe(true);
    expect(await canEditStudentInfo(user(ASSISTANT_OF_A, "assistant"), studentOfA, db)).toBe(true);
    expect(await canEditStudentInfo(user(HEAD_A, "head_teacher"), studentOfA, db)).toBe(false);
    expect(await canEditStudentInfo(user(ASSISTANT_OF_NONE, "assistant"), studentOfA, db)).toBe(false);
  });
});

describe("assertNotSelfRoleDemotion", () => {
  it("yönetici kendi rolünü düşüremez", () => {
    expect(() => assertNotSelfRoleDemotion(ADMIN, ADMIN, "head_teacher")).toThrow(PermissionError);
  });

  it("yönetici kendini tekrar admin yapmaya çalışırsa (no-op) engellenmez", () => {
    expect(() => assertNotSelfRoleDemotion(ADMIN, ADMIN, "admin")).not.toThrow();
  });

  it("yönetici BAŞKA birinin rolünü değiştirebilir", () => {
    expect(() => assertNotSelfRoleDemotion(ADMIN, HEAD_A, "assistant")).not.toThrow();
  });
});

describe("assertNotSelfDelete", () => {
  it("yönetici kendi hesabını silemez", () => {
    expect(() => assertNotSelfDelete(ADMIN, ADMIN)).toThrow(PermissionError);
  });

  it("yönetici başka bir hesabı silebilir", () => {
    expect(() => assertNotSelfDelete(ADMIN, HEAD_A)).not.toThrow();
  });
});

describe("assertKeepsOneActiveAdmin", () => {
  it("tek aktif yönetici varken onu devre dışı bırakmak/silmek engellenir", async () => {
    await seedBaseFixture(db);
    await expect(assertKeepsOneActiveAdmin(ADMIN, db)).rejects.toThrow(PermissionError);
  });

  it("başka bir aktif yönetici varsa işlem serbest bırakılır", async () => {
    await seedBaseFixture(db);
    await db.insert(profiles).values({
      id: ADMIN_2,
      firstName: "İkinci",
      lastName: "Yönetici",
      email: "admin2@test.local",
      role: "admin",
      isActive: true,
    });
    await expect(assertKeepsOneActiveAdmin(ADMIN, db)).resolves.toBeUndefined();
  });

  it("diğer yönetici pasifse yine de son aktif yönetici sayılır ve engellenir", async () => {
    await seedBaseFixture(db);
    await db.insert(profiles).values({
      id: ADMIN_2,
      firstName: "Pasif",
      lastName: "Yönetici",
      email: "admin2-inactive@test.local",
      role: "admin",
      isActive: false,
    });
    await expect(assertKeepsOneActiveAdmin(ADMIN, db)).rejects.toThrow(PermissionError);
  });
});

describe("canAddStudentForHeadTeacher", () => {
  it("admin herhangi bir baş öğretmen için öğrenci ekleyebilir", async () => {
    expect(await canAddStudentForHeadTeacher(user(ADMIN, "admin"), HEAD_A)).toBe(true);
    expect(await canAddStudentForHeadTeacher(user(ADMIN, "admin"), HEAD_B)).toBe(true);
  });

  it("baş öğretmen yalnızca kendi altına öğrenci ekleyebilir", async () => {
    expect(await canAddStudentForHeadTeacher(user(HEAD_A, "head_teacher"), HEAD_A)).toBe(true);
    expect(await canAddStudentForHeadTeacher(user(HEAD_A, "head_teacher"), HEAD_B)).toBe(false);
  });

  it("asistan yalnızca görebildiği (aynı kurum + seviye + dal) baş öğretmene öğrenci ekleyebilir", async () => {
    const org = await seedOrg(db);
    const a = user(ASSISTANT_OF_A, "assistant");
    expect(await canAddStudentForHeadTeacher(a, HEAD_A, db)).toBe(true); // aynı dal, ortak kurum
    expect(await canAddStudentForHeadTeacher(a, HEAD_B, db)).toBe(false); // ortak kurum yok
    expect(await canAddStudentForHeadTeacher(a, HEAD_C, db)).toBe(false); // farklı dal, onay yok
    expect(await canAddStudentForHeadTeacher(a, org.headD, db)).toBe(false); // farklı seviye
    expect(await canAddStudentForHeadTeacher(user(ASSISTANT_OF_NONE, "assistant"), HEAD_A, db)).toBe(false);
  });

  it("pending kullanıcı öğrenci ekleyemez", async () => {
    expect(await canAddStudentForHeadTeacher(user(PENDING, "pending"), HEAD_A)).toBe(false);
  });
});

describe("isStudentScheduledOn", () => {
  it("öğrencinin o günün haftalık gününe atanmış olması gerekir", async () => {
    const { studentOfA } = await seedBaseFixture(db);
    const scheduledDate = "2026-10-05"; // Pazartesi
    await db.insert(studentStudyDays).values({ studentId: studentOfA, weekday: weekdayOfISODate(scheduledDate) });

    expect(await isStudentScheduledOn(studentOfA, scheduledDate, db)).toBe(true);
  });

  it("atanmadığı bir gün için reddeder", async () => {
    const { studentOfA } = await seedBaseFixture(db);
    const scheduledDate = "2026-10-05"; // Pazartesi
    const otherDate = "2026-10-06"; // Salı
    await db.insert(studentStudyDays).values({ studentId: studentOfA, weekday: weekdayOfISODate(scheduledDate) });

    expect(await isStudentScheduledOn(studentOfA, otherDate, db)).toBe(false);
  });

  it("hiç etüt günü atanmamış öğrenci için her zaman reddeder", async () => {
    const { studentOfA } = await seedBaseFixture(db);
    expect(await isStudentScheduledOn(studentOfA, "2026-10-05", db)).toBe(false);
  });
});

// ---- Kurum / dal görünürlüğü ----

const HEAD_C = "99999999-9999-9999-9999-999999999991"; // Türkçe · lise · Kurum A
const HEAD_D = "99999999-9999-9999-9999-999999999992"; // Matematik · ortaokul · Kurum A
const HEAD_E = "99999999-9999-9999-9999-999999999993"; // Matematik · lise · "Kurum A" (AYNI ADLI, farklı kurum)
const HEAD_F = "99999999-9999-9999-9999-999999999994"; // Matematik · lise · Kurum A ama pasif

async function seedOrg(database: TestDb) {
  await seedBaseFixture(database);
  const [kurumA] = await database.insert(institutions).values({ name: "Kurum A" }).returning({ id: institutions.id });
  const [kurumB] = await database.insert(institutions).values({ name: "Kurum B" }).returning({ id: institutions.id });
  const [kurumA2] = await database.insert(institutions).values({ name: "Kurum A" }).returning({ id: institutions.id });
  const [matLise] = await database.insert(branches).values({ name: "Matematik", level: "lise" }).returning({ id: branches.id });
  const [trkLise] = await database.insert(branches).values({ name: "Türkçe", level: "lise" }).returning({ id: branches.id });
  const [matOrta] = await database.insert(branches).values({ name: "Matematik", level: "ortaokul" }).returning({ id: branches.id });
  const [fizLise] = await database.insert(branches).values({ name: "Fizik", level: "lise" }).returning({ id: branches.id });
  // Kurum A'da Matematik(lise), Türkçe(lise), Matematik(ortaokul) var; Fizik hiçbir kuruma atanmamış.
  await database.insert(institutionBranches).values([
    { institutionId: kurumA.id, branchId: matLise.id },
    { institutionId: kurumA.id, branchId: trkLise.id },
    { institutionId: kurumA.id, branchId: matOrta.id },
    { institutionId: kurumB.id, branchId: matLise.id },
  ]);

  await database.insert(profiles).values([
    { id: HEAD_C, firstName: "Baş C", lastName: "Öğretmen", email: "head-c@test.local", role: "head_teacher", isActive: true },
    { id: HEAD_D, firstName: "Baş D", lastName: "Öğretmen", email: "head-d@test.local", role: "head_teacher", isActive: true },
    { id: HEAD_E, firstName: "Baş E", lastName: "Öğretmen", email: "head-e@test.local", role: "head_teacher", isActive: true },
    { id: HEAD_F, firstName: "Baş F", lastName: "Öğretmen", email: "head-f@test.local", role: "head_teacher", isActive: false },
  ]);
  const setBranch = (id: string, branchId: string) =>
    database.update(profiles).set({ branchId }).where(eq(profiles.id, id));
  await setBranch(ASSISTANT_OF_A, matLise.id);
  await setBranch(HEAD_A, matLise.id);
  await setBranch(HEAD_B, matLise.id);
  await setBranch(HEAD_C, trkLise.id);
  await setBranch(HEAD_D, matOrta.id);
  await setBranch(HEAD_E, matLise.id);
  await setBranch(HEAD_F, matLise.id);

  await database.insert(teacherInstitutions).values([
    { teacherId: ASSISTANT_OF_A, institutionId: kurumA.id },
    { teacherId: ASSISTANT_OF_NONE, institutionId: kurumA.id }, // kurumu var ama dalı yok
    { teacherId: HEAD_A, institutionId: kurumA.id },
    { teacherId: HEAD_B, institutionId: kurumB.id }, // ortak kurum yok
    { teacherId: HEAD_C, institutionId: kurumA.id },
    { teacherId: HEAD_D, institutionId: kurumA.id },
    { teacherId: HEAD_E, institutionId: kurumA2.id }, // adı "Kurum A" ama başka kurum
    { teacherId: HEAD_F, institutionId: kurumA.id },
  ]);
  return {
    kurumA: kurumA.id,
    kurumB: kurumB.id,
    kurumA2: kurumA2.id,
    matLise: matLise.id,
    trkLise: trkLise.id,
    matOrta: matOrta.id,
    fizLise: fizLise.id,
    headD: HEAD_D,
  };
}

describe("visibleHeadTeacherIds", () => {
  it("asistan aynı kurum + aynı seviye + aynı daldaki öğretmeni görür, başkalarını görmez", async () => {
    await seedOrg(db);
    const ids = await visibleHeadTeacherIds(user(ASSISTANT_OF_A, "assistant"), db);
    expect(ids).toEqual([HEAD_A]);
    // HEAD_B: ortak kurum yok · HEAD_C: farklı dal · HEAD_D: farklı seviye
    // HEAD_E: adı aynı ama farklı kurum (id'ye göre) · HEAD_F: pasif
  });

  it("aynı adlı iki kurum birbirinden id ile ayrılır", async () => {
    const org = await seedOrg(db);
    expect(org.kurumA).not.toBe(org.kurumA2);
    expect(await visibleHeadTeacherIds(user(ASSISTANT_OF_A, "assistant"), db)).not.toContain(HEAD_E);
  });

  it("onaylı talep, o kurumdaki farklı daldaki öğretmeni görünür yapar", async () => {
    const org = await seedOrg(db);
    await db.insert(branchAccessRequests).values({
      assistantId: ASSISTANT_OF_A,
      institutionId: org.kurumA,
      branchId: org.trkLise,
      status: "approved",
    });
    const ids = await visibleHeadTeacherIds(user(ASSISTANT_OF_A, "assistant"), db);
    expect(ids.sort()).toEqual([HEAD_A, HEAD_C].sort());
  });

  it("bekleyen veya reddedilen talep hiçbir şey açmaz", async () => {
    const org = await seedOrg(db);
    await db
      .insert(branchAccessRequests)
      .values({ assistantId: ASSISTANT_OF_A, institutionId: org.kurumA, branchId: org.trkLise, status: "pending" });
    expect(await visibleHeadTeacherIds(user(ASSISTANT_OF_A, "assistant"), db)).toEqual([HEAD_A]);
    await db.update(branchAccessRequests).set({ status: "rejected" });
    expect(await visibleHeadTeacherIds(user(ASSISTANT_OF_A, "assistant"), db)).toEqual([HEAD_A]);
  });

  it("dal kurumdan çıkarılırsa onaylı talep de geçerliliğini yitirir", async () => {
    const org = await seedOrg(db);
    await db
      .insert(branchAccessRequests)
      .values({ assistantId: ASSISTANT_OF_A, institutionId: org.kurumA, branchId: org.trkLise, status: "approved" });
    expect(await visibleHeadTeacherIds(user(ASSISTANT_OF_A, "assistant"), db)).toContain(HEAD_C);
    await db
      .delete(institutionBranches)
      .where(and(eq(institutionBranches.institutionId, org.kurumA), eq(institutionBranches.branchId, org.trkLise)));
    expect(await visibleHeadTeacherIds(user(ASSISTANT_OF_A, "assistant"), db)).not.toContain(HEAD_C);
  });

  it("onaylı talep başka bir kurum içinse öğretmeni açmaz", async () => {
    const org = await seedOrg(db);
    await db
      .insert(branchAccessRequests)
      .values({ assistantId: ASSISTANT_OF_A, institutionId: org.kurumB, branchId: org.trkLise, status: "approved" });
    expect(await visibleHeadTeacherIds(user(ASSISTANT_OF_A, "assistant"), db)).toEqual([HEAD_A]);
  });

  it("seviye kuralı talebi de aşamaz: onaylı kayıt olsa bile ortaokul öğretmeni görünmez", async () => {
    const org = await seedOrg(db);
    await db
      .insert(branchAccessRequests)
      .values({ assistantId: ASSISTANT_OF_A, institutionId: org.kurumA, branchId: org.matOrta, status: "approved" });
    expect(await visibleHeadTeacherIds(user(ASSISTANT_OF_A, "assistant"), db)).not.toContain(HEAD_D);
  });

  it("dalı veya kurumu olmayan asistan hiçbir öğretmeni görmez", async () => {
    await seedOrg(db);
    expect(await visibleHeadTeacherIds(user(ASSISTANT_OF_NONE, "assistant"), db)).toEqual([]);
  });

  it("yönetici tüm aktif baş öğretmenleri görür; baş öğretmen, pending ve oturumsuz hiçbirini", async () => {
    await seedOrg(db);
    const admin = (await visibleHeadTeacherIds(user(ADMIN, "admin"), db)).sort();
    expect(admin).toEqual([HEAD_A, HEAD_B, HEAD_C, HEAD_D, HEAD_E].sort());
    expect(await visibleHeadTeacherIds(user(HEAD_A, "head_teacher"), db)).toEqual([]);
    expect(await visibleHeadTeacherIds(user(PENDING, "pending"), db)).toEqual([]);
    expect(await visibleHeadTeacherIds(null, db)).toEqual([]);
  });
});

describe("assertCanRequestBranchAccess", () => {
  it("kendi kurumunda, kendi seviyesindeki farklı bir dal için talep açabilir", async () => {
    const org = await seedOrg(db);
    await expect(
      assertCanRequestBranchAccess(user(ASSISTANT_OF_A, "assistant"), org.kurumA, org.trkLise, db),
    ).resolves.toBeUndefined();
  });

  it("kendi kurumu olmayan, başka seviyedeki veya kendi dalı için talebi reddeder", async () => {
    const org = await seedOrg(db);
    const a = user(ASSISTANT_OF_A, "assistant");
    await expect(assertCanRequestBranchAccess(a, org.kurumB, org.trkLise, db)).rejects.toThrow(PermissionError);
    await expect(assertCanRequestBranchAccess(a, org.kurumA, org.matOrta, db)).rejects.toThrow(PermissionError);
    await expect(assertCanRequestBranchAccess(a, org.kurumA, org.matLise, db)).rejects.toThrow(PermissionError);
  });

  it("kuruma atanmamış bir dal için talep açılamaz", async () => {
    const org = await seedOrg(db);
    // Fizik (lise) hiçbir kuruma atanmamış; Türkçe yalnızca Kurum A'da var
    await expect(
      assertCanRequestBranchAccess(user(ASSISTANT_OF_A, "assistant"), org.kurumA, org.fizLise, db),
    ).rejects.toThrow(PermissionError);
  });

  it("asistan olmayanlar ve dalı olmayan asistan talep açamaz", async () => {
    const org = await seedOrg(db);
    await expect(
      assertCanRequestBranchAccess(user(HEAD_A, "head_teacher"), org.kurumA, org.trkLise, db),
    ).rejects.toThrow(PermissionError);
    await expect(
      assertCanRequestBranchAccess(user(ASSISTANT_OF_NONE, "assistant"), org.kurumA, org.trkLise, db),
    ).rejects.toThrow(PermissionError);
  });
});
