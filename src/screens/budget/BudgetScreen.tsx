import React, { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Circle } from 'react-native-svg';
import { Card, Screen, SectionLabel } from '../../components/ui';
import { ZONES } from '../../data/seed';
import {
  bookedThisMonth,
  budgetByMonth,
  expectedNextMonth,
  spentThisMonth,
} from '../../services/logic';
import { formatLong, isSameMonth, monthShort, startOfMonth, todayISO } from '../../lib/dates';
import { formatEUR } from '../../lib/money';
import { radii, spacing, type } from '../../theme';
import { useEterna, useTheme } from '../../store';
import type { RootStackParamList, TabParamList } from '../../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Budget'>,
  NativeStackScreenProps<RootStackParamList>
>;

/** Progress ring: spent portion of the month's planned total. */
function SpendRing({ fraction, size = 108 }: { fraction: number; size?: number }) {
  const t = useTheme();
  const R = 44;
  const LEN = 2 * Math.PI * R;
  const f = Math.min(1, Math.max(0, fraction));
  return (
    <Svg width={size} height={size} viewBox="0 0 108 108">
      <Circle cx="54" cy="54" r={R} stroke={t.accentSoft} strokeWidth={11} fill="none" />
      <Circle
        cx="54"
        cy="54"
        r={R}
        stroke={t.accent}
        strokeWidth={11}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${LEN}`}
        strokeDashoffset={LEN * (1 - f)}
        transform="rotate(-90 54 54)"
      />
    </Svg>
  );
}

/**
 * Budget, hero total + booked/expected forecast + 6-month bars + zone
 * breakdown + upcoming appointment costs. Layout adapted from Apple Wallet's
 * spending summary and Cleo's category rows (Mobbin).
 */
export function BudgetScreen({ navigation }: Props) {
  const t = useTheme();
  const sessions = useEterna((s) => s.sessions);
  const appointments = useEterna((s) => s.appointments);
  const treatments = useEterna((s) => s.treatments);
  const clinics = useEterna((s) => s.clinics);

  const spent = useMemo(() => spentThisMonth(sessions), [sessions]);
  const booked = useMemo(() => bookedThisMonth(appointments), [appointments]);
  const nextMonth = useMemo(
    () => expectedNextMonth(appointments, treatments),
    [appointments, treatments],
  );
  const months = useMemo(() => budgetByMonth(sessions, appointments), [sessions, appointments]);
  const maxMonth = Math.max(1, ...months.map((m) => m.spent + m.booked));

  const byZone = useMemo(() => {
    const m = startOfMonth(todayISO());
    return ZONES.map((z) => {
      const zoneTreatmentIds = treatments.filter((tr) => tr.zone === z.id).map((tr) => tr.id);
      const total = sessions
        .filter((s) => zoneTreatmentIds.includes(s.treatmentId) && isSameMonth(s.dateISO, m))
        .reduce((x, s) => x + s.priceEUR, 0);
      return { zone: z, total };
    })
      .filter((x) => x.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [sessions, treatments]);
  const maxZone = Math.max(1, ...byZone.map((x) => x.total));

  const upcoming = [...appointments].sort((a, b) => (a.dateISO < b.dateISO ? -1 : 1));

  return (
    <Screen>
      <View style={{ paddingTop: spacing.s }}>
        <Text style={[type.largeTitle, { color: t.text }]}>Budget</Text>
      </View>
      <ScrollView
        style={{ marginTop: spacing.l }}
        contentContainerStyle={{ gap: spacing.l, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* hero */}
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.l }}>
            <View style={{ flex: 1 }}>
              <Text style={[type.label, { color: t.muted }]}>Spent this month</Text>
              <Text style={{ fontSize: 38, fontWeight: '700', color: t.text, letterSpacing: -1, marginTop: 4 }}>
                {formatEUR(spent)}
              </Text>
              <Text style={{ fontSize: 13, color: t.sub, marginTop: 2 }}>
                of {formatEUR(spent + booked)} planned
              </Text>
            </View>
            <SpendRing fraction={spent + booked > 0 ? spent / (spent + booked) : 0} />
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.l, marginTop: spacing.m }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: t.sub }}>Still booked this month</Text>
              <Text style={{ fontSize: 17, fontWeight: '700', color: t.accent, marginTop: 2 }}>
                {formatEUR(booked)}
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: t.separator }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: t.sub }}>Expected next month</Text>
              <Text style={{ fontSize: 17, fontWeight: '700', color: t.text, marginTop: 2 }}>
                {formatEUR(nextMonth)}
              </Text>
            </View>
          </View>
        </Card>

        {/* insight sentence (Apple Health Highlights pattern) */}
        <Card>
          <SectionLabel>Highlights</SectionLabel>
          <Text style={{ fontSize: 16, fontWeight: '600', color: t.text, lineHeight: 23 }}>
            {nextMonth > spent + booked
              ? 'Next month is set to cost more than this one, two rituals fall due together.'
              : 'Next month is on track to cost less than this one.'}
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.l, marginTop: spacing.m }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.accent }} />
              <Text style={{ fontSize: 13, color: t.sub }}>This month {formatEUR(spent + booked)}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.faint }} />
              <Text style={{ fontSize: 13, color: t.sub }}>Next {formatEUR(nextMonth)}</Text>
            </View>
          </View>
        </Card>

        {/* six month bars */}
        <Card>
          <SectionLabel>Last months</SectionLabel>
          {/* stat header: value + range (Apple Health chart grammar) */}
          <View style={{ marginBottom: spacing.m }}>
            <Text style={{ fontSize: 26, fontWeight: '700', color: t.text, letterSpacing: -0.5 }}>
              {formatEUR(Math.round(months.reduce((x, m) => x + m.spent + m.booked, 0) / Math.max(1, months.length)))}
              <Text style={{ fontSize: 14, fontWeight: '500', color: t.sub }}>  monthly average</Text>
            </Text>
            <Text style={{ fontSize: 12, color: t.muted, marginTop: 1 }}>
              {monthShort(months[0]?.monthISO ?? todayISO())} – {monthShort(months[months.length - 1]?.monthISO ?? todayISO())}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.s, height: 110 }}>
            {months.map((m) => {
              const h = ((m.spent + m.booked) / maxMonth) * 84;
              const isNow = isSameMonth(m.monthISO, todayISO());
              const isFuture = m.monthISO > todayISO();
              return (
                <View key={m.monthISO} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                  <View
                    style={{
                      width: '68%',
                      height: Math.max(4, h),
                      borderRadius: 6,
                      backgroundColor: isFuture ? t.accentSoft : isNow ? t.accent : t.faint,
                      borderWidth: isFuture ? 1 : 0,
                      borderColor: t.accent,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: isNow ? '700' : '500',
                      color: isNow ? t.accent : t.muted,
                    }}
                  >
                    {monthShort(m.monthISO)}
                  </Text>
                </View>
              );
            })}
          </View>
          <Text style={{ fontSize: 12, color: t.muted, marginTop: spacing.s }}>
            Outlined bar = booked and projected, not yet spent.
          </Text>
        </Card>

        {/* zone breakdown */}
        {byZone.length > 0 ? (
          <Card>
            <SectionLabel>This month by area</SectionLabel>
            <View style={{ gap: spacing.m }}>
              {byZone.map(({ zone, total }) => (
                <View key={zone.id} style={{ gap: 5 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: t.text }}>{zone.label}</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: t.sub }}>
                      {formatEUR(total)}
                    </Text>
                  </View>
                  <View
                    style={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: t.surfaceAlt,
                      overflow: 'hidden',
                    }}
                  >
                    <View
                      style={{
                        width: `${(total / maxZone) * 100}%`,
                        height: '100%',
                        borderRadius: 3,
                        backgroundColor: t.accent,
                      }}
                    />
                  </View>
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        {/* upcoming */}
        <View style={{ gap: spacing.s }}>
          <SectionLabel>Upcoming appointments</SectionLabel>
          {upcoming.length === 0 ? (
            <Card>
              <Text style={{ fontSize: 14, color: t.sub }}>Nothing booked yet.</Text>
            </Card>
          ) : (
            upcoming.map((a) => {
              const tr = treatments.find((x) => x.id === a.treatmentId);
              const clinic = clinics.find((c) => c.id === a.clinicId);
              return (
                <Card
                  key={a.id}
                  onPress={() => tr && navigation.navigate('TreatmentDetail', { treatmentId: tr.id })}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.m }}>
                    <View
                      style={{
                        backgroundColor: t.accentSoft,
                        borderRadius: radii.m,
                        paddingVertical: 8,
                        paddingHorizontal: 10,
                        alignItems: 'center',
                        minWidth: 52,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700', color: t.accent }}>
                        {monthShort(a.dateISO).toUpperCase()}
                      </Text>
                      <Text style={{ fontSize: 17, fontWeight: '700', color: t.accent }}>
                        {Number(a.dateISO.slice(8))}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: t.text }}>
                        {tr?.name ?? 'Appointment'}
                      </Text>
                      <Text style={{ fontSize: 13, color: t.sub, marginTop: 1 }}>
                        {formatLong(a.dateISO)} · {a.timeLabel} · {clinic?.name}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: t.text }}>
                      {formatEUR(a.priceEUR)}
                    </Text>
                  </View>
                </Card>
              );
            })
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
