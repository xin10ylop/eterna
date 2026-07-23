import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card, IconButton, Screen } from '../../components/ui';
import { AVATAR_MARKERS } from '../../data/seed';
import { nextDueISO, treatmentStatus } from '../../services/logic';
import { cadenceEvery, formatMedium, humanizeDue, todayISO } from '../../lib/dates';
import { spacing, type } from '../../theme';
import { useEterna, useTheme } from '../../store';
import { useT } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ZoneDetail'>;

/** One fixed body zone: every treatment in it, most urgent first. */
export function ZoneDetailScreen({ navigation, route }: Props) {
  const t = useTheme();
  const tx = useT();
  // A marker aggregates zones (face+lips, torso+hips); show every treatment the
  // tapped glow actually covers, not just the primary zone.
  const marker = AVATAR_MARKERS.find((m) => m.id === route.params.zone);
  const zoneIds = marker?.zones ?? [route.params.zone];
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
        <IconButton name="chevron-back" onPress={() => navigation.goBack()} accessibilityLabel={tx('zdetail.back')} />
        <Text style={[type.title, { color: t.text }]}>{tx('zone.' + route.params.zone)}</Text>
      </View>

      <ScrollView
        style={{ marginTop: spacing.l }}
        contentContainerStyle={{ gap: spacing.m, paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        {inZone.length === 0 ? (
          <Card>
            <Text style={{ fontSize: 15, color: t.sub }}>
              {tx('zdetail.empty')}
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
                ? tx('zdetail.bookedOn', { date: formatMedium(appt.dateISO), time: appt.timeLabel })
                : status === 'bookNow'
                  ? tx('zdetail.timeToBook')
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
                      {statusLine} · {tx('planning.every', { c: cadenceEvery(tr.cadence) })} · {clinic?.name}
                      {tr.pkg ? ` · ${tx('zdetail.sessions', { done: tr.pkg.done, total: tr.pkg.total })}` : ''}
                      {tr.atHome ? ` · ${tx('common.atHome')}` : ''}
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
