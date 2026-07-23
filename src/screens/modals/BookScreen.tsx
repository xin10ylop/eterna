import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { IconButton, LedgerRow, Screen, SectionLabel } from '../../components/ui';
import { CalendarPicker } from '../../components/ui/CalendarPicker';
import { AnimatedCheck } from '../../components/anim/AnimatedCheck';
import { Confetti } from '../../components/anim/Lottie';
import { Entrance } from '../../components/anim/Entrance';
import { addDays, formatLong, monthShort, todayISO, weekdayShort } from '../../lib/dates';
import { formatAED } from '../../lib/money';
import { cardShadow, radii, spacing, type } from '../../theme';
import { useEterna, useTheme } from '../../store';
import { useT } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Book'>;

/**
 * Booking, Airbnb-style: horizontal date cards, a time grid, and a pinned
 * bottom bar with the price on the left and the primary action on the right.
 * Ends in a drawn-check success moment.
 */
export function BookScreen({ navigation, route }: Props) {
  const t = useTheme();
  const tx = useT();
  const tr = useEterna((s) => s.treatments.find((x) => x.id === route.params.treatmentId));
  const clinics = useEterna((s) => s.clinics);
  const book = useEterna((s) => s.book);
  const showToast = useEterna((s) => s.showToast);

  // same-day booking allowed; the strip covers the next stretch, the calendar
  // opens any date at all (a day earlier or later, or when a clinic day is full)
  const days = useMemo(() => Array.from({ length: 10 }, (_, i) => addDays(todayISO(), i)), []);
  const times = ['09:30', '11:00', '13:15', '14:30', '16:15', '18:00'];
  const [day, setDay] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [showCal, setShowCal] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  if (!tr) {
    return (
      <Screen>
        <Text style={{ marginTop: 100, textAlign: 'center', color: t.sub }}>{tx('book.notFound')}</Text>
      </Screen>
    );
  }
  const clinic = clinics.find((c) => c.id === tr.clinicId);

  if (confirmed && day && time) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.l }}>
          <Confetti size={260} style={{ position: 'absolute', top: '12%' }} />
          <AnimatedCheck
            onDone={() => {
              // let her actually enjoy the "all set" moment before we leave
              setTimeout(() => {
                showToast(tx('book.bookedToast', { date: formatLong(day), time }));
                navigation.goBack();
              }, 2200);
            }}
          />
          <Entrance delay={500}>
            <Text style={[type.title, { color: t.text, textAlign: 'center' }]}>{tx('book.allSet')}</Text>
            <Text style={{ fontSize: 15, color: t.sub, textAlign: 'center', marginTop: 4 }}>
              {tr.name} · {tx('book.dateAtTime', { date: formatLong(day), time })}
            </Text>
          </Entrance>
          {/* expectation-setting summary (Uber post-booking sheet) */}
          <Entrance delay={650} distance={12}>
            <View
              style={{
                backgroundColor: t.surfaceAlt,
                borderWidth: 1,
                borderColor: t.border,
                borderRadius: radii.l,
                paddingVertical: spacing.m,
                paddingHorizontal: spacing.l,
              }}
            >
              <Text style={{ fontSize: 13, color: t.sub, textAlign: 'center' }}>
                {clinic?.name} · {formatAED(tr.price)} · {tx('book.reminderBefore', { n: 5 })}
              </Text>
            </View>
          </Entrance>
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: spacing.xl, flexDirection: 'row', alignItems: 'center', gap: spacing.m, paddingTop: spacing.s }}>
        <IconButton name="close" onPress={() => navigation.goBack()} accessibilityLabel={tx('book.close')} />
        <View style={{ flex: 1 }}>
          <Text style={[type.title, { color: t.text }]}>{tx('book.title', { name: tr.name.toLowerCase() })}</Text>
          <Text style={{ fontSize: 14, color: t.sub, marginTop: 2 }}>{clinic?.name}</Text>
        </View>
      </View>

      <ScrollView
        style={{ marginTop: spacing.xl }}
        contentContainerStyle={{ paddingBottom: 140, gap: spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        {/* date cards */}
        <View style={{ gap: spacing.s }}>
          <View style={{ paddingHorizontal: spacing.xl }}>
            <SectionLabel>{tx('book.pickDay')}</SectionLabel>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.s }}
          >
            {days.map((d) => {
              const sel = day === d;
              return (
                <Pressable
                  key={d}
                  accessibilityRole="button"
                  accessibilityState={{ selected: sel }}
                  onPress={() => setDay(d)}
                  style={({ pressed }) => ({
                    width: 66,
                    paddingVertical: 12,
                    borderRadius: radii.l,
                    alignItems: 'center',
                    gap: 2,
                    backgroundColor: sel ? t.accent : t.bg,
                    borderWidth: sel ? 0 : StyleSheet.hairlineWidth,
                    borderColor: t.border,
                    ...(sel ? {} : cardShadow),
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                  })}
                >
                  <Text style={{ fontSize: 11, fontWeight: '600', color: sel ? t.onAccent : t.muted }}>
                    {weekdayShort(d).toUpperCase()}
                  </Text>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: sel ? t.onAccent : t.text }}>
                    {Number(d.slice(8))}
                  </Text>
                  <Text style={{ fontSize: 11, fontWeight: '500', color: sel ? t.onAccent : t.muted }}>
                    {monthShort(d)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          {/* any other date — a day earlier, a day later, or further out */}
          <View style={{ paddingHorizontal: spacing.xl, gap: spacing.s }}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: showCal }}
              onPress={() => setShowCal((v) => !v)}
              hitSlop={6}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingVertical: 8,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Ionicons name="calendar-outline" size={15} color={t.accent} />
              <Text style={{ fontSize: 13.5, fontWeight: '700', color: t.accent }}>
                {tx('book.moreDates')}
              </Text>
              <Ionicons name={showCal ? 'chevron-up' : 'chevron-down'} size={14} color={t.accent} />
            </Pressable>
            {showCal ? (
              <CalendarPicker
                value={day ?? todayISO()}
                onSelect={(iso) => setDay(iso)}
                minISO={todayISO()}
              />
            ) : null}
          </View>
        </View>

        {/* time grid */}
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.s }}>
          <SectionLabel>{tx('book.pickTime')}</SectionLabel>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s, justifyContent: 'space-between' }}>
            {times.map((x) => {
              const sel = time === x;
              return (
                <Pressable
                  key={x}
                  accessibilityRole="button"
                  accessibilityState={{ selected: sel }}
                  onPress={() => setTime(x)}
                  style={({ pressed }) => ({
                    width: '30%',
                    paddingVertical: 13,
                    borderRadius: radii.m,
                    alignItems: 'center',
                    backgroundColor: sel ? t.accent : t.surface,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: sel ? t.accent : t.border,
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                  })}
                >
                  <Text style={{ fontSize: 15, fontWeight: '600', color: sel ? t.onAccent : t.text }}>
                    {x}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        {/* price breakdown ledger (Airbnb receipt pattern) */}
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.s }}>
          <SectionLabel>{tx('book.priceDetails')}</SectionLabel>
          <View
            style={{
              backgroundColor: t.surfaceAlt,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: t.border,
              borderRadius: radii.l,
              paddingVertical: spacing.s,
              paddingHorizontal: spacing.l,
            }}
          >
            {tr.pkg ? (
              <>
                <LedgerRow
                  label={`${tr.name} · ${tr.pkg.done + 1}/${tr.pkg.total}`}
                  value={tx('book.free')}
                  muted
                />
                <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.separator, marginVertical: 4 }} />
                <LedgerRow label={tx('book.total')} value={formatAED(0)} bold />
                <Text style={{ fontSize: 12, color: t.muted, paddingBottom: 4 }}>{tx('book.packagePrepaid')}</Text>
              </>
            ) : (
              <>
                <LedgerRow label={`${tr.name} × 1`} value={formatAED(tr.price)} />
                <LedgerRow label={tx('book.fee')} value={tx('book.free')} muted />
                <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.separator, marginVertical: 4 }} />
                <LedgerRow label={tx('book.total')} value={formatAED(tr.price)} bold />
                <Text style={{ fontSize: 12, color: t.muted, paddingBottom: 4 }}>
                  {tr.atHome ? tx('book.paidAtHome') : tx('book.paidAtClinic')}
                </Text>
              </>
            )}
          </View>
        </View>
      </ScrollView>

      {/* pinned price + action bar (Airbnb pattern) */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.m,
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.m,
          paddingBottom: spacing.xxl,
          backgroundColor: t.bg,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: t.border,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: t.text }}>{formatAED(tr.price)}</Text>
          <Text style={{ fontSize: 12, color: t.sub }}>
            {day && time ? `${formatLong(day)} · ${time}` : tx('book.usualPrice')}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !day || !time }}
          onPress={() => {
            if (!day || !time) return;
            book(tr.id, day, time);
            setConfirmed(true);
          }}
          style={({ pressed }) => ({
            paddingVertical: day && time ? 10 : 15,
            paddingHorizontal: 28,
            borderRadius: radii.l,
            alignItems: 'center',
            backgroundColor: day && time ? t.accent : t.faint,
            transform: [{ scale: pressed && day && time ? 0.97 : 1 }],
          })}
        >
          {/* CTA names the selection (Uber Reserve pattern) */}
          <Text style={{ color: day && time ? t.onAccent : t.sub, fontSize: 16, fontWeight: '700' }}>
            {tx('book.confirm')}
          </Text>
          {day && time ? (
            <Text style={{ color: t.onAccent, fontSize: 11, fontWeight: '500', opacity: 0.85 }}>
              {formatLong(day)} · {time}
            </Text>
          ) : null}
        </Pressable>
      </View>
    </Screen>
  );
}
