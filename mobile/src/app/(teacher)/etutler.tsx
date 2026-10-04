import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { AppText, Avatar, Card, Empty, ErrorState, Loading, Screen, StatusChip, useRemote } from "@/components/ui";
import { StatTile, WeekControls, WeekStrip } from "@/components/week";
import { api } from "@/lib/api";
import { formatLong, todayISODate } from "@/lib/date";
import type { EtutlerResponse } from "@/lib/types";
import { usePalette } from "@/theme";

const HOMEWORK_LABEL = { done: "Yapıldı", missing: "Eksik" } as const;
const BOOK_LABEL = { brought: "Getirdi", not_brought: "Getirmedi" } as const;
const ATTENDANCE_LABEL = { came: "Geldi", absent: "Gelmedi" } as const;

export default function EtutlerScreen() {
  const p = usePalette();
  const router = useRouter();
  const [date, setDate] = useState<string | undefined>(undefined);
  const q = useRemote(() => api<EtutlerResponse>("/etutler", { query: { date } }), [date]);
  const view = q.data;
  const dateISO = view?.date ?? date ?? todayISODate();
  const students = view?.students ?? [];

  const done = students.filter((s) => s.homework && s.book).length;
  const eksik = students.filter((s) => s.homework === "missing");
  let homeworkDone = 0;
  let homeworkTotal = 0;
  for (const s of students) {
    for (const h of s.last4Homework) {
      if (h === null) continue;
      homeworkTotal++;
      if (h === "done") homeworkDone++;
    }
  }
  const assistantNames = (view?.assistants ?? []).map((a) => a.name).join(", ");

  return (
    <Screen
      title="Etütler"
      crumb={formatLong(dateISO).split(",")[0]}
      onRefresh={q.refresh}
      refreshing={q.refreshing}
    >
      <View style={{ gap: 12 }}>
        <AppText mono weight="medium" size={12} tone="accent" style={{ textTransform: "uppercase", letterSpacing: 0.7 }}>
          {formatLong(dateISO)}
        </AppText>
        <AppText tone="ink2">
          {view && view.assistants.length > 0
            ? `Öğrencilerinizin etüt kayıtlarını Öğretmen ${assistantNames} giriyor. Buradan yalnızca takip edebilirsiniz.`
            : view
              ? "Henüz size bağlı bir öğretmen yok. Kayıtlar girilmeye başladığında burada görünecek."
              : ""}
        </AppText>
        <WeekControls dateISO={dateISO} onChange={setDate} />
      </View>

      {q.loading && !view ? <Loading /> : q.error && !view ? <ErrorState error={q.error} onRetry={q.reload} /> : null}

      {view ? (
        <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            <StatTile label="Öğrencilerim" value={view.totalStudents} hint={`seçili günde ${students.length}'ü etütte`} />
            <StatTile label="Kayıt girildi" value={done} total={students.length} ring={{ done, total: students.length }} />
            <StatTile
              label="Ödev yapılma · son 4 etüt"
              value={homeworkDone}
              total={homeworkTotal}
              hint={`o gün etütteki ${students.length} öğrenci`}
              tone="accent"
            />
            <StatTile
              label="Ödev eksik"
              value={eksik.length}
              hint={eksik.map((s) => s.fullName).join(", ") || "—"}
              tone="warn"
            />
          </View>

          <WeekStrip dateISO={dateISO} counts={view.weekdayCounts} onSelect={setDate} />

          <AppText size={15} weight="semibold">
            {formatLong(dateISO).split(",")[0]} etüdü{" "}
            <AppText mono size={13} tone="muted">
              {students.length}
            </AppText>
          </AppText>

          {students.length === 0 ? (
            <Empty>Bu gün etüde gelecek öğrenci yok.</Empty>
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
                      <View style={{ flexDirection: "row", gap: 3 }} accessibilityLabel="Son 4 etütte ödev durumu">
                        {s.last4Homework.map((h, i) => (
                          <View
                            key={i}
                            style={{
                              width: 10,
                              height: 8,
                              borderRadius: 2,
                              backgroundColor: h === "done" ? p.accent : h === "missing" ? "transparent" : p.line,
                              borderWidth: h === "missing" ? 2 : 0,
                              borderColor: p.warn,
                            }}
                          />
                        ))}
                      </View>
                      <ChevronRight size={18} color={p.muted} />
                    </View>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                      <StatusChip tone={s.attendance === "came" ? "pos" : s.attendance === "absent" ? "neg" : "wait"}>
                        {`Katılım: ${s.attendance ? ATTENDANCE_LABEL[s.attendance] : "Bekleniyor"}`}
                      </StatusChip>
                      <StatusChip tone={s.homework === "done" ? "pos" : s.homework === "missing" ? "neg" : "wait"}>
                        {`Ödev: ${s.homework ? HOMEWORK_LABEL[s.homework] : "Bekleniyor"}`}
                      </StatusChip>
                      <StatusChip tone={s.book === "brought" ? "pos" : s.book === "not_brought" ? "neg" : "wait"}>
                        {`Kitap: ${s.book ? BOOK_LABEL[s.book] : "Bekleniyor"}`}
                      </StatusChip>
                    </View>
                    {s.note ? (
                      <AppText size={13} tone="ink2">
                        {s.note}
                      </AppText>
                    ) : null}
                  </Card>
                )}
              </Pressable>
            ))
          )}
        </>
      ) : null}
    </Screen>
  );
}
