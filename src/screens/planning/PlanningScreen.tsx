import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Card, Screen, SectionLabel, Segmented, TimeChip } from '../../components/ui';
import {
  addDays,
  addMonths,
  daysInMonth,
  formatLong,
  formatMonthYear,
  monthShort,
  startOfMonth,
  startOfWeek,
  todayISO,
  weekdayMon0,
  weekdayShort,
} from '../../lib/dates';
import { formatEUR } from '../../lib/money';
import { needsAttention, nextDueISO, treatmentStatus } from '../../services/logic';
import { humanizeDue } from '../../lib/dates';
import { radii, spacing, type } from '../../theme';
import { useEterna, useTheme } from '../../store';
import type { RootStackParamList, TabParamList } from '../../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Planning'>,
  NativeStackScreenProps<RootStackParamList>
>;

/**
 * Planning — the calendar-first tab (renamed from "Rituals").
 * Two segments: Schedule (iOS-style month/week/day calendar of appointments)
 * and Rituals (the cadence list grouped by urgency). Month-grid + selected-day
 * agenda pattern adapted from pliability's calendar on Mobbin.
 */
export function PlanningScreen({ navigation }: Props) {
  const t = useTheme();
  const [tab, setTab] = useState('Schedule');
  return (
    <Screen>
      <View style={{ paddingTop: spacing.s, gap: spacing.l, flex: 1 }}>
        <Text style={[type.largeTitle, { color: t.text }]}>Planning</Text>
        <Segmented options={['Schedule', 'Rituals']} value={tab} onChange={setTab} />
        {tab === 'Schedule' ? <ScheduleView nav={navigation} /> : <RitualsView nav={navigation} />}
      </View>
    </Screen>
  );
}

/* --------------------------------- Schedule --------------------------------- */

function ScheduleView({ nav }: { nav: Props['navigation'] }) {
  const t = useTheme();
  const [mode, setMode] = useState('Month');
  const [selected, setSelected] = useState(todayISO());
  const [anchor, setAnchor] = useState(startOfMonth(todayISO()));
  const appointments = useEterna((s) => s.appointments);
  const treatments = useEterna((s) => s.treatments);
  const clinics = useEterna((s) => s.clinics);

  const eventsOn = (iso: string) => appointments.filter((a) => a.dateISO === iso);
  // predicted (not yet booked) due dates — rendered as outlined markers,
  // solid = booked (Apple Health's solid-vs-hatched cycle language)
  const predicted = useMemo(() => {
    const booked = new Set(appointments.map((a) => a.treatmentId));
    return new Set(
      treatments.filter((tr) => !booked.has(tr.id)).map((tr) => nextDueISO(tr)),
    );
  }, [appointments, treatments]);

  const dayAgenda = (
    <View style={{ gap: spacing.s }}>
      <SectionLabel>{formatLong(selected)}</SectionLabel>
      {eventsOn(selected).length === 0 ? (
        <Card>
          <Text style={{ fontSize: 14, color: t.sub }}>Nothing booked this day.</Text>
        </Card>
      ) : (
        eventsOn(selected)
          .sort((a, b) => (a.timeLabel < b.timeLabel ? -1 : 1))
          .map((a) => {
            const tr = treatments.find((x) => x.id === a.treatmentId);
            const clinic = clinics.find((c) => c.id === a.clinicId);
            return (
              <Card
                key={a.id}
                onPress={() => tr && nav.navigate('TreatmentDetail', { treatmentId: tr.id })}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.m }}>
                  <View
                    style={{
                      backgroundColor: t.accentSoft,
                      borderRadius: radii.m,
                      paddingVertical: 6,
                      paddingHorizontal: 10,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '700', color: t.accent }}>
                      {a.timeLabel}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: t.text }}>
                      {tr?.name ?? 'Appointment'}
                    </Text>
                    <Text style={{ fontSize: 13, color: t.sub, marginTop: 1 }}>
                      {clinic?.name} · {formatEUR(a.priceEUR)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={t.muted} />
                </View>
              </Card>
            );
          })
      )}
    </View>
  );

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: spacing.l, paddingBottom: 120 }}>
      <Segmented options={['Month', 'Week', 'Day']} value={mode} onChange={setMode} />

      {mode === 'Month' ? (
        <View style={{ gap: spacing.m }}>
          {/* month header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Pressable
              accessibilityLabel="Previous month"
              onPress={() => setAnchor(startOfMonth(addMonths(anchor, -1)))}
              style={({ pressed }) => ({ padding: 8, opacity: pressed ? 0.5 : 1 })}
            >
              <Ionicons name="chevron-back" size={18} color={t.accent} />
            </Pressable>
            <Text style={{ fontSize: 17, fontWeight: '700', color: t.text }}>
              {formatMonthYear(anchor)}
            </Text>
            <Pressable
              accessibilityLabel="Next month"
              onPress={() => setAnchor(startOfMonth(addMonths(anchor, 1)))}
              style={({ pressed }) => ({ padding: 8, opacity: pressed ? 0.5 : 1 })}
            >
              <Ionicons name="chevron-forward" size={18} color={t.accent} />
            </Pressable>
          </View>
          {/* weekday header */}
          <View style={{ flexDirection: 'row' }}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <Text
                key={i}
                style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600', color: t.muted }}
              >
                {d}
              </Text>
            ))}
          </View>
          {/* grid */}
          <MonthGrid
            anchor={anchor}
            selected={selected}
            onSelect={setSelected}
            hasEvents={(iso) => eventsOn(iso).length > 0}
            isPredicted={(iso) => predicted.has(iso)}
          />
          {/* marker legend */}
          <View style={{ flexDirection: 'row', gap: spacing.l, justifyContent: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.accent }} />
              <Text style={{ fontSize: 11, color: t.muted }}>Booked</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, borderWidth: 1, borderColor: t.accent }} />
              <Text style={{ fontSize: 11, color: t.muted }}>Predicted due</Text>
            </View>
          </View>
          {dayAgenda}
        </View>
      ) : null}

      {mode === 'Week' ? (
        <View style={{ gap: spacing.l }}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {Array.from({ length: 7 }).map((_, i) => {
              const iso = addDays(startOfWeek(todayISO()), i);
              const sel = iso === selected;
              const today = iso === todayISO();
              return (
                <Pressable
                  key={iso}
                  accessibilityRole="button"
                  onPress={() => setSelected(iso)}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    paddingVertical: 10,
                    borderRadius: radii.m,
                    backgroundColor: sel ? t.accent : t.surface,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '600', color: sel ? t.onAccent : t.muted }}>
                    {weekdayShort(iso)}
                  </Text>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '700',
                      marginTop: 2,
                      color: sel ? t.onAccent : today ? t.accent : t.text,
                    }}
                  >
                    {iso.slice(8)}
                  </Text>
                  {eventsOn(iso).length > 0 ? (
                    <View
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: 2,
                        marginTop: 3,
                        backgroundColor: sel ? t.onAccent : t.accent,
                      }}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
          {dayAgenda}
        </View>
      ) : null}

      {mode === 'Day' ? (
        <View style={{ gap: spacing.l }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Pressable
              accessibilityLabel="Previous day"
              onPress={() => setSelected(addDays(selected, -1))}
              style={({ pressed }) => ({ padding: 8, opacity: pressed ? 0.5 : 1 })}
            >
              <Ionicons name="chevron-back" size={18} color={t.accent} />
            </Pressable>
            <Pressable onPress={() => setSelected(todayISO())}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: t.accent }}>Today</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Next day"
              onPress={() => setSelected(addDays(selected, 1))}
              style={({ pressed }) => ({ padding: 8, opacity: pressed ? 0.5 : 1 })}
            >
              <Ionicons name="chevron-forward" size={18} color={t.accent} />
            </Pressable>
          </View>
          {dayAgenda}
        </View>
      ) : null}
    </ScrollView>
  );
}

function MonthGrid({
  anchor,
  selected,
  onSelect,
  hasEvents,
  isPredicted,
}: {
  anchor: string;
  selected: string;
  onSelect: (iso: string) => void;
  hasEvents: (iso: string) => boolean;
  isPredicted?: (iso: string) => boolean;
}) {
  const t = useTheme();
  const cells = useMemo(() => {
    const lead = weekdayMon0(anchor);
    const total = daysInMonth(anchor);
    const list: (string | null)[] = Array.from({ length: lead }, () => null);
    for (let d = 0; d < total; d++) list.push(addDays(anchor, d));
    while (list.length % 7 !== 0) list.push(null);
    return list;
  }, [anchor]);

  return (
    <View style={{ gap: 4 }}>
      {Array.from({ length: cells.length / 7 }).map((_, row) => (
        <View key={row} style={{ flexDirection: 'row' }}>
          {cells.slice(row * 7, row * 7 + 7).map((iso, col) => {
            if (!iso) return <View key={col} style={{ flex: 1, height: 44 }} />;
            const sel = iso === selected;
            const today = iso === todayISO();
            return (
              <Pressable
                key={col}
                accessibilityRole="button"
                accessibilityLabel={iso}
                onPress={() => onSelect(iso)}
                style={{ flex: 1, height: 44, alignItems: 'center', justifyContent: 'center' }}
              >
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: sel ? t.accent : today ? t.accentSoft : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: today || sel ? '700' : '400',
                      color: sel ? t.onAccent : today ? t.accent : t.text,
                    }}
                  >
                    {Number(iso.slice(8))}
                  </Text>
                </View>
                {hasEvents(iso) ? (
                  <View
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 3,
                      backgroundColor: t.accent,
                      marginTop: 1,
                    }}
                  />
                ) : isPredicted?.(iso) ? (
                  <View
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 3,
                      borderWidth: 1,
                      borderColor: t.accent,
                      marginTop: 1,
                    }}
                  />
                ) : (
                  <View style={{ height: 6 }} />
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

/* ---------------------------------- Rituals ---------------------------------- */

function RitualsView({ nav }: { nav: Props['navigation'] }) {
  const t = useTheme();
  const treatments = useEterna((s) => s.treatments);
  const appointments = useEterna((s) => s.appointments);
  const clinics = useEterna((s) => s.clinics);

  const groups = useMemo(() => {
    const overdue: typeof treatments = [];
    const soon: typeof treatments = [];
    const scheduled: typeof treatments = [];
    const onTrack: typeof treatments = [];
    for (const tr of treatments) {
      const s = treatmentStatus(tr, appointments);
      if (s === 'overdue') overdue.push(tr);
      else if (s === 'dueSoon') soon.push(tr);
      else if (s === 'scheduled') scheduled.push(tr);
      else onTrack.push(tr);
    }
    return [
      { title: 'Overdue', items: overdue, color: t.attention },
      { title: 'Due soon', items: soon, color: t.accent },
      { title: 'Booked', items: scheduled, color: t.positive },
      { title: 'On schedule', items: onTrack, color: t.muted },
    ].filter((g) => g.items.length > 0);
  }, [treatments, appointments, t]);

  const caughtUp = treatments.filter((tr) => needsAttention(treatmentStatus(tr, appointments))).length === 0;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: spacing.l, paddingBottom: 120 }}>
      {caughtUp ? (
        <Card>
          <Text style={{ fontSize: 15, fontWeight: '600', color: t.text }}>
            Everything is on schedule.
          </Text>
        </Card>
      ) : null}
      {groups.map((g) => (
        <View key={g.title} style={{ gap: spacing.s }}>
          {/* colored-dot group label (Apple Health log grouping) */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: g.color }} />
            <Text style={[type.label, { color: g.color }]}>{g.title}</Text>
          </View>
          {g.items.map((tr) => {
            const clinic = clinics.find((c) => c.id === tr.clinicId);
            const appt = appointments.find((a) => a.treatmentId === tr.id);
            return (
              <Card key={tr.id} onPress={() => nav.navigate('TreatmentDetail', { treatmentId: tr.id })}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.m }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: t.text }}>{tr.name}</Text>
                    <Text style={{ fontSize: 13, color: t.sub, marginTop: 1 }}>
                      {appt
                        ? `Booked ${formatLong(appt.dateISO)} · ${appt.timeLabel}`
                        : `${humanizeDue(nextDueISO(tr))} · ${clinic?.name}`}
                    </Text>
                  </View>
                  {appt ? (
                    <Ionicons name="chevron-forward" size={16} color={t.muted} />
                  ) : (
                    <TimeChip dueISO={nextDueISO(tr)} />
                  )}
                </View>
              </Card>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}
