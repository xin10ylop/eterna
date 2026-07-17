import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { cardShadow, radii, spacing, type } from '../../theme';
import { useEterna, useTheme } from '../../store';
import { diffDays, todayISO } from '../../lib/dates';

/* ---------------------------------- Screen -------------------------------- */

export function Screen({
  children,
  padded = true,
  style,
}: {
  children: React.ReactNode;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        { flex: 1, backgroundColor: t.bg, paddingTop: insets.top },
        padded && { paddingHorizontal: spacing.xl },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/* --------------------------------- Buttons -------------------------------- */

export function PrimaryButton({
  title,
  onPress,
  disabled,
  loading,
  style,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off }}
      onPress={off ? undefined : onPress}
      style={({ pressed }) => [
        {
          backgroundColor: off ? t.faint : t.accent,
          borderRadius: radii.m + 2,
          paddingVertical: 16,
          alignItems: 'center',
          transform: [{ scale: pressed && !off ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={t.onAccent} />
      ) : (
        <Text style={{ color: off ? t.sub : t.onAccent, fontSize: 17, fontWeight: '600' }}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

export function GhostButton({
  title,
  onPress,
  style,
}: {
  title: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [{ paddingVertical: 12, alignItems: 'center', opacity: pressed ? 0.6 : 1 }, style]}
    >
      <Text style={{ color: t.accent, fontSize: 15, fontWeight: '600' }}>{title}</Text>
    </Pressable>
  );
}

export function IconButton({
  name,
  onPress,
  size = 36,
  accessibilityLabel,
}: {
  name: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  size?: number;
  accessibilityLabel: string;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: t.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: t.border,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ scale: pressed ? 0.92 : 1 }],
      })}
    >
      <Ionicons name={name} size={size * 0.5} color={t.text} />
    </Pressable>
  );
}

/* ---------------------------------- Cards ---------------------------------- */

export function Card({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const t = useTheme();
  const base: ViewStyle = {
    backgroundColor: t.bg,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.border,
    padding: spacing.l,
    ...cardShadow,
  };
  if (!onPress) return <View style={[base, style]}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [base, { transform: [{ scale: pressed ? 0.985 : 1 }] }, style]}
    >
      {children}
    </Pressable>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return <Text style={[type.label, { color: t.muted, marginBottom: spacing.s }]}>{children}</Text>;
}

/* ---------------------------------- Chips ---------------------------------- */

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: radii.pill,
        backgroundColor: selected ? t.accent : t.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: selected ? t.accent : t.border,
        transform: [{ scale: pressed ? 0.95 : 1 }],
      })}
    >
      <Text style={{ color: selected ? t.onAccent : t.text, fontSize: 15, fontWeight: '500' }}>
        {label}
      </Text>
    </Pressable>
  );
}

/* ------------------------------ Segmented control --------------------------- */

export function Segmented({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: t.surface,
        borderRadius: radii.s + 2,
        padding: 2,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: t.border,
      }}
    >
      {options.map((o) => {
        const sel = o === value;
        return (
          <Pressable
            key={o}
            accessibilityRole="button"
            accessibilityState={{ selected: sel }}
            onPress={() => onChange(o)}
            style={{
              flex: 1,
              paddingVertical: 7,
              borderRadius: radii.s,
              backgroundColor: sel ? t.bg : 'transparent',
              alignItems: 'center',
              shadowColor: sel ? '#000' : 'transparent',
              shadowOpacity: sel ? 0.08 : 0,
              shadowRadius: 3,
              shadowOffset: { width: 0, height: 1 },
              elevation: sel ? 1 : 0,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: sel ? t.text : t.sub }}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ---------------------------------- Inputs ---------------------------------- */

export function Field({
  label,
  error,
  ...inputProps
}: TextInputProps & { label: string; error?: string | null }) {
  const t = useTheme();
  const [focused, setFocused] = React.useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={[type.label, { color: t.muted }]}>{label}</Text>
      <TextInput
        placeholderTextColor={t.muted}
        {...inputProps}
        onFocus={(e) => {
          setFocused(true);
          inputProps.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          inputProps.onBlur?.(e);
        }}
        style={{
          backgroundColor: t.surface,
          borderRadius: radii.m,
          borderWidth: 1,
          borderColor: error ? t.attention : focused ? t.accent : t.border,
          paddingHorizontal: 14,
          paddingVertical: 14,
          fontSize: 16,
          color: t.text,
        }}
      />
      {error ? <Text style={{ color: t.attention, fontSize: 13 }}>{error}</Text> : null}
    </View>
  );
}

/* --------------------------------- Switch ----------------------------------- */

export function IOSSwitch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  const t = useTheme();
  const x = useRef(new Animated.Value(on ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(x, { toValue: on ? 1 : 0, duration: 180, useNativeDriver: false }).start();
  }, [on, x]);
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      onPress={onToggle}
    >
      <Animated.View
        style={{
          width: 51,
          height: 31,
          borderRadius: 16,
          backgroundColor: x.interpolate({
            inputRange: [0, 1],
            outputRange: [t.faint, t.accent],
          }) as unknown as string,
          justifyContent: 'center',
        }}
      >
        <Animated.View
          style={{
            width: 27,
            height: 27,
            borderRadius: 14,
            backgroundColor: '#FFFFFF',
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowRadius: 3,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
            transform: [
              { translateX: x.interpolate({ inputRange: [0, 1], outputRange: [2, 22] }) },
            ],
          }}
        />
      </Animated.View>
    </Pressable>
  );
}

/* ---------------------------------- Rows ------------------------------------ */

export function Row({
  title,
  subtitle,
  right,
  onPress,
  last,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  last?: boolean;
}) {
  const t = useTheme();
  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 13,
        borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: t.separator,
        gap: spacing.m,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '500', color: t.text }}>{title}</Text>
        {subtitle ? (
          <Text style={{ fontSize: 13, color: t.sub, marginTop: 1 }}>{subtitle}</Text>
        ) : null}
      </View>
      {right}
      {onPress && !right ? <Ionicons name="chevron-forward" size={16} color={t.muted} /> : null}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
      {content}
    </Pressable>
  );
}

/* --------------------------------- Progress --------------------------------- */

export function ProgressBar({ value, height = 6 }: { value: number; height?: number }) {
  const t = useTheme();
  return (
    <View
      style={{
        height,
        borderRadius: height / 2,
        backgroundColor: t.surface,
        overflow: 'hidden',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: t.border,
      }}
    >
      <View
        style={{
          width: `${Math.min(100, Math.max(0, value * 100))}%`,
          height: '100%',
          borderRadius: height / 2,
          backgroundColor: t.accent,
        }}
      />
    </View>
  );
}

/** Duolingo-style chunky progress bar: one rounded track, animated fill. */
export function StepDots({ total, index }: { total: number; index: number }) {
  const t = useTheme();
  const v = useRef(new Animated.Value(index / total)).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: (index + 1) / total,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [index, total, v]);
  return (
    <View
      style={{
        height: 10,
        borderRadius: 5,
        backgroundColor: t.surface,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={{
          height: '100%',
          borderRadius: 5,
          backgroundColor: t.accent,
          width: v.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
        }}
      />
    </View>
  );
}

/* -------------------------------- Option card -------------------------------- */

/**
 * Full-width selectable answer card (Duolingo / Hims intake pattern):
 * leading icon, label, optional qualifier; selected = tinted fill + accent
 * border + accent ink, with a check square when multi-select.
 */
export function OptionCard({
  icon,
  label,
  sublabel,
  qualifier,
  selected,
  multi,
  onPress,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  sublabel?: string;
  qualifier?: string;
  selected?: boolean;
  multi?: boolean;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole={multi ? 'checkbox' : 'button'}
      accessibilityState={multi ? { checked: !!selected } : { selected: !!selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.m,
        paddingVertical: 14,
        paddingHorizontal: spacing.l,
        borderRadius: radii.l,
        backgroundColor: selected ? t.accentSoft : t.bg,
        borderWidth: selected ? 1.5 : 1,
        borderColor: selected ? t.accent : t.border,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      {multi ? (
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            borderWidth: 1.5,
            borderColor: selected ? t.accent : t.muted,
            backgroundColor: selected ? t.accent : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {selected ? <Ionicons name="checkmark" size={14} color={t.onAccent} /> : null}
        </View>
      ) : icon ? (
        <Ionicons name={icon} size={20} color={selected ? t.accent : t.sub} />
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: selected ? t.accent : t.text }}>
          {label}
        </Text>
        {sublabel ? (
          <Text style={{ fontSize: 13, color: t.sub, marginTop: 1 }}>{sublabel}</Text>
        ) : null}
      </View>
      {qualifier ? <Text style={{ fontSize: 13, color: t.muted }}>{qualifier}</Text> : null}
    </Pressable>
  );
}

/* --------------------------------- Time chip --------------------------------- */

/**
 * Relative-proximity pill (Airbnb Trips pattern): "Overdue" / "Today" /
 * "In 3 days" / "In 2 wks". Overdue is the only alarmed state.
 */
export function TimeChip({ dueISO }: { dueISO: string }) {
  const t = useTheme();
  const days = diffDays(todayISO(), dueISO);
  const label =
    days < 0 ? 'Overdue' : days === 0 ? 'Today' : days === 1 ? 'Tomorrow'
    : days < 14 ? `In ${days} days` : `In ${Math.round(days / 7)} wks`;
  const alarmed = days < 0;
  return (
    <View
      style={{
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: radii.pill,
        backgroundColor: alarmed ? t.accent : t.surface,
        borderWidth: alarmed ? 0 : StyleSheet.hairlineWidth,
        borderColor: t.border,
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: '700', color: alarmed ? t.onAccent : t.sub }}>
        {label}
      </Text>
    </View>
  );
}

/* ---------------------------------- Ledger ----------------------------------- */

/** Receipt-style breakdown rows (Airbnb price details): label left, amount right. */
export function LedgerRow({
  label,
  value,
  bold,
  muted,
}: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
}) {
  const t = useTheme();
  const color = muted ? t.sub : t.text;
  const weight = bold ? ('700' as const) : ('400' as const);
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
      <Text style={{ fontSize: 15, fontWeight: weight, color }}>{label}</Text>
      <Text style={{ fontSize: 15, fontWeight: weight, color }}>{value}</Text>
    </View>
  );
}

/* -------------------------------- Wheel picker -------------------------------- */

const WHEEL_ITEM_H = 44;

/**
 * Snap-scroll wheel (Cal AI height/weight pattern): capsule highlight on the
 * center row, neighbors fade. ScrollView-based so it works everywhere.
 */
export function WheelPicker({
  items,
  index,
  onChange,
  width = 110,
  label,
}: {
  items: string[];
  index: number;
  onChange: (i: number) => void;
  width?: number;
  label?: string;
}) {
  const t = useTheme();
  const sv = useRef<ScrollView>(null);
  const H = WHEEL_ITEM_H * 5;
  useEffect(() => {
    // position on mount (and when the item set swaps, e.g. metric<->imperial)
    const id = setTimeout(() => sv.current?.scrollTo({ y: index * WHEEL_ITEM_H, animated: false }), 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);
  return (
    <View style={{ alignItems: 'center', gap: spacing.s }}>
      {label ? <Text style={[type.label, { color: t.muted }]}>{label}</Text> : null}
      <View style={{ width, height: H }}>
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: WHEEL_ITEM_H * 2,
            left: 0,
            right: 0,
            height: WHEEL_ITEM_H,
            borderRadius: radii.m,
            backgroundColor: t.surface,
            borderWidth: 1,
            borderColor: t.border,
          }}
        />
        <ScrollView
          ref={sv}
          showsVerticalScrollIndicator={false}
          snapToInterval={WHEEL_ITEM_H}
          decelerationRate="fast"
          contentContainerStyle={{ paddingVertical: WHEEL_ITEM_H * 2 }}
          onMomentumScrollEnd={(e) => {
            const i = Math.min(
              items.length - 1,
              Math.max(0, Math.round(e.nativeEvent.contentOffset.y / WHEEL_ITEM_H)),
            );
            if (i !== index) onChange(i);
          }}
        >
          {items.map((it, i) => {
            const d = Math.abs(i - index);
            return (
              <Pressable
                key={it}
                accessibilityRole="button"
                accessibilityLabel={it}
                onPress={() => {
                  sv.current?.scrollTo({ y: i * WHEEL_ITEM_H, animated: true });
                  onChange(i);
                }}
                style={{ height: WHEEL_ITEM_H, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text
                  style={{
                    fontSize: d === 0 ? 20 : 17,
                    fontWeight: d === 0 ? '700' : '500',
                    color: d === 0 ? t.text : d === 1 ? t.sub : t.faint,
                  }}
                >
                  {it}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

/* --------------------------------- Link text ---------------------------------- */

/** Airbnb link idiom: underline, ink color — never blue. */
export function LinkText({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: StyleProp<TextStyle>;
}) {
  const t = useTheme();
  return (
    <Text
      accessibilityRole="link"
      onPress={onPress}
      style={[
        { fontSize: 14, fontWeight: '600', color: t.text, textDecorationLine: 'underline' },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

/* ----------------------------------- Toast ----------------------------------- */

export function ToastHost() {
  const t = useTheme();
  const toast = useEterna((s) => s.toast);
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, { toValue: toast ? 1 : 0, duration: 180, useNativeDriver: true }).start();
  }, [toast, opacity]);
  if (!toast) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: insets.top + 8,
        alignSelf: 'center',
        backgroundColor: t.text,
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: radii.pill,
        opacity,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
        zIndex: 100,
      }}
    >
      <Text style={{ color: t.bg, fontSize: 14, fontWeight: '600' }}>{toast}</Text>
    </Animated.View>
  );
}
