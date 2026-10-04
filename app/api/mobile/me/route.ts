import { ApiError, errorResponse, json } from "@/lib/mobile-api";
import { getOrCreateProfile } from "@/lib/profile";

/**
 * Giriş yapmış kullanıcının profili. Onay bekleyen/pasif kullanıcılar için de
 * 200 döner (uygulama "onay bekliyor" ekranını gösterebilsin diye).
 */
export async function GET() {
  try {
    const profile = await getOrCreateProfile();
    if (!profile) throw new ApiError(401, "Oturum bulunamadı, lütfen tekrar giriş yapın.");
    return json({
      id: profile.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      role: profile.role,
      isActive: profile.isActive,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
