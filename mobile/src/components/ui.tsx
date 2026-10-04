import { useFocusEffect } from "expo-router";
import { AlertTriangle, Check, Minus } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ApiError } from "@/lib/api";
import { avatarColors, fonts, initialsOf, usePalette, type Palette } from "@/theme";

/* ---------- Metin ---------- */

type Tone = "ink" | "ink2" | "muted" | "accent" | "warn" | "white";

function toneColor(p: Palette, tone: Tone) {
  switch (tone) {
    case "ink2":
      return p.ink2;
    case "muted":
      return p.muted;
    case "accent":
      return p.accentText;
    case "warn":
      return p.warnText;
    case "white":
      return "#FFFFFF";
    default:
      return p.ink;
  }
}

export function AppText({
  size = 14,
  weight = "regular",
  tone = "ink",
  mono,
  style,
  ...rest
}: {
  size?: number;
  weight?: "regular" | "medium" | "semibold";
  tone?: Tone;
  mono?: boolean;
} & React.ComponentProps<typeof Text>) {
  const p = usePalette();
  const family = mono ? (weight === "regular" ? fonts.mono : fonts.monoMedium) : fonts[weight];
  return <Text {...rest} style={[{ fontFamily: family, fontSize: size, color: toneColor(p, tone) }, style]} />;
}

/* ---------- Kart / düğme ---------- */

export function Card({
  children,
  style,
  tone = "surface2",
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: "surface" | "surface2" | "accent" | "warn";
}) {
  const p = usePalette();
  const bg = tone === "accent" ? p.accentSoft : tone === "warn" ? p.warnSoft : tone === "surface" ? p.surface : p.surface2;
  const border = tone === "accent" ? p.accentLine : tone === "warn" ? p.warnLine : p.line;
  return (
    <View style={[{ backgroundColor: bg, borderColor: border, borderWidth: 1, borderRadius: 14 }, style]}>{children}</View>
  );
}

export function Button({
  label,
  onPress,
  variant = "primary",
  loading,
  disabled,
  icon,
  style,
  small,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}) {
  const p = usePalette();
  const off = disabled || loading;
  const bg = variant === "primary" ? p.accent : variant === "danger" ? "transparent" : p.surface;
  const border = variant === "primary" ? p.accent : variant === "danger" ? p.warnLine : p.line;
  const color = variant === "primary" ? "#FFFFFF" : variant === "danger" ? p.warnText : p.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [
        {
          minHeight: small ? 40 : 46,
          borderRadius: 10,
          paddingHorizontal: 16,
          backgroundColor: bg,
          borderWidth: 1,
          borderColor: border,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 6,
          opacity: off ? 0.55 : pressed ? 0.8 : 1,
          transform: [{ scale: pressed && !off ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator size="small" color={color} /> : icon}
      <Text style={{ fontFamily: fonts.medium, fontSize: small ? 13 : 14, color }}>{label}</Text>
    </Pressable>
  );
}

export function IconButton({
  label,
  onPress,
  children,
  style,
}: {
  label: string;
  onPress: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const p = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        {
          width: 44,
          height: 44,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: p.line,
          backgroundColor: pressed ? p.sunken : p.surface,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

/* ---------- Form ---------- */

export function Field({
  label,
  error,
  containerStyle,
  ...input
}: { label: string; error?: string | null; containerStyle?: StyleProp<ViewStyle> } & TextInputProps) {
  const p = usePalette();
  const [focused, setFocused] = useState(false);
  return (
    <View style={[{ gap: 6 }, containerStyle]}>
      <AppText size={13} weight="medium">
        {label}
      </AppText>
      <TextInput
        placeholderTextColor={p.muted}
        aria-label={label}
        {...input}
        onFocus={(e) => {
          setFocused(true);
          input.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          input.onBlur?.(e);
        }}
        style={[
          {
            minHeight: 46,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: focused ? p.accent : p.line2,
            backgroundColor: p.surface,
            paddingHorizontal: 14,
            fontFamily: fonts.regular,
            fontSize: 15,
            color: p.ink,
          },
          input.multiline ? { minHeight: 84, paddingTop: 12, textAlignVertical: "top" } : null,
          input.style,
        ]}
      />
      {error ? (
        <AppText size={12} tone="warn" weight="medium">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

export function Message({ ok, text }: { ok: boolean; text: string }) {
  return (
    <AppText size={13} weight="medium" tone={ok ? "accent" : "warn"} accessibilityRole="alert">
      {text}
    </AppText>
  );
}

/* ---------- Durum rozetleri ---------- */

export function StatusChip({ tone, children }: { tone: "pos" | "neg" | "wait"; children: string }) {
  const p = usePalette();
  const bg = tone === "pos" ? p.accentSoft : tone === "neg" ? p.warnSoft : p.sunken;
  const color = tone === "pos" ? p.accentText : tone === "neg" ? p.warnText : p.muted;
  return (
    <View
      style={{
        height: 26,
        paddingHorizontal: 10,
        borderRadius: 7,
        backgroundColor: bg,
        justifyContent: "center",
        borderWidth: tone === "wait" ? 1 : 0,
        borderStyle: "dashed",
        borderColor: p.line2,
      }}
    >
      <Text style={{ fontFamily: fonts.medium, fontSize: 12, color }}>{children}</Text>
    </View>
  );
}

export type ToggleOption = { value: string; label: string; tone: "pos" | "neg" };

/** Web'deki StatusToggle ile aynı: iki seçenekli, ikon + renk + metin. */
export function StatusToggle({
  value,
  options,
  onSelect,
  disabled,
  label,
}: {
  value: string | null;
  options: readonly [ToggleOption, ToggleOption];
  onSelect: (value: string) => void;
  disabled?: boolean;
  label: string;
}) {
  const p = usePalette();
  return (
    <View
      accessibilityLabel={label}
      style={{
        flexDirection: "row",
        gap: 2,
        padding: 3,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: p.line,
        backgroundColor: p.sunken,
      }}
    >
      {options.map((opt) => {
        const selected = value === opt.value;
        const bg = selected ? (opt.tone === "pos" ? p.accentSoft : p.warnSoft) : "transparent";
        const color = selected ? (opt.tone === "pos" ? p.accentText : p.warnText) : p.muted;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="button"
            accessibilityState={{ selected, disabled }}
            accessibilityLabel={`${label}: ${opt.label}`}
            disabled={disabled}
            onPress={() => onSelect(opt.value)}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 40,
              borderRadius: 7,
              paddingHorizontal: 8,
              backgroundColor: bg,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 4,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            {selected ? (
              opt.tone === "pos" ? (
                <Check size={14} strokeWidth={2.8} color={color} />
              ) : (
                <Minus size={14} strokeWidth={2.8} color={color} />
              )
            ) : null}
            <Text style={{ fontFamily: fonts.medium, fontSize: 13, color }}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ---------- Avatar ---------- */

export function Avatar({ name, colorId, size = 34 }: { name: string; colorId: string; size?: number }) {
  const p = usePalette();
  const c = avatarColors(colorId, p.dark);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: c.bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontFamily: fonts.semibold, fontSize: Math.round(size * 0.36), color: c.fg }}>{initialsOf(name)}</Text>
    </View>
  );
}

export function ColorDot({ colorId, size = 8 }: { colorId: string; size?: number }) {
  const p = usePalette();
  return <View style={{ width: size, height: size, borderRadius: 3, backgroundColor: avatarColors(colorId, p.dark).dot }} />;
}

/* ---------- İlerleme halkası ---------- */

export function ProgressRing({ done, total, size = 44 }: { done: number; total: number; size?: number }) {
  const p = usePalette();
  const R = 16;
  const C = 2 * Math.PI * R;
  const ratio = total > 0 ? done / total : 0;
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" style={{ transform: [{ rotate: "-90deg" }] }}>
      <Circle cx="20" cy="20" r={R} fill="none" stroke={p.line} strokeWidth={5} />
      <Circle
        cx="20"
        cy="20"
        r={R}
        fill="none"
        stroke={p.accent}
        strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray={`${ratio * C} ${C}`}
      />
    </Svg>
  );
}

/* ---------- Sayfa iskeleti ---------- */

export function Screen({
  title,
  crumb,
  right,
  children,
  scroll = true,
  onRefresh,
  refreshing,
  footer,
}: {
  title: string;
  crumb?: string;
  right?: ReactNode;
  children: ReactNode;
  scroll?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  footer?: ReactNode;
}) {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <View
        style={{
          paddingTop: insets.top,
          backgroundColor: p.surface,
          borderBottomWidth: 1,
          borderBottomColor: p.line,
        }}
      >
        <View style={{ minHeight: 56, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ flex: 1 }}>
            {crumb ? (
              <AppText size={12} tone="muted" numberOfLines={1}>
                {crumb}
              </AppText>
            ) : null}
            <AppText size={17} weight="semibold" numberOfLines={1}>
              {title}
            </AppText>
          </View>
          {right}
        </View>
      </View>
      {/* Klavye açılınca içerik (ve alttaki çubuk) klavyenin üstünde kalır */}
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        {scroll ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            refreshControl={
              onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={p.accent} /> : undefined
            }
          >
            {children}
          </ScrollView>
        ) : (
          <View style={{ flex: 1 }}>{children}</View>
        )}
        {footer}
      </KeyboardAvoidingView>
    </View>
  );
}

/* ---------- Yükleniyor / hata / boş ---------- */

export function Loading() {
  const p = usePalette();
  return (
    <View style={{ paddingVertical: 48, alignItems: "center" }}>
      <ActivityIndicator color={p.accent} />
    </View>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const p = usePalette();
  const message = error instanceof ApiError ? error.message : "Bir şeyler ters gitti.";
  return (
    <Card style={{ padding: 24, alignItems: "center", gap: 10 }}>
      <AlertTriangle size={26} color={p.warnText} />
      <AppText weight="semibold" size={16}>
        Bir şeyler ters gitti
      </AppText>
      <AppText tone="ink2" style={{ textAlign: "center" }}>
        {message}
      </AppText>
      <Button label="Tekrar dene" onPress={onRetry} small />
    </Card>
  );
}

export function Empty({ children }: { children: string }) {
  return (
    <Card style={{ paddingVertical: 36, paddingHorizontal: 16, alignItems: "center" }}>
      <AppText tone="ink2" style={{ textAlign: "center" }}>
        {children}
      </AppText>
    </Card>
  );
}

/* ---------- Veri çekme ---------- */

type RemoteState<T> = { key: string; data: T | null; error: unknown; loading: boolean };

/**
 * Veriyi yükler; `deps` değişince (örn. tarih) baştan yükler, ekrana her
 * dönüldüğünde de sessizce yeniler (düzenleme sonrası liste güncel kalsın).
 */
export function useRemote<T>(load: () => Promise<T>, deps: unknown[]) {
  const depsKey = JSON.stringify(deps);
  const [state, setState] = useState<RemoteState<T>>({ key: depsKey, data: null, error: null, loading: true });
  const [refreshing, setRefreshing] = useState(false);

  // Bağımlılık değişti: eski veriyi bırak (render sırasında sıfırlama deseni)
  if (state.key !== depsKey) setState({ key: depsKey, data: null, error: null, loading: true });

  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });
  const seq = useRef(0);

  const fetchData = useCallback(async (key: string, mode: "initial" | "refresh" | "silent") => {
    const id = ++seq.current;
    if (mode === "refresh") setRefreshing(true);
    try {
      const data = await loadRef.current();
      if (id === seq.current) setState({ key, data, error: null, loading: false });
    } catch (error) {
      if (id === seq.current) setState((s) => ({ ...s, key, error, loading: false }));
    } finally {
      if (id === seq.current) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchData(depsKey, "initial");
  }, [depsKey, fetchData]);

  const first = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (first.current) {
        first.current = false;
        return;
      }
      void fetchData(depsKey, "silent");
    }, [depsKey, fetchData]),
  );

  return {
    data: state.data,
    error: state.error,
    loading: state.loading,
    refreshing,
    reload: () => {
      setState((s) => ({ ...s, error: null, loading: true }));
      void fetchData(depsKey, "initial");
    },
    refresh: () => void fetchData(depsKey, "refresh"),
    setData: (data: T) => setState((s) => ({ ...s, data })),
  };
}

/* ---------- Alt pencere (diyalog) ---------- */

export function Sheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Kapat">
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.45)" }]} />
        </Pressable>
        <View style={{ flex: 1, justifyContent: "flex-end", pointerEvents: "box-none" }}>
          <View
            style={{
              backgroundColor: p.surface,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              borderWidth: 1,
              borderColor: p.line,
              maxHeight: "90%",
              paddingBottom: Math.max(insets.bottom, 16),
            }}
          >
            <View style={{ padding: 20, paddingBottom: 8 }}>
              <AppText size={18} weight="semibold">
                {title}
              </AppText>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 16 }} keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** Seçenek listesi (öğretmen seçimi gibi). */
export function OptionPicker({
  label,
  options,
  value,
  onChange,
  placeholder = "Seçin",
}: {
  label: string;
  options: { id: string; name: string }[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}) {
  const p = usePalette();
  return (
    <View style={{ gap: 6 }}>
      <AppText size={13} weight="medium">
        {label}
      </AppText>
      {value === "" ? (
        <AppText size={12} tone="warn">
          {placeholder}
        </AppText>
      ) : null}
      <View style={{ gap: 6 }}>
        {options.map((o) => {
          const on = o.id === value;
          return (
            <Pressable
              key={o.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              onPress={() => onChange(o.id)}
              style={({ pressed }) => ({
                minHeight: 44,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: on ? p.accent : p.line,
                backgroundColor: pressed ? p.sunken : p.surface,
                paddingHorizontal: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              })}
            >
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  borderWidth: on ? 5 : 1.5,
                  borderColor: on ? p.accent : p.line2,
                }}
              />
              <Avatar name={o.name} colorId={o.id} size={24} />
              <AppText weight="medium" style={{ flex: 1 }}>
                {o.name}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
