import React, { useMemo } from 'react';
import { Dimensions, Pressable, Text, View } from 'react-native';
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
import { countdownLabel, useT } from '../../i18n';
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

  const nextEvent = upcomingEvents[0] ?? null;
  const nextCountdown = nextEvent ? countdownLabel(tx, diffDays(todayISO(), nextEvent.dateISO)) : '';
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
            {profile?.firstName ? (
              <>
                <Text style={{ fontSize: 13.5, color: t.sub, fontWeight: '600' }}>
                  {tx('greeting.' + dayPart)}
                </Text>
                <Text style={[type.display, { color: t.text, marginTop: 1 }]} numberOfLines={1}>
                  {profile.firstName}
                </Text>
              </>
            ) : (
              <Text style={[type.display, { color: t.text }]} numberOfLines={1}>
                {tx('greeting.' + dayPart)}
              </Text>
            )}
            <Text style={{ fontSize: 14, color: t.sub, marginTop: 3 }}>{line}</Text>
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

        {/* events — the earlier clean pill: the next one up, or "add an event".
            Tapping opens the full Events screen (list + add). One event, no cram. */}
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('EventPrep', nextEvent ? undefined : { add: true })}
          style={({ pressed }) => ({
            marginHorizontal: spacing.xl,
            marginTop: spacing.m,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.s,
            paddingVertical: 11,
            paddingHorizontal: spacing.m,
            borderRadius: radii.pill,
            backgroundColor: nextEvent ? t.accentSoft : t.surfaceAlt,
            borderWidth: 1,
            borderColor: nextEvent ? 'transparent' : t.border,
            transform: [{ scale: pressed ? 0.99 : 1 }],
          })}
        >
          <Ionicons
            name={nextEvent ? 'calendar-clear-outline' : 'add-circle-outline'}
            size={16}
            color={t.accent}
          />
          <Text
            numberOfLines={1}
            style={{ flex: 1, fontSize: 13.5, fontWeight: '600', color: nextEvent ? t.accent : t.sub }}
          >
            {nextEvent ? `${nextEvent.name}    ${nextCountdown}` : tx('event.add')}
          </Text>
          <Ionicons name="chevron-forward" size={15} color={nextEvent ? t.accent : t.muted} />
        </Pressable>

        {/* avatar hero — the glows are the interface */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Entrance spring distance={22}>
            <AvatarFigure
              height={Math.min(580, Dimensions.get('window').height * 0.64)}
              skinTone={profile?.avatar?.skinTone ?? 0}
              hairColor={profile?.avatar?.hairColor ?? 0}
            >
              <ZoneMarkers
                zoneGlows={zoneGlows}
                onOpenZone={(zone) => navigation.navigate('ZoneDetail', { zone })}
              />
            </AvatarFigure>
          </Entrance>
          <Text style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>
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
