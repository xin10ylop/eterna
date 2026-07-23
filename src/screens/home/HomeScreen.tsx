import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/ui';
import { Entrance } from '../../components/anim/Entrance';
import { AvatarFigure } from '../../components/avatar/AvatarFigure';
import { ZoneMarkers } from '../../components/avatar/ZoneMarkers';
import { FRONT_ASPECT } from '../../components/avatar/config';
import { GuideTour, useGuideRects, type GuideStep } from '../../components/GuideTour';
import { ZONES } from '../../data/seed';
import { needsAttention, treatmentStatus, zoneGlowInfo, type ZoneGlowInfo } from '../../services/logic';
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
  const guideStage = useEterna((s) => s.guideStage);
  const guideTotal = useEterna((s) => s.guideTotal);
  const setGuide = useEterna((s) => s.setGuide);
  // measure the space the figure gets, so it fills it and never spills into the
  // header, chip, or the link below
  const [stageH, setStageH] = useState(0);

  // guided tour, chapter "home": measure the real elements, spotlight them one
  // by one, then hand over to Planning. Chapter "finish" is the closing card.
  const stageRef = useRef<View>(null);
  const eventsRef = useRef<View>(null);
  const bookingsRef = useRef<View>(null);
  const guideRects = useGuideRects(
    guideStage === 'home' && stageH > 0,
    { stage: stageRef, events: eventsRef, bookings: bookingsRef },
    650,
  );

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
    const m: Partial<Record<ZoneId, ZoneGlowInfo>> = {};
    for (const z of ZONES) m[z.id] = zoneGlowInfo(z.id, treatments, appointments);
    return m;
  }, [treatments, appointments]);

  // the tour continues on Planning (2 steps), Discover (1), Budget (1) and
  // ends with a closing card back here (1) — the global counter needs them
  const LATER_STEPS = 5;

  const guideSteps = useMemo<GuideStep[] | null>(() => {
    if (guideStage === 'finish')
      return [
        { key: 'finish', rect: null, title: tx('guide.finish.title'), body: tx('guide.finish.body') },
      ];
    if (guideStage !== 'home' || !guideRects?.stage) return null;
    const steps: GuideStep[] = [];
    // hug the figure itself, not the whole stage, so the spotlight has shape
    const st = guideRects.stage;
    const figH = Math.min(540, st.h - 8);
    const figW = figH * FRONT_ASPECT;
    steps.push({
      key: 'avatar',
      rect: { x: st.x + st.w / 2 - figW / 2, y: st.y + st.h / 2 - figH / 2, w: figW, h: figH },
      title: tx('guide.avatar.title'),
      body: tx('guide.avatar.body'),
      legend: 'glows',
    });
    if (guideRects.events)
      steps.push({
        key: 'events',
        rect: guideRects.events,
        title: tx('guide.events.title'),
        body: tx('guide.events.body'),
      });
    if (guideRects.bookings)
      steps.push({
        key: 'bookings',
        rect: guideRects.bookings,
        title: tx('guide.bookings.title'),
        body: tx('guide.bookings.body'),
      });
    return steps;
  }, [guideStage, guideRects, tx]);

  // the home chapter fixes the tour's global length once its steps are known
  useEffect(() => {
    if (guideStage === 'home' && guideSteps) setGuide({ total: guideSteps.length + LATER_STEPS });
  }, [guideStage, guideSteps, setGuide, LATER_STEPS]);

  // the next few visits already on the books, soonest first
  const nextBookings = useMemo(
    () =>
      appointments
        .filter((a) => a.dateISO >= todayISO())
        .sort((a, b) => a.dateISO.localeCompare(b.dateISO))
        .slice(0, 3)
        .map((appt) => ({
          appt,
          name: treatments.find((tr) => tr.id === appt.treatmentId)?.name ?? tx('budget.appointment'),
        })),
    [appointments, treatments, tx],
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
            // top-align so the monogram sits level with the greeting no matter
            // how many lines the name takes
            alignItems: 'flex-start',
            gap: spacing.m,
          }}
        >
          <View style={{ flex: 1 }}>
            {name ? (
              <>
                <Text style={{ fontSize: 17, fontWeight: '600', color: t.text }}>{greeting},</Text>
                <Text
                  style={{ fontSize: 27, fontWeight: '700', color: t.text, letterSpacing: -0.4, marginTop: 1 }}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {name}
                </Text>
              </>
            ) : (
              <Text style={{ fontSize: 27, fontWeight: '700', color: t.text, letterSpacing: -0.4 }}>
                {greeting}
              </Text>
            )}
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
              marginTop: 2,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: t.accent }}>{initials}</Text>
          </Pressable>
        </View>

        {/* events — every upcoming one as a small date card, add always visible.
            The wrapper carries the margin so the tour can measure a clean box. */}
        <View ref={eventsRef} collapsable={false} style={{ marginTop: spacing.m }}>
        {upcomingEvents.length === 0 ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('EventPrep', { add: true })}
            style={({ pressed }) => ({
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
            style={{ flexGrow: 0 }}
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
        </View>

        {/* figure — sized to the measured stage so it can't overlap anything */}
        <View
          ref={stageRef}
          collapsable={false}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          onLayout={(e) => setStageH(e.nativeEvent.layout.height)}
        >
          {stageH > 0 ? (
            <Entrance spring distance={22}>
              <AvatarFigure
                height={Math.min(540, stageH - 8)}
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
          <View ref={bookingsRef} collapsable={false} style={{ marginTop: spacing.s }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0 }}
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
          </View>
        ) : null}

        <View style={{ paddingBottom: spacing.l }} />
      </View>

      {guideSteps ? (
        <GuideTour
          steps={guideSteps}
          offset={guideStage === 'finish' ? Math.max(0, guideTotal - 1) : 0}
          total={guideTotal}
          onComplete={() => {
            if (guideStage === 'home') {
              setGuide({ stage: 'planning', offset: guideSteps.length });
              navigation.navigate('Planning');
            } else {
              setGuide({ stage: null, offset: 0 });
            }
          }}
          onSkip={() => setGuide({ stage: null, offset: 0 })}
        />
      ) : null}
    </Screen>
  );
}
