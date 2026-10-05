import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { AppText } from "@/components/ui";
import { usePalette } from "@/theme";

// Dilimler r=8, çizgi kalınlığı 16 olan halkalarla çizilir (dolu pasta görünümü).
const ARC_R = 8;
const ARC_LEN = 2 * Math.PI * ARC_R;

/** Üç dilimin yüzdeleri toplamı her zaman 100 olacak şekilde yuvarlanır. */
function percentages(done: number, missing: number, notDone: number) {
  const total = done + missing + notDone;
  if (total === 0) return { done: 0, missing: 0, notDone: 0 };
  const d = Math.round((done / total) * 100);
  const m = Math.round((missing / total) * 100);
  return { done: d, missing: m, notDone: Math.max(0, 100 - d - m) };
}

/** Tüm etütlerdeki ödev durumu dağılımı (yapıldı / eksik / yapmadı) pasta grafiği. */
export function HomeworkPie({
  done,
  missing,
  notDone,
  size = 120,
}: {
  done: number;
  missing: number;
  notDone: number;
  size?: number;
}) {
  const p = usePalette();
  const total = done + missing + notDone;
  const pct = percentages(done, missing, notDone);
  const summary =
    total === 0
      ? "Henüz ödev kaydı yok"
      : `Ödev yapıldı ${done}, yüzde ${pct.done}. Ödev eksik ${missing}, yüzde ${pct.missing}. Ödev yapmadı ${notDone}, yüzde ${pct.notDone}`;

  const slices = [
    { key: "done", label: "✓ Ödev yapıldı", count: done, pct: pct.done, color: p.accent, opacity: 1 },
    { key: "missing", label: "– Ödev eksik", count: missing, pct: pct.missing, color: p.warn, opacity: 0.5 },
    { key: "notDone", label: "✕ Ödev yapmadı", count: notDone, pct: pct.notDone, color: p.warn, opacity: 1 },
  ];
  let offset = 0;
  const drawn = slices.map((s) => {
    const len = total > 0 ? (s.count / total) * ARC_LEN : 0;
    const arc = { ...s, len, offset };
    offset += len;
    return arc;
  });

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
      <View accessible accessibilityRole="image" accessibilityLabel={summary}>
        <Svg width={size} height={size} viewBox="0 0 32 32" style={{ transform: [{ rotate: "-90deg" }] }}>
          <Circle cx="16" cy="16" r="16" fill={p.line} />
          {drawn
            .filter((a) => a.len > 0)
            .map((a) => (
              <Circle
                key={a.key}
                cx="16"
                cy="16"
                r={ARC_R}
                fill="none"
                stroke={a.color}
                strokeOpacity={a.opacity}
                strokeWidth={16}
                strokeDasharray={`${a.len} ${ARC_LEN}`}
                strokeDashoffset={-a.offset}
              />
            ))}
        </Svg>
      </View>
      <View style={{ gap: 8, flexShrink: 1 }}>
        {slices.map((s) => (
          <View key={s.key} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: s.color, opacity: s.opacity }} />
            <AppText size={13} tone="ink2">
              {s.label}
            </AppText>
            <AppText mono weight="medium" size={13}>
              {total > 0 ? `${s.count} · %${s.pct}` : `${s.count}`}
            </AppText>
          </View>
        ))}
        {total === 0 ? (
          <AppText size={13} tone="muted">
            Henüz ödev kaydı yok.
          </AppText>
        ) : null}
      </View>
    </View>
  );
}
