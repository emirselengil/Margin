import { Redirect } from "expo-router";

import { useAuth } from "@/lib/auth";

/** Girişten sonra yönlendirme: rol'e göre (web'deki ROLE_HOME ile aynı mantık). */
export default function Index() {
  const { state } = useAuth();
  if (state.status !== "signedIn") return <Redirect href="/login" />;

  const { me } = state;
  if (!me.isActive || me.role === "pending") return <Redirect href="/bekliyor" />;
  if (me.role === "assistant") return <Redirect href="/etut" />;
  if (me.role === "head_teacher") return <Redirect href="/ogrencilerim" />;
  return <Redirect href="/yonetici" />;
}
