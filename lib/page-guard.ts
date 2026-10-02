import { redirect } from "next/navigation";

import type { Profile } from "@/db/schema";
import { getOrCreateProfile } from "@/lib/profile";
import { ROLE_HOME, type Role } from "@/lib/roles";

/**
 * Sayfanın yalnızca belirtilen rolden, aktif kullanıcılar tarafından
 * görülebilmesini sağlar. Uygun değilse doğru yere yönlendirir.
 */
export async function requirePageRole(role: Role): Promise<Profile> {
  const profile = await getOrCreateProfile();
  if (!profile) redirect("/giris");
  if (!profile.isActive) redirect("/onay-bekliyor");
  if (profile.role !== role) redirect(ROLE_HOME[profile.role]);
  return profile;
}
