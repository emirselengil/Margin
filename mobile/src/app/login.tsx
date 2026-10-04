import { Redirect } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Logo } from "@/components/brand";
import { AppText, Button, Card, Field, Message } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { usePalette } from "@/theme";

export default function LoginScreen() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const { state, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (state.status === "signedIn") return <Redirect href="/" />;

  async function submit() {
    if (!email.trim() || !password) {
      setError("E-posta ve şifre gerekli.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Giriş yapılamadı, lütfen tekrar deneyin.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: p.bg }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 16,
          justifyContent: "center",
          gap: 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: "center" }}>
          <Logo />
        </View>
        <Card tone="surface" style={{ padding: 24, gap: 18, maxWidth: 440, width: "100%", alignSelf: "center" }}>
          <View style={{ gap: 6 }}>
            <AppText size={26} weight="semibold">
              Tekrar hoş geldiniz
            </AppText>
            <AppText tone="ink2">Öğretmen hesabınızla giriş yapın.</AppText>
          </View>
          <Field
            label="E-posta"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="next"
          />
          <Field
            label="Şifre"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={submit}
          />
          {error ? <Message ok={false} text={error} /> : null}
          <Button label="Giriş yap" onPress={submit} loading={busy} />
        </Card>
        <AppText size={13} tone="muted" style={{ textAlign: "center" }}>
          Hesabınız yok mu? Kayıt olmak için Margin web sitesini kullanın.
        </AppText>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
