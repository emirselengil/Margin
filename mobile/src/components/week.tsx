import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { Pressable, View } from "react-native";

import { AppText, Card, IconButton, ProgressRing } from "@/components/ui";
import { addDaysISO, dayOfMonth, monthShortOfISO, startOfWeekISO, WEEKDAY_SHORT } from "@/lib/date";
import { usePalette } from "@/theme";

/** Önceki hafta / Bu hafta / Sonraki hafta (web'deki ile aynı). */
export function WeekControls({ dateISO, onChange }: { dateISO: string; onChange: (iso: string | undefined) => void }) {
  const p = usePalette();
  const weekStart = startOfWeekISO(dateISO);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <IconButton label="Önceki hafta" onPress={() => onChange(addDaysISO(weekStart, -7))}>
        <ChevronLeft size={18} color={p.ink2} />
      </IconButton>
      <Pressable
        accessibilityRole="button"
        onPress={() => onChange(undefined)}
        style={({ pressed }) => ({
          height: 44,
          paddingHorizontal: 14,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: p.line,
          backgroundColor: pressed ? p.sunken : p.surface,
          justifyContent: "center",
        })}
      >
        <AppText size={13} weight="medium">
          Bu hafta
        </AppText>
      </Pressable>
      <IconButton label="Sonraki hafta" onPress={() => onChange(addDaysISO(weekStart, 7))}>
        <ChevronRight size={18} color={p.ink2} />
      </IconButton>
    </View>
  );
}

/** Haftanın 7 günü; seçili gün vurgulu, altta o günkü öğrenci sayısı kadar nokta. */
export function WeekStrip({
  dateISO,
  counts,
  onSelect,
}: {
  dateISO: string;
  counts: number[];
  onSelect: (iso: string) => void;
}) {
  const p = usePalette();
  const weekStart = startOfWeekISO(dateISO);
  return (
    <View style={{ flexDirection: "row", gap: 6 }}>
      {WEEKDAY_SHORT.map((label, i) => {
        const iso = addDaysISO(weekStart, i);
        const selected = iso === dateISO;
        const dots = Math.min(counts[i] ?? 0, 4);
        return (
          <Pressable
            key={iso}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${label} ${dayOfMonth(iso)} ${monthShortOfISO(iso)}`}
            onPress={() => onSelect(iso)}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 84,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: selected ? p.accent : p.line,
              backgroundColor: selected ? p.accent : pressed ? p.sunken : p.surface,
              paddingVertical: 8,
              paddingHorizontal: 4,
              alignItems: "center",
              justifyContent: "space-between",
            })}
          >
            <AppText mono weight="medium" size={10} style={{ color: selected ? "rgba(255,255,255,0.85)" : p.muted }}>
              {label}
            </AppText>
            <View style={{ alignItems: "center" }}>
              <AppText weight="semibold" size={19} style={{ color: selected ? "#FFFFFF" : p.ink }}>
                {dayOfMonth(iso)}
              </AppText>
              <AppText weight="medium" size={10} style={{ color: selected ? "rgba(255,255,255,0.85)" : p.muted }}>
                {monthShortOfISO(iso)}
              </AppText>
            </View>
            <View style={{ flexDirection: "row", gap: 2, height: 5 }}>
              {Array.from({ length: dots }, (_, k) => (
                <View
                  key={k}
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 2,
                    backgroundColor: selected ? "rgba(255,255,255,0.8)" : p.accent,
                  }}
                />
              ))}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export function StatTile({
  label,
  value,
  total,
  hint,
  tone = "surface2",
  ring,
}: {
  label: string;
  value: number | string;
  total?: number;
  hint?: string;
  tone?: "surface2" | "warn" | "accent";
  ring?: { done: number; total: number };
}) {
  const color = tone === "warn" ? "warn" : tone === "accent" ? "accent" : "ink";
  return (
    <Card tone={tone} style={{ flexBasis: "47%", flexGrow: 1, padding: 14, gap: 4 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flex: 1 }}>
          <AppText size={13} tone={tone === "surface2" ? "muted" : color}>
            {label}
          </AppText>
          <AppText mono weight="medium" size={26} tone={color} style={{ marginTop: 4 }}>
            {value}
            {total !== undefined ? <AppText mono size={26} tone="muted">{`/${total}`}</AppText> : null}
          </AppText>
        </View>
        {ring && ring.total > 0 ? <ProgressRing done={ring.done} total={ring.total} /> : null}
      </View>
      {hint ? (
        <AppText size={12} tone={tone === "surface2" ? "muted" : color} numberOfLines={1}>
          {hint}
        </AppText>
      ) : null}
    </Card>
  );
}
