import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Chip, IconButton, PrimaryButton, Screen } from '../../components/ui';
import { mergedEventPlan } from '../../services/logic';
import { addDays, diffDays, formatMedium, todayISO } from '../../lib/dates';
import { cardShadow, radii, spacing, type } from '../../theme';
import { useEterna, useTheme } from '../../store';
import { useT } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'EventPrep'>;

const RED = '#C83A2C';

/**
 * Every event she's prepping for, and one back-planned prep list across all of
 * them. The point: close events don't double-book. When a ritual done for the
 * first is still fresh for the next, it shows as a single row tagged with both,
 * not two appointments.
 */
export function EventPrepScreen({ navigation }: Props) {
  const t = useTheme();
  const tx = useT();
  const events = useEterna((s) => s.events);
  const treatments = useEterna((s) => s.treatments);
  const appointments = useEterna((s) => s.appointments);
  const clinics = useEterna((s) => s.clinics);
  const addEvent = useEterna((s) => s.addEvent);
  const removeEvent = useEterna((s) => s.removeEvent);

  const upcoming = useMemo(
    () =>
      events
        .filter((e) => diffDays(todayISO(), e.dateISO) >= 0)
        .sort((a, b) => a.dateISO.localeCompare(b.dateISO)),
    [events],
  );

  const plan = useMemo(
    () => mergedEventPlan(events, treatments, appointments),
    [events, treatments, appointments],
  );

  const [adding, setAdding] = useState(events.length === 0);
  const [name, setName] = useState('');
  const [weeks, setWeeks] = useState(4);
  const save = () => {
    addEvent(name.trim() || 'My event', addDays(todayISO(), weeks * 7));
    setName('');
    setWeeks(4);
    setAdding(false);
  };

  const clinicName = (id: string) => clinics.find((c) => c.id === id)?.name ?? '';
  const multi = upcoming.length > 1;

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.m, paddingTop: spacing.s }}>
        <IconButton name="chevron-back" onPress={() => navigation.goBack()} accessibilityLabel="Back" />
        <View style={{ flex: 1 }}>
          <Text style={[type.title, { color: t.text }]}>{tx('event.title')}</Text>
          <Text style={{ fontSize: 13, color: t.sub, marginTop: 1 }}>
            {tx('event.upcoming', { n: upcoming.length })}
          </Text>
        </View>
        {!adding ? (
          <IconButton name="add" onPress={() => setAdding(true)} accessibilityLabel={tx('event.add')} />
        ) : null}
      </View>

      <ScrollView
        style={{ marginTop: spacing.l }}
        contentContainerStyle={{ gap: spacing.s, paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* add-event editor */}
        {adding ? (
          <View
            style={{
              gap: spacing.m,
              backgroundColor: t.surfaceAlt,
              borderRadius: radii.card,
              borderWidth: 1,
              borderColor: t.border,
              padding: spacing.l,
              marginBottom: spacing.s,
            }}
          >
            <View style={{ gap: spacing.s }}>
              <Text style={[type.label, { color: t.muted }]}>{tx('event.name')}</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={tx('event.namePlaceholder')}
                placeholderTextColor={t.muted}
                style={{
                  backgroundColor: t.surface,
                  borderRadius: radii.m,
                  borderWidth: 1,
                  borderColor: t.border,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 15,
                  color: t.text,
                }}
              />
            </View>
            <View style={{ gap: spacing.s }}>
              <Text style={[type.label, { color: t.muted }]}>{tx('event.when')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s }}>
                {[2, 4, 8, 12, 26].map((w) => (
                  <Chip
                    key={w}
                    label={tx('event.inWeeks', { n: w })}
                    selected={weeks === w}
                    onPress={() => setWeeks(w)}
                  />
                ))}
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.s }}>
              {events.length > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setAdding(false)}
                  style={({ pressed }) => ({
                    paddingHorizontal: 18,
                    paddingVertical: 13,
                    borderRadius: radii.l,
                    borderWidth: 1,
                    borderColor: t.border,
                    justifyContent: 'center',
                    opacity: pressed ? 0.6 : 1,
                  })}
                >
                  <Text style={{ color: t.sub, fontWeight: '700' }}>{tx('common.cancel')}</Text>
                </Pressable>
              ) : null}
              <View style={{ flex: 1 }}>
                <PrimaryButton title={tx('event.set')} onPress={save} />
              </View>
            </View>
          </View>
        ) : null}

        {/* event cards */}
        {upcoming.map((ev) => {
          const d = diffDays(todayISO(), ev.dateISO);
          return (
            <View
              key={ev.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.m,
                backgroundColor: t.accentSoft,
                borderRadius: radii.card,
                padding: spacing.m,
              }}
            >
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  backgroundColor: t.bg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="calendar" size={19} color={t.accent} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '700', color: t.text }}>
                  {ev.name}
                </Text>
                <Text style={{ fontSize: 12.5, color: t.accent, marginTop: 1 }}>
                  {d < 14 ? tx('event.inDays', { n: d }) : tx('event.inWeeks', { n: Math.round(d / 7) })} ·{' '}
                  {formatMedium(ev.dateISO)}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={tx('common.remove')}
                onPress={() => removeEvent(ev.id)}
                hitSlop={8}
                style={({ pressed }) => ({ padding: 6, opacity: pressed ? 0.5 : 1 })}
              >
                <Ionicons name="close" size={18} color={t.muted} />
              </Pressable>
            </View>
          );
        })}

        {upcoming.length === 0 && !adding ? (
          <Text style={{ fontSize: 14, color: t.sub, lineHeight: 20, paddingVertical: spacing.m }}>
            {tx('event.empty')}
          </Text>
        ) : null}

        {/* merged prep plan across every event */}
        {plan.length > 0 ? (
          <Text style={[type.label, { color: t.muted, marginTop: spacing.l, marginBottom: spacing.xs }]}>
            {tx('event.prep')}
          </Text>
        ) : null}

        {plan.map((item, idx) => {
          const tr = item.treatment;
          const late = diffDays(todayISO(), item.doByISO) < 0;
          const [mon, day] = formatMedium(item.doByISO).split(' ');
          const shared = item.events.length > 1;
          return (
            <View
              key={`${tr.id}-${idx}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.m,
                backgroundColor: t.bg,
                borderRadius: radii.card,
                borderWidth: 1,
                borderColor: shared ? t.accent : t.border,
                padding: spacing.m,
                ...cardShadow,
              }}
            >
              <View style={{ alignItems: 'center', width: 44 }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: item.booked ? t.positive : late ? RED : t.accent,
                  }}
                >
                  {mon.toUpperCase()}
                </Text>
                <Text style={{ fontSize: 18, fontWeight: '800', color: t.text }}>{day}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '600', color: t.text }}>
                  {tr.name}
                </Text>
                <Text numberOfLines={1} style={{ fontSize: 12.5, color: t.sub }}>
                  {tx('event.doBy', { date: formatMedium(item.doByISO) })} · {clinicName(tr.clinicId)}
                  {tr.atHome ? ` · ${tx('common.atHome')}` : ''}
                </Text>
                {multi ? (
                  <View
                    style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 2, alignItems: 'center' }}
                  >
                    {shared ? <Ionicons name="link" size={12} color={t.accent} /> : null}
                    {item.events.map((e) => (
                      <View
                        key={e.id}
                        style={{
                          backgroundColor: t.accentSoft,
                          borderRadius: radii.pill,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '600', color: t.accent }}>{e.name}</Text>
                      </View>
                    ))}
                    {shared ? (
                      <Text style={{ fontSize: 11, color: t.muted }}>· {tx('event.shared')}</Text>
                    ) : null}
                  </View>
                ) : null}
              </View>
              {item.booked ? (
                <Ionicons name="checkmark-circle" size={22} color={t.positive} />
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Book ${tr.name}`}
                  onPress={() => navigation.navigate('Book', { treatmentId: tr.id })}
                  style={({ pressed }) => ({
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: radii.pill,
                    backgroundColor: t.accent,
                    transform: [{ scale: pressed ? 0.94 : 1 }],
                  })}
                >
                  <Text style={{ color: t.onAccent, fontSize: 13.5, fontWeight: '700' }}>{tx('common.book')}</Text>
                </Pressable>
              )}
            </View>
          );
        })}
      </ScrollView>
    </Screen>
  );
}
