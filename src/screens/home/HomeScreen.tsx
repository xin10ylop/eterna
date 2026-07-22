import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/ui';
import { Entrance } from '../../components/anim/Entrance';
import { AvatarFigure } from '../../components/avatar/AvatarFigure';
import { ZoneMarkers } from '../../components/avatar/ZoneMarkers';
import { ZONES } from '../../data/seed';
import { needsAttention, treatmentStatus, zoneGlow, type GlowStatus } from '../../services/logic';
import { diffDays, formatMedium, todayISO } from '../../lib/dates';
import { radii, spacing, type } from '../../theme';
import { useEterna, useTheme } from '../../store';
import { countdownLabel, useT } from '../../i18n';
import type { ZoneId } from '../../types';
import type { RootStackParamList, TabParamList } from '../../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

/**
 * Home is the avatar. The glowing body parts ARE the interface — tap one to see
 * and book what's due there. A warm greeting, a small event chip, the figure
 * sized to the space it's given (so nothing overlaps), and a quiet link to the
 * full plan.
 */
export function HomeScreen({ navigation }: Props) {
  const t = useTheme();
  const tx = useT();
  const profile = useEterna((s) => s.profile);
  const treatments = useEterna((s) => s.treatments);
  const appointments = useEterna((s) => s.appointments);
  const events = useEterna((s) => s.events);
  // measure the space the figure gets, so it fills it and never spills into the
  // header, chip, or the link below
  const [stageH, setStageH] = useState(0);

  const upcomingEvents = useMemo(
    () =>
      events
        .filter((e) => diffDays(todayISO(), e.dateISO) >= 0)
        .sort((a, b) => a.dateISO.localeCompare(b.dateISO)),
    [events],
  );

  const toBook = useMemo(
    () => treatments.filter((tr) => needsAttention(treatmentStatus(tr, appointments))).length,
    [treatments, appointments],
  );
  const zoneGlows = useMemo(() => {
    const m: Partial<Record<ZoneId, GlowStatus>> = {};
    for (const z of ZONES) m[z.id] = zoneGlow(z.id, treatments, appointments);
    return m;
  }, [treatments, appointments]);

  // the next few visits already on the books, soonest first
  const nextBookings = useMemo(
    () =>
      appointments
        .filter((a) => a.dateISO >= todayISO())
        .sort((a, b) => a.dateISO.localeCompare(b.dateISO))
        .slice(0, 3)
        .map((appt) => ({
          appt,
          name: treatments.find((tr) => tr.id === appt.treatmentId)?.name ?? 'Appointment',
        })),
    [appointments, treatments],
  );

  const hour = new Date().getHours();
  const dayPart = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const greeting = tx('greeting.' + dayPart);
  const name = profile?.firstName?.trim();
  const line =
    toBook === 0
      ? tx('home.toBook.zero')
      : toBook === 1
        ? tx('home.toBook.one')
        : tx('home.toBook.many', { n: toBook });
  const initials = ((profile?.firstName?.[0] ?? 'Y') + (profile?.lastName?.[0] ?? '')).toUpperCase();

  return (
    <Screen padded={false}>
      <View style={{ flex: 1 }}>
        {/* header */}
        <View
          style={{
            paddingHorizontal: spacing.xl,
            paddingTop: spacing.s,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.m,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{ fontSize: 26, fontWeight: '700', color: t.text, letterSpacing: -0.4 }}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {name ? `${greeting}, ${name}` : greeting}
            </Text>
            <Text style={{ fontSize: 13.5, color: t.sub, marginTop: 4 }}>{line}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tx('profile.title')}
            onPress={() => navigation.navigate('Profile')}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: t.accentSoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: t.accent }}>{initials}</Text>
          </Pressable>
        </View>

        {/* events — every upcoming one as a small date card, add always visible */}
        {upcomingEvents.length === 0 ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('EventPrep', { add: true })}
            style={({ pressed }) => ({
              marginTop: spacing.m,
              alignSelf: 'center',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 7,
              paddingVertical: 9,
              paddingHorizontal: 14,
              borderRadius: radii.pill,
              backgroundColor: t.surfaceAlt,
              borderWidth: 1,
              borderColor: t.border,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name="add-circle-outline" size={15} color={t.accent} />
            <Text style={{ fontSize: 13.5, fontWeight: '600', color: t.sub }}>{tx('event.add')}</Text>
          </Pressable>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0, marginTop: spacing.m }}
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              paddingHorizontal: spacing.xl,
              gap: spacing.s,
              alignItems: 'center',
            }}
          >
            {upcomingEvents.map((ev) => {
              const [mon, day] = formatMedium(ev.dateISO).split(' ');
              return (
                <Pressable
                  key={ev.id}
                  accessibilityRole="button"
                  accessibilityLabel={ev.name}
                  onPress={() => navigation.navigate('EventPrep')}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.s,
                    paddingVertical: 7,
                    paddingLeft: 7,
                    paddingRight: 13,
                    borderRadius: radii.l,
                    backgroundColor: t.bg,
                    borderWidth: 1,
                    borderColor: t.border,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <View
                    style={{
                      width: 38,
                      borderRadius: radii.m,
                      backgroundColor: t.accentSoft,
                      alignItems: 'center',
                      paddingVertical: 4,
                    }}
                  >
                    <Text style={{ fontSize: 9, fontWeight: '800', color: t.accent }}>
                      {mon?.toUpperCase()}
                    </Text>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: t.text, marginTop: -1 }}>
                      {day}
                    </Text>
                  </View>
                  <View style={{ minWidth: 0 }}>
                    <Text numberOfLines={1} style={{ fontSize: 13.5, fontWeight: '700', color: t.text, maxWidth: 130 }}>
                      {ev.name}
                    </Text>
                    <Text style={{ fontSize: 11.5, color: t.accent, marginTop: 1 }}>
                      {countdownLabel(tx, diffDays(todayISO(), ev.dateISO))}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={tx('event.add')}
              onPress={() => navigation.navigate('EventPrep', { add: true })}
              style={({ pressed }) => ({
                width: 34,
                height: 34,
                borderRadius: 17,
                borderWidth: 1,
                borderColor: t.border,
                backgroundColor: t.surfaceAlt,
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{ scale: pressed ? 0.9 : 1 }],
              })}
            >
              <Ionicons name="add" size={18} color={t.accent} />
            </Pressable>
          </ScrollView>
        )}

        {/* figure — sized to the measured stage so it can't overlap anything */}
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          onLayout={(e) => setStageH(e.nativeEvent.layout.height)}
        >
          {stageH > 0 ? (
            <Entrance spring distance={22}>
              <AvatarFigure
                height={Math.min(620, stageH - 4)}
                skinTone={profile?.avatar?.skinTone ?? 0}
                hairColor={profile?.avatar?.hairColor ?? 0}
              >
                <ZoneMarkers
                  zoneGlows={zoneGlows}
                  onOpenZone={(zone) => navigation.navigate('ZoneDetail', { zone })}
                />
              </AvatarFigure>
            </Entrance>
          ) : null}
        </View>

        {/* tap hint — its own row, never under the figure */}
        <Text style={{ fontSize: 12, color: t.muted, textAlign: 'center', paddingTop: spacing.xs }}>
          {tx('home.tapHint')}
        </Text>

        {/* approaching bookings — tap one to see it on the calendar */}
        {nextBookings.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0, marginTop: spacing.s }}
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              paddingHorizontal: spacing.xl,
              gap: spacing.s,
              alignItems: 'center',
            }}
          >
            {nextBookings.map(({ appt, name }) => (
              <Pressable
                key={appt.id}
                accessibilityRole="button"
                accessibilityLabel={`${name}, ${formatMedium(appt.dateISO)}`}
                onPress={() => navigation.navigate('Planning', { dateISO: appt.dateISO })}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingVertical: 7,
                  paddingHorizontal: 12,
                  borderRadius: radii.pill,
                  backgroundColor: t.surfaceAlt,
                  borderWidth: 1,
                  borderColor: t.border,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.positive }} />
                <Text numberOfLines={1} style={{ fontSize: 12.5, color: t.sub, maxWidth: 170 }}>
                  <Text style={{ fontWeight: '700', color: t.text }}>{formatMedium(appt.dateISO)}</Text>
                  {`  ${name}`}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        {/* quiet link to the full plan */}
        {toBook > 0 ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('Planning')}
            style={{ alignItems: 'center', paddingBottom: spacing.l, paddingTop: spacing.xs }}
          >
            <Text style={{ fontSize: 13.5, fontWeight: '700', color: t.accent }}>
              {tx('home.seeAll', { n: toBook })}
            </Text>
          </Pressable>
        ) : (
          <View style={{ paddingBottom: spacing.l }} />
        )}
      </View>
    </Screen>
  );
}
