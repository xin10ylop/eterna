import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
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

  const nextEvent = upcomingEvents[0] ?? null;
  const nextCountdown = nextEvent ? countdownLabel(tx, diffDays(todayISO(), nextEvent.dateISO)) : '';
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

        {/* small event chip — auto-width, not a full-width bar */}
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('EventPrep', nextEvent ? undefined : { add: true })}
          style={({ pressed }) => ({
            marginHorizontal: spacing.xl,
            marginTop: spacing.m,
            alignSelf: 'flex-start',
            maxWidth: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 7,
            paddingVertical: 8,
            paddingHorizontal: 13,
            borderRadius: radii.pill,
            backgroundColor: nextEvent ? t.accentSoft : t.surfaceAlt,
            borderWidth: nextEvent ? 0 : 1,
            borderColor: t.border,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons
            name={nextEvent ? 'calendar-clear-outline' : 'add-circle-outline'}
            size={14}
            color={t.accent}
          />
          {nextEvent ? (
            <Text numberOfLines={1} style={{ fontSize: 13, color: t.accent, maxWidth: 240 }}>
              <Text style={{ fontWeight: '700' }}>{nextCountdown}</Text>
              {`  ·  ${nextEvent.name}`}
            </Text>
          ) : (
            <Text style={{ fontSize: 13, fontWeight: '600', color: t.sub }}>{tx('event.add')}</Text>
          )}
        </Pressable>

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
