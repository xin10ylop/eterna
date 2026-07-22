import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Card, Screen, SectionLabel, Segmented } from '../../components/ui';
import {
  addDays,
  addMonths,
  cadenceEvery,
  formatLong,
  formatMonthYear,
  startOfMonth,
  startOfWeek,
  todayISO,
  weekdayShort,
} from '../../lib/dates';
import { formatAED } from '../../lib/money';
import { nextDueISO, treatmentStatus } from '../../services/logic';
import { ZONES } from '../../data/seed';
import { radii, spacing, type } from '../../theme';
import { useEterna, useTheme } from '../../store';
import type { RootStackParamList, TabParamList } from '../../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Planning'>,
  NativeStackScreenProps<RootStackParamList>
>;

/**
 * Planning: Schedule (week strip + an hour-by-hour day, like the iPhone
 * calendar) and My routine (every ritual she does, and at which clinic).
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
        <Segmented options={['Schedule', 'My routine']} value={tab} onChange={setTab} />
        {tab === 'Schedule' ? (
          <ScheduleView nav={navigation} focusDate={focusDate} />
        ) : (
          <RoutineView nav={navigation} />
        )}
      </View>
    </Screen>
  );
}

/* --------------------------------- Schedule --------------------------------- */

const DAY_START = 8; // the visible day runs 8:00
const DAY_END = 22; //  … to 22:00
const HOUR_H = 54;

function ScheduleView({ nav, focusDate }: { nav: Props['navigation']; focusDate?: string }) {
  const t = useTheme();
  const [selected, setSelected] = useState(todayISO());
  const [weekStart, setWeekStart] = useState(startOfWeek(todayISO()));
  const appointments = useEterna((s) => s.appointments);
  const treatments = useEterna((s) => s.treatments);
  const clinics = useEterna((s) => s.clinics);
  const salonEvents = useEterna((s) => s.events);

  useEffect(() => {
    if (focusDate) {
      setSelected(focusDate);
      setWeekStart(startOfWeek(focusDate));
    }
  }, [focusDate]);

  const apptsOn = (iso: string) => appointments.filter((a) => a.dateISO === iso);
  const eventOn = (iso: string) => salonEvents.filter((e) => e.dateISO === iso);
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

  /** "15:30" → hours from DAY_START as a float; null when unparsable. */
  const hourOf = (timeLabel: string): number | null => {
    const m = timeLabel.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    return Number(m[1]) + Number(m[2]) / 60 - DAY_START;
  };
  /** The clinic's own duration for this visit, when it's on their menu. */
  const minsOf = (apptClinicId: string, name?: string): number =>
    clinics.find((c) => c.id === apptClinicId)?.offerings.find((o) => o.name === name)?.mins ?? 60;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: spacing.l, paddingBottom: 120 }}>
      {/* month row: ‹ › jump a month, tap the title for today */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable
          accessibilityLabel="Previous month"
          onPress={() => shiftMonth(-1)}
          hitSlop={8}
          style={({ pressed }) => ({ padding: 8, opacity: pressed ? 0.5 : 1 })}
        >
          <Ionicons name="chevron-back" size={18} color={t.accent} />
        </Pressable>
        <Pressable
          onPress={() => {
            setSelected(todayISO());
            setWeekStart(startOfWeek(todayISO()));
          }}
        >
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

      {/* the week: big day boxes; small arrows underneath move a week */}
      <View style={{ gap: spacing.s }}>
        <View style={{ flexDirection: 'row', gap: 6 }}>
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
                  paddingVertical: 12,
                  borderRadius: radii.m,
                  backgroundColor: sel ? t.accent : hasEvent ? t.accentSoft : t.surface,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '600', color: sel ? t.onAccent : t.muted }}>
                  {weekdayShort(iso)}
                </Text>
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: '700',
                    marginTop: 2,
                    color: sel ? t.onAccent : today ? t.accent : t.text,
                  }}
                >
                  {Number(iso.slice(8))}
                </Text>
                {hasAppt ? (
                  <View style={{ width: 5, height: 5, borderRadius: 3, marginTop: 4, backgroundColor: sel ? t.onAccent : t.accent }} />
                ) : isDue ? (
                  <View style={{ width: 5, height: 5, borderRadius: 3, marginTop: 4, borderWidth: 1, borderColor: sel ? t.onAccent : t.accent }} />
                ) : (
                  <View style={{ height: 9 }} />
                )}
              </Pressable>
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable
            accessibilityLabel="Previous week"
            onPress={() => shiftWeek(-1)}
            hitSlop={10}
            style={({ pressed }) => ({ paddingVertical: 2, paddingHorizontal: 14, opacity: pressed ? 0.5 : 1 })}
          >
            <Ionicons name="chevron-back" size={15} color={t.muted} />
          </Pressable>
          <Text style={{ fontSize: 12, color: t.muted }}>{formatLong(selected)}</Text>
          <Pressable
            accessibilityLabel="Next week"
            onPress={() => shiftWeek(1)}
            hitSlop={10}
            style={({ pressed }) => ({ paddingVertical: 2, paddingHorizontal: 14, opacity: pressed ? 0.5 : 1 })}
          >
            <Ionicons name="chevron-forward" size={15} color={t.muted} />
          </Pressable>
        </View>
      </View>

      {/* events sit above the day, like all-day banners */}
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
          <Ionicons name="sparkles" size={17} color={t.accent} />
          <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: t.text }}>{ev.name}</Text>
          <Ionicons name="chevron-forward" size={15} color={t.accent} />
        </Pressable>
      ))}

      {/* the day, hour by hour (iPhone calendar) */}
      <View style={{ height: (DAY_END - DAY_START) * HOUR_H + 20 }}>
        {Array.from({ length: DAY_END - DAY_START + 1 }).map((_, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              top: i * HOUR_H,
              left: 0,
              right: 0,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.s,
            }}
          >
            <Text style={{ width: 44, fontSize: 11, color: t.muted, textAlign: 'right' }}>
              {`${DAY_START + i}:00`}
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: t.separator }} />
          </View>
        ))}

        {dayAppts.map((a) => {
          const tr = treatments.find((x) => x.id === a.treatmentId);
          const clinic = clinics.find((c) => c.id === a.clinicId);
          const start = hourOf(a.timeLabel);
          if (start === null || start < 0) return null;
          const mins = minsOf(a.clinicId, tr?.name);
          const height = Math.max(44, (mins / 60) * HOUR_H - 4);
          return (
            <Pressable
              key={a.id}
              accessibilityRole="button"
              accessibilityLabel={`${tr?.name ?? 'Appointment'} ${a.timeLabel}`}
              onPress={() => tr && nav.navigate('TreatmentDetail', { treatmentId: tr.id })}
              style={({ pressed }) => ({
                position: 'absolute',
                top: start * HOUR_H + 8,
                left: 56,
                right: 0,
                height,
                borderRadius: radii.m,
                backgroundColor: t.accentSoft,
                borderLeftWidth: 3,
                borderLeftColor: t.accent,
                paddingHorizontal: spacing.m,
                paddingVertical: 7,
                justifyContent: 'center',
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '700', color: t.text }}>
                {tr?.name ?? 'Appointment'}
              </Text>
              <Text numberOfLines={1} style={{ fontSize: 12, color: t.sub, marginTop: 1 }}>
                {a.timeLabel} · {clinic?.name} · {formatAED(a.price)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

/* -------------------------------- My routine -------------------------------- */

const RED = '#C83A2C';

/**
 * Everything she keeps up with, at a glance: grouped by body area, each ritual
 * with its rhythm and which clinic it's at. Tap for the full story.
 */
function RoutineView({ nav }: { nav: Props['navigation'] }) {
  const t = useTheme();
  const treatments = useEterna((s) => s.treatments);
  const appointments = useEterna((s) => s.appointments);
  const clinics = useEterna((s) => s.clinics);

  const groups = useMemo(
    () =>
      ZONES.map((z) => ({
        zone: z,
        items: treatments.filter((tr) => tr.zone === z.id && !tr.oneOff),
      })).filter((g) => g.items.length > 0),
    [treatments],
  );

  const clinicName = (id: string) => clinics.find((c) => c.id === id)?.name ?? '';

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: spacing.l, paddingBottom: 120 }}>
      {groups.map((g) => (
        <View key={g.zone.id} style={{ gap: spacing.s }}>
          <SectionLabel>{g.zone.label}</SectionLabel>
          <Card style={{ paddingVertical: 4 }}>
            {g.items.map((tr, i) => {
              const status = treatmentStatus(tr, appointments);
              const dot =
                status === 'bookNow' ? RED : status === 'comingUp' ? t.attention : status === 'booked' ? t.positive : t.faint;
              return (
                <Pressable
                  key={tr.id}
                  accessibilityRole="button"
                  onPress={() => nav.navigate('TreatmentDetail', { treatmentId: tr.id })}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.m,
                    paddingVertical: 13,
                    borderTopWidth: i === 0 ? 0 : 1,
                    borderTopColor: t.separator,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dot }} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '600', color: t.text }}>
                      {tr.name}
                    </Text>
                    <Text numberOfLines={1} style={{ fontSize: 12.5, color: t.sub, marginTop: 1 }}>
                      every {cadenceEvery(tr.cadence)} · {clinicName(tr.clinicId)}
                      {tr.atHome ? ' · At home' : ''}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 13.5, fontWeight: '600', color: t.sub }}>
                    {formatAED(tr.price)}
                  </Text>
                  <Ionicons name="chevron-forward" size={15} color={t.muted} />
                </Pressable>
              );
            })}
          </Card>
        </View>
      ))}
    </ScrollView>
  );
}
