import { createAuthServer } from "@neondatabase/auth/server";
import { headers } from "next/headers";

import { auth as webAuth } from "@/lib/auth/server";

/**
 * Mobil uygulama çerez kullanmaz; oturum belirteci (Neon Auth session_token)
 * `Authorization: Bearer <belirteç>` başlığıyla gelir. Bu dosya, belirteci
 * çerçeveden bağımsız Neon Auth sunucu API'sine çerez gibi vererek oturumu
 * doğrular. Böylece web ile aynı oturum ve aynı yetki kuralları kullanılır.
 */
const SESSION_COOKIE = "__Secure-neon-auth.session_token";

function createMemoryAuth(initial: Record<string, string> = {}) {
  const baseUrl = process.env.NEON_AUTH_BASE_URL!;
  const jar = new Map<string, string>(Object.entries(initial));
  const auth = createAuthServer({
    baseUrl,
    cookieSecret: process.env.NEON_AUTH_COOKIE_SECRET!,
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
      getFramework: () => "mobile-api",
    }),
  });
  return { auth, jar };
}

export type MobileSessionUser = { id: string; email: string; name: string };

/** E-posta + şifre ile giriş yapar, mobilin saklayacağı oturum belirtecini döner. */
export async function mobileSignIn(
  email: string,
  password: string,
): Promise<{ token: string; user: MobileSessionUser } | { error: "invalid" | "failed"; message?: string }> {
  const { auth, jar } = createMemoryAuth();
  const { data, error } = await auth.signIn.email({ email, password });
  if (error || !data?.user) {
    if (error?.status === 401 || error?.status === 403 || error?.status === 400) return { error: "invalid" };
    return { error: "failed", message: error?.message };
  }
  const token = jar.get(SESSION_COOKIE);
  if (!token) return { error: "failed", message: "Oturum belirteci alınamadı." };
  return { token, user: { id: data.user.id, email: data.user.email, name: data.user.name } };
}

/** Bearer belirtecinden Neon Auth kullanıcısını çözer; geçersizse null. */
export async function userFromBearerToken(token: string): Promise<MobileSessionUser | null> {
  const { auth } = createMemoryAuth({ [SESSION_COOKIE]: token });
  try {
    const { data } = await auth.getSession();
    const user = data?.user;
    return user ? { id: user.id, email: user.email, name: user.name } : null;
  } catch {
    return null;
  }
}

export async function mobileSignOut(token: string): Promise<void> {
  const { auth } = createMemoryAuth({ [SESSION_COOKIE]: token });
  try {
    await auth.signOut();
  } catch {
    // Belirteç zaten geçersiz olabilir; istemci yine de yerelde siler.
  }
}

/**
 * İsteğin kimliğini taşıyan auth nesnesi: Bearer başlığı varsa o belirteçle
 * (mobil), yoksa çerezle (web). Profil güncelleme gibi her iki istemcinin de
 * kullandığı sunucu eylemleri bunu kullanır.
 */
export async function getRequestAuth(): Promise<typeof webAuth> {
  const bearer = (await headers()).get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!bearer) return webAuth;
  return createMemoryAuth({ [SESSION_COOKIE]: bearer }).auth as unknown as typeof webAuth;
}
