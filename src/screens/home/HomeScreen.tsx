import React, { useMemo } from 'react';
import { Dimensions, Pressable, ScrollView, Text, View } from 'react-native';
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
import { diffDays, todayISO } from '../../lib/dates';
import { radii, spacing, type } from '../../theme';
import { useEterna, useTheme } from '../../store';
import { useT } from '../../i18n';
import type { ZoneId } from '../../types';
import type { RootStackParamList, TabParamList } from '../../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

/**
 * Home is the avatar. The glowing body parts ARE the interface — tap one to see
 * and book what's due there. No list, no booking box: those would undercut the
 * whole point of the glow. Just a greeting, an events rail, the figure, and a
 * quiet link to the full plan.
 */
export function HomeScreen({ navigation }: Props) {
  const t = useTheme();
  const tx = useT();
  const profile = useEterna((s) => s.profile);
  const treatments = useEterna((s) => s.treatments);
  const appointments = useEterna((s) => s.appointments);
  const events = useEterna((s) => s.events);

  const upcomingEvents = useMemo(
    () =>
      events
        .filter((e) => diffDays(todayISO(), e.dateISO) > 0)
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

  const hour = new Date().getHours();
  const dayPart = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
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
            <Text style={[type.display, { color: t.text }]}>{tx('greeting.' + dayPart)}</Text>
            <Text style={{ fontSize: 14, color: t.sub, marginTop: 2 }}>{line}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tx('profile.title')}
            onPress={() => navigation.navigate('Profile')}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: t.accentSoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: t.accent }}>{initials}</Text>
          </Pressable>
        </View>

        {/* events rail — one clean chip per event, add on the end */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0, marginTop: spacing.m }}
          contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.s, alignItems: 'center' }}
        >
          {upcomingEvents.map((ev) => {
            const d = diffDays(todayISO(), ev.dateISO);
            const countdown =
              d < 14 ? tx('event.inDays', { n: d }) : tx('event.inWeeks', { n: Math.round(d / 7) });
            return (
              <Pressable
                key={ev.id}
                accessibilityRole="button"
                accessibilityLabel={`${ev.name}, ${countdown}`}
                onPress={() => navigation.navigate('EventPrep')}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 7,
                  paddingVertical: 9,
                  paddingHorizontal: 14,
                  borderRadius: radii.pill,
                  backgroundColor: t.accentSoft,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                })}
              >
                <Ionicons name="calendar-clear-outline" size={13} color={t.accent} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: t.accent }}>{countdown}</Text>
                <Text numberOfLines={1} style={{ fontSize: 13, color: t.accent, opacity: 0.75, maxWidth: 132 }}>
                  {ev.name}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tx('event.add')}
            onPress={() => navigation.navigate('EventPrep', { add: true })}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingVertical: 9,
              paddingHorizontal: upcomingEvents.length === 0 ? 14 : 12,
              borderRadius: radii.pill,
              borderWidth: 1,
              borderColor: t.border,
              backgroundColor: t.surfaceAlt,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            })}
          >
            <Ionicons name="add" size={16} color={t.accent} />
            {upcomingEvents.length === 0 ? (
              <Text style={{ fontSize: 13, fontWeight: '600', color: t.sub }}>{tx('event.add')}</Text>
            ) : null}
          </Pressable>
        </ScrollView>

        {/* avatar hero — the glows are the interface */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Entrance spring distance={22}>
            <AvatarFigure
              height={Math.min(520, Dimensions.get('window').height * 0.58)}
              skinTone={profile?.avatar?.skinTone ?? 0}
              hairColor={profile?.avatar?.hairColor ?? 0}
            >
              <ZoneMarkers
                zoneGlows={zoneGlows}
                onOpenZone={(zone) => navigation.navigate('ZoneDetail', { zone })}
              />
            </AvatarFigure>
          </Entrance>
          <Text style={{ fontSize: 12.5, color: t.muted, marginTop: spacing.s }}>
            {tx('home.tapHint')}
          </Text>
        </View>

        {/* quiet link to the full plan — text only, not a box */}
        {toBook > 0 ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('Planning')}
            style={{ alignItems: 'center', paddingBottom: spacing.l, paddingTop: spacing.xs }}
          >
            <Text style={{ fontSize: 13.5, fontWeight: '600', color: t.accent }}>
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
