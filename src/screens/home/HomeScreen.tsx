import React, { useMemo } from 'react';
import { Dimensions, Pressable, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Screen, TimeChip } from '../../components/ui';
import { Entrance } from '../../components/anim/Entrance';
import { AvatarFigure } from '../../components/avatar/AvatarFigure';
import { ZoneMarkers } from '../../components/avatar/ZoneMarkers';
import { ZONES } from '../../data/seed';
import { needsAttention, nextDueISO, treatmentStatus, zoneAttentionCount } from '../../services/logic';
import { humanizeDue } from '../../lib/dates';
import { cardShadow, radii, spacing, type } from '../../theme';
import { useEterna, useTheme } from '../../store';
import type { RootStackParamList, TabParamList } from '../../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function HomeScreen({ navigation }: Props) {
  const t = useTheme();
  const profile = useEterna((s) => s.profile);
  const treatments = useEterna((s) => s.treatments);
  const appointments = useEterna((s) => s.appointments);
  const clinics = useEterna((s) => s.clinics);

  const attention = useMemo(
    () =>
      treatments
        .map((tr) => ({ tr, status: treatmentStatus(tr, appointments) }))
        .filter((x) => needsAttention(x.status))
        .sort((a, b) => (a.status === 'overdue' ? -1 : 1) - (b.status === 'overdue' ? -1 : 1)),
    [treatments, appointments],
  );

  const zoneData = useMemo(
    () =>
      ZONES.map((z) => ({
        zone: z.id,
        attentionCount: zoneAttentionCount(z.id, treatments, appointments),
      })),
    [treatments, appointments],
  );

  const hour = new Date().getHours();
  const dayPart = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const line =
    attention.length === 0
      ? 'You are all caught up'
      : attention.length === 1
        ? '1 thing needs attention'
        : `${attention.length} things need attention`;

  // full-width-minus-margins cards: with snapToInterval = cardW + gap the
  // snapped card sits centered, equal margins both sides
  const cardW = Dimensions.get('window').width - spacing.xl * 2;
  const initials = (
    (profile?.firstName?.[0] ?? 'Y') + (profile?.lastName?.[0] ?? '')
  ).toUpperCase();

  return (
    <Screen padded={false}>
      {/* header */}
      <View
        style={{
          paddingHorizontal: spacing.xl,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.m,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={[type.display, { color: t.text }]}>
            Good {dayPart}, {profile?.firstName ?? 'you'}
          </Text>
          <Text style={{ fontSize: 15, color: t.sub, marginTop: 2 }}>{line}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open profile"
          onPress={() => navigation.navigate('Profile')}
          style={({ pressed }) => ({
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: t.accentSoft,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: t.border,
            transform: [{ scale: pressed ? 0.92 : 1 }],
          })}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: '700',
              color: t.accent,
              includeFontPadding: false,
              textAlignVertical: 'center',
            }}
          >
            {initials}
          </Text>
        </Pressable>
      </View>

      {/* avatar */}
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Entrance spring distance={24}>
          <AvatarFigure
            height={Math.min(440, Dimensions.get('window').height * 0.46)}
            skinTone={profile?.avatar?.skinTone ?? 0}
            hairColor={profile?.avatar?.hairColor ?? 0}
          >
            <ZoneMarkers
              data={zoneData}
              onOpenZone={(zone) => navigation.navigate('ZoneDetail', { zone })}
            />
          </AvatarFigure>
          <Text style={{ textAlign: 'center', fontSize: 12, color: t.muted, marginTop: spacing.s }}>
            Tap a marker to see what needs attention
          </Text>
        </Entrance>
      </View>

      {/* attention rail */}
      <View style={{ paddingBottom: spacing.l, minHeight: 96 }}>
        {attention.length === 0 ? (
          <View
            style={{
              marginHorizontal: spacing.xl,
              backgroundColor: t.bg,
              borderRadius: radii.card,
              borderWidth: 1,
              borderColor: t.border,
              padding: spacing.l,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.m,
              ...cardShadow,
            }}
          >
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: t.positive }} />
            <Text style={{ fontSize: 15, fontWeight: '600', color: t.text }}>
              All caught up. Nothing due right now.
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={cardW + spacing.m}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.m }}
          >
            {attention.map(({ tr }) => {
              const clinic = clinics.find((c) => c.id === tr.clinicId);
              const zone = ZONES.find((z) => z.id === tr.zone);
              const due = nextDueISO(tr);
              return (
                <Pressable
                  key={tr.id}
                  accessibilityRole="button"
                  onPress={() => navigation.navigate('TreatmentDetail', { treatmentId: tr.id })}
                  style={({ pressed }) => ({
                    width: cardW,
                    backgroundColor: t.bg,
                    borderRadius: radii.card,
                    borderWidth: 1,
                    borderColor: t.border,
                    padding: spacing.l,
                    gap: spacing.s,
                    ...cardShadow,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  })}
                >
                  {/* metric-card anatomy: zone eyebrow left, proximity chip right */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={[type.label, { color: t.accent }]}>{zone?.label ?? 'Ritual'}</Text>
                    <TimeChip dueISO={due} />
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.m }}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text numberOfLines={1} style={{ fontSize: 16, fontWeight: '600', color: t.text }}>
                        {tr.name}
                      </Text>
                      <Text numberOfLines={1} style={{ fontSize: 13, color: t.sub, marginTop: 1 }}>
                        {humanizeDue(due)} · {clinic?.name}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Book ${tr.name}`}
                      onPress={() => navigation.navigate('Book', { treatmentId: tr.id })}
                      style={({ pressed }) => ({
                        paddingVertical: 9,
                        paddingHorizontal: 15,
                        borderRadius: radii.pill,
                        backgroundColor: t.accent,
                        transform: [{ scale: pressed ? 0.94 : 1 }],
                      })}
                    >
                      <Text style={{ color: t.onAccent, fontSize: 14, fontWeight: '600' }}>Book</Text>
                    </Pressable>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>
    </Screen>
  );
}
