import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Chip, IconButton, PrimaryButton, Screen, SectionLabel } from '../../components/ui';
import { addDays, formatLong, todayISO } from '../../lib/dates';
import { formatEUR } from '../../lib/money';
import { spacing, type } from '../../theme';
import { useEterna, useTheme } from '../../store';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Book'>;

/** Simple two-step booking: pick a day chip, pick a time, confirm.
 *  Date + slot pattern following Booking.com's picker (Mobbin). */
export function BookScreen({ navigation, route }: Props) {
  const t = useTheme();
  const tr = useEterna((s) => s.treatments.find((x) => x.id === route.params.treatmentId));
  const clinics = useEterna((s) => s.clinics);
  const book = useEterna((s) => s.book);
  const showToast = useEterna((s) => s.showToast);

  const days = useMemo(() => Array.from({ length: 6 }, (_, i) => addDays(todayISO(), i + 1)), []);
  const times = ['09:30', '11:00', '14:30', '16:15', '18:00'];
  const [day, setDay] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);

  if (!tr) return <Screen><Text style={{ marginTop: 100, textAlign: 'center', color: t.sub }}>Treatment not found.</Text></Screen>;
  const clinic = clinics.find((c) => c.id === tr.clinicId);

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.m, paddingTop: spacing.s }}>
        <IconButton name="close" onPress={() => navigation.goBack()} accessibilityLabel="Close" />
        <View style={{ flex: 1 }}>
          <Text style={[type.title, { color: t.text }]}>Book {tr.name.toLowerCase()}</Text>
          <Text style={{ fontSize: 14, color: t.sub, marginTop: 2 }}>
            {clinic?.name} · usually {formatEUR(tr.priceEUR)}
          </Text>
        </View>
      </View>

      <View style={{ marginTop: spacing.xl, gap: spacing.l, flex: 1 }}>
        <View style={{ gap: spacing.s }}>
          <SectionLabel>Day</SectionLabel>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s }}>
            {days.map((d) => (
              <Chip key={d} label={formatLong(d)} selected={day === d} onPress={() => setDay(d)} />
            ))}
          </View>
        </View>
        <View style={{ gap: spacing.s }}>
          <SectionLabel>Time</SectionLabel>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s }}>
            {times.map((x) => (
              <Chip key={x} label={x} selected={time === x} onPress={() => setTime(x)} />
            ))}
          </View>
        </View>
      </View>

      <View style={{ paddingBottom: spacing.xxl, gap: spacing.s }}>
        <PrimaryButton
          title={day && time ? `Confirm ${formatLong(day)} · ${time}` : 'Pick a day and time'}
          disabled={!day || !time}
          onPress={() => {
            if (!day || !time) return;
            book(tr.id, day, time);
            showToast(`Booked ${formatLong(day)} at ${time}`);
            navigation.goBack();
          }}
        />
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={{ textAlign: 'center', color: t.accent, fontSize: 15, fontWeight: '600', paddingVertical: 8 }}>
            Not now
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
