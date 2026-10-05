import { useRouter } from "expo-router";
import { ChevronRight, Plus, ShieldCheck } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";

import {
  AppText,
  Avatar,
  Button,
  Card,
  Empty,
  ErrorState,
  Field,
  Loading,
  Message,
  Screen,
  Sheet,
  StatusChip,
  useRemote,
} from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { formatDayMonth, WEEKDAY_SHORT } from "@/lib/date";
import type { MyStudentListRow } from "@/lib/types";
import { usePalette } from "@/theme";

const HOMEWORK_LABEL = { done: "Ödev yapıldı", missing: "Ödev eksik", not_done: "Ödev yapmadı" } as const;
const BOOK_LABEL = { brought: "Kitap getirdi", not_brought: "Kitap getirmedi" } as const;
const ATTENDANCE_LABEL = { came: "Geldi", absent: "Gelmedi" } as const;

export default function OgrencilerimScreen() {
  const p = usePalette();
  const router = useRouter();
  const q = useRemote(() => api<{ students: MyStudentListRow[] }>("/ogrencilerim"), []);
  const [adding, setAdding] = useState(false);
  const students = q.data?.students ?? [];

  return (
    <Screen
      title="Öğrencilerim"
      crumb="Öğretmen"
      onRefresh={q.refresh}
      refreshing={q.refreshing}
      right={
        <Button
          label="Öğrenci ekle"
          small
          variant="secondary"
          onPress={() => setAdding(true)}
          icon={<Plus size={15} color={p.ink} />}
        />
      }
    >
      <View style={{ gap: 6 }}>
        <View
          style={{
            alignSelf: "flex-start",
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            height: 30,
            paddingHorizontal: 10,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: p.line,
            backgroundColor: p.sunken,
          }}
        >
          <ShieldCheck size={13} color={p.ink2} />
          <AppText size={12} weight="medium" tone="ink2">
            Salt görüntüleme
          </AppText>
        </View>
        <AppText tone="ink2">
          Size bağlı tüm öğrenciler. Günlük etüt durumunu görmek için Etütler sekmesine bakın.
        </AppText>
      </View>

      {q.loading && !q.data ? <Loading /> : q.error && !q.data ? <ErrorState error={q.error} onRetry={q.reload} /> : null}

      {q.data ? (
        <>
          <AppText size={15} weight="semibold">
            Tüm öğrenciler{" "}
            <AppText mono size={13} tone="muted">
              {students.length}
            </AppText>
          </AppText>
          {students.length === 0 ? (
            <Empty>Henüz size bağlı öğrenci yok. “Öğrenci ekle” ile ilk öğrencinizi ekleyebilirsiniz.</Empty>
          ) : (
            students.map((s) => (
              <Pressable
                key={s.id}
                accessibilityRole="button"
                accessibilityLabel={`${s.fullName} etüt kayıtları`}
                onPress={() => router.push({ pathname: "/ogrenci/[id]", params: { id: s.id } })}
              >
                {({ pressed }) => (
                  <Card tone="surface" style={{ padding: 14, gap: 10, opacity: pressed ? 0.75 : 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <Avatar name={s.fullName} colorId={s.id} />
                      <View style={{ flex: 1, gap: 2 }}>
                        <AppText weight="medium" size={15}>
                          {s.fullName}
                        </AppText>
                        <AppText mono size={12} tone="muted">
                          {s.className}
                        </AppText>
                      </View>
                      <ChevronRight size={18} color={p.muted} />
                    </View>
                    <AppText mono size={12} tone="ink2">
                      {s.days.map((d) => WEEKDAY_SHORT[d]).join(" · ") || "Gün belirlenmemiş"}
                    </AppText>
                    {s.latest ? (
                      <View style={{ gap: 6 }}>
                        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
                          <AppText mono size={12} tone="muted">
                            {formatDayMonth(s.latest.date)}
                          </AppText>
                          {s.latest.attendance ? (
                            <StatusChip tone={s.latest.attendance === "came" ? "pos" : "neg"}>
                              {ATTENDANCE_LABEL[s.latest.attendance]}
                            </StatusChip>
                          ) : null}
                          {s.latest.homework ? (
                            <StatusChip tone={s.latest.homework === "done" ? "pos" : "neg"}>
                              {HOMEWORK_LABEL[s.latest.homework]}
                            </StatusChip>
                          ) : null}
                          {s.latest.book ? (
                            <StatusChip tone={s.latest.book === "brought" ? "pos" : "neg"}>
                              {BOOK_LABEL[s.latest.book]}
                            </StatusChip>
                          ) : null}
                        </View>
                        {s.latest.note ? (
                          <AppText size={13} tone="ink2">
                            {s.latest.note}
                          </AppText>
                        ) : null}
                        {s.latest.headTeacherNote ? (
                          <View style={{ gap: 1 }}>
                            <AppText size={12} tone="muted">
                              Öğretmen notu
                            </AppText>
                            <AppText size={13} tone="ink2">
                              {s.latest.headTeacherNote}
                            </AppText>
                          </View>
                        ) : null}
                      </View>
                    ) : (
                      <AppText size={13} tone="muted">
                        Henüz kayıt yok
                      </AppText>
                    )}
                  </Card>
                )}
              </Pressable>
            ))
          )}
        </>
      ) : null}

      <AddStudentSheet
        open={adding}
        onClose={() => setAdding(false)}
        onAdded={() => {
          setAdding(false);
          void q.refresh();
        }}
      />
    </Screen>
  );
}

function AddStudentSheet({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded: () => void }) {
  const [fullName, setFullName] = useState("");
  const [className, setClassName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!fullName.trim() || !className.trim()) {
      setError("Ad soyad ve sınıf gerekli.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api("/ogrencilerim", { method: "POST", body: { fullName: fullName.trim(), className: className.trim() } });
      setFullName("");
      setClassName("");
      onAdded();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Öğrenci eklenemedi, lütfen tekrar deneyin.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} title="Öğrenci ekle" onClose={onClose}>
      <Field label="Ad soyad" value={fullName} onChangeText={setFullName} />
      <Field label="Sınıf" value={className} onChangeText={setClassName} placeholder="örn. 7-B" />
      {error ? <Message ok={false} text={error} /> : null}
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Button label="Vazgeç" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
        <Button label="Ekle" onPress={submit} loading={busy} style={{ flex: 1 }} />
      </View>
    </Sheet>
  );
}
