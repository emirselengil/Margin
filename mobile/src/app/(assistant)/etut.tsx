import { useRouter } from "expo-router";
import { ChevronRight, Search } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, TextInput, View } from "react-native";

import {
  AppText,
  Avatar,
  Card,
  ColorDot,
  Empty,
  ErrorState,
  Loading,
  Message,
  Screen,
  StatusToggle,
  useRemote,
} from "@/components/ui";
import { StatTile, WeekControls, WeekStrip } from "@/components/week";
import { api, ApiError } from "@/lib/api";
import { formatLong, todayISODate } from "@/lib/date";
import type { Attendance, Book, EtutResponse, Homework, StudentForDay } from "@/lib/types";
import { fonts, usePalette } from "@/theme";

const ATTENDANCE = [
  { value: "came", label: "Geldi", tone: "pos" },
  { value: "absent", label: "Gelmedi", tone: "neg" },
] as const;
const HOMEWORK = [
  { value: "done", label: "Yapıldı", tone: "pos" },
  { value: "missing", label: "Eksik", tone: "neg" },
] as const;
const BOOK = [
  { value: "brought", label: "Getirdi", tone: "pos" },
  { value: "not_brought", label: "Getirmedi", tone: "neg" },
] as const;

type Field = "attendance" | "homework" | "book";

export default function EtutScreen() {
  const p = usePalette();
  const router = useRouter();
  const [date, setDate] = useState<string | undefined>(undefined);
  const [query, setQuery] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const q = useRemote(() => api<EtutResponse>("/etut", { query: { date } }), [date]);

  const view = q.data;
  const dateISO = view?.date ?? date ?? todayISODate();

  const filtered = useMemo(() => {
    const list = view?.students ?? [];
    const needle = query.trim().toLocaleLowerCase("tr");
    return needle ? list.filter((s) => s.fullName.toLocaleLowerCase("tr").includes(needle)) : list;
  }, [view, query]);

  async function setField(student: StudentForDay, field: Field, value: string) {
    if (!view) return;
    const previous = student[field];
    setSaveError(null);
    // Anında göster (web'deki gibi); hata olursa geri al.
    q.setData({ ...view, students: view.students.map((s) => (s.id === student.id ? { ...s, [field]: value } : s)) });
    try {
      await api(`/etut/${student.id}/record`, { method: "PUT", body: { date: dateISO, [field]: value } });
    } catch (e) {
      q.setData({
        ...view,
        students: view.students.map((s) => (s.id === student.id ? { ...s, [field]: previous } : s)),
      });
      setSaveError(e instanceof ApiError ? e.message : "Kaydedilemedi, lütfen tekrar deneyin.");
    }
  }

  const students = view?.students ?? [];
  const done = students.filter((s) => s.homework && s.book).length;
  const odevEksik = students.filter((s) => s.homework === "missing").length;
  const kitapYok = students.filter((s) => s.book === "not_brought").length;
  const teacherCount = new Set(students.map((s) => s.headTeacherId)).size;

  return (
    <Screen
      title="Bugünün etüdü"
      crumb={`Etüt listesi › ${formatLong(dateISO).split(",")[0]}`}
      onRefresh={q.refresh}
      refreshing={q.refreshing}
    >
      <View style={{ gap: 12 }}>
        <AppText mono weight="medium" size={12} tone="accent" style={{ textTransform: "uppercase", letterSpacing: 0.7 }}>
          {formatLong(dateISO)}
        </AppText>
        <WeekControls dateISO={dateISO} onChange={setDate} />
      </View>

      {q.loading && !view ? <Loading /> : q.error && !view ? <ErrorState error={q.error} onRetry={q.reload} /> : null}

      {view ? (
        <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            <StatTile label="Kayıt girildi" value={done} total={students.length} ring={{ done, total: students.length }} />
            <StatTile label="Etüde gelecek" value={students.length} hint={`${teacherCount} öğretmen`} />
            <StatTile label="Ödev eksik" value={odevEksik} hint="öğrenci" tone="warn" />
            <StatTile label="Kitap getirmedi" value={kitapYok} hint="öğrenci" tone="warn" />
          </View>

          <WeekStrip dateISO={dateISO} counts={view.weekdayCounts} onSelect={setDate} />

          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <AppText size={15} weight="semibold">
                Öğrenciler{" "}
                <AppText mono size={13} tone="muted">
                  {students.length}
                </AppText>
              </AppText>
              <AppText size={12} tone="muted">
                Seçimler anında kaydedilir
              </AppText>
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                height: 44,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: p.line,
                backgroundColor: p.sunken,
                paddingHorizontal: 12,
              }}
            >
              <Search size={16} color={p.muted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Öğrenci ara"
                placeholderTextColor={p.muted}
                accessibilityLabel="Öğrenci ara"
                style={{ flex: 1, fontFamily: fonts.regular, fontSize: 14, color: p.ink }}
              />
            </View>

            {saveError ? <Message ok={false} text={saveError} /> : null}

            {students.length === 0 ? (
              <Empty>Bu gün etüde gelecek öğrenci yok.</Empty>
            ) : filtered.length === 0 ? (
              <Empty>{`“${query}” ile eşleşen öğrenci bulunamadı.`}</Empty>
            ) : (
              filtered.map((s) => (
                <Card key={s.id} tone="surface" style={{ padding: 14, gap: 12 }}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${s.fullName} detayı`}
                    onPress={() =>
                      router.push({ pathname: "/etut-ogrenci/[id]", params: { id: s.id, date: dateISO } })
                    }
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <Avatar name={s.fullName} colorId={s.headTeacherId} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <AppText weight="medium" size={15}>
                        {s.fullName}
                      </AppText>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <AppText mono size={12} tone="muted">
                          {s.className}
                        </AppText>
                        <ColorDot colorId={s.headTeacherId} />
                        <AppText size={12} tone="ink2" numberOfLines={1} style={{ flexShrink: 1 }}>
                          {s.headTeacherName}
                        </AppText>
                      </View>
                    </View>
                    <ChevronRight size={18} color={p.muted} />
                  </Pressable>

                  <ToggleRow label="Katılım">
                    <StatusToggle
                      label="Katılım"
                      value={s.attendance}
                      options={ATTENDANCE}
                      onSelect={(v) => setField(s, "attendance", v as Attendance)}
                    />
                  </ToggleRow>
                  <ToggleRow label="Ödev">
                    <StatusToggle
                      label="Ödev"
                      value={s.homework}
                      options={HOMEWORK}
                      onSelect={(v) => setField(s, "homework", v as Homework)}
                    />
                  </ToggleRow>
                  <ToggleRow label="Kitap">
                    <StatusToggle
                      label="Kitap"
                      value={s.book}
                      options={BOOK}
                      onSelect={(v) => setField(s, "book", v as Book)}
                    />
                  </ToggleRow>

                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      router.push({ pathname: "/etut-ogrenci/[id]", params: { id: s.id, date: dateISO } })
                    }
                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, minHeight: 32, justifyContent: "center" })}
                  >
                    {s.note ? (
                      <AppText size={13} tone="ink2">
                        {s.note}
                      </AppText>
                    ) : (
                      <AppText size={13} weight="medium" tone="accent">
                        + Not ekle
                      </AppText>
                    )}
                  </Pressable>
                </Card>
              ))
            )}
          </View>
        </>
      ) : null}
    </Screen>
  );
}

function ToggleRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <AppText size={12} tone="muted" weight="medium">
        {label}
      </AppText>
      {children}
    </View>
  );
}
