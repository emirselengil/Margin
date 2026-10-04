import type { Profile } from "@/db/schema";
import { ApiError } from "@/lib/api-validation";
import { PermissionError } from "@/lib/permissions";
import { getOrCreateProfile } from "@/lib/profile";
import type { Role } from "@/lib/roles";

export { ApiError, readBody, requireDate, requireOneOf, requireString } from "@/lib/api-validation";

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

type Ctx<P> = { params: Promise<P> };

/**
 * Oturumu (Authorization: Bearer) doğrular, rolü kontrol eder ve hataları
 * JSON'a çevirir. İş kuralları/yetkiler zaten çağrılan sunucu eylemlerinde
 * ve lib/permissions.ts'te; burada yalnızca kaba rol kapısı var.
 */
export function withUser<P = Record<string, never>>(
  roles: Role[] | null,
  handler: (req: Request, user: Profile, params: P) => Promise<Response>,
) {
  return async (req: Request, ctx: Ctx<P>): Promise<Response> => {
    try {
      const user = await getOrCreateProfile();
      if (!user) throw new ApiError(401, "Oturum bulunamadı, lütfen tekrar giriş yapın.");
      if (!user.isActive || user.role === "pending") {
        throw new ApiError(403, "Hesabınız aktif değil veya henüz onaylanmamış.");
      }
      if (roles && !roles.includes(user.role)) {
        throw new ApiError(403, "Bu işlem için yetkiniz yok.");
      }
      return await handler(req, user, await ctx.params);
    } catch (e) {
      return errorResponse(e);
    }
  };
}

export function errorResponse(e: unknown): Response {
  if (e instanceof ApiError) return json({ error: e.message }, e.status);
  if (e instanceof PermissionError) return json({ error: e.message }, 403);
  console.error("Mobil API hatası:", e);
  return json({ error: "Beklenmeyen bir hata oluştu." }, 500);
}
