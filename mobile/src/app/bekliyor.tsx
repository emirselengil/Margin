import { Redirect } from "expo-router";
import { Hourglass, ShieldX } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Logo } from "@/components/brand";
import { AppText, Button, Card } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { usePalette } from "@/theme";

/** Web'deki /onay-bekliyor ile aynı: onay bekleyen / pasif / reddedilen hesap. */
export default function BekliyorScreen() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const { state, signOut, refreshMe } = useAuth();
  const [busy, setBusy] = useState(false);

  if (state.status !== "signedIn") return <Redirect href="/login" />;
  const { me } = state;
  if (me.isActive && me.role !== "pending") return <Redirect href="/" />;

  const deactivated = !me.isActive && me.role !== "pending";
  const rejected = !me.isActive && me.role === "pending";
  const heading = deactivated
    ? "Hesabınız devre dışı bırakıldı"
    : rejected
      ? "Kaydınız onaylanmadı"
      : "Hesabınız onay bekliyor";
  const description = deactivated
    ? "Yöneticiniz hesabınızı devre dışı bıraktı. Bir hata olduğunu düşünüyorsanız okul yöneticinizle iletişime geçin."
    : rejected
      ? "Yöneticiniz kayıt talebinizi onaylamadı. Bir hata olduğunu düşünüyorsanız okul yöneticinizle iletişime geçin."
      : "Kaydınız alındı. Yöneticiniz rolünüzü belirleyip onayladığında uygulamaya erişebileceksiniz.";
  const Icon = !me.isActive ? ShieldX : Hourglass;

  return (
    <View style={{ flex: 1, backgroundColor: p.bg, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24, paddingHorizontal: 16 }}>
      <View style={{ alignItems: "center", marginBottom: 24 }}>
        <Logo />
      </View>
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Card tone="surface" style={{ padding: 28, alignItems: "center", gap: 16 }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: !me.isActive ? p.warnSoft : p.accentSoft,
            }}
          >
            <Icon size={26} color={!me.isActive ? p.warnText : p.accentText} />
          </View>
          <AppText size={20} weight="semibold" style={{ textAlign: "center" }}>
            {heading}
          </AppText>
          <AppText tone="ink2" style={{ textAlign: "center", lineHeight: 21 }}>
            {description}
          </AppText>
          <View style={{ width: "100%", gap: 10 }}>
            {me.isActive ? (
              <Button
                label="Durumu yenile"
                variant="secondary"
                loading={busy}
                onPress={async () => {
                  setBusy(true);
                  try {
                    await refreshMe();
                  } finally {
                    setBusy(false);
                  }
                }}
              />
            ) : null}
            <Button label="Çıkış yap" variant="secondary" onPress={signOut} />
          </View>
        </Card>
      </View>
    </View>
  );
}
