import React, { useEffect, useMemo, useState } from 'react';
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
import { formatAED } from '../../lib/money';
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
 * Planning, the calendar-first tab (renamed from "Rituals").
 * Two segments: Schedule (iOS-style month/week/day calendar of appointments)
 * and Rituals (the cadence list grouped by urgency). Month-grid + selected-day
 * agenda pattern adapted from pliability's calendar on Mobbin.
 */
export function PlanningScreen({ navigation, route }: Props) {
  const t = useTheme();
  const [tab, setTab] = useState('Schedule');
  // arriving from Home with a date (a tapped booking) → land on the calendar
  const focusDate = route.params?.dateISO;
  useEffect(() => {
    if (focusDate) setTab('Schedule');
  }, [focusDate]);
  return (
    <Screen>
      <View style={{ paddingTop: spacing.s, gap: spacing.l, flex: 1 }}>
        <Text style={[type.largeTitle, { color: t.text }]}>Planning</Text>
        <Segmented options={['Schedule', 'Rituals']} value={tab} onChange={setTab} />
        {tab === 'Schedule' ? (
          <ScheduleView nav={navigation} focusDate={focusDate} />
        ) : (
          <RitualsView nav={navigation} />
        )}
      </View>
    </Screen>
  );
}

/* --------------------------------- Schedule --------------------------------- */

/**
 * One simple calendar: a week strip you move with arrows (and month arrows to
 * jump further), tap a day to see its schedule below. No month/week/day modes.
 */
function ScheduleView({ nav, focusDate }: { nav: Props['navigation']; focusDate?: string }) {
  const t = useTheme();
  const [selected, setSelected] = useState(todayISO());
  const [weekStart, setWeekStart] = useState(startOfWeek(todayISO()));
  const appointments = useEterna((s) => s.appointments);
  const treatments = useEterna((s) => s.treatments);
  const clinics = useEterna((s) => s.clinics);
  const salonEvents = useEterna((s) => s.events);

  // a booking tapped on Home selects its day here
  useEffect(() => {
    if (focusDate) {
      setSelected(focusDate);
      setWeekStart(startOfWeek(focusDate));
    }
  }, [focusDate]);

  const apptsOn = (iso: string) => appointments.filter((a) => a.dateISO === iso);
  const eventOn = (iso: string) => salonEvents.filter((e) => e.dateISO === iso);
  // predicted (not yet booked) due dates, outlined; solid = booked
  const predicted = useMemo(() => {
    const booked = new Set(appointments.map((a) => a.treatmentId));
    return new Set(treatments.filter((tr) => !booked.has(tr.id)).map((tr) => nextDueISO(tr)));
  }, [appointments, treatments]);

  const shiftWeek = (dir: number) => {
    const next = addDays(weekStart, dir * 7);
    setWeekStart(next);
    setSelected(next);
  };
  const shiftMonth = (dir: number) => {
    const first = startOfMonth(addMonths(selected, dir));
    setWeekStart(startOfWeek(first));
    setSelected(first);
  };

  const dayAppts = apptsOn(selected).sort((a, b) => (a.timeLabel < b.timeLabel ? -1 : 1));
  const dayEvents = eventOn(selected);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: spacing.l, paddingBottom: 120 }}>
      {/* month header: arrows jump a whole month */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable
          accessibilityLabel="Previous month"
          onPress={() => shiftMonth(-1)}
          hitSlop={8}
          style={({ pressed }) => ({ padding: 8, opacity: pressed ? 0.5 : 1 })}
        >
          <Ionicons name="chevron-back" size={18} color={t.accent} />
        </Pressable>
        <Pressable onPress={() => { setSelected(todayISO()); setWeekStart(startOfWeek(todayISO())); }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: t.text }}>{formatMonthYear(selected)}</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Next month"
          onPress={() => shiftMonth(1)}
          hitSlop={8}
          style={({ pressed }) => ({ padding: 8, opacity: pressed ? 0.5 : 1 })}
        >
          <Ionicons name="chevron-forward" size={18} color={t.accent} />
        </Pressable>
      </View>

      {/* week strip: arrows move a week, tap a day for its schedule */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Pressable
          accessibilityLabel="Previous week"
          onPress={() => shiftWeek(-1)}
          hitSlop={8}
          style={({ pressed }) => ({ padding: 4, opacity: pressed ? 0.5 : 1 })}
        >
          <Ionicons name="chevron-back" size={15} color={t.muted} />
        </Pressable>
        <View style={{ flex: 1, flexDirection: 'row', gap: 5 }}>
          {Array.from({ length: 7 }).map((_, i) => {
            const iso = addDays(weekStart, i);
            const sel = iso === selected;
            const today = iso === todayISO();
            const hasAppt = apptsOn(iso).length > 0;
            const hasEvent = eventOn(iso).length > 0;
            const isDue = predicted.has(iso);
            return (
              <Pressable
                key={iso}
                accessibilityRole="button"
                accessibilityLabel={iso}
                onPress={() => setSelected(iso)}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: 9,
                  borderRadius: radii.m,
                  backgroundColor: sel ? t.accent : hasEvent ? t.accentSoft : t.surface,
                }}
              >
                <Text style={{ fontSize: 10.5, fontWeight: '600', color: sel ? t.onAccent : t.muted }}>
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
                  {Number(iso.slice(8))}
                </Text>
                {hasAppt ? (
                  <View style={{ width: 5, height: 5, borderRadius: 3, marginTop: 3, backgroundColor: sel ? t.onAccent : t.accent }} />
                ) : isDue ? (
                  <View style={{ width: 5, height: 5, borderRadius: 3, marginTop: 3, borderWidth: 1, borderColor: sel ? t.onAccent : t.accent }} />
                ) : (
                  <View style={{ height: 8 }} />
                )}
              </Pressable>
            );
          })}
        </View>
        <Pressable
          accessibilityLabel="Next week"
          onPress={() => shiftWeek(1)}
          hitSlop={8}
          style={({ pressed }) => ({ padding: 4, opacity: pressed ? 0.5 : 1 })}
        >
          <Ionicons name="chevron-forward" size={15} color={t.muted} />
        </Pressable>
      </View>

      {/* the selected day's schedule */}
      <View style={{ gap: spacing.s }}>
        <SectionLabel>{formatLong(selected)}</SectionLabel>
        {dayEvents.map((ev) => (
          <Pressable
            key={ev.id}
            accessibilityRole="button"
            onPress={() => nav.navigate('EventPrep')}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.m,
              backgroundColor: t.accentSoft,
              borderRadius: radii.card,
              padding: spacing.m,
              transform: [{ scale: pressed ? 0.99 : 1 }],
            })}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: t.bg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="sparkles" size={17} color={t.accent} />
            </View>
            <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: t.text }}>{ev.name}</Text>
            <Ionicons name="chevron-forward" size={15} color={t.accent} />
          </Pressable>
        ))}
        {dayAppts.map((a) => {
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
                  <Text style={{ fontSize: 14, fontWeight: '700', color: t.accent }}>{a.timeLabel}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: t.text }}>
                    {tr?.name ?? 'Appointment'}
                  </Text>
                  <Text style={{ fontSize: 13, color: t.sub, marginTop: 1 }}>
                    {clinic?.name} · {formatAED(a.price)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={t.muted} />
              </View>
            </Card>
          );
        })}
        {dayEvents.length === 0 && dayAppts.length === 0 ? (
          <Card>
            <Text style={{ fontSize: 14, color: t.sub }}>Nothing booked this day.</Text>
          </Card>
        ) : null}
      </View>
    </ScrollView>
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
      if (s === 'bookNow') overdue.push(tr);
      else if (s === 'comingUp') soon.push(tr);
      else if (s === 'booked') scheduled.push(tr);
      else onTrack.push(tr);
    }
    return [
      { title: 'Book now', items: overdue, color: '#C83A2C' },
      { title: 'Coming up', items: soon, color: t.accent },
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
            const appt = appointments
              .filter((a) => a.treatmentId === tr.id && a.dateISO >= todayISO())
              .sort((a, b) => a.dateISO.localeCompare(b.dateISO))[0];
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
