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
import {
  bookedThisMonth,
  nextDueISO,
  spentThisMonth,
  treatmentStatus,
  zoneGlow,
  type GlowStatus,
} from '../../services/logic';
import { diffDays, formatMedium, humanizeDue, todayISO } from '../../lib/dates';
import { formatAED } from '../../lib/money';
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

const GLOW_DOT: Record<GlowStatus, string> = {
  calm: '#C9BDB0',
  soon: '#B05C3E',
  due: '#C83A2C',
};

function AtHomeTag() {
  const t = useTheme();
  const tr = useT();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: radii.pill,
        backgroundColor: t.surface,
      }}
    >
      <Ionicons name="home" size={10} color={t.sub} />
      <Text style={{ fontSize: 10.5, fontWeight: '600', color: t.sub }}>{tr('common.atHome')}</Text>
    </View>
  );
}

function BookButton({ onPress, label = 'Book' }: { onPress: () => void; label?: string }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: radii.pill,
        backgroundColor: t.accent,
        transform: [{ scale: pressed ? 0.94 : 1 }],
      })}
    >
      <Text style={{ color: t.onAccent, fontSize: 13.5, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

function Row({
  icon,
  title,
  sub,
  atHome,
  right,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  sub: string;
  atHome?: boolean;
  right?: React.ReactNode;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.m,
        backgroundColor: t.bg,
        borderRadius: radii.card,
        borderWidth: 1,
        borderColor: t.border,
        paddingVertical: spacing.m,
        paddingHorizontal: spacing.m,
        ...cardShadow,
        transform: [{ scale: pressed ? 0.99 : 1 }],
      })}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: t.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={19} color={t.accent} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text numberOfLines={1} style={{ fontSize: 15.5, fontWeight: '600', color: t.text, flexShrink: 1 }}>
            {title}
          </Text>
          {atHome ? <AtHomeTag /> : null}
        </View>
        <Text numberOfLines={1} style={{ fontSize: 13, color: t.sub, marginTop: 2 }}>
          {sub}
        </Text>
      </View>
      {right}
    </Pressable>
  );
}

function SectionLabel({ color, title }: { color: string; title: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: spacing.s, marginTop: spacing.s }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text style={[type.label, { color: t.sub }]}>{title}</Text>
    </View>
  );
}

export function HomeScreen({ navigation }: Props) {
  const t = useTheme();
  const tx = useT();
  const profile = useEterna((s) => s.profile);
  const treatments = useEterna((s) => s.treatments);
  const appointments = useEterna((s) => s.appointments);
  const sessions = useEterna((s) => s.sessions);
  const clinics = useEterna((s) => s.clinics);
  const event = useEterna((s) => s.event);

  const clinicName = (id: string) => clinics.find((c) => c.id === id)?.name ?? '';

  const ranked = useMemo(
    () => treatments.map((tr) => ({ tr, status: treatmentStatus(tr, appointments) })),
    [treatments, appointments],
  );
  const bookNow = ranked.filter((r) => r.status === 'bookNow');
  const comingUp = ranked.filter((r) => r.status === 'comingUp');
  const upcoming = useMemo(
    () =>
      appointments
        .map((a) => ({ a, tr: treatments.find((x) => x.id === a.treatmentId) }))
        .filter((x): x is { a: typeof x.a; tr: Treatment } => !!x.tr)
        .sort((x, y) => x.a.dateISO.localeCompare(y.a.dateISO)),
    [appointments, treatments],
  );

  const zoneGlows = useMemo(() => {
    const m: Partial<Record<ZoneId, GlowStatus>> = {};
    for (const z of ZONES) m[z.id] = zoneGlow(z.id, treatments, appointments);
    return m;
  }, [treatments, appointments]);

  const eventDays = event ? diffDays(todayISO(), event.dateISO) : 0;
  const prepCount = bookNow.length + comingUp.length;
  const monthTotal = spentThisMonth(sessions) + bookedThisMonth(appointments);

  const hour = new Date().getHours();
  const dayPart = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const toBook = bookNow.length + comingUp.length;
  const line =
    toBook === 0
      ? tx('home.toBook.zero')
      : toBook === 1
        ? tx('home.toBook.one')
        : tx('home.toBook.many', { n: toBook });
  const initials = ((profile?.firstName?.[0] ?? 'Y') + (profile?.lastName?.[0] ?? '')).toUpperCase();

  const sponsored = clinics.find((c) => c.sponsored);
  const subFor = (item: Treatment, kind: 'due' | 'soon') => {
    const base = kind === 'due' ? tx('status.timeToBook') : humanizeDue(nextDueISO(item));
    const pkg = item.pkg
      ? ` · ${tx('common.sessions', { done: item.pkg.done, total: item.pkg.total })}`
      : '';
    return `${base} · ${clinicName(item.clinicId)}${pkg}`;
  };

  return (
    <Screen padded={false}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
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
            accessibilityLabel="Profile"
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

        {/* avatar hero */}
        <Entrance spring distance={22}>
          <View style={{ alignItems: 'center', marginTop: spacing.s }}>
            <AvatarFigure
              height={Math.min(330, Dimensions.get('window').height * 0.36)}
              skinTone={profile?.avatar?.skinTone ?? 0}
              hairColor={profile?.avatar?.hairColor ?? 0}
            >
              <ZoneMarkers
                zoneGlows={zoneGlows}
                onOpenZone={(zone) => navigation.navigate('ZoneDetail', { zone })}
              />
            </AvatarFigure>
            <Text style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>
              {tx('home.tapHint')}
            </Text>
          </View>
        </Entrance>

        <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.m, gap: spacing.s }}>
          {/* event countdown */}
          {event && eventDays > 0 ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('EventPrep')}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.m,
                backgroundColor: t.accentSoft,
                borderRadius: radii.card,
                padding: spacing.m,
                transform: [{ scale: pressed ? 0.99 : 1 }],
              })}
            >
              <Ionicons name="calendar" size={20} color={t.accent} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: t.accent }}>
                  {event.name} ·{' '}
                  {eventDays < 14
                    ? tx('event.inDays', { n: eventDays })
                    : tx('event.inWeeks', { n: Math.round(eventDays / 7) })}
                </Text>
                <Text style={{ fontSize: 12.5, color: t.accent, opacity: 0.85, marginTop: 1 }}>
                  {prepCount > 0 ? tx('event.prepCount', { n: prepCount }) : tx('event.onTrack')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={t.accent} />
            </Pressable>
          ) : null}

          {/* Book now */}
          {bookNow.length > 0 ? (
            <>
              <SectionLabel color={GLOW_DOT.due} title={tx('section.bookNow')} />
              {bookNow.map(({ tr }) => (
                <Row
                  key={tr.id}
                  icon={ZONE_ICON[tr.zone]}
                  title={tr.name}
                  sub={subFor(tr, 'due')}
                  atHome={tr.atHome}
                  right={<BookButton label={tx('common.book')} onPress={() => navigation.navigate('Book', { treatmentId: tr.id })} />}
                  onPress={() => navigation.navigate('TreatmentDetail', { treatmentId: tr.id })}
                />
              ))}
            </>
          ) : null}

          {/* Coming up */}
          {comingUp.length > 0 ? (
            <>
              <SectionLabel color={GLOW_DOT.soon} title={tx('section.comingUp')} />
              {comingUp.map(({ tr }) => (
                <Row
                  key={tr.id}
                  icon={ZONE_ICON[tr.zone]}
                  title={tr.name}
                  sub={subFor(tr, 'soon')}
                  atHome={tr.atHome}
                  right={<BookButton label={tx('common.book')} onPress={() => navigation.navigate('Book', { treatmentId: tr.id })} />}
                  onPress={() => navigation.navigate('TreatmentDetail', { treatmentId: tr.id })}
                />
              ))}
            </>
          ) : null}

          {/* Upcoming (booked) */}
          {upcoming.length > 0 ? (
            <>
              <SectionLabel color={t.positive} title={tx('section.upcoming')} />
              {upcoming.map(({ a, tr }) => (
                <Row
                  key={a.id}
                  icon={ZONE_ICON[tr.zone]}
                  title={tr.name}
                  sub={`${formatMedium(a.dateISO)} · ${a.timeLabel} · ${clinicName(a.clinicId)}`}
                  right={
                    <Ionicons name="checkmark-circle" size={22} color={t.positive} />
                  }
                  onPress={() => navigation.navigate('TreatmentDetail', { treatmentId: tr.id })}
                />
              ))}
            </>
          ) : null}

          {toBook === 0 && upcoming.length === 0 ? (
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
              <Text style={{ fontSize: 15, fontWeight: '600', color: t.text }}>
                {tx('home.caughtUp')}
              </Text>
            </View>
          ) : null}

          {/* budget glance */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Budget"
            onPress={() => navigation.navigate('Budget')}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: t.surfaceAlt,
              borderRadius: radii.card,
              padding: spacing.m,
              marginTop: spacing.s,
              transform: [{ scale: pressed ? 0.99 : 1 }],
            })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s }}>
              <Ionicons name="wallet-outline" size={18} color={t.sub} />
              <Text style={{ fontSize: 14, color: t.sub }}>{tx('home.plannedThisMonth')}</Text>
            </View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: t.text }}>{formatAED(monthTotal)}</Text>
          </Pressable>

          {/* one tasteful sponsored suggestion */}
          {sponsored ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Sponsored: ${sponsored.name}`}
              onPress={() => navigation.navigate('Discover')}
              style={({ pressed }) => ({
                borderRadius: radii.card,
                borderWidth: 1,
                borderColor: t.border,
                backgroundColor: t.bg,
                padding: spacing.m,
                marginTop: spacing.s,
                gap: 6,
                transform: [{ scale: pressed ? 0.99 : 1 }],
              })}
            >
              <Text style={{ fontSize: 10.5, fontWeight: '700', letterSpacing: 0.6, color: t.muted }}>
                {tx('common.sponsored')}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.m }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: t.accentSoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 17, fontWeight: '700', color: t.accent }}>{sponsored.name[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '600', color: t.text }}>
                    {sponsored.name}
                  </Text>
                  <Text numberOfLines={1} style={{ fontSize: 12.5, color: t.sub, marginTop: 1 }}>
                    {sponsored.category} · ★ {sponsored.rating.toFixed(1)}
                    {sponsored.distanceKm > 0 ? ` · ${sponsored.distanceKm} km` : ''}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={t.muted} />
              </View>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}
