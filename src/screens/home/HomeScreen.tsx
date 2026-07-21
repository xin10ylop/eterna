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
import { nextDueISO, treatmentStatus, zoneGlow, type GlowStatus } from '../../services/logic';
import { diffDays, humanizeDue, todayISO } from '../../lib/dates';
import { cardShadow, radii, spacing, type } from '../../theme';
import { useEterna, useTheme } from '../../store';
import { useT } from '../../i18n';
import type { Treatment, ZoneId } from '../../types';
import type { RootStackParamList, TabParamList } from '../../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

const ZONE_ICON: Record<ZoneId, keyof typeof Ionicons.glyphMap> = {
  hair: 'sparkles-outline',
  face: 'happy-outline',
  lips: 'heart-outline',
  torso: 'body-outline',
  hands: 'hand-left-outline',
  hips: 'body-outline',
  legs: 'footsteps-outline',
};

export function HomeScreen({ navigation }: Props) {
  const t = useTheme();
  const tx = useT();
  const profile = useEterna((s) => s.profile);
  const treatments = useEterna((s) => s.treatments);
  const appointments = useEterna((s) => s.appointments);
  const clinics = useEterna((s) => s.clinics);
  const event = useEterna((s) => s.event);

  const clinicName = (id: string) => clinics.find((c) => c.id === id)?.name ?? '';

  const ranked = useMemo(
    () => treatments.map((tr) => ({ tr, status: treatmentStatus(tr, appointments) })),
    [treatments, appointments],
  );
  const bookNow = ranked.filter((r) => r.status === 'bookNow');
  const comingUp = ranked.filter((r) => r.status === 'comingUp');
  const topItem = bookNow[0] ?? comingUp[0];
  const toBook = bookNow.length + comingUp.length;

  const zoneGlows = useMemo(() => {
    const m: Partial<Record<ZoneId, GlowStatus>> = {};
    for (const z of ZONES) m[z.id] = zoneGlow(z.id, treatments, appointments);
    return m;
  }, [treatments, appointments]);

  const eventDays = event ? diffDays(todayISO(), event.dateISO) : 0;
  const hour = new Date().getHours();
  const dayPart = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const line =
    toBook === 0
      ? tx('home.toBook.zero')
      : toBook === 1
        ? tx('home.toBook.one')
        : tx('home.toBook.many', { n: toBook });
  const initials = ((profile?.firstName?.[0] ?? 'Y') + (profile?.lastName?.[0] ?? '')).toUpperCase();

  const subFor = (item: Treatment, urgent: boolean) =>
    `${urgent ? tx('status.timeToBook') : humanizeDue(nextDueISO(item))} · ${clinicName(item.clinicId)}`;

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
            backgroundColor: event && eventDays > 0 ? t.accentSoft : t.surfaceAlt,
            borderWidth: 1,
            borderColor: event && eventDays > 0 ? 'transparent' : t.border,
            transform: [{ scale: pressed ? 0.99 : 1 }],
          })}
        >
          <Ionicons
            name={event && eventDays > 0 ? 'calendar' : 'add-circle-outline'}
            size={17}
            color={t.accent}
          />
          <Text style={{ flex: 1, fontSize: 13.5, fontWeight: '600', color: event && eventDays > 0 ? t.accent : t.sub }}>
            {event && eventDays > 0
              ? `${event.name} · ${eventDays < 14 ? tx('event.inDays', { n: eventDays }) : tx('event.inWeeks', { n: Math.round(eventDays / 7) })}`
              : tx('event.add')}
          </Text>
          <Ionicons name="chevron-forward" size={15} color={event && eventDays > 0 ? t.accent : t.muted} />
        </Pressable>

        {/* avatar hero */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Entrance spring distance={22}>
            <AvatarFigure
              height={Math.min(400, Dimensions.get('window').height * 0.44)}
              skinTone={profile?.avatar?.skinTone ?? 0}
              hairColor={profile?.avatar?.hairColor ?? 0}
            >
              <ZoneMarkers
                zoneGlows={zoneGlows}
                onOpenZone={(zone) => navigation.navigate('ZoneDetail', { zone })}
              />
            </AvatarFigure>
          </Entrance>
          <Text style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>{tx('home.tapHint')}</Text>
        </View>

        {/* one "next up" card + quiet see-all */}
        <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.l, gap: spacing.s }}>
          {topItem ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('TreatmentDetail', { treatmentId: topItem.tr.id })}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.m,
                backgroundColor: t.bg,
                borderRadius: radii.card,
                borderWidth: 1,
                borderColor: t.border,
                padding: spacing.m,
                ...cardShadow,
                transform: [{ scale: pressed ? 0.99 : 1 }],
              })}
            >
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  backgroundColor: t.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name={ZONE_ICON[topItem.tr.zone]} size={20} color={t.accent} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={{ fontSize: 16, fontWeight: '600', color: t.text }}>
                  {topItem.tr.name}
                </Text>
                <Text numberOfLines={1} style={{ fontSize: 13, color: t.sub, marginTop: 2 }}>
                  {subFor(topItem.tr, topItem.status === 'bookNow')}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={tx('common.book')}
                onPress={() => navigation.navigate('Book', { treatmentId: topItem.tr.id })}
                style={({ pressed }) => ({
                  paddingVertical: 9,
                  paddingHorizontal: 18,
                  borderRadius: radii.pill,
                  backgroundColor: t.accent,
                  transform: [{ scale: pressed ? 0.94 : 1 }],
                })}
              >
                <Text style={{ color: t.onAccent, fontSize: 14, fontWeight: '700' }}>{tx('common.book')}</Text>
              </Pressable>
            </Pressable>
          ) : (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.m,
                backgroundColor: t.bg,
                borderRadius: radii.card,
                borderWidth: 1,
                borderColor: t.border,
                padding: spacing.l,
                ...cardShadow,
              }}
            >
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: t.positive }} />
              <Text style={{ fontSize: 15, fontWeight: '600', color: t.text }}>{tx('home.caughtUp')}</Text>
            </View>
          )}

          {toBook > 0 ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('Planning')}
              style={{ alignItems: 'center', paddingVertical: 4 }}
            >
              <Text style={{ fontSize: 13.5, fontWeight: '600', color: t.accent }}>
                {tx('home.seeAll', { n: toBook })}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Screen>
  );
}
