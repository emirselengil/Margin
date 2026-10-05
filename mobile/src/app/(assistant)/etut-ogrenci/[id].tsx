import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, ChevronDown, ChevronLeft, ChevronUp, Minus } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { HeadNoteReadOnly } from "@/components/head-note";
import {
  AppText,
  Avatar,
  Button,
  Card,
  ErrorState,
  Field,
  IconButton,
  Loading,
  Message,
  Screen,
  useRemote,
} from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { formatBadgeDate, formatTimelineDate, todayISODate, WEEKDAY_LONG } from "@/lib/date";
import type { Attendance, Book, Homework, StudentDetailResponse } from "@/lib/types";
import { fonts, usePalette } from "@/theme";

const NOTE_SHORTCUTS = ["Derse aktif katıldı", "Eksiği tamamlayacak"];
const ATTENDANCE_LABEL = { came: "Geldi", absent: "Gelmedi" } as const;
const HOMEWORK_LABEL = { done: "Ödev yapıldı", missing: "Ödev eksik" } as const;
const BOOK_LABEL = { brought: "Kitap getirdi", not_brought: "Kitap getirmedi" } as const;

function OptionCard({
  selected,
  tone,
  title,
  subtitle,
  onPress,
}: {
  selected: boolean;
  tone: "pos" | "neg";
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const p = usePalette();
  const border = !selected ? p.line : tone === "pos" ? p.accent : p.warn;
  const bg = !selected ? p.surface : tone === "pos" ? p.accentSoft : p.warnSoft;
  const fg = !selected ? p.ink : tone === "pos" ? p.accentText : p.warnText;
  const iconBg = !selected ? p.sunken : tone === "pos" ? p.accent : p.warn;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 68,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: border,
        backgroundColor: bg,
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        opacity: pressed ? 0.8 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: iconBg, alignItems: "center", justifyContent: "center" }}>
        {selected ? tone === "pos" ? <Check size={16} strokeWidth={2.8} color="#FFFFFF" /> : <Minus size={16} strokeWidth={2.8} color="#FFFFFF" /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <AppText weight="semibold" size={15} style={{ color: fg }}>
          {title}
        </AppText>
        <AppText size={11} style={{ color: selected ? fg : p.muted }} numberOfLines={2}>
          {subtitle}
        </AppText>
      </View>
    </Pressable>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <AppText weight="semibold">{title}</AppText>
      <View style={{ flexDirection: "row", gap: 8 }}>{children}</View>
    </View>
  );
}

export default function OgrenciDetay() {
  const p = usePalette();
  const router = useRouter();
  const { id, date } = useLocalSearchParams<{ id: string; date?: string }>();
  const dateISO = date || todayISODate();
  const q = useRemote(() => api<StudentDetailResponse>(`/etut/${id}`, { query: { date: dateISO } }), [id, dateISO]);

  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [homework, setHomework] = useState<Homework | null>(null);
  const [book, setBook] = useState<Book | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Sunucudan gelen kaydı forma yükle (öğrenci/gün değişince; sessiz yenilemeler formu ezmez)
  const detail = q.data;
  const formKey = `${id}|${dateISO}`;
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  if (detail && loadedKey !== formKey) {
    setLoadedKey(formKey);
    setAttendance(detail.record?.attendance ?? null);
    setHomework(detail.record?.homework ?? null);
    setBook(detail.record?.book ?? null);
    setNote(detail.record?.note ?? "");
    setSaved(false);
    setError(null);
  }

  async function save() {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const body: Record<string, unknown> = { date: dateISO, note: note.trim() || null };
      if (attendance) body.attendance = attendance;
      if (homework) body.homework = homework;
      if (book) body.book = book;
      await api(`/etut/${id}/record`, { method: "PUT", body });
      setSaved(true);
      router.back();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Kaydedilemedi, lütfen tekrar deneyin.");
    } finally {
      setBusy(false);
    }
  }

  function addShortcut(text: string) {
    setNote((prev) => (prev ? `${prev}${prev.endsWith(" ") ? "" : " "}${text}` : text));
  }

  const ids = detail?.sameDayStudentIds ?? [];
  const index = ids.indexOf(String(id));
  const go = (target?: string) =>
    target && router.replace({ pathname: "/etut-ogrenci/[id]", params: { id: target, date: dateISO } });

  const student = detail?.student;
  const filledPast = (detail?.pastRecords ?? []).filter((r) => r.homework || r.book || r.attendance);

  return (
    <Screen
      title={student?.fullName ?? "Öğrenci"}
      crumb={`Etüt listesi › ${formatBadgeDate(dateISO)}`}
      right={
        <View style={{ flexDirection: "row", gap: 6 }}>
          <IconButton label="Geri" onPress={() => router.back()}>
            <ChevronLeft size={18} color={p.ink2} />
          </IconButton>
          {index >= 0 ? (
            <>
              <IconButton label="Önceki öğrenci" onPress={() => go(ids[index - 1])} style={{ opacity: index > 0 ? 1 : 0.4 }}>
                <ChevronUp size={18} color={p.ink2} />
              </IconButton>
              <IconButton label="Sonraki öğrenci" onPress={() => go(ids[index + 1])} style={{ opacity: index < ids.length - 1 ? 1 : 0.4 }}>
                <ChevronDown size={18} color={p.ink2} />
              </IconButton>
            </>
          ) : null}
        </View>
      }
    >
      {q.loading && !detail ? <Loading /> : q.error && !detail ? <ErrorState error={q.error} onRetry={q.reload} /> : null}

      {detail && student ? (
        <>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <Avatar name={student.fullName} colorId={student.headTeacherId} size={56} />
            <View style={{ flex: 1, gap: 6 }}>
              <AppText size={22} weight="semibold">
                {student.fullName}
              </AppText>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                <Pill>{student.className}</Pill>
                <Pill accent>{student.headTeacherName}</Pill>
                <Pill>{student.studyDays.map((d) => WEEKDAY_LONG[d]).join(" · ") || "Gün belirlenmemiş"}</Pill>
              </View>
            </View>
          </View>

          {detail.scheduled ? (
            <Card tone="surface" style={{ overflow: "hidden" }}>
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
                <AppText weight="semibold" size={15}>
                  Bugünkü kayıt
                </AppText>
                <View style={{ backgroundColor: p.accentSoft, borderRadius: 7, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <AppText mono weight="medium" size={12} tone="accent">
                    {formatBadgeDate(dateISO)}
                  </AppText>
                </View>
              </View>
              <View style={{ padding: 14, gap: 18 }}>
                <Group title="Katılım">
                  <OptionCard selected={attendance === "came"} tone="pos" title="Geldi" subtitle="Etüde katıldı" onPress={() => setAttendance("came")} />
                  <OptionCard selected={attendance === "absent"} tone="neg" title="Gelmedi" subtitle="Etüde katılmadı" onPress={() => setAttendance("absent")} />
                </Group>
                <Group title="Ödev durumu">
                  <OptionCard selected={homework === "done"} tone="pos" title="Yapıldı" subtitle="Ödevin tamamı yapılmış" onPress={() => setHomework("done")} />
                  <OptionCard selected={homework === "missing"} tone="neg" title="Eksik" subtitle="Eksik kalan kısım var" onPress={() => setHomework("missing")} />
                </Group>
                <Group title="Kitap">
                  <OptionCard selected={book === "brought"} tone="pos" title="Getirdi" subtitle="Kitabı yanında" onPress={() => setBook("brought")} />
                  <OptionCard selected={book === "not_brought"} tone="neg" title="Getirmedi" subtitle="Kitabı yanında değil" onPress={() => setBook("not_brought")} />
                </Group>
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                    {NOTE_SHORTCUTS.map((s) => (
                      <Pressable
                        key={s}
                        accessibilityRole="button"
                        onPress={() => addShortcut(s)}
                        style={({ pressed }) => ({
                          minHeight: 36,
                          paddingHorizontal: 12,
                          borderRadius: 18,
                          borderWidth: 1,
                          borderColor: p.line,
                          backgroundColor: pressed ? p.sunken : p.surface2,
                          justifyContent: "center",
                        })}
                      >
                        <AppText size={12} weight="medium" tone="ink2">{`+ ${s}`}</AppText>
                      </Pressable>
                    ))}
                  </View>
                  <Field label="Not" value={note} onChangeText={setNote} placeholder="Öğretmen notu (isteğe bağlı)" multiline />
                </View>
                {detail?.record?.headTeacherNote ? (
                  <HeadNoteReadOnly note={detail.record.headTeacherNote} title="Baş öğretmen notu (salt okunur)" />
                ) : null}
                {error ? <Message ok={false} text={error} /> : null}
                {saved ? <Message ok text="Kaydedildi." /> : null}
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Button label="Vazgeç" variant="secondary" onPress={() => router.back()} style={{ flex: 1 }} />
                  <Button label="Kaydet" onPress={save} loading={busy} style={{ flex: 1 }} />
                </View>
              </View>
            </Card>
          ) : (
            <Card style={{ padding: 16 }}>
              <AppText tone="ink2">
                {`${student.fullName}, ${formatBadgeDate(dateISO)} için etüde atanmamış. Bu tarihe kayıt eklenemez.`}
              </AppText>
            </Card>
          )}

          <View style={{ gap: 12 }}>
            <AppText size={15} weight="semibold">
              Geçmiş etütler
            </AppText>
            {filledPast.length === 0 ? (
              <AppText tone="ink2">Bu öğrenci için henüz geçmiş etüt kaydı yok.</AppText>
            ) : (
              filledPast.map((r) => {
                const ok = r.homework !== "missing" && r.book !== "not_brought" && r.attendance !== "absent";
                return (
                  <View key={r.date} style={{ flexDirection: "row", gap: 12 }}>
                    <View style={{ alignItems: "center" }}>
                      <View style={{ width: 12, height: 12, borderRadius: 6, marginTop: 3, backgroundColor: ok ? p.accent : p.warn }} />
                      <View style={{ flex: 1, width: 2, backgroundColor: p.line, marginTop: 4 }} />
                    </View>
                    <View style={{ flex: 1, gap: 6, paddingBottom: 14 }}>
                      <AppText mono weight="medium" size={12} tone="muted">
                        {formatTimelineDate(r.date)}
                      </AppText>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                        {r.attendance ? <Tag pos={r.attendance === "came"}>{ATTENDANCE_LABEL[r.attendance]}</Tag> : null}
                        {r.homework ? <Tag pos={r.homework === "done"}>{HOMEWORK_LABEL[r.homework]}</Tag> : null}
                        {r.book ? <Tag pos={r.book === "brought"}>{BOOK_LABEL[r.book]}</Tag> : null}
                      </View>
                      {r.note ? <AppText tone="ink2">{r.note}</AppText> : null}
                      {r.headTeacherNote ? <HeadNoteReadOnly note={r.headTeacherNote} /> : null}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </>
      ) : null}
    </Screen>
  );
}

function Pill({ children, accent }: { children: string; accent?: boolean }) {
  const p = usePalette();
  return (
    <View
      style={{
        height: 26,
        borderRadius: 7,
        paddingHorizontal: 10,
        justifyContent: "center",
        backgroundColor: accent ? p.accentSoft : p.sunken,
        borderWidth: accent ? 0 : 1,
        borderColor: p.line,
      }}
    >
      <AppText size={12} weight="medium" tone={accent ? "accent" : "ink2"} mono={!accent && children.length < 8}>
        {children}
      </AppText>
    </View>
  );
}

function Tag({ pos, children }: { pos: boolean; children: string }) {
  const p = usePalette();
  return (
    <View style={{ height: 24, borderRadius: 6, paddingHorizontal: 8, justifyContent: "center", backgroundColor: pos ? p.accentSoft : p.warnSoft }}>
      <AppText size={12} weight="medium" tone={pos ? "accent" : "warn"} style={{ fontFamily: fonts.medium }}>
        {children}
      </AppText>
    </View>
  );
}
