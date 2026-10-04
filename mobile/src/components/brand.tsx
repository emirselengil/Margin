import { View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { AppText } from "@/components/ui";
import { usePalette } from "@/theme";

export function Logo({ size = 30 }: { size?: number }) {
  const p = usePalette();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: 9,
          backgroundColor: p.accent,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Svg width={size * 0.53} height={size * 0.53} viewBox="0 0 20 20">
          <Path d="M5 5.5h10M5 10h6M5 14.5h10" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
        </Svg>
      </View>
      <AppText size={15} weight="semibold">
        Margin
      </AppText>
    </View>
  );
}
