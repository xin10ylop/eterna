import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Chip, IconButton, PrimaryButton, ProgressBar, Screen } from '../../components/ui';
import { eventReadiness, type PrepRitual } from '../../services/logic';
import { addDays, diffDays, formatMedium, todayISO } from '../../lib/dates';
import { cardShadow, radii, spacing, type } from '../../theme';
import { useEterna, useTheme } from '../../store';
import { useT } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'EventPrep'>;

const RED = '#C83A2C';

/**
 * Events, and one connected picture of prep across all of them:
 *   • each event shows how ready it is (booked / total)
 *   • "To schedule" — what still needs booking, with the ideal date; a single
 *     visit that keeps a ritual fresh for several events is shown as one row
 *     tagged with each event (never a silent merge)
 *   • "Booked" — appointments already covering an event, including ones made
 *     before the event was even added (coverage is derived from real dates)
 *   • "Add-ons" — add anything extra for an event; it flows into the plan
 * Nothing is assumed; everything the app infers is shown and reversible.
 */
export function EventPrepScreen({ navigation, route }: Props) {
  const t = useTheme();
  const tx = useT();
  const events = useEterna((s) => s.events);
  const treatments = useEterna((s) => s.treatments);
  const appointments = useEterna((s) => s.appointments);
  const clinics = useEterna((s) => s.clinics);
  const addEvent = useEterna((s) => s.addEvent);
  const removeEvent = useEterna((s) => s.removeEvent);
  const showPast = useEterna((s) => s.showPastEvents);
  const setShowPast = useEterna((s) => s.setShowPastEvents);

  const upcoming = useMemo(
    () =>
      events
        .filter((e) => diffDays(todayISO(), e.dateISO) >= 0)
        .sort((a, b) => a.dateISO.localeCompare(b.dateISO)),
    [events],
  );
  const past = useMemo(
    () =>
      events
        .filter((e) => diffDays(todayISO(), e.dateISO) < 0)
        .sort((a, b) => b.dateISO.localeCompare(a.dateISO)),
    [events],
  );
  const readiness = useMemo(
    () => eventReadiness(events, treatments, appointments),
    [events, treatments, appointments],
  );

  const [adding, setAdding] = useState(events.length === 0 || !!route.params?.add);
  const [name, setName] = useState('');
  const [weeks, setWeeks] = useState(4);
  const save = () => {
    addEvent(name.trim() || 'My event', addDays(todayISO(), weeks * 7));
    setName('');
    setWeeks(4);
    setAdding(false);
  };

  const clinicName = (id: string) => clinics.find((c) => c.id === id)?.name ?? '';
  const multi = upcoming.length > 1;

  /** Which events a visit covers — chips, with a link + note when shared. */
  const EventTags = ({ item }: { item: PrepRitual }) =>
    multi ? (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 4, alignItems: 'center' }}>
        {item.shared ? <Ionicons name="link" size={12} color={t.accent} /> : null}
        {item.events.map((e) => (
          <View
            key={e.id}
            style={{
              backgroundColor: t.accentSoft,
              borderRadius: radii.pill,
              paddingHorizontal: 8,
              paddingVertical: 2,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '600', color: t.accent }}>{e.name}</Text>
          </View>
        ))}
        {item.shared ? <Text style={{ fontSize: 11, color: t.muted }}>· {tx('event.shared')}</Text> : null}
      </View>
    ) : null;

  const rowBase = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.m,
    backgroundColor: t.bg,
    borderRadius: radii.card,
    borderWidth: 1,
    padding: spacing.m,
    ...cardShadow,
  };
  const sectionLabel = { marginTop: spacing.l, marginBottom: spacing.xs };

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.m, paddingTop: spacing.s }}>
        <IconButton name="chevron-back" onPress={() => navigation.goBack()} accessibilityLabel="Back" />
        <View style={{ flex: 1 }}>
          <Text style={[type.title, { color: t.text }]}>{tx('event.title')}</Text>
          <Text style={{ fontSize: 13, color: t.sub, marginTop: 1 }}>
            {tx('event.upcoming', { n: upcoming.length })}
          </Text>
        </View>
        {!adding ? (
          <IconButton name="add" onPress={() => setAdding(true)} accessibilityLabel={tx('event.add')} />
        ) : null}
      </View>

      <ScrollView
        style={{ marginTop: spacing.l }}
        contentContainerStyle={{ gap: spacing.s, paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* add-event editor */}
        {adding ? (
          <View
            style={{
              gap: spacing.m,
              backgroundColor: t.surfaceAlt,
              borderRadius: radii.card,
              borderWidth: 1,
              borderColor: t.border,
              padding: spacing.l,
              marginBottom: spacing.s,
            }}
          >
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
            <View style={{ flexDirection: 'row', gap: spacing.s }}>
              {events.length > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setAdding(false)}
                  style={({ pressed }) => ({
                    paddingHorizontal: 18,
                    paddingVertical: 13,
                    borderRadius: radii.l,
                    borderWidth: 1,
                    borderColor: t.border,
                    justifyContent: 'center',
                    opacity: pressed ? 0.6 : 1,
                  })}
                >
                  <Text style={{ color: t.sub, fontWeight: '700' }}>{tx('common.cancel')}</Text>
                </Pressable>
              ) : null}
              <View style={{ flex: 1 }}>
                <PrimaryButton title={tx('event.set')} onPress={save} />
              </View>
            </View>
          </View>
        ) : null}

        {/* event cards with readiness */}
        {upcoming.map((ev) => {
          const d = diffDays(todayISO(), ev.dateISO);
          const r = readiness.perEvent.find((p) => p.id === ev.id);
          const total = r?.total ?? 0;
          const booked = r?.booked ?? 0;
          return (
            <View
              key={ev.id}
              style={{ backgroundColor: t.accentSoft, borderRadius: radii.card, padding: spacing.m, gap: spacing.s }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.m }}>
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    backgroundColor: t.bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="calendar" size={19} color={t.accent} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '700', color: t.text }}>
                    {ev.name}
                  </Text>
                  <Text style={{ fontSize: 12.5, color: t.accent, marginTop: 1 }}>
                    {d < 14 ? tx('event.inDays', { n: d }) : tx('event.inWeeks', { n: Math.round(d / 7) })} ·{' '}
                    {formatMedium(ev.dateISO)}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={tx('common.remove')}
                  onPress={() => removeEvent(ev.id)}
                  hitSlop={8}
                  style={({ pressed }) => ({ padding: 6, opacity: pressed ? 0.5 : 1 })}
                >
                  <Ionicons name="close" size={18} color={t.muted} />
                </Pressable>
              </View>
              {total > 0 ? (
                <View style={{ gap: 5 }}>
                  <ProgressBar value={booked / total} />
                  <Text style={{ fontSize: 11.5, color: t.sub }}>
                    {tx('event.ready', { done: booked, total })}
                  </Text>
                </View>
              ) : null}
            </View>
          );
        })}

        {upcoming.length === 0 && !adding ? (
          <Text style={{ fontSize: 14, color: t.sub, lineHeight: 20, paddingVertical: spacing.m }}>
            {tx('event.empty')}
          </Text>
        ) : null}

        {/* TO SCHEDULE */}
        {readiness.toBook.length > 0 ? (
          <Text style={[type.label, { color: t.muted }, sectionLabel]}>{tx('event.toBook')}</Text>
        ) : null}
        {readiness.toBook.map((item, idx) => {
          const [mon, day] = formatMedium(item.doByISO).split(' ');
          return (
            <View
              key={`tb-${item.treatment.id}-${idx}`}
              style={{ ...rowBase, borderColor: item.shared ? t.accent : t.border }}
            >
              <View style={{ alignItems: 'center', width: 44 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: item.urgent ? RED : t.accent }}>
                  {mon.toUpperCase()}
                </Text>
                <Text style={{ fontSize: 18, fontWeight: '800', color: t.text }}>{day}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '600', color: t.text }}>
                  {item.treatment.name}
                </Text>
                <Text numberOfLines={1} style={{ fontSize: 12.5, color: item.urgent ? RED : t.sub, marginTop: 1 }}>
                  {item.urgent ? tx('event.asap') : tx('event.doBy', { date: formatMedium(item.doByISO) })}
                  {clinicName(item.treatment.clinicId) ? ` · ${clinicName(item.treatment.clinicId)}` : ''}
                  {item.treatment.atHome ? ` · ${tx('common.atHome')}` : ''}
                </Text>
                <EventTags item={item} />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Book ${item.treatment.name}`}
                onPress={() => navigation.navigate('Book', { treatmentId: item.treatment.id })}
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
            </View>
          );
        })}

        {upcoming.length > 0 && readiness.toBook.length === 0 ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.s,
              backgroundColor: t.surfaceAlt,
              borderRadius: radii.card,
              padding: spacing.m,
              marginTop: spacing.s,
            }}
          >
            <Ionicons name="checkmark-circle" size={20} color={t.positive} />
            <Text style={{ flex: 1, fontSize: 14, color: t.sub }}>{tx('event.allSet')}</Text>
          </View>
        ) : null}

        {/* BOOKED */}
        {readiness.booked.length > 0 ? (
          <Text style={[type.label, { color: t.muted }, sectionLabel]}>{tx('event.booked')}</Text>
        ) : null}
        {readiness.booked.map((item, idx) => (
          <View key={`bk-${item.treatment.id}-${idx}`} style={{ ...rowBase, borderColor: t.border }}>
            <Ionicons name="checkmark-circle" size={24} color={t.positive} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '600', color: t.text }}>
                {item.treatment.name}
              </Text>
              <Text numberOfLines={1} style={{ fontSize: 12.5, color: t.sub, marginTop: 1 }}>
                {item.bookedDateISO ? formatMedium(item.bookedDateISO) : ''}
                {clinicName(item.treatment.clinicId) ? ` · ${clinicName(item.treatment.clinicId)}` : ''}
              </Text>
              <EventTags item={item} />
            </View>
          </View>
        ))}

        {/* ADD-ONS — anything extra for an event flows into the plan */}
        {upcoming.length > 0 ? (
          <>
            <Text style={[type.label, { color: t.muted }, sectionLabel]}>{tx('event.addons')}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('AddRitual')}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.s,
                borderRadius: radii.card,
                borderWidth: 1,
                borderColor: t.border,
                borderStyle: 'dashed',
                padding: spacing.m,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: t.accentSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="add" size={18} color={t.accent} />
              </View>
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: t.text }}>
                {tx('event.addonCta')}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={t.muted} />
            </Pressable>
          </>
        ) : null}

        {/* PAST — the user chooses whether to see them; nothing is auto-deleted. */}
        {past.length > 0 ? (
          <View style={{ marginTop: spacing.l }}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: showPast }}
              onPress={() => setShowPast(!showPast)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: spacing.s,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Text style={[type.label, { color: t.muted, flex: 1 }]}>
                {tx('event.past')} · {past.length}
              </Text>
              <Ionicons name={showPast ? 'chevron-up' : 'chevron-down'} size={16} color={t.muted} />
            </Pressable>
            {showPast
              ? past.map((ev) => (
                  <View
                    key={ev.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.m,
                      backgroundColor: t.surfaceAlt,
                      borderRadius: radii.card,
                      borderWidth: 1,
                      borderColor: t.border,
                      padding: spacing.m,
                      marginTop: spacing.s,
                    }}
                  >
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text numberOfLines={1} style={{ fontSize: 14.5, fontWeight: '600', color: t.sub }}>
                        {ev.name}
                      </Text>
                      <Text style={{ fontSize: 12, color: t.muted, marginTop: 1 }}>
                        {tx('event.passed')} · {formatMedium(ev.dateISO)}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={tx('common.remove')}
                      onPress={() => removeEvent(ev.id)}
                      hitSlop={8}
                      style={({ pressed }) => ({ padding: 6, opacity: pressed ? 0.5 : 1 })}
                    >
                      <Ionicons name="close" size={18} color={t.muted} />
                    </Pressable>
                  </View>
                ))
              : null}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
