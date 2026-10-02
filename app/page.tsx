import { redirect } from "next/navigation";

import { getOrCreateProfile } from "@/lib/profile";
import { ROLE_HOME } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const profile = await getOrCreateProfile();
  if (!profile) {
    redirect("/giris");
  }
  redirect(ROLE_HOME[profile.role]);
}
