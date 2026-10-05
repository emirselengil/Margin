import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { AppText } from "@/components/ui";
import { usePalette } from "@/theme";

/** Tüm etütlerdeki ödev durumu dağılımı (yapıldı / eksik) pasta grafiği. */
export function HomeworkPie({ done, missing, size = 120 }: { done: number; missing: number; size?: number }) {
  const p = usePalette();
  const total = done + missing;
  const donePct = total > 0 ? Math.round((done / total) * 100) : 0;
  const R = 8;
  const C = 2 * Math.PI * R; // r=8, strokeWidth=16 => 16 yarıçaplı dolu daire
  const summary =
    total === 0
      ? "Henüz ödev kaydı yok"
      : `Ödev yapıldı ${done}, yüzde ${donePct}. Ödev eksik ${missing}, yüzde ${100 - donePct}`;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
      <View accessible accessibilityRole="image" accessibilityLabel={summary}>
        <Svg width={size} height={size} viewBox="0 0 32 32" style={{ transform: [{ rotate: "-90deg" }] }}>
          <Circle cx="16" cy="16" r="16" fill={p.line} />
          {total > 0 ? (
            <>
              <Circle cx="16" cy="16" r={R} fill="none" stroke={p.warn} strokeWidth={16} strokeDasharray={`${C} ${C}`} />
              <Circle
                cx="16"
                cy="16"
                r={R}
                fill="none"
                stroke={p.accent}
                strokeWidth={16}
                strokeDasharray={`${(done / total) * C} ${C}`}
              />
            </>
          ) : null}
        </Svg>
      </View>
      <View style={{ gap: 8, flexShrink: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: p.accent }} />
          <AppText size={13} tone="ink2">
            ✓ Ödev yapıldı
          </AppText>
          <AppText mono weight="medium" size={13}>
            {total > 0 ? `${done} · %${donePct}` : `${done}`}
          </AppText>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: p.warn }} />
          <AppText size={13} tone="ink2">
            – Ödev eksik
          </AppText>
          <AppText mono weight="medium" size={13}>
            {total > 0 ? `${missing} · %${100 - donePct}` : `${missing}`}
          </AppText>
        </View>
        {total === 0 ? (
          <AppText size={13} tone="muted">
            Henüz ödev kaydı yok.
          </AppText>
        ) : null}
      </View>
    </View>
  );
}
