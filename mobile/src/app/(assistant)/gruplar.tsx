import { Check, Plus, Search } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  AppText,
  Avatar,
  Button,
  Card,
  ColorDot,
  Empty,
  ErrorState,
  Field,
  Loading,
  Message,
  OptionPicker,
  Screen,
  Sheet,
  useRemote,
} from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { WEEKDAY_LONG, WEEKDAY_SHORT } from "@/lib/date";
import type { GroupStudent, GruplarResponse } from "@/lib/types";
import { fonts, usePalette } from "@/theme";

type StudentForm = { fullName: string; className: string; headTeacherId: string };

export default function GruplarScreen() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const q = useRemote(() => api<GruplarResponse>("/gruplar"), []);

  const [students, setStudents] = useState<GroupStudent[]>([]);
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState<"days" | "grid">("days");
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<{ mode: "add" } | { mode: "edit"; id: string } | null>(null);

  // Sunucudan gelen listeyi yerel düzenleme durumuna al (kaydedilmemiş değişiklik yokken).
  // Render sırasında eşitleme deseni: efekt yerine, ekstra render turu olmadan.
  const [syncedWith, setSyncedWith] = useState<GruplarResponse | null>(null);
  if (q.data && q.data !== syncedWith && dirty.size === 0) {
    setSyncedWith(q.data);
    setStudents(q.data.students);
  }

  const allTeachers = q.data?.allHeadTeachers ?? [];
  const filterTeachers = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of students) if (s.headTeacherName !== "—") map.set(s.headTeacherId, s.headTeacherName);
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [students]);
  const byTeacher = filter === "all" ? students : students.filter((s) => s.headTeacherId === filter);
  const needle = query.trim().toLocaleLowerCase("tr");
  const shown = needle ? byTeacher.filter((s) => s.fullName.toLocaleLowerCase("tr").includes(needle)) : byTeacher;
  const dayGroups = [
    ...WEEKDAY_LONG.map((title, i) => ({ key: String(i), title, list: shown.filter((s) => s.days.includes(i)) })),
    { key: "none", title: "Gün atanmamış", list: shown.filter((s) => s.days.length === 0) },
  ].filter((g) => g.list.length > 0);

  function toggleDay(studentId: string, weekday: number) {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        const has = s.days.includes(weekday);
        return { ...s, days: has ? s.days.filter((d) => d !== weekday) : [...s.days, weekday].sort((a, b) => a - b) };
      }),
    );
    setDirty((prev) => new Set(prev).add(studentId));
  }

  async function saveDays() {
    setSaving(true);
    setSaveError(null);
    try {
      await api("/gruplar/days", {
        method: "PUT",
        body: {
          changes: Array.from(dirty).map((studentId) => ({
            studentId,
            weekdays: students.find((s) => s.id === studentId)?.days ?? [],
          })),
        },
      });
      // Kaydedilen hâl yerelde zaten güncel; eski sunucu verisiyle ezilmesin
      setSyncedWith(q.data);
      setDirty(new Set());
    } catch (e) {
      setSaveError(e instanceof ApiError ? e.message : "Kaydedilemedi, lütfen tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  }

  const editing = sheet?.mode === "edit" ? students.find((s) => s.id === sheet.id) : undefined;
  const totals = [0, 0, 0, 0, 0, 0, 0];
  for (const s of byTeacher) for (const d of s.days) totals[d]++;
  // Çubuklar en kalabalık güne göre oranlanır; öğrenci sayısı ne olursa olsun kutuya sığar.
  const maxTotal = Math.max(1, ...totals);
  const BAR_MAX = 56;

  return (
    <Screen
      title="Gün grupları"
      crumb="Haftalık plan"
      onRefresh={q.refresh}
      refreshing={q.refreshing}
      right={
        <Button
          label="Öğrenci ekle"
          small
          variant="secondary"
          onPress={() => setSheet({ mode: "add" })}
          disabled={allTeachers.length === 0}
          icon={<Plus size={15} color={p.ink} />}
        />
      }
      footer={
        dirty.size > 0 ? (
          <View
            style={{
              padding: 12,
              paddingBottom: Math.max(insets.bottom, 12) + 4,
              backgroundColor: p.surface,
              borderTopWidth: 1,
              borderTopColor: p.line,
              gap: 8,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: p.warnText }} />
              <AppText size={12} weight="medium" tone="warn">
                Kaydedilmemiş değişiklik
              </AppText>
            </View>
            {saveError ? <Message ok={false} text={saveError} /> : null}
            <Button label="Kaydet" onPress={saveDays} loading={saving} />
          </View>
        ) : null
      }
    >
      <View style={{ gap: 6 }}>
        <AppText mono weight="medium" size={12} tone="accent" style={{ textTransform: "uppercase", letterSpacing: 0.7 }}>
          Haftalık plan
        </AppText>
        <AppText size={26} weight="semibold">
          Kim hangi gün geliyor?
        </AppText>
        <AppText tone="ink2">Öğrenciler işaretli günlere göre listelenir. Günleri değiştirmek için “Plan tablosu”na geçip kutulara dokunun. Etüt listesi her gün bu plana göre oluşur.</AppText>
      </View>

      {q.loading && !q.data ? <Loading /> : q.error && !q.data ? <ErrorState error={q.error} onRetry={q.reload} /> : null}

      {q.data ? (
        <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            <FilterChip label={`Tümü · ${students.length}`} active={filter === "all"} onPress={() => setFilter("all")} />
            {filterTeachers.map((t) => (
              <FilterChip
                key={t.id}
                label={`${t.name} · ${students.filter((s) => s.headTeacherId === t.id).length}`}
                active={filter === t.id}
                onPress={() => setFilter(t.id)}
              />
            ))}
          </View>

          <Card style={{ padding: 14, gap: 10 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <AppText weight="semibold" size={13}>
                Günlük yoğunluk
              </AppText>
              <AppText size={13} tone="muted">
                öğrenci sayısı
              </AppText>
            </View>
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6, height: 104 }}>
              {WEEKDAY_SHORT.map((label, i) => (
                <View key={label} style={{ flex: 1, alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
                  <AppText mono weight="medium" size={12}>
                    {totals[i]}
                  </AppText>
                  <View
                    style={{
                      width: "70%",
                      maxWidth: 30,
                      height: Math.max(4, Math.round((totals[i] / maxTotal) * BAR_MAX)),
                      borderRadius: 5,
                      backgroundColor: totals[i] ? p.accent : p.line,
                    }}
                  />
                  <AppText mono weight="medium" size={10} tone="muted">
                    {label}
                  </AppText>
                </View>
              ))}
            </View>
          </Card>

          <View style={{ flexDirection: "row", gap: 2, padding: 3, borderRadius: 10, borderWidth: 1, borderColor: p.line, backgroundColor: p.sunken }}>
            {(
              [
                ["days", "Günlere göre"],
                ["grid", "Plan tablosu"],
              ] as const
            ).map(([value, label]) => (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityState={{ selected: view === value }}
                onPress={() => setView(value)}
                style={({ pressed }) => ({
                  flex: 1,
                  minHeight: 40,
                  borderRadius: 7,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: view === value ? p.surface : "transparent",
                  borderWidth: view === value ? 1 : 0,
                  borderColor: p.line,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <AppText size={13} weight="medium" tone={view === value ? "ink" : "muted"}>
                  {label}
                </AppText>
              </Pressable>
            ))}
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
              aria-label="Öğrenci ara"
              style={{ flex: 1, fontFamily: fonts.regular, fontSize: 14, color: p.ink }}
            />
          </View>

          {shown.length === 0 ? (
            <Empty>{needle ? `“${query.trim()}” ile eşleşen öğrenci bulunamadı.` : "Gösterilecek öğrenci yok."}</Empty>
          ) : view === "days" ? (
            dayGroups.map((g) => (
              <Card key={g.key} tone="surface" style={{ overflow: "hidden" }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: 14,
                    backgroundColor: p.surface2,
                    borderBottomWidth: 1,
                    borderBottomColor: p.line,
                  }}
                >
                  <AppText size={15} weight="semibold">
                    {g.title}
                  </AppText>
                  <AppText mono size={13} tone="muted">{`${g.list.length} öğrenci`}</AppText>
                </View>
                {g.list.map((s, i) => (
                  <Pressable
                    key={s.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${s.fullName} bilgilerini düzenle`}
                    onPress={() => setSheet({ mode: "edit", id: s.id })}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      padding: 12,
                      borderTopWidth: i === 0 ? 0 : 1,
                      borderTopColor: p.line,
                      backgroundColor: pressed ? p.sunken : "transparent",
                    })}
                  >
                    <Avatar name={s.fullName} colorId={s.headTeacherId} size={34} />
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
                      <AppText mono size={11} tone="muted">
                        {s.days.map((d) => WEEKDAY_SHORT[d]).join(" · ") || "—"}
                      </AppText>
                    </View>
                  </Pressable>
                ))}
              </Card>
            ))
          ) : (
            shown.map((s) => (
              <Card key={s.id} tone="surface" style={{ padding: 14, gap: 12 }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${s.fullName} bilgilerini düzenle`}
                  onPress={() => setSheet({ mode: "edit", id: s.id })}
                  style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, opacity: pressed ? 0.7 : 1 })}
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
                  <AppText mono size={13} weight="medium">
                    {s.days.length}
                  </AppText>
                </Pressable>
                <View style={{ flexDirection: "row", gap: 5 }}>
                  {WEEKDAY_SHORT.map((label, di) => {
                    const on = s.days.includes(di);
                    return (
                      <Pressable
                        key={di}
                        accessibilityRole="button"
                        accessibilityLabel={`${s.fullName}, ${WEEKDAY_LONG[di]}`}
                        accessibilityState={{ selected: on }}
                        onPress={() => toggleDay(s.id, di)}
                        style={({ pressed }) => ({
                          flex: 1,
                          height: 46,
                          borderRadius: 10,
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 1,
                          backgroundColor: on ? p.accent : p.sunken,
                          borderWidth: on ? 0 : 1,
                          borderStyle: "dashed",
                          borderColor: p.line2,
                          opacity: pressed ? 0.75 : 1,
                        })}
                      >
                        {on ? <Check size={14} strokeWidth={3} color="#FFFFFF" /> : null}
                        <AppText mono weight="medium" size={10} style={{ color: on ? "#FFFFFF" : p.muted }}>
                          {label}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              </Card>
            ))
          )}
        </>
      ) : null}

      <StudentSheet
        open={sheet !== null}
        mode={sheet?.mode ?? "add"}
        teachers={allTeachers}
        initial={
          editing
            ? {
                fullName: editing.fullName,
                className: editing.className,
                // Pasif/artık seçilemeyen öğretmen: yeniden seçtir
                headTeacherId: allTeachers.some((t) => t.id === editing.headTeacherId) ? editing.headTeacherId : "",
              }
            : { fullName: "", className: "", headTeacherId: allTeachers[0]?.id ?? "" }
        }
        onClose={() => setSheet(null)}
        onSubmit={async (data) => {
          const teacher = allTeachers.find((t) => t.id === data.headTeacherId);
          if (sheet?.mode === "edit") {
            await api(`/gruplar/students/${sheet.id}`, { method: "PATCH", body: data });
            setStudents((prev) =>
              prev.map((s) =>
                s.id === sheet.id
                  ? { ...s, ...data, headTeacherName: teacher?.name ?? s.headTeacherName }
                  : s,
              ),
            );
          } else {
            const { id } = await api<{ id: string }>("/gruplar/students", { method: "POST", body: data });
            setStudents((prev) => [
              ...prev,
              { id, ...data, headTeacherName: teacher?.name ?? "", days: [] },
            ]);
            setFilter("all");
          }
          setSheet(null);
        }}
      />
    </Screen>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const p = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 38,
        paddingHorizontal: 12,
        borderRadius: 9,
        borderWidth: 1,
        borderColor: active ? p.line2 : p.line,
        backgroundColor: active ? p.surface : pressed ? p.line : p.sunken,
        justifyContent: "center",
      })}
    >
      <AppText size={13} weight="medium" tone={active ? "ink" : "muted"}>
        {label}
      </AppText>
    </Pressable>
  );
}

function StudentSheet({
  open,
  mode,
  teachers,
  initial,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: "add" | "edit";
  teachers: { id: string; name: string }[];
  initial: StudentForm;
  onClose: () => void;
  onSubmit: (data: StudentForm) => Promise<void>;
}) {
  const [form, setForm] = useState<StudentForm>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pencere her açıldığında formu başlangıç değerleriyle doldur
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open && !wasOpen.current) {
      setForm(initial);
      setError(null);
    }
    wasOpen.current = open;
  }, [open, initial]);

  async function submit() {
    if (!form.fullName.trim() || !form.className.trim() || !form.headTeacherId) {
      setError("Ad soyad, sınıf ve öğretmen gerekli.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit({ ...form, fullName: form.fullName.trim(), className: form.className.trim() });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Kaydedilemedi, lütfen tekrar deneyin.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} title={mode === "add" ? "Öğrenci ekle" : "Öğrenciyi düzenle"} onClose={onClose}>
      <Field label="Ad soyad" value={form.fullName} onChangeText={(v) => setForm({ ...form, fullName: v })} />
      <Field
        label="Sınıf"
        value={form.className}
        placeholder="örn. 7-B"
        onChangeText={(v) => setForm({ ...form, className: v })}
      />
      <OptionPicker
        label="Öğretmen"
        options={teachers}
        value={form.headTeacherId}
        placeholder="Öğretmen seçin"
        onChange={(id) => setForm({ ...form, headTeacherId: id })}
      />
      {error ? <Message ok={false} text={error} /> : null}
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Button label="Vazgeç" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
        <Button label={mode === "add" ? "Ekle" : "Kaydet"} onPress={submit} loading={busy} style={{ flex: 1 }} />
      </View>
    </Sheet>
  );
}
