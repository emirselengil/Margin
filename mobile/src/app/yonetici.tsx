import { Redirect } from "expo-router";
import { MonitorSmartphone } from "lucide-react-native";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Logo } from "@/components/brand";
import { AppText, Button, Card } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { usePalette } from "@/theme";

/** Yönetici paneli bu sürümde yalnızca web'de; mobil sürüm öğretmen rolleri için. */
export default function YoneticiScreen() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const { state, signOut } = useAuth();
  if (state.status !== "signedIn") return <Redirect href="/login" />;

  return (
    <View style={{ flex: 1, backgroundColor: p.bg, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24, paddingHorizontal: 16 }}>
      <View style={{ alignItems: "center", marginBottom: 24 }}>
        <Logo />
      </View>
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Card tone="surface" style={{ padding: 28, alignItems: "center", gap: 16 }}>
          <MonitorSmartphone size={32} color={p.accentText} />
          <AppText size={20} weight="semibold" style={{ textAlign: "center" }}>
            Yönetim paneli web&apos;de
          </AppText>
          <AppText tone="ink2" style={{ textAlign: "center", lineHeight: 21 }}>
            Yönetici işlemleri (öğretmen onayı, roller, öğrenci ve kayıt yönetimi) şimdilik yalnızca Margin web sitesinden
            yapılabiliyor.
          </AppText>
          <Button label="Çıkış yap" variant="secondary" onPress={signOut} style={{ alignSelf: "stretch" }} />
        </Card>
      </View>
    </View>
  );
}
