import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/ui';
import { diffDays, formatMedium, humanizeDue, todayISO } from '../../lib/dates';
import { nextDueISO, treatmentStatus } from '../../services/logic';
import { cardShadow, radii, spacing, type } from '../../theme';
import { useEterna, useTheme } from '../../store';
import { useT } from '../../i18n';
import type { Appointment, Treatment } from '../../types';
import type { RootStackParamList, TabParamList } from '../../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Planning'>,
  NativeStackScreenProps<RootStackParamList>
>;

const RED = '#C83A2C';

/**
 * Planning is agenda-first. For a sparse maintenance schedule a month grid is
 * ~90% empty cells and forces recall-based hunting; a countdown + "Upcoming"
 * list answers "what's next / what should I book" by recognition, and the
 * countdown taps goal-gradient + anticipation. No month/week/day toggle.
 */
export function PlanningScreen({ navigation }: Props) {
  const t = useTheme();
  const tx = useT();
  const treatments = useEterna((s) => s.treatments);
  const appointments = useEterna((s) => s.appointments);
  const clinics = useEterna((s) => s.clinics);
  const clinicName = (id: string) => clinics.find((c) => c.id === id)?.name ?? '';
  const today = todayISO();

  const ranked = useMemo(
    () => treatments.map((tr) => ({ tr, status: treatmentStatus(tr, appointments) })),
    [treatments, appointments],
  );
  const bookNow = ranked.filter((r) => r.status === 'bookNow');
  const comingUp = ranked.filter((r) => r.status === 'comingUp');
  const onScheduleCount = ranked.filter((r) => r.status === 'onTrack' || r.status === 'booked').length;

  const apptItems = useMemo(
    () =>
      appointments
        .map((a) => ({ a, tr: treatments.find((x) => x.id === a.treatmentId) }))
        .filter((x): x is { a: Appointment; tr: Treatment } => !!x.tr),
    [appointments, treatments],
  );
  const nextAppt = useMemo(
    () =>
      apptItems
        .filter((x) => diffDays(today, x.a.dateISO) >= 0)
        .sort((p, q) => p.a.dateISO.localeCompare(q.a.dateISO))[0],
    [apptItems, today],
  );

  type Item = {
    key: string;
    dateISO: string;
    tr: Treatment;
    kind: 'appt' | 'due';
    a?: Appointment;
    urgent?: boolean;
  };
  const items: Item[] = useMemo(() => {
    const list: Item[] = [
      ...apptItems.map((x) => ({ key: `a-${x.a.id}`, dateISO: x.a.dateISO, tr: x.tr, kind: 'appt' as const, a: x.a })),
      ...[...bookNow, ...comingUp].map((x) => ({
        key: `d-${x.tr.id}`,
        dateISO: nextDueISO(x.tr),
        tr: x.tr,
        kind: 'due' as const,
        urgent: x.status === 'bookNow',
      })),
    ];
    return list.sort((p, q) => p.dateISO.localeCompare(q.dateISO));
  }, [apptItems, bookNow, comingUp]);

  // Hero: surface an urgent booking first, else the next confirmed visit.
  const heroDue = bookNow[0]?.tr;
  const heroKey = heroDue ? `d-${heroDue.id}` : nextAppt ? `a-${nextAppt.a.id}` : null;
  const listItems = items.filter((i) => i.key !== heroKey);
  const nextDays = nextAppt ? diffDays(today, nextAppt.a.dateISO) : 0;

  return (
    <Screen>
      <View style={{ paddingTop: spacing.s, flex: 1 }}>
        <Text style={[type.largeTitle, { color: t.text }]}>{tx('tab.planning')}</Text>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.m, paddingTop: spacing.l, paddingBottom: 120 }}
        >
          {/* countdown hero */}
          {heroDue ? (
            <View style={{ backgroundColor: t.accentSoft, borderRadius: radii.card, padding: spacing.l, gap: 6 }}>
              <Text style={[type.label, { color: RED }]}>{tx('status.timeToBook')}</Text>
              <Text style={{ fontSize: 22, fontWeight: '800', color: t.text }}>{heroDue.name}</Text>
              <Text style={{ fontSize: 14, color: t.sub }}>{clinicName(heroDue.clinicId)}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={tx('common.book')}
                onPress={() => navigation.navigate('Book', { treatmentId: heroDue.id })}
                style={({ pressed }) => ({
                  marginTop: spacing.s,
                  paddingVertical: 13,
                  borderRadius: radii.l,
                  alignItems: 'center',
                  backgroundColor: t.accent,
                  transform: [{ scale: pressed ? 0.99 : 1 }],
                })}
              >
                <Text style={{ color: t.onAccent, fontSize: 15, fontWeight: '700' }}>{tx('common.book')}</Text>
              </Pressable>
            </View>
          ) : nextAppt ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('TreatmentDetail', { treatmentId: nextAppt.tr.id })}
              style={({ pressed }) => ({
                backgroundColor: t.accentSoft,
                borderRadius: radii.card,
                padding: spacing.l,
                gap: 6,
                transform: [{ scale: pressed ? 0.99 : 1 }],
              })}
            >
              <Text style={[type.label, { color: t.accent }]}>{tx('planning.nextVisit')}</Text>
              <Text style={{ fontSize: 22, fontWeight: '800', color: t.text }}>{nextAppt.tr.name}</Text>
              <Text style={{ fontSize: 14, color: t.accent, fontWeight: '600' }}>
                {nextDays < 14 ? tx('event.inDays', { n: nextDays }) : tx('event.inWeeks', { n: Math.round(nextDays / 7) })}
                {' · '}
                {formatMedium(nextAppt.a.dateISO)} · {nextAppt.a.timeLabel}
              </Text>
              <Text style={{ fontSize: 13, color: t.sub }}>{clinicName(nextAppt.a.clinicId)}</Text>
            </Pressable>
          ) : (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.m,
                backgroundColor: t.bg,
                borderRadius: radii.card,
                borderWidth: 1,
                borderColor: t.border,
                padding: spacing.l,
                ...cardShadow,
              }}
            >
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: t.positive }} />
              <Text style={{ fontSize: 15, fontWeight: '600', color: t.text }}>{tx('home.caughtUp')}</Text>
            </View>
          )}

          {/* upcoming agenda */}
          {listItems.length > 0 ? (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: spacing.s }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.accent }} />
                <Text style={[type.label, { color: t.sub }]}>{tx('section.upcoming')}</Text>
              </View>
              {listItems.map((it) => {
                const [mon, day] = formatMedium(it.dateISO).split(' ');
                const dateColor = it.kind === 'appt' ? t.positive : it.urgent ? RED : t.accent;
                const sub =
                  it.kind === 'appt'
                    ? `${it.a!.timeLabel} · ${clinicName(it.a!.clinicId)}`
                    : `${it.urgent ? tx('status.timeToBook') : humanizeDue(it.dateISO)} · ${clinicName(it.tr.clinicId)}`;
                return (
                  <Pressable
                    key={it.key}
                    accessibilityRole="button"
                    onPress={() => navigation.navigate('TreatmentDetail', { treatmentId: it.tr.id })}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.m,
                      backgroundColor: t.bg,
                      borderRadius: radii.card,
                      borderWidth: 1,
                      borderColor: t.border,
                      padding: spacing.m,
                      ...cardShadow,
                      transform: [{ scale: pressed ? 0.99 : 1 }],
                    })}
                  >
                    <View style={{ alignItems: 'center', width: 44 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: dateColor }}>{mon.toUpperCase()}</Text>
                      <Text style={{ fontSize: 18, fontWeight: '800', color: t.text }}>{day}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '600', color: t.text }}>
                        {it.tr.name}
                      </Text>
                      <Text numberOfLines={1} style={{ fontSize: 12.5, color: t.sub, marginTop: 1 }}>
                        {sub}
                      </Text>
                    </View>
                    {it.kind === 'appt' ? (
                      <Ionicons name="checkmark-circle" size={22} color={t.positive} />
                    ) : (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={tx('common.book')}
                        onPress={() => navigation.navigate('Book', { treatmentId: it.tr.id })}
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
                  </Pressable>
                );
              })}
            </>
          ) : null}

          {onScheduleCount > 0 ? (
            <Text style={{ fontSize: 13, color: t.muted, textAlign: 'center', marginTop: spacing.s }}>
              {tx('planning.onSchedule', { n: onScheduleCount })}
            </Text>
          ) : null}
        </ScrollView>
      </View>
    </Screen>
  );
}
