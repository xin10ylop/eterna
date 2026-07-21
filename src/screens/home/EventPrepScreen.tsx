import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Chip, IconButton, PrimaryButton, Screen } from '../../components/ui';
import { eventPlan, treatmentStatus } from '../../services/logic';
import { addDays, diffDays, formatMedium, todayISO } from '../../lib/dates';
import { cardShadow, radii, spacing, type } from '../../theme';
import { useEterna, useTheme } from '../../store';
import { useT } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'EventPrep'>;

/**
 * Back-planned prep list for an event (a wedding, Eid). Every ritual gets a
 * "do by" date backed off the event so it peaks in time; booked ones show a
 * check, the rest a one-tap Book.
 */
export function EventPrepScreen({ navigation }: Props) {
  const t = useTheme();
  const tx = useT();
  const event = useEterna((s) => s.event);
  const treatments = useEterna((s) => s.treatments);
  const appointments = useEterna((s) => s.appointments);
  const clinics = useEterna((s) => s.clinics);
  const setEvent = useEterna((s) => s.setEvent);

  const [editing, setEditing] = useState(!event);
  const [name, setName] = useState(event?.name ?? '');
  const [weeks, setWeeks] = useState(4);
  const save = () => {
    setEvent({ name: name.trim() || 'My event', dateISO: addDays(todayISO(), weeks * 7) });
    setEditing(false);
  };

  const plan = useMemo(
    () => (event ? eventPlan(event.dateISO, treatments) : []),
    [event, treatments],
  );
  const days = event ? diffDays(todayISO(), event.dateISO) : 0;
  const clinicName = (id: string) => clinics.find((c) => c.id === id)?.name ?? '';

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.m, paddingTop: spacing.s }}>
        <IconButton name="chevron-back" onPress={() => navigation.goBack()} accessibilityLabel="Back" />
        <View style={{ flex: 1 }}>
          <Text style={[type.title, { color: t.text }]}>{event ? event.name : 'Event prep'}</Text>
          {event ? (
            <Text style={{ fontSize: 13, color: t.sub, marginTop: 2 }}>
              {days < 14 ? tx('event.inDays', { n: days }) : tx('event.inWeeks', { n: Math.round(days / 7) })} ·{' '}
              {tx('event.ritualsToTime', { n: plan.length })}
            </Text>
          ) : null}
        </View>
        {event && !editing ? (
          <IconButton name="create-outline" onPress={() => setEditing(true)} accessibilityLabel={tx('event.change')} />
        ) : null}
      </View>

      <ScrollView
        style={{ marginTop: spacing.l }}
        contentContainerStyle={{ gap: spacing.s, paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {editing ? (
          <View style={{ gap: spacing.m, marginBottom: spacing.m }}>
            <View style={{ gap: spacing.s }}>
              <Text style={[type.label, { color: t.muted }]}>{tx('event.name')}</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={tx('event.namePlaceholder')}
                placeholderTextColor={t.muted}
                style={{
                  backgroundColor: t.surface,
                  borderRadius: radii.m,
                  borderWidth: 1,
                  borderColor: t.border,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 15,
                  color: t.text,
                }}
              />
            </View>
            <View style={{ gap: spacing.s }}>
              <Text style={[type.label, { color: t.muted }]}>{tx('event.when')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s }}>
                {[2, 4, 8, 12, 26].map((w) => (
                  <Chip
                    key={w}
                    label={tx('event.inWeeks', { n: w })}
                    selected={weeks === w}
                    onPress={() => setWeeks(w)}
                  />
                ))}
              </View>
            </View>
            <PrimaryButton title={tx('event.set')} onPress={save} />
          </View>
        ) : null}

        {event && !editing ? (
          <Text style={{ fontSize: 13, color: t.sub, lineHeight: 19, marginBottom: spacing.s }}>
            {tx('event.intro', { date: formatMedium(event.dateISO) })}
          </Text>
        ) : null}

        {plan.map(({ treatment: tr, doByISO }) => {
          const booked = treatmentStatus(tr, appointments) === 'booked';
          const late = diffDays(todayISO(), doByISO) < 0;
          const [mon, day] = formatMedium(doByISO).split(' ');
          return (
            <View
              key={tr.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.m,
                backgroundColor: t.bg,
                borderRadius: radii.card,
                borderWidth: 1,
                borderColor: t.border,
                padding: spacing.m,
                ...cardShadow,
              }}
            >
              <View style={{ alignItems: 'center', width: 44 }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: booked ? t.positive : late ? '#C83A2C' : t.accent,
                  }}
                >
                  {mon.toUpperCase()}
                </Text>
                <Text style={{ fontSize: 18, fontWeight: '800', color: t.text }}>{day}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '600', color: t.text }}>
                  {tr.name}
                </Text>
                <Text numberOfLines={1} style={{ fontSize: 12.5, color: t.sub, marginTop: 1 }}>
                  {tx('event.doBy', { date: formatMedium(doByISO) })} · {clinicName(tr.clinicId)}
                  {tr.atHome ? ` · ${tx('common.atHome')}` : ''}
                </Text>
              </View>
              {booked ? (
                <Ionicons name="checkmark-circle" size={22} color={t.positive} />
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Book ${tr.name}`}
                  onPress={() => navigation.navigate('Book', { treatmentId: tr.id })}
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
            </View>
          );
        })}
      </ScrollView>
    </Screen>
  );
}
