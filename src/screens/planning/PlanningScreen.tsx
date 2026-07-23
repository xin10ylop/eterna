import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Card, Screen, SectionLabel, Segmented } from '../../components/ui';
import { GuideTour, useGuideRects, type GuideStep } from '../../components/GuideTour';
import { useT } from '../../i18n';
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
import { treatmentStatus } from '../../services/logic';
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
  const tx = useT();
  const [tab, setTab] = useState('Schedule');
  // arriving from Home with a date (a tapped booking) → land on the calendar
  const focusDate = route.params?.dateISO;
  useEffect(() => {
    if (focusDate) setTab('Schedule');
  }, [focusDate]);

  // guided tour, chapter "planning", in two parts because the screen itself
  // changes between them: first the week strip on Schedule, then the tour
  // flips to My routine so she sees the REAL list while it's explained
  const guideStage = useEterna((s) => s.guideStage);
  const guideOffset = useEterna((s) => s.guideOffset);
  const guideTotal = useEterna((s) => s.guideTotal);
  const setGuide = useEterna((s) => s.setGuide);
  const [guidePart, setGuidePart] = useState<1 | 2>(1);
  const weekRef = useRef<View>(null);
  const routineRef = useRef<View>(null);
  useEffect(() => {
    // the chapter starts on the calendar
    if (guideStage === 'planning') {
      setGuidePart(1);
      setTab('Schedule');
    }
  }, [guideStage]);
  const weekRects = useGuideRects(guideStage === 'planning' && guidePart === 1, { week: weekRef }, 500);
  const routineRects = useGuideRects(
    guideStage === 'planning' && guidePart === 2,
    { routine: routineRef },
    450,
  );
  const guideSteps = useMemo<GuideStep[] | null>(() => {
    if (guideStage !== 'planning') return null;
    if (guidePart === 1 && weekRects?.week)
      return [
        { key: 'week', rect: weekRects.week, title: tx('guide.week.title'), body: tx('guide.week.body') },
      ];
    if (guidePart === 2 && routineRects?.routine) {
      // spotlight the top of the list, so the card fits comfortably below
      const r = routineRects.routine;
      return [
        {
          key: 'routine',
          rect: { ...r, h: Math.min(r.h, 320) },
          title: tx('guide.routine.title'),
          body: tx('guide.routine.body'),
        },
      ];
    }
    return null;
  }, [guideStage, guidePart, weekRects, routineRects, tx]);

  return (
    <Screen>
      <View style={{ paddingTop: spacing.s, gap: spacing.l, flex: 1 }}>
        <Text style={[type.largeTitle, { color: t.text }]}>{tx('planning.title')}</Text>
        <Segmented
          options={['Schedule', 'My routine']}
          labels={[tx('planning.schedule'), tx('planning.routine')]}
          value={tab}
          onChange={setTab}
        />
        {tab === 'Schedule' ? (
          <ScheduleView nav={navigation} focusDate={focusDate} weekRef={weekRef} />
        ) : (
          <RoutineView nav={navigation} listRef={routineRef} />
        )}
      </View>
      {guideSteps ? (
        <GuideTour
          steps={guideSteps}
          offset={guidePart === 1 ? guideOffset : guideOffset + 1}
          total={guideTotal}
          onComplete={() => {
            if (guidePart === 1) {
              // part two: show the real routine list while it's explained
              setTab('My routine');
              setGuidePart(2);
            } else {
              setGuide({ stage: 'discover', offset: guideOffset + 2 });
              navigation.navigate('Discover');
            }
          }}
          onSkip={() => setGuide({ stage: null, offset: 0 })}
        />
      ) : null}
    </Screen>
  );
}

/* --------------------------------- Schedule --------------------------------- */

const DAY_START = 8; // the visible day runs 8:00
const DAY_END = 22; //  … to 22:00
const HOUR_H = 54;

function ScheduleView({
  nav,
  focusDate,
  weekRef,
}: {
  nav: Props['navigation'];
  focusDate?: string;
  /** Guide target: the week strip block, measured by the tour. */
  weekRef?: React.RefObject<View | null>;
}) {
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
  /** "15:30" + 45 min → "16:15". */
  const endLabel = (timeLabel: string, mins: number): string => {
    const m = timeLabel.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return '';
    const total = Number(m[1]) * 60 + Number(m[2]) + mins;
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
  };

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
      <View ref={weekRef} collapsable={false} style={{ gap: spacing.s }}>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {Array.from({ length: 7 }).map((_, i) => {
            const iso = addDays(weekStart, i);
            const sel = iso === selected;
            const today = iso === todayISO();
            const hasAppt = apptsOn(iso).length > 0;
            const hasEvent = eventOn(iso).length > 0;
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
                {/* an event day carries its little spark */}
                {hasEvent ? (
                  <View style={{ position: 'absolute', top: 4, right: 5 }}>
                    <Ionicons name="sparkles" size={10} color={sel ? t.onAccent : t.accent} />
                  </View>
                ) : null}
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

      {/* the day, hour by hour (iPhone calendar). The rail's origin is exact:
          the LINE for hour i sits at i*HOUR_H, labels centred on their line,
          blocks positioned and sized purely by time so 15:30 lands halfway
          between 15:00 and 16:00. */}
      <View style={{ height: (DAY_END - DAY_START) * HOUR_H + 20, marginTop: spacing.s }}>
        {Array.from({ length: DAY_END - DAY_START + 1 }).map((_, i) => (
          <View key={i} style={{ position: 'absolute', top: i * HOUR_H, left: 0, right: 0 }}>
            <View
              style={{ position: 'absolute', top: 0, left: 52, right: 0, height: 1, backgroundColor: t.separator }}
            />
            <Text
              style={{
                position: 'absolute',
                top: -7,
                left: 0,
                width: 44,
                fontSize: 11,
                color: t.muted,
                textAlign: 'right',
              }}
            >
              {`${DAY_START + i}:00`}
            </Text>
          </View>
        ))}

        {dayAppts.map((a) => {
          const tr = treatments.find((x) => x.id === a.treatmentId);
          const clinic = clinics.find((c) => c.id === a.clinicId);
          const start = hourOf(a.timeLabel);
          if (start === null || start < 0) return null;
          const mins = minsOf(a.clinicId, tr?.name);
          const height = Math.max(30, (mins / 60) * HOUR_H - 2);
          const compact = height < 48;
          const range = `${a.timeLabel} – ${endLabel(a.timeLabel, mins)}`;
          return (
            <Pressable
              key={a.id}
              accessibilityRole="button"
              accessibilityLabel={`${tr?.name ?? 'Appointment'} ${range}`}
              onPress={() => tr && nav.navigate('TreatmentDetail', { treatmentId: tr.id })}
              style={({ pressed }) => ({
                position: 'absolute',
                top: start * HOUR_H + 1,
                left: 56,
                right: 0,
                height,
                borderRadius: radii.m,
                backgroundColor: t.accentSoft,
                borderLeftWidth: 3,
                borderLeftColor: t.accent,
                paddingHorizontal: spacing.m,
                justifyContent: 'center',
                opacity: pressed ? 0.8 : 1,
              })}
            >
              {compact ? (
                <Text numberOfLines={1} style={{ fontSize: 12.5, fontWeight: '700', color: t.text }}>
                  {tr?.name ?? 'Appointment'}
                  <Text style={{ fontWeight: '500', color: t.sub }}>{`  ${range}`}</Text>
                </Text>
              ) : (
                <>
                  <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '700', color: t.text }}>
                    {tr?.name ?? 'Appointment'}
                  </Text>
                  <Text numberOfLines={1} style={{ fontSize: 12, color: t.sub, marginTop: 1 }}>
                    {range} · {clinic?.name}
                  </Text>
                </>
              )}
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
function RoutineView({
  nav,
  listRef,
}: {
  nav: Props['navigation'];
  /** Guide target: the list area, measured by the tour. */
  listRef?: React.RefObject<View | null>;
}) {
  const t = useTheme();
  const tx = useT();
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
    <View ref={listRef} collapsable={false} style={{ flex: 1 }}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: spacing.l, paddingBottom: 120 }}>
      {groups.map((g) => (
        <View key={g.zone.id} style={{ gap: spacing.s }}>
          <SectionLabel>{tx('zone.' + g.zone.id)}</SectionLabel>
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
                      {tx('planning.every', { c: cadenceEvery(tr.cadence) })} · {clinicName(tr.clinicId)}
                      {tr.atHome ? ` · ${tx('common.atHome')}` : ''}
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
    </View>
  );
}
