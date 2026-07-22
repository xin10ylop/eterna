import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  addDays,
  addMonths,
  daysInMonth,
  formatMonthYear,
  startOfMonth,
  todayISO,
  weekdayMon0,
} from '../../lib/dates';
import { radii, spacing } from '../../theme';
import { useTheme } from '../../store';

/**
 * A compact month calendar for picking any date — no fixed presets. Optional
 * min/max bounds gray out days outside the allowed range (future-only for an
 * event date, past-only for "last done").
 */
export function CalendarPicker({
  value,
  onSelect,
  minISO,
  maxISO,
}: {
  value: string;
  onSelect: (iso: string) => void;
  minISO?: string;
  maxISO?: string;
}) {
  const t = useTheme();
  const [anchor, setAnchor] = useState(startOfMonth(value || todayISO()));

  const cells = useMemo(() => {
    const lead = weekdayMon0(anchor);
    const total = daysInMonth(anchor);
    const list: (string | null)[] = Array.from({ length: lead }, () => null);
    for (let d = 0; d < total; d++) list.push(addDays(anchor, d));
    while (list.length % 7 !== 0) list.push(null);
    return list;
  }, [anchor]);

  const outOfRange = (iso: string) =>
    (minISO !== undefined && iso < minISO) || (maxISO !== undefined && iso > maxISO);

  return (
    <View style={{ backgroundColor: t.surface, borderRadius: radii.card, padding: spacing.m, gap: spacing.s }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable
          accessibilityLabel="Previous month"
          onPress={() => setAnchor(startOfMonth(addMonths(anchor, -1)))}
          hitSlop={8}
          style={({ pressed }) => ({ padding: 6, opacity: pressed ? 0.5 : 1 })}
        >
          <Ionicons name="chevron-back" size={18} color={t.accent} />
        </Pressable>
        <Text style={{ fontSize: 15, fontWeight: '700', color: t.text }}>{formatMonthYear(anchor)}</Text>
        <Pressable
          accessibilityLabel="Next month"
          onPress={() => setAnchor(startOfMonth(addMonths(anchor, 1)))}
          hitSlop={8}
          style={({ pressed }) => ({ padding: 6, opacity: pressed ? 0.5 : 1 })}
        >
          <Ionicons name="chevron-forward" size={18} color={t.accent} />
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row' }}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <Text
            key={i}
            style={{ flex: 1, textAlign: 'center', fontSize: 10.5, fontWeight: '600', color: t.muted }}
          >
            {d}
          </Text>
        ))}
      </View>

      <View style={{ gap: 3 }}>
        {Array.from({ length: cells.length / 7 }).map((_, row) => (
          <View key={row} style={{ flexDirection: 'row' }}>
            {cells.slice(row * 7, row * 7 + 7).map((iso, col) => {
              if (!iso) return <View key={col} style={{ flex: 1, height: 38 }} />;
              const sel = iso === value;
              const today = iso === todayISO();
              const off = outOfRange(iso);
              return (
                <View key={col} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', height: 38 }}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={iso}
                    disabled={off}
                    onPress={() => onSelect(iso)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: sel ? t.accent : 'transparent',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: sel || today ? '700' : '400',
                        color: off ? t.faint : sel ? t.onAccent : today ? t.accent : t.text,
                      }}
                    >
                      {Number(iso.slice(8))}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
