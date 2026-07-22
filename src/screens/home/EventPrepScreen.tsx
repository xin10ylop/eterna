import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { IconButton, PrimaryButton, Screen } from '../../components/ui';
import { CalendarPicker } from '../../components/ui/CalendarPicker';
import { eventItems, eventProgress } from '../../services/logic';
import { addDays, diffDays, formatMedium, todayISO } from '../../lib/dates';
import { radii, spacing, type } from '../../theme';
import { useEterna, useTheme } from '../../store';
import { countdownLabel, useT } from '../../i18n';
import type { Appointment, SalonEvent } from '../../types';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'EventPrep'>;

const RED = '#C83A2C';

type TimelineEntry =
  | { kind: 'appt'; dateISO: string; appt: Appointment }
  | { kind: 'event'; dateISO: string; event: SalonEvent };

/**
 * One simple map of the road ahead: a vertical timeline from today, with every
 * booked visit (green) and every event (milestone) in date order — so she sees
 * all her bookings and events together at a glance. Each event carries her own
 * picks and what's still to book; adding an event is just a name and a date.
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

  const today = todayISO();
  const upcoming = useMemo(
    () =>
      events
        .filter((e) => diffDays(today, e.dateISO) >= 0)
        .sort((a, b) => a.dateISO.localeCompare(b.dateISO)),
    [events, today],
  );
  const past = useMemo(
    () =>
      events
        .filter((e) => diffDays(today, e.dateISO) < 0)
        .sort((a, b) => b.dateISO.localeCompare(a.dateISO)),
    [events, today],
  );

  // Everything ahead, in one order: every upcoming booking + every event.
  const timeline = useMemo<TimelineEntry[]>(() => {
    const appts: TimelineEntry[] = appointments
      .filter((a) => a.dateISO >= today)
      .map((a) => ({ kind: 'appt', dateISO: a.dateISO, appt: a }));
    const evs: TimelineEntry[] = upcoming.map((e) => ({ kind: 'event', dateISO: e.dateISO, event: e }));
    return [...appts, ...evs].sort((x, y) =>
      x.dateISO === y.dateISO ? (x.kind === 'appt' ? -1 : 1) : x.dateISO < y.dateISO ? -1 : 1,
    );
  }, [appointments, upcoming, today]);

  const [adding, setAdding] = useState(events.length === 0 || !!route.params?.add);
  const [name, setName] = useState('');
  const [dateISO, setDateISO] = useState(addDays(today, 28));
  const [openPicker, setOpenPicker] = useState<string | null>(null);

  const save = () => {
    addEvent(name.trim() || 'My event', dateISO, []);
    setName('');
    setDateISO(addDays(today, 28));
    setAdding(false);
  };

  const clinicName = (id: string) => clinics.find((c) => c.id === id)?.name ?? '';

  /** One row of the timeline: the rail on the left, content on the right. */
  const Row = ({
    node,
    last,
    children,
  }: {
    node: React.ReactNode;
    last?: boolean;
    children: React.ReactNode;
  }) => (
    <View style={{ flexDirection: 'row' }}>
      <View style={{ width: 36, alignItems: 'center' }}>
        <View
          style={{
            position: 'absolute',
            top: 0,
            bottom: last ? undefined : 0,
            height: last ? 14 : undefined,
            width: 2,
            backgroundColor: t.border,
          }}
        />
        <View style={{ marginTop: 1 }}>{node}</View>
      </View>
      <View style={{ flex: 1, minWidth: 0, paddingBottom: spacing.l }}>{children}</View>
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
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* add an event — just a name and a date */}
        {adding ? (
          <View
            style={{
              gap: spacing.l,
              backgroundColor: t.surfaceAlt,
              borderRadius: radii.card,
              borderWidth: 1,
              borderColor: t.border,
              padding: spacing.l,
              marginBottom: spacing.l,
            }}
          >
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
            <CalendarPicker value={dateISO} onSelect={setDateISO} minISO={addDays(today, 1)} />
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

        {/* the map: today → bookings → events, in order */}
        {upcoming.length > 0 ? (
          <View>
            {/* today marker */}
            <Row
              node={
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: t.muted,
                    marginTop: 4,
                  }}
                />
              }
            >
              <Text style={[type.label, { color: t.muted, marginTop: 1 }]}>{tx('common.today')}</Text>
            </Row>

            {timeline.map((entry, i) => {
              const last = i === timeline.length - 1;
              if (entry.kind === 'appt') {
                const tr = treatments.find((x) => x.id === entry.appt.treatmentId);
                return (
                  <Row
                    key={`a-${entry.appt.id}`}
                    last={last}
                    node={<Ionicons name="checkmark-circle" size={22} color={t.positive} />}
                  >
                    <Text numberOfLines={1} style={{ fontSize: 14.5, fontWeight: '600', color: t.text }}>
                      {tr?.name ?? 'Appointment'}
                    </Text>
                    <Text numberOfLines={1} style={{ fontSize: 12, color: t.sub, marginTop: 1 }}>
                      {formatMedium(entry.dateISO)} · {entry.appt.timeLabel} · {clinicName(entry.appt.clinicId)}
                    </Text>
                  </Row>
                );
              }

              const ev = entry.event;
              const items = eventItems(ev, treatments, appointments, events);
              const prog = eventProgress(items);
              const isOpen = openPicker === ev.id;
              return (
                <Row
                  key={`e-${ev.id}`}
                  last={last}
                  node={
                    <View
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 13,
                        backgroundColor: t.accent,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="sparkles" size={13} color={t.onAccent} />
                    </View>
                  }
                >
                  <View
                    style={{
                      backgroundColor: t.accentSoft,
                      borderRadius: radii.card,
                      padding: spacing.m,
                      gap: spacing.s,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s }}>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text numberOfLines={1} style={{ fontSize: 16, fontWeight: '700', color: t.text }}>
                          {ev.name}
                        </Text>
                        <Text style={{ fontSize: 12.5, color: t.accent, marginTop: 1 }}>
                          {countdownLabel(tx, diffDays(today, ev.dateISO))} · {formatMedium(ev.dateISO)}
                          {items.length > 0 ? ` · ${tx('event.ready', { done: prog.done, total: prog.total })}` : ''}
                        </Text>
                      </View>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={tx('common.remove')}
                        onPress={() => removeEvent(ev.id)}
                        hitSlop={8}
                        style={({ pressed }) => ({ padding: 4, opacity: pressed ? 0.5 : 1 })}
                      >
                        <Ionicons name="close" size={17} color={t.muted} />
                      </Pressable>
                    </View>

                    {/* her picks for this event */}
                    {items.map((it) => {
                      const urgent = it.dueISO < today;
                      const handled = it.status !== 'toBook';
                      const also =
                        it.alsoFor.length > 0
                          ? ` · ${tx('event.also', { names: it.alsoFor.map((e) => e.name).join(', ') })}`
                          : '';
                      return (
                        <View
                          key={it.treatment.id}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s }}
                        >
                          <Ionicons
                            name={handled ? 'checkmark-circle' : 'ellipse-outline'}
                            size={18}
                            color={handled ? t.positive : RED}
                          />
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '600', color: t.text }}>
                              {it.treatment.name}
                            </Text>
                            <Text
                              numberOfLines={1}
                              style={{ fontSize: 11.5, color: handled ? t.sub : RED, marginTop: 1 }}
                            >
                              {it.status === 'booked'
                                ? tx('event.bookedOn', { date: formatMedium(it.apptDateISO ?? '') })
                                : it.status === 'fresh'
                                  ? tx('event.setFresh')
                                  : urgent
                                    ? tx('event.asap')
                                    : tx('event.bookBy', { date: formatMedium(it.dueISO) })}
                              {also}
                            </Text>
                          </View>
                          {!handled ? (
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel={`Book ${it.treatment.name}`}
                              onPress={() => navigation.navigate('Book', { treatmentId: it.treatment.id })}
                              style={({ pressed }) => ({
                                paddingVertical: 6,
                                paddingHorizontal: 13,
                                borderRadius: radii.pill,
                                backgroundColor: t.accent,
                                transform: [{ scale: pressed ? 0.94 : 1 }],
                              })}
                            >
                              <Text style={{ color: t.onAccent, fontSize: 12.5, fontWeight: '700' }}>
                                {tx('common.book')}
                              </Text>
                            </Pressable>
                          ) : null}
                        </View>
                      );
                    })}

                    {/* choose / edit what she wants ready */}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ expanded: isOpen }}
                      onPress={() => setOpenPicker(isOpen ? null : ev.id)}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                        opacity: pressed ? 0.6 : 1,
                      })}
                    >
                      <Ionicons name={isOpen ? 'chevron-up' : 'add'} size={15} color={t.accent} />
                      <Text style={{ fontSize: 13, fontWeight: '700', color: t.accent }}>
                        {items.length > 0 ? tx('event.editPicks') : tx('event.choose')}
                      </Text>
                    </Pressable>
                    {isOpen ? (
                      <View style={{ gap: 5 }}>
                        {treatments.map((tr) => {
                          const on = ev.treatmentIds.includes(tr.id);
                          return (
                            <Pressable
                              key={tr.id}
                              accessibilityRole="checkbox"
                              accessibilityState={{ checked: on }}
                              onPress={() => toggleEventTreatment(ev.id, tr.id)}
                              style={({ pressed }) => ({
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: spacing.s,
                                paddingVertical: 8,
                                paddingHorizontal: spacing.s,
                                borderRadius: radii.m,
                                backgroundColor: on ? t.bg : 'transparent',
                                opacity: pressed ? 0.7 : 1,
                              })}
                            >
                              <View
                                style={{
                                  width: 20,
                                  height: 20,
                                  borderRadius: 10,
                                  borderWidth: 1.5,
                                  borderColor: on ? t.accent : t.muted,
                                  backgroundColor: on ? t.accent : 'transparent',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {on ? <Ionicons name="checkmark" size={13} color={t.onAccent} /> : null}
                              </View>
                              <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: t.text }}>
                                {tr.name}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    ) : null}
                  </View>
                </Row>
              );
            })}
          </View>
        ) : null}

        {/* past events — her choice to see them */}
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
