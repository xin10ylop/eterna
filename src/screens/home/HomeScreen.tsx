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
 * whole point of the glow. Just a greeting, a slim event countdown, the figure,
 * and a quiet link to the full plan.
 */
export function HomeScreen({ navigation }: Props) {
  const t = useTheme();
  const tx = useT();
  const profile = useEterna((s) => s.profile);
  const treatments = useEterna((s) => s.treatments);
  const appointments = useEterna((s) => s.appointments);
  const event = useEterna((s) => s.event);

  const toBook = useMemo(
    () => treatments.filter((tr) => needsAttention(treatmentStatus(tr, appointments))).length,
    [treatments, appointments],
  );
  const zoneGlows = useMemo(() => {
    const m: Partial<Record<ZoneId, GlowStatus>> = {};
    for (const z of ZONES) m[z.id] = zoneGlow(z.id, treatments, appointments);
    return m;
  }, [treatments, appointments]);

  const eventDays = event ? diffDays(todayISO(), event.dateISO) : 0;
  const hasEvent = !!event && eventDays > 0;
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

        {/* slim event chip — add or countdown */}
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('EventPrep')}
          style={({ pressed }) => ({
            marginHorizontal: spacing.xl,
            marginTop: spacing.m,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.s,
            paddingVertical: 10,
            paddingHorizontal: spacing.m,
            borderRadius: radii.pill,
            backgroundColor: hasEvent ? t.accentSoft : t.surfaceAlt,
            borderWidth: 1,
            borderColor: hasEvent ? 'transparent' : t.border,
            transform: [{ scale: pressed ? 0.99 : 1 }],
          })}
        >
          <Ionicons name={hasEvent ? 'calendar' : 'add-circle-outline'} size={17} color={t.accent} />
          <Text
            style={{ flex: 1, fontSize: 13.5, fontWeight: '600', color: hasEvent ? t.accent : t.sub }}
          >
            {hasEvent
              ? `${event!.name} · ${eventDays < 14 ? tx('event.inDays', { n: eventDays }) : tx('event.inWeeks', { n: Math.round(eventDays / 7) })}`
              : tx('event.add')}
          </Text>
          <Ionicons name="chevron-forward" size={15} color={hasEvent ? t.accent : t.muted} />
        </Pressable>

        {/* avatar hero — the glows are the interface */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Entrance spring distance={22}>
            <AvatarFigure
              height={Math.min(420, Dimensions.get('window').height * 0.48)}
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
