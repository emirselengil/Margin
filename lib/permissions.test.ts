import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createTestDb, type TestDb } from "@/db/test-utils";
import { assistantHeadTeachers, profiles, studentStudyDays, students } from "@/db/schema";
import { weekdayOfISODate } from "@/lib/date";
import {
  assertKeepsOneActiveAdmin,
  assertNotSelfDelete,
  assertNotSelfRoleDemotion,
  canAddStudentForHeadTeacher,
  canEditStudentDays,
  canEditStudentInfo,
  canViewStudent,
  canWriteHeadTeacherNote,
  canWriteRecord,
  isStudentScheduledOn,
  PermissionError,
  requireRole,
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
  await db.delete(profiles);
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

describe("canWriteHeadTeacherNote", () => {
  it("öğrencinin kendi baş öğretmeni not yazabilir", async () => {
    const { studentOfA } = await seedBaseFixture(db);
    expect(await canWriteHeadTeacherNote(user(HEAD_A, "head_teacher"), studentOfA, db)).toBe(true);
  });

  it("başka baş öğretmenin öğrencisine not yazılamaz", async () => {
    const { studentOfB } = await seedBaseFixture(db);
    expect(await canWriteHeadTeacherNote(user(HEAD_A, "head_teacher"), studentOfB, db)).toBe(false);
  });

  it("asistan baş öğretmen notunu yazamaz (yalnızca görür)", async () => {
    const { studentOfA } = await seedBaseFixture(db);
    expect(await canWriteHeadTeacherNote(user(ASSISTANT_OF_A, "assistant"), studentOfA, db)).toBe(false);
  });

  it("admin her öğrenci için yazabilir", async () => {
    const { studentOfA, studentOfB } = await seedBaseFixture(db);
    expect(await canWriteHeadTeacherNote(user(ADMIN, "admin"), studentOfA, db)).toBe(true);
    expect(await canWriteHeadTeacherNote(user(ADMIN, "admin"), studentOfB, db)).toBe(true);
  });

  it("pending, pasif kullanıcı ve oturumsuz yazamaz", async () => {
    const { studentOfA } = await seedBaseFixture(db);
    expect(await canWriteHeadTeacherNote(user(PENDING, "pending"), studentOfA, db)).toBe(false);
    expect(await canWriteHeadTeacherNote(null, studentOfA, db)).toBe(false);
    expect(
      await canWriteHeadTeacherNote({ ...user(HEAD_A, "head_teacher"), isActive: false }, studentOfA, db),
    ).toBe(false);
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

  it("asistan, bağlı olmasa bile herhangi bir baş öğretmene öğrenci ekleyebilir (ilk bağlantıyı kurmanın yolu)", async () => {
    expect(await canAddStudentForHeadTeacher(user(ASSISTANT_OF_A, "assistant"), HEAD_A)).toBe(true);
    expect(await canAddStudentForHeadTeacher(user(ASSISTANT_OF_A, "assistant"), HEAD_B)).toBe(true);
    expect(await canAddStudentForHeadTeacher(user(ASSISTANT_OF_NONE, "assistant"), HEAD_A)).toBe(true);
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
