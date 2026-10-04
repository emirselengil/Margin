import { Redirect, Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CalendarDays, UserRound, Users } from "lucide-react-native";

import { useAuth } from "@/lib/auth";
import { fonts, usePalette } from "@/theme";

export default function TeacherLayout() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const { state } = useAuth();
  if (state.status !== "signedIn") return <Redirect href="/login" />;
  if (state.me.role !== "head_teacher" || !state.me.isActive) return <Redirect href="/" />;

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
        name="ogrencilerim"
        options={{ title: "Öğrencilerim", tabBarIcon: ({ color }) => <Users size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="etutler"
        options={{ title: "Etütler", tabBarIcon: ({ color }) => <CalendarDays size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="profil"
        options={{ title: "Profil", tabBarIcon: ({ color }) => <UserRound size={22} color={color} /> }}
      />
      <Tabs.Screen name="ogrenci/[id]" options={{ href: null }} />
    </Tabs>
  );
}
