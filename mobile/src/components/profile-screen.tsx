import { LogOut } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";

import { AppText, Button, Card, Field, Message, Screen } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useAuth, useMe } from "@/lib/auth";
import type { ActionResult } from "@/lib/types";
import { usePalette } from "@/theme";

async function call(path: string, method: "PATCH" | "POST", body: unknown): Promise<ActionResult> {
  try {
    return await api<ActionResult>(path, { method, body });
  } catch (e) {
    // Sunucu doğrulama hataları 400 + {ok:false,message} döner
    return { ok: false, message: e instanceof ApiError ? e.message : "İşlem başarısız oldu." };
  }
}

export function ProfileScreen() {
  const p = usePalette();
  const me = useMe();
  const { signOut, refreshMe } = useAuth();

  const [firstName, setFirstName] = useState(me.firstName);
  const [lastName, setLastName] = useState(me.lastName);
  const [nameResult, setNameResult] = useState<ActionResult | null>(null);
  const [nameBusy, setNameBusy] = useState(false);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwResult, setPwResult] = useState<ActionResult | null>(null);
  const [pwBusy, setPwBusy] = useState(false);

  async function saveName() {
    setNameBusy(true);
    setNameResult(null);
    const res = await call("/profile", "PATCH", { firstName, lastName });
    setNameResult(res);
    if (res.ok) await refreshMe().catch(() => undefined);
    setNameBusy(false);
  }

  async function savePassword() {
    setPwBusy(true);
    setPwResult(null);
    const res = await call("/profile/password", "POST", {
      currentPassword: current,
      newPassword: next,
      newPasswordConfirm: confirm,
    });
    setPwResult(res);
    if (res.ok) {
      setCurrent("");
      setNext("");
      setConfirm("");
    }
    setPwBusy(false);
  }

  return (
    <Screen title="Profilim" crumb="Hesabım">
      <View style={{ gap: 4 }}>
        <AppText size={22} weight="semibold">
          {me.firstName} {me.lastName}
        </AppText>
        <AppText mono size={12} tone="muted">
          {me.email}
        </AppText>
      </View>

      <Card style={{ padding: 16, gap: 14 }}>
        <AppText size={16} weight="semibold">
          İsim
        </AppText>
        <Field label="Ad" value={firstName} onChangeText={setFirstName} autoComplete="given-name" />
        <Field label="Soyad" value={lastName} onChangeText={setLastName} autoComplete="family-name" />
        {nameResult ? <Message ok={nameResult.ok} text={nameResult.message} /> : null}
        <Button label="İsmi kaydet" onPress={saveName} loading={nameBusy} />
      </Card>

      <Card style={{ padding: 16, gap: 14 }}>
        <AppText size={16} weight="semibold">
          Şifre
        </AppText>
        <Field label="Mevcut şifre" value={current} onChangeText={setCurrent} secureTextEntry autoCapitalize="none" />
        <Field label="Yeni şifre" value={next} onChangeText={setNext} secureTextEntry autoCapitalize="none" />
        <Field label="Yeni şifre (tekrar)" value={confirm} onChangeText={setConfirm} secureTextEntry autoCapitalize="none" />
        <AppText size={12} tone="muted">
          Şifre en az 8 karakter olmalı.
        </AppText>
        {pwResult ? <Message ok={pwResult.ok} text={pwResult.message} /> : null}
        <Button label="Şifreyi değiştir" onPress={savePassword} loading={pwBusy} />
      </Card>

      <Button
        label="Çıkış yap"
        variant="danger"
        onPress={signOut}
        icon={<LogOut size={16} color={p.warnText} />}
      />
    </Screen>
  );
}
