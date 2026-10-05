import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { View } from "react-native";

import { HeadNoteEditor } from "@/components/head-note";
import { HomeworkPie } from "@/components/homework-pie";
import { AppText, Avatar, Card, Empty, ErrorState, IconButton, Loading, Screen, useRemote } from "@/components/ui";
import { api } from "@/lib/api";
import { formatDayMonth, formatTimelineDate, todayISODate, WEEKDAY_LONG } from "@/lib/date";
import type { OwnStudentDetailResponse } from "@/lib/types";
import { usePalette } from "@/theme";

const HOMEWORK_LABEL = { done: "Ödev yapıldı", missing: "Ödev eksik", not_done: "Ödev yapmadı" } as const;
const BOOK_LABEL = { brought: "Kitap getirdi", not_brought: "Kitap getirmedi" } as const;
const ATTENDANCE_LABEL = { came: "Geldi", absent: "Gelmedi" } as const;

function Square({ pos }: { pos: boolean | null }) {
  const p = usePalette();
  return (
    <View
      style={{
        flex: 1,
        maxWidth: 44,
        height: 8,
        borderRadius: 2,
        backgroundColor: pos === true ? p.accent : pos === false ? "transparent" : p.line,
        borderWidth: pos === false ? 2 : 0,
        borderColor: p.warn,
      }}
    />
  );
}

export default function OgrenciDetay() {
  const p = usePalette();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = useRemote(() => api<OwnStudentDetailResponse>(`/ogrencilerim/${id}`), [id]);
  const data = q.data;
  const records = data?.records ?? [];
  const today = todayISODate();
  const todayRecord = records.find((r) => r.date === today);
  const last4 = records.slice(0, 4);
  const allHwDone = records.filter((r) => r.homework === "done").length;
  const allHwMissing = records.filter((r) => r.homework === "missing").length;
  const allHwNotDone = records.filter((r) => r.homework === "not_done").length;

  const hwSquares = Array.from({ length: 4 }, (_, i) => {
    const h = last4[3 - i]?.homework;
    return h === undefined || h === null ? null : h === "done";
  });
  const bookSquares = Array.from({ length: 4 }, (_, i) => {
    const b = last4[3 - i]?.book;
    return b === undefined || b === null ? null : b === "brought";
  });
  const hwDone = last4.filter((r) => r.homework === "done").length;
  const hwCounted = last4.filter((r) => r.homework !== null).length;
  const bookBrought = last4.filter((r) => r.book === "brought").length;
  const bookCounted = last4.filter((r) => r.book !== null).length;

  return (
    <Screen
      title={data?.student.fullName ?? "Öğrenci"}
      crumb="Öğrencilerim"
      right={
        <IconButton label="Geri" onPress={() => router.back()}>
          <ChevronLeft size={18} color={p.ink2} />
        </IconButton>
      }
      onRefresh={q.refresh}
      refreshing={q.refreshing}
    >
      {q.loading && !data ? <Loading /> : q.error && !data ? <ErrorState error={q.error} onRetry={q.reload} /> : null}

      {data ? (
        <>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <Avatar name={data.student.fullName} colorId={data.student.id} size={56} />
            <View style={{ flex: 1, gap: 4 }}>
              <AppText size={22} weight="semibold">
                {data.student.fullName}
              </AppText>
              <AppText mono size={12} tone="muted">
                {data.student.className}
              </AppText>
              <AppText size={12} tone="ink2">
                {data.student.studyDays.map((d) => WEEKDAY_LONG[d]).join(" · ") || "Gün belirlenmemiş"}
              </AppText>
            </View>
          </View>

          <View style={{ gap: 10 }}>
            <Card style={{ padding: 14, gap: 8 }}>
              <AppText size={13} tone="muted">
                Ödev yapıldı
              </AppText>
              <AppText mono weight="medium" size={26}>
                {hwDone}
                <AppText mono size={26} tone="muted">{`/${hwCounted}`}</AppText>
              </AppText>
              <View style={{ flexDirection: "row", gap: 4 }}>
                {hwSquares.map((s, i) => (
                  <Square key={i} pos={s} />
                ))}
              </View>
            </Card>
            <Card style={{ padding: 14, gap: 8 }}>
              <AppText size={13} tone="muted">
                Kitap getirdi
              </AppText>
              <AppText mono weight="medium" size={26}>
                {bookBrought}
                <AppText mono size={26} tone="muted">{`/${bookCounted}`}</AppText>
              </AppText>
              <View style={{ flexDirection: "row", gap: 4 }}>
                {bookSquares.map((s, i) => (
                  <Square key={i} pos={s} />
                ))}
              </View>
            </Card>
            <View
              style={{
                padding: 14,
                gap: 4,
                borderRadius: 14,
                borderWidth: 1,
                borderStyle: "dashed",
                borderColor: p.line2,
                backgroundColor: p.sunken,
              }}
            >
              <AppText size={13} tone="muted">{`Bugün · ${formatDayMonth(today)}`}</AppText>
              {todayRecord ? (
                <>
                  <AppText size={12} tone="muted">
                    {todayRecord.attendance ? ATTENDANCE_LABEL[todayRecord.attendance] : "Katılım bekleniyor"}
                  </AppText>
                  <AppText size={16} weight="semibold">
                    {todayRecord.homework ? HOMEWORK_LABEL[todayRecord.homework] : "Ödev bekleniyor"}
                  </AppText>
                  <AppText size={12} tone="muted">
                    {todayRecord.book ? BOOK_LABEL[todayRecord.book] : "Kitap bekleniyor"}
                  </AppText>
                </>
              ) : (
                <>
                  <AppText size={16} weight="semibold">
                    Kayıt bekleniyor
                  </AppText>
                  <AppText size={12} tone="muted">
                    Öğretmen girince burada görünür
                  </AppText>
                </>
              )}
            </View>
          </View>

          <Card style={{ padding: 14, gap: 12 }}>
            <View style={{ gap: 2 }}>
              <AppText size={15} weight="semibold">
                Genel ödev durumu
              </AppText>
              <AppText size={13} tone="muted">
                Tüm etütlerdeki ödev kayıtlarının dağılımı.
              </AppText>
            </View>
            <HomeworkPie done={allHwDone} missing={allHwMissing} notDone={allHwNotDone} />
          </Card>

          <Card tone="surface" style={{ overflow: "hidden" }}>
            <View style={{ padding: 14, backgroundColor: p.surface2, borderBottomWidth: 1, borderBottomColor: p.line }}>
              <AppText size={15} weight="semibold">
                Etüt kayıtları
              </AppText>
            </View>
            {records.length === 0 ? (
              <Empty>Bu öğrenci için henüz etüt kaydı yok.</Empty>
            ) : (
              <View style={{ padding: 14, gap: 4 }}>
                {records.map((r) => {
                  const ok = r.homework !== "missing" && r.homework !== "not_done" && r.book !== "not_brought" && r.attendance !== "absent";
                  return (
                    <View key={r.date} style={{ flexDirection: "row", gap: 12 }}>
                      <View style={{ alignItems: "center" }}>
                        <View
                          style={{ width: 12, height: 12, borderRadius: 6, marginTop: 3, backgroundColor: ok ? p.accent : p.warn }}
                        />
                        <View style={{ flex: 1, width: 2, backgroundColor: p.line, marginTop: 4 }} />
                      </View>
                      <View style={{ flex: 1, gap: 6, paddingBottom: 16 }}>
                        <AppText mono weight="medium" size={12} tone="muted">
                          {formatTimelineDate(r.date)}
                        </AppText>
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                          {r.attendance ? <Tag pos={r.attendance === "came"}>{ATTENDANCE_LABEL[r.attendance]}</Tag> : null}
                          {r.homework ? <Tag pos={r.homework === "done"}>{HOMEWORK_LABEL[r.homework]}</Tag> : null}
                          {r.book ? <Tag pos={r.book === "brought"}>{BOOK_LABEL[r.book]}</Tag> : null}
                        </View>
                        {r.note ? <AppText tone="ink2">{r.note}</AppText> : null}
                        <HeadNoteEditor studentId={data.student.id} date={r.date} initialNote={r.headTeacherNote} onSaved={q.refresh} />
                        <AppText size={12} tone="muted">{`Giren: ${r.enteredBy}`}</AppText>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

function Tag({ pos, children }: { pos: boolean; children: string }) {
  const p = usePalette();
  return (
    <View style={{ height: 24, borderRadius: 6, paddingHorizontal: 8, justifyContent: "center", backgroundColor: pos ? p.accentSoft : p.warnSoft }}>
      <AppText size={12} weight="medium" tone={pos ? "accent" : "warn"}>
        {children}
      </AppText>
    </View>
  );
}
