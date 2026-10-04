import { Redirect, Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CalendarDays, ListChecks, UserRound } from "lucide-react-native";

import { useAuth } from "@/lib/auth";
import { fonts, usePalette } from "@/theme";

export default function AssistantLayout() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const { state } = useAuth();
  if (state.status !== "signedIn") return <Redirect href="/login" />;
  if (state.me.role !== "assistant" || !state.me.isActive) return <Redirect href="/" />;

  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: p.accent,
        tabBarInactiveTintColor: p.muted,
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16 },
        tabBarStyle: {
          backgroundColor: p.surface,
          borderTopColor: p.line,
          height: 60 + insets.bottom,
          paddingTop: 6,
          paddingBottom: 6 + insets.bottom,
        },
        tabBarItemStyle: { height: 48 },
        sceneStyle: { backgroundColor: p.bg },
      }}
    >
      <Tabs.Screen
        name="etut"
        options={{ title: "Etüt listesi", tabBarIcon: ({ color }) => <ListChecks size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="gruplar"
        options={{ title: "Gün grupları", tabBarIcon: ({ color }) => <CalendarDays size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="profilim"
        options={{ title: "Profil", tabBarIcon: ({ color }) => <UserRound size={22} color={color} /> }}
      />
      <Tabs.Screen name="etut-ogrenci/[id]" options={{ href: null }} />
    </Tabs>
  );
}
