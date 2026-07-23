import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card, GhostButton, IOSSwitch, IconButton, PrimaryButton, ProgressBar, Row, Screen, SectionLabel } from '../../components/ui';
import { needsAttention, nextDueISO, treatmentStatus } from '../../services/logic';
import { formatLong, formatMedium, humanizeDue, todayISO } from '../../lib/dates';
import { formatAED } from '../../lib/money';
import { radii, spacing, type } from '../../theme';
import { useEterna, useTheme } from '../../store';
import { useT } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'TreatmentDetail'>;

/**
 * Full treatment record: current status, cadence, practitioner, and the
 * complete session history, what was done, by whom (role, not assumed
 * "doctor"), which products, at what price, plus practitioner notes when
 * they exist.
 */
export function TreatmentDetailScreen({ navigation, route }: Props) {
  const t = useTheme();
  const tx = useT();
  const tr = useEterna((s) => s.treatments.find((x) => x.id === route.params.treatmentId));
  // Select the stable array, then derive — filtering inside the selector returns
  // a brand-new array every render, which makes zustand's snapshot look changed
  // and loops forever ("getSnapshot should be cached").
  const allSessions = useEterna((s) => s.sessions);
  const sessions = useMemo(
    () => allSessions.filter((x) => x.treatmentId === route.params.treatmentId),
    [allSessions, route.params.treatmentId],
  );
  const appointments = useEterna((s) => s.appointments);
  const clinics = useEterna((s) => s.clinics);
  const toggleReminder = useEterna((s) => s.toggleReminder);
  const logDone = useEterna((s) => s.logDone);
  const cancelAppointment = useEterna((s) => s.cancelAppointment);
  const showToast = useEterna((s) => s.showToast);
  const remindDays = useEterna((s) => s.profile?.remindDaysBefore ?? 5);

  if (!tr) {
    return (
      <Screen>
        <Text style={{ color: t.sub, marginTop: 100, textAlign: 'center' }}>
          {tx('tdetail.notFound')}
        </Text>
      </Screen>
    );
  }

  const status = treatmentStatus(tr, appointments);
  const clinic = clinics.find((c) => c.id === tr.clinicId);
  const appt = appointments
    .filter((a) => a.treatmentId === tr.id && a.dateISO >= todayISO())
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO))[0];
  const ordered = [...sessions].sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1));

  const statusLine =
    status === 'booked' && appt
      ? tx('tdetail.bookedOn', { date: formatMedium(appt.dateISO), time: appt.timeLabel })
      : humanizeDue(nextDueISO(tr));
  const statusColor = needsAttention(status)
    ? t.attention
    : status === 'booked'
      ? t.positive
      : t.sub;

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.m, paddingTop: spacing.s }}>
        <IconButton name="chevron-back" onPress={() => navigation.goBack()} accessibilityLabel={tx('tdetail.back')} />
        <Text style={[type.title, { color: t.text, flex: 1 }]} numberOfLines={1}>
          {tr.name}
        </Text>
      </View>

      <ScrollView
        style={{ marginTop: spacing.l }}
        contentContainerStyle={{ gap: spacing.m, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* status card */}
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s }}>
            <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: statusColor }} />
            <Text style={[type.label, { color: statusColor }]}>{statusLine}</Text>
          </View>
          {/* centered stat plaque, hairline-separated (Airbnb listing header) */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: spacing.m,
              paddingVertical: spacing.s,
            }}
          >
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: t.text }}>
                {tr.cadence.every}{' '}
                {tr.cadence.unit === 'day'
                  ? tx('tdetail.unitDay')
                  : tr.cadence.unit === 'week'
                    ? tx('tdetail.unitWeek')
                    : tx('tdetail.unitMonth')}
              </Text>
              <Text style={{ fontSize: 11, color: t.muted, marginTop: 1 }}>{tx('tdetail.howOften')}</Text>
            </View>
            <View style={{ width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: t.separator }} />
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: t.text }}>
                {formatAED(tr.price)}
              </Text>
              <Text style={{ fontSize: 11, color: t.muted, marginTop: 1 }}>{tx('book.usualPrice')}</Text>
            </View>
            <View style={{ width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: t.separator }} />
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: t.text }}>{ordered.length}</Text>
              <Text style={{ fontSize: 11, color: t.muted, marginTop: 1 }}>{tx('tdetail.sessions')}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 13, color: t.sub }}>
            {clinic?.name ?? tx('tdetail.notSet')}
            {tr.atHome ? ` · ${tx('common.atHome')}` : ''}
          </Text>
          {tr.pkg ? (
            <View style={{ gap: 5, marginTop: spacing.m }}>
              <ProgressBar value={tr.pkg.done / tr.pkg.total} />
              <Text style={{ fontSize: 12, color: t.sub }}>
                {tx('tdetail.package', { done: tr.pkg.done, total: tr.pkg.total })}
              </Text>
            </View>
          ) : null}
          {appt ? (
            <GhostButton
              title={tx('tdetail.cancelBooking')}
              onPress={() => {
                cancelAppointment(appt.id);
                showToast(tx('tdetail.bookingCancelled'));
              }}
              style={{ marginTop: spacing.m }}
            />
          ) : null}
          <View style={{ flexDirection: 'row', gap: spacing.s, marginTop: spacing.l }}>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                title={tx('tdetail.bookNow')}
                onPress={() => navigation.navigate('Book', { treatmentId: tr.id })}
                style={{ paddingVertical: 12 }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <GhostButton
                title={tx('tdetail.markDone')}
                onPress={() => {
                  logDone(tr.id);
                  showToast(tx('tdetail.loggedToast'));
                }}
              />
            </View>
          </View>
        </Card>

        {/* settings */}
        <Card style={{ paddingVertical: 4 }}>
          <Row
            title={remindDays > 0 ? `${tx('profile.remind')} ${tx('profile.daysBefore', { n: remindDays })}` : tx('tdetail.remindersOff')}
            right={<IOSSwitch on={tr.reminderOn} onToggle={() => toggleReminder(tr.id)} />}
          />
          <Row
            title={tx('tdetail.clinic')}
            subtitle={clinic ? `${clinic.name} · ${clinic.distanceKm} km` : tx('tdetail.notSet')}
            last
          />
        </Card>

        {/* history */}
        <SectionLabel>{tx('tdetail.history', { n: ordered.length })}</SectionLabel>
        {ordered.map((s, i) => {
          const sClinic = clinics.find((c) => c.id === s.clinicId);
          return (
            <View key={s.id} style={{ flexDirection: 'row', gap: spacing.m }}>
              {/* timeline spine */}
              <View style={{ alignItems: 'center', width: 12 }}>
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: i === 0 ? t.accent : t.faint,
                    marginTop: 18,
                  }}
                />
                {i < ordered.length - 1 ? (
                  <View style={{ width: StyleSheet.hairlineWidth * 2, flex: 1, backgroundColor: t.border }} />
                ) : null}
              </View>
              <Card style={{ flex: 1, marginBottom: spacing.s }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: t.sub }}>
                    {formatLong(s.dateISO)}
                  </Text>
                  {s.price > 0 ? (
                    <Text style={{ fontSize: 13, fontWeight: '600', color: t.text }}>
                      {formatAED(s.price)}
                    </Text>
                  ) : null}
                </View>
                <Text style={{ fontSize: 15, fontWeight: '600', color: t.text, marginTop: 6 }}>
                  {s.detail}
                </Text>
                <Text style={{ fontSize: 13, color: t.sub, marginTop: 4 }}>
                  {s.practitioner.name} · {s.practitioner.role}
                  {sClinic ? ` · ${sClinic.name}` : ''}
                </Text>
                {s.products?.length ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.s }}>
                    {s.products.map((p) => (
                      <View
                        key={p}
                        style={{
                          paddingVertical: 4,
                          paddingHorizontal: 10,
                          borderRadius: radii.pill,
                          backgroundColor: t.accentSoft,
                        }}
                      >
                        <Text style={{ fontSize: 12, color: t.accent, fontWeight: '600' }}>{p}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
                {s.notes ? (
                  <View
                    style={{
                      marginTop: spacing.s,
                      backgroundColor: t.surfaceAlt,
                      borderRadius: radii.m,
                      padding: spacing.m,
                      borderLeftWidth: 2,
                      borderLeftColor: t.accent,
                    }}
                  >
                    <Text style={[type.label, { color: t.muted, marginBottom: 2 }]}>
                      {tx('tdetail.practitionerNotes')}
                    </Text>
                    <Text style={{ fontSize: 13, color: t.text, lineHeight: 19 }}>{s.notes}</Text>
                  </View>
                ) : null}
              </Card>
            </View>
          );
        })}
        {ordered.length === 0 ? (
          <Card>
            <Text style={{ fontSize: 14, color: t.sub }}>
              {tx('tdetail.noSessions')}
            </Text>
          </Card>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
