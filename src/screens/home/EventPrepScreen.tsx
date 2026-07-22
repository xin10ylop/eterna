import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { IconButton, PrimaryButton, ProgressBar, Screen } from '../../components/ui';
import { CalendarPicker } from '../../components/ui/CalendarPicker';
import { eventItems, eventProgress, unplannedUpcoming, type EventItem } from '../../services/logic';
import { addDays, diffDays, formatMedium, todayISO } from '../../lib/dates';
import { cardShadow, radii, spacing, type } from '../../theme';
import { useEterna, useTheme } from '../../store';
import { countdownLabel, useT } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'EventPrep'>;

const RED = '#C83A2C';

/**
 * Events built around HER choices. Setting an event asks what she wants ready
 * for it; each event then shows those picks and where each stands (booked / still
 * to book / already fresh). If a pick is also chosen for another event it's
 * flagged — never silently merged — so she coordinates herself. A final section
 * shows her other (non-event) bookings so she manages everything together.
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
  const toggleEventTreatment = useEterna((s) => s.toggleEventTreatment);
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
  const other = useMemo(
    () => unplannedUpcoming(events, treatments, appointments),
    [events, treatments, appointments],
  );

  const [adding, setAdding] = useState(events.length === 0 || !!route.params?.add);
  const [name, setName] = useState('');
  const [dateISO, setDateISO] = useState(addDays(todayISO(), 28));
  const [picks, setPicks] = useState<string[]>([]);
  const [editing, setEditing] = useState<string | null>(null); // event id whose picker is open

  const save = () => {
    addEvent(name.trim() || 'My event', dateISO, picks);
    setName('');
    setDateISO(addDays(todayISO(), 28));
    setPicks([]);
    setAdding(false);
  };

  const clinicName = (id: string) => clinics.find((c) => c.id === id)?.name ?? '';

  /** Selectable list of her rituals — used to choose picks (new or existing). */
  const RitualChecklist = ({
    selected,
    onToggle,
  }: {
    selected: string[];
    onToggle: (id: string) => void;
  }) => (
    <View style={{ gap: 6 }}>
      {treatments.map((tr) => {
        const on = selected.includes(tr.id);
        return (
          <Pressable
            key={tr.id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            onPress={() => onToggle(tr.id)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.m,
              paddingVertical: 10,
              paddingHorizontal: spacing.m,
              borderRadius: radii.m,
              backgroundColor: on ? t.accentSoft : t.surfaceAlt,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                borderWidth: 1.5,
                borderColor: on ? t.accent : t.muted,
                backgroundColor: on ? t.accent : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {on ? <Ionicons name="checkmark" size={14} color={t.onAccent} /> : null}
            </View>
            <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: t.text }}>{tr.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );

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
        {/* add-event editor — name, date, and what she wants ready */}
        {adding ? (
          <View
            style={{
              gap: spacing.l,
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
              <CalendarPicker value={dateISO} onSelect={setDateISO} minISO={addDays(todayISO(), 1)} />
            </View>
            <View style={{ gap: spacing.s }}>
              <Text style={[type.label, { color: t.muted }]}>{tx('event.want')}</Text>
              <RitualChecklist
                selected={picks}
                onToggle={(id) => setPicks((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))}
              />
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

        {upcoming.length === 0 && !adding ? (
          <Text style={{ fontSize: 14, color: t.sub, lineHeight: 20, paddingVertical: spacing.m }}>
            {tx('event.empty')}
          </Text>
        ) : null}

        {/* one card per event, built from her picks */}
        {upcoming.map((ev) => {
          const d = diffDays(todayISO(), ev.dateISO);
          const items = eventItems(ev, treatments, appointments, events);
          const prog = eventProgress(items);
          const isEditing = editing === ev.id;
          return (
            <View
              key={ev.id}
              style={{
                backgroundColor: t.bg,
                borderRadius: radii.card,
                borderWidth: 1,
                borderColor: t.border,
                padding: spacing.m,
                gap: spacing.s,
                ...cardShadow,
              }}
            >
              {/* header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.m }}>
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    backgroundColor: t.accentSoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="sparkles" size={18} color={t.accent} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={{ fontSize: 16, fontWeight: '700', color: t.text }}>
                    {ev.name}
                  </Text>
                  <Text style={{ fontSize: 12.5, color: t.accent, marginTop: 1 }}>
                    {countdownLabel(tx, d)} · {formatMedium(ev.dateISO)}
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

              {items.length > 0 ? (
                <View style={{ gap: 4 }}>
                  <ProgressBar value={prog.total ? prog.done / prog.total : 0} />
                  <Text style={{ fontSize: 11.5, color: t.sub }}>
                    {tx('event.ready', { done: prog.done, total: prog.total })}
                  </Text>
                </View>
              ) : null}

              {/* her chosen rituals */}
              {items.map((it) => (
                <EventItemRow key={it.treatment.id} it={it} tx={tx} t={t} clinicName={clinicName} navigation={navigation} />
              ))}

              {/* edit picks */}
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: isEditing }}
                onPress={() => setEditing(isEditing ? null : ev.id)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingVertical: spacing.s,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Ionicons name={isEditing ? 'chevron-up' : 'add'} size={16} color={t.accent} />
                <Text style={{ fontSize: 13.5, fontWeight: '600', color: t.accent }}>
                  {tx('event.editPicks')}
                </Text>
              </Pressable>
              {isEditing ? (
                <RitualChecklist
                  selected={ev.treatmentIds}
                  onToggle={(id) => toggleEventTreatment(ev.id, id)}
                />
              ) : null}
            </View>
          );
        })}

        {/* her other bookings, not tied to an event — so she manages it all */}
        {other.length > 0 ? (
          <>
            <Text style={[type.label, { color: t.muted, marginTop: spacing.l, marginBottom: spacing.xs }]}>
              {tx('event.otherCalendar')}
            </Text>
            {other.map(({ appt, treatment }) => {
              const [mon, day] = formatMedium(appt.dateISO).split(' ');
              return (
                <View
                  key={appt.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.m,
                    backgroundColor: t.surfaceAlt,
                    borderRadius: radii.card,
                    borderWidth: 1,
                    borderColor: t.border,
                    padding: spacing.m,
                  }}
                >
                  <View style={{ alignItems: 'center', width: 44 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: t.sub }}>{mon.toUpperCase()}</Text>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: t.text }}>{day}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '600', color: t.text }}>
                      {treatment?.name ?? 'Appointment'}
                    </Text>
                    <Text numberOfLines={1} style={{ fontSize: 12.5, color: t.sub, marginTop: 1 }}>
                      {[appt.timeLabel, clinicName(appt.clinicId)].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                </View>
              );
            })}
          </>
        ) : null}

        {/* PAST — her choice whether to see them; nothing is auto-deleted */}
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

/** One chosen ritual and where it stands for this event. */
function EventItemRow({
  it,
  tx,
  t,
  clinicName,
  navigation,
}: {
  it: EventItem;
  tx: (k: string, v?: Record<string, string | number>) => string;
  t: ReturnType<typeof useTheme>;
  clinicName: (id: string) => string;
  navigation: Props['navigation'];
}) {
  const handled = it.status !== 'toBook';
  const statusLine =
    it.status === 'booked'
      ? tx('event.bookedOn', { date: formatMedium(it.apptDateISO ?? '') })
      : it.status === 'fresh'
        ? tx('event.setFresh')
        : tx('event.bookBy', { date: formatMedium(it.dueISO) });
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.m,
        paddingVertical: spacing.s,
        borderTopWidth: 1,
        borderTopColor: t.border,
      }}
    >
      <Ionicons
        name={handled ? 'checkmark-circle' : 'ellipse-outline'}
        size={22}
        color={handled ? t.positive : RED}
      />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '600', color: t.text }}>
          {it.treatment.name}
        </Text>
        <Text numberOfLines={1} style={{ fontSize: 12.5, color: it.status === 'toBook' ? RED : t.sub, marginTop: 1 }}>
          {statusLine}
          {it.treatment.atHome ? ` · ${tx('common.atHome')}` : ''}
        </Text>
        {it.alsoFor.length > 0 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3, flexWrap: 'wrap' }}>
            <Ionicons name="link" size={12} color={t.accent} />
            <Text style={{ fontSize: 11, color: t.accent }}>
              {tx('event.alsoFor', { names: it.alsoFor.map((e) => e.name).join(', ') })}
            </Text>
          </View>
        ) : null}
      </View>
      {it.status === 'toBook' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Book ${it.treatment.name}`}
          onPress={() => navigation.navigate('Book', { treatmentId: it.treatment.id })}
          style={({ pressed }) => ({
            paddingVertical: 7,
            paddingHorizontal: 15,
            borderRadius: radii.pill,
            backgroundColor: t.accent,
            transform: [{ scale: pressed ? 0.94 : 1 }],
          })}
        >
          <Text style={{ color: t.onAccent, fontSize: 13, fontWeight: '700' }}>{tx('common.book')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
