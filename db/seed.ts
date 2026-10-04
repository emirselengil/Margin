import "./load-env";

import { createAuthServer } from "@neondatabase/auth/server";

import { db } from "./client";
import {
  assistantHeadTeachers,
  profiles,
  recordHistory,
  roleEnum,
  studentStudyDays,
  students,
  studyRecords,
} from "./schema";

/**
 * tsx ile Next.js dışında çalıştığı için `@neondatabase/auth/next/server`
 * yerine çerçeveden bağımsız `server` giriş noktasını, çerezleri bellekte
 * tutan basit bir context ile kullanıyoruz. Ağ çağrıları gerçek Neon Auth
 * sunucusuna gider; yalnızca oturum çerezi saklama yöntemi değişir.
 */
function createMemoryAuth(baseUrl: string, cookieSecret: string) {
  const jar = new Map<string, string>();
  return createAuthServer({
    baseUrl,
    cookieSecret,
    context: () => ({
      getCookies: () =>
        Array.from(jar.entries())
          .map(([k, v]) => `${k}=${v}`)
          .join("; "),
      setCookie: (name: string, value: string) => {
        jar.set(name, value);
      },
      getHeader: () => null,
      getOrigin: () => baseUrl,
      getFramework: () => "db-seed-script",
    }),
  });
}

const auth = createMemoryAuth(
  process.env.NEON_AUTH_BASE_URL!,
  process.env.NEON_AUTH_COOKIE_SECRET!,
);

/** Neon Auth hesabı yoksa oluşturur, varsa giriş yaparak kimliğini döner. */
async function ensureAuthUser(name: string, email: string, password: string) {
  const signUp = await auth.signUp.email({ name, email, password });
  if (signUp.data?.user) return signUp.data.user;

  const signIn = await auth.signIn.email({ email, password });
  if (!signIn.data?.user) {
    throw new Error(
      `${email} için Neon Auth hesabı oluşturulamadı/giriş yapılamadı: ${signIn.error?.message}`,
    );
  }
  return signIn.data.user;
}

const SEED_PASSWORD = "Margin2026!";

type SeedTeacher = {
  key: string;
  firstName: string;
  lastName: string;
  email: string;
  role: (typeof roleEnum.enumValues)[number];
};

const TEACHERS: SeedTeacher[] = [
  { key: "admin", firstName: "Okul", lastName: "Yöneticisi", email: "admin@margin.local", role: "admin" },
  { key: "ak", firstName: "Ahmet", lastName: "Kaya", email: "ahmet.kaya@margin.local", role: "head_teacher" },
  { key: "zc", firstName: "Zeynep", lastName: "Çelik", email: "zeynep.celik@margin.local", role: "head_teacher" },
  { key: "sa", firstName: "Selin", lastName: "Aydın", email: "selin.aydin@margin.local", role: "assistant" },
  { key: "dk", firstName: "Deniz", lastName: "Koç", email: "deniz.koc@margin.local", role: "pending" },
];

const STUDENTS: {
  key: string;
  fullName: string;
  className: string;
  headTeacher: "ak" | "zc";
  days: number[]; // 0 = Pazartesi … 6 = Pazar
}[] = [
  { key: "ey", fullName: "Elif Yılmaz", className: "8-A", headTeacher: "ak", days: [1, 3] },
  { key: "md", fullName: "Mert Demir", className: "8-A", headTeacher: "ak", days: [1, 3] },
  { key: "ak2", fullName: "Ayşe Kılıç", className: "8-C", headTeacher: "ak", days: [1, 3] },
  { key: "ba", fullName: "Berk Aksoy", className: "8-C", headTeacher: "ak", days: [0, 2] },
  { key: "da", fullName: "Defne Arslan", className: "7-B", headTeacher: "zc", days: [0, 1] },
  { key: "co", fullName: "Can Öztürk", className: "7-B", headTeacher: "zc", days: [1, 4] },
  { key: "es", fullName: "Emir Şahin", className: "7-A", headTeacher: "zc", days: [1, 5] },
];

/** `weekday` (0=Pzt…6=Paz) gününün bugünden geriye doğru son `count` tekrarı. */
function lastOccurrences(weekday: number, count: number, from = new Date()): Date[] {
  const jsTarget = (weekday + 1) % 7; // JS Date: 0=Paz…6=Cmt
  const dates: Date[] = [];
  const cur = new Date(from);
  cur.setHours(0, 0, 0, 0);
  while (dates.length < count) {
    if (cur.getDay() === jsTarget) dates.push(new Date(cur));
    cur.setDate(cur.getDate() - 1);
  }
  return dates;
}

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

const SAMPLE_NOTES = [
  "Konuyu iyi kavramış.",
  "Derse aktif katıldı.",
  "Kitabını evde unutmuş, fotokopiden çalıştı.",
  "Eksik kalan kısmı tamamlayacak.",
  "",
  "",
];

async function main() {
  if (process.env.DB_TARGET === "production") {
    throw new Error("Örnek veri (seed) canlı veritabanına yazılamaz.");
  }
  console.log("Neon Auth hesapları oluşturuluyor / doğrulanıyor...");
  const authUsers = new Map<string, { id: string; email: string }>();
  for (const t of TEACHERS) {
    const user = await ensureAuthUser(`${t.firstName} ${t.lastName}`, t.email, SEED_PASSWORD);
    authUsers.set(t.key, { id: user.id, email: user.email });
    console.log(`  ✓ ${t.email} (${t.role}) -> ${user.id}`);
  }

  await db.transaction(async (tx) => {
    console.log("\nProfiller yazılıyor...");
    for (const t of TEACHERS) {
      const authUser = authUsers.get(t.key)!;
      await tx
        .insert(profiles)
        .values({
          id: authUser.id,
          firstName: t.firstName,
          lastName: t.lastName,
          email: t.email,
          role: t.role,
          isActive: true,
        })
        .onConflictDoUpdate({
          target: profiles.id,
          set: {
            firstName: t.firstName,
            lastName: t.lastName,
            role: t.role,
            isActive: true,
            deletedAt: null,
          },
        });
    }

    const headTeacherId = (key: "ak" | "zc") => authUsers.get(key)!.id;
    const assistantId = authUsers.get("sa")!.id;

    console.log("Asistan ↔ baş öğretmen bağları yazılıyor...");
    await tx.delete(assistantHeadTeachers);
    for (const headTeacherKey of ["ak", "zc"] as const) {
      await tx.insert(assistantHeadTeachers).values({
        assistantId,
        headTeacherId: headTeacherId(headTeacherKey),
      });
    }

    console.log("Örnek öğrenciler ve etüt günleri yazılıyor (önceki örnek veriler temizlenip)...");
    await tx.delete(recordHistory);
    await tx.delete(studyRecords);
    await tx.delete(studentStudyDays);
    await tx.delete(students);

    let noteIdx = 0;
    for (const s of STUDENTS) {
      const [inserted] = await tx
        .insert(students)
        .values({
          fullName: s.fullName,
          className: s.className,
          headTeacherId: headTeacherId(s.headTeacher),
          isActive: true,
        })
        .returning({ id: students.id });

      for (const weekday of s.days) {
        await tx.insert(studentStudyDays).values({ studentId: inserted.id, weekday });
      }

      // Her öğrenci için geçmişe dönük birkaç etüt kaydı oluştur; en güncel
      // tarihi bilerek boş bırakıyoruz ki "kayıt bekliyor" durumu da görülsün.
      const occurrences = s.days
        .flatMap((weekday) => lastOccurrences(weekday, 3))
        .sort((a, b) => b.getTime() - a.getTime());
      const toFill = occurrences.slice(1); // en yeni tarih boş kalsın

      for (const occurrence of toFill) {
        const homework = Math.random() > 0.25 ? "done" : "missing";
        const book = Math.random() > 0.25 ? "brought" : "not_brought";
        const note = SAMPLE_NOTES[noteIdx % SAMPLE_NOTES.length];
        noteIdx++;
        await tx.insert(studyRecords).values({
          studentId: inserted.id,
          date: toISODate(occurrence),
          homework,
          book,
          note: note || null,
          createdBy: assistantId,
        });
      }
    }
  });

  console.log("\n✓ Seed tamamlandı.");
  console.log("\nGiriş bilgileri (hepsinde şifre: " + SEED_PASSWORD + "):");
  for (const t of TEACHERS) {
    console.log(`  ${t.role.padEnd(12)} ${t.email}`);
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error("Seed başarısız:", err);
    process.exit(1);
  },
);
