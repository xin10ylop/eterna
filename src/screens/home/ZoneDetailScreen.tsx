import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card, IconButton, Screen } from '../../components/ui';
import { AVATAR_MARKERS, ZONES } from '../../data/seed';
import { nextDueISO, treatmentStatus } from '../../services/logic';
import { cadenceEvery, formatMedium, humanizeDue, todayISO } from '../../lib/dates';
import { spacing, type } from '../../theme';
import { useEterna, useTheme } from '../../store';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ZoneDetail'>;

/** One fixed body zone: every treatment in it, most urgent first. */
export function ZoneDetailScreen({ navigation, route }: Props) {
  const t = useTheme();
  // A marker aggregates zones (face+lips, torso+hips); show every treatment the
  // tapped glow actually covers, not just the primary zone.
  const marker = AVATAR_MARKERS.find((m) => m.id === route.params.zone);
  const zoneIds = marker?.zones ?? [route.params.zone];
  const zone = ZONES.find((z) => z.id === route.params.zone);
  const treatments = useEterna((s) => s.treatments);
  const appointments = useEterna((s) => s.appointments);
  const clinics = useEterna((s) => s.clinics);

  const inZone = treatments
    .filter((tr) => zoneIds.includes(tr.zone))
    .map((tr) => ({ tr, status: treatmentStatus(tr, appointments) }))
    .sort((a, b) => {
      const rank = (s: string) => (s === 'bookNow' ? 0 : s === 'comingUp' ? 1 : s === 'booked' ? 2 : 3);
      return rank(a.status) - rank(b.status);
    });

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.m, paddingTop: spacing.s }}>
        <IconButton name="chevron-back" onPress={() => navigation.goBack()} accessibilityLabel="Back" />
        <Text style={[type.title, { color: t.text }]}>{marker?.label ?? zone?.label ?? 'Zone'}</Text>
      </View>

      <ScrollView
        style={{ marginTop: spacing.l }}
        contentContainerStyle={{ gap: spacing.m, paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        {inZone.length === 0 ? (
          <Card>
            <Text style={{ fontSize: 15, color: t.sub }}>
              Nothing tracked here yet. Add a treatment with the plus button.
            </Text>
          </Card>
        ) : (
          inZone.map(({ tr, status }) => {
            const clinic = clinics.find((c) => c.id === tr.clinicId);
            const appt = appointments
              .filter((a) => a.treatmentId === tr.id && a.dateISO >= todayISO())
              .sort((a, b) => a.dateISO.localeCompare(b.dateISO))[0];
            const statusLine =
              status === 'booked' && appt
                ? `Booked ${formatMedium(appt.dateISO)} at ${appt.timeLabel}`
                : status === 'bookNow'
                  ? 'Time to book'
                  : humanizeDue(nextDueISO(tr));
            return (
              <Card key={tr.id} onPress={() => navigation.navigate('TreatmentDetail', { treatmentId: tr.id })}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.m }}>
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor:
                        status === 'bookNow'
                          ? '#C83A2C'
                          : status === 'comingUp'
                            ? t.attention
                            : status === 'booked'
                              ? t.positive
                              : t.muted,
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: t.text }}>{tr.name}</Text>
                    <Text style={{ fontSize: 13, color: t.sub, marginTop: 2 }}>
                      {statusLine} · every {cadenceEvery(tr.cadence)} · {clinic?.name}
                      {tr.pkg ? ` · ${tr.pkg.done}/${tr.pkg.total} sessions` : ''}
                      {tr.atHome ? ' · At home' : ''}
                    </Text>
                  </View>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}
