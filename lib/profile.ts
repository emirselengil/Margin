import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db/client";
import { profiles, type Profile } from "@/db/schema";
import { auth } from "@/lib/auth/server";
import { userFromBearerToken } from "@/lib/auth/mobile";

export async function getSessionUser() {
  // Mobil uygulama: Authorization: Bearer <oturum belirteci>
  const bearer = (await headers()).get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (bearer) return userFromBearerToken(bearer);

  const { data } = await auth.getSession();
  return data?.user ?? null;
}

/**
 * Oturum açmış kullanıcının profilini döndürür. Profil henüz yoksa (ilk giriş)
 * `pending` rolüyle oluşturur. Oturum yoksa null döner.
 */
export async function getOrCreateProfile(): Promise<Profile | null> {
  const user = await getSessionUser();
  if (!user) return null;

  const [existing] = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);
  if (existing) return existing;

  const [first, ...rest] = (user.name || user.email || "Kullanıcı").trim().split(/\s+/);

  const inserted = await db
    .insert(profiles)
    .values({
      id: user.id,
      firstName: first || "Kullanıcı",
      lastName: rest.join(" "),
      email: user.email,
    })
    .onConflictDoNothing({ target: profiles.id })
    .returning();

  if (inserted[0]) return inserted[0];

  const [created] = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);
  return created ?? null;
}
