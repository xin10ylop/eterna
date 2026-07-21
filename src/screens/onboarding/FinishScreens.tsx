import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { GhostButton, IOSSwitch, PrimaryButton, Screen } from '../../components/ui';
import { AnimatedCheck } from '../../components/anim/AnimatedCheck';
import { Confetti } from '../../components/anim/Lottie';
import { Entrance } from '../../components/anim/Entrance';
import { AvatarFigure } from '../../components/avatar/AvatarFigure';
import { OnboardingShell } from './OnboardingShell';
import { radii, spacing, type } from '../../theme';
import { useEterna, useTheme } from '../../store';
import type { RootStackParamList } from '../../navigation/types';

/* ------------------------------- Notifications ------------------------------- */

/**
 * Notification priming reframed as scheduling your own ritual times (Stoic
 * pattern): pick when Eterna may nudge you, then one rationale line, the
 * permission ask becomes self-care planning instead of an interruption.
 */
export function NotificationsScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'Notifications'>) {
  const t = useTheme();
  const [slots, setSlots] = useState([
    { key: 'due', icon: 'notifications-outline' as const, label: 'Before something’s due', time: '5 days ahead', on: true },
    { key: 'appt', icon: 'calendar-outline' as const, label: 'Appointment reminders', time: 'Morning of', on: true },
    { key: 'quiet', icon: 'moon-outline' as const, label: 'Quiet hours', time: '22:00 – 8:00', on: true },
  ]);
  const toggle = (key: string) =>
    setSlots((s) => s.map((x) => (x.key === key ? { ...x, on: !x.on } : x)));

  return (
    <OnboardingShell
      step={5}
      title="Your quiet reminders"
      subtitle="One gentle nudge per ritual — never a daily buzz."
      cta="Set reminders"
      onNext={() => navigation.navigate('Ready')}
      footer={<GhostButton title="Maybe later" onPress={() => navigation.navigate('Ready')} />}
    >
      <View style={{ gap: spacing.m, paddingTop: spacing.l }}>
        {slots.map((s) => (
          <View
            key={s.key}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.m,
              backgroundColor: s.on ? t.accentSoft : t.surfaceAlt,
              borderRadius: radii.l,
              borderWidth: 1,
              borderColor: s.on ? t.accent : t.border,
              padding: spacing.l,
            }}
          >
            <Ionicons name={s.icon} size={20} color={s.on ? t.accent : t.muted} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: t.text }}>{s.label}</Text>
              <Text style={{ fontSize: 13, color: t.sub, marginTop: 1 }}>{s.time}</Text>
            </View>
            <IOSSwitch on={s.on} onToggle={() => toggle(s.key)} />
          </View>
        ))}
        <View
          style={{
            backgroundColor: t.surface,
            borderRadius: radii.l,
            padding: spacing.l,
            gap: 4,
            marginTop: spacing.s,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '700', color: t.text }}>Eterna</Text>
          <Text style={{ fontSize: 13, color: t.sub }}>
            Lip filler is due Friday. Jamila Skin Clinic has 15:30 open.
          </Text>
        </View>
        <Text style={{ fontSize: 12, color: t.muted, lineHeight: 17 }}>
          Gentle reminders at the times you chose keep rituals on rhythm, you can change them any
          time in Profile.
        </Text>
      </View>
    </OnboardingShell>
  );
}

/* ----------------------------------- Ready ----------------------------------- */

/** Celebration anatomy (Duolingo): burst + headline + stat chips + one CTA. */
function StatChip({ icon, value, label }: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string }) {
  const t = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: t.surfaceAlt,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: radii.l,
        paddingVertical: spacing.m,
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Ionicons name={icon} size={16} color={t.accent} />
      <Text style={{ fontSize: 16, fontWeight: '700', color: t.text }}>{value}</Text>
      <Text style={{ fontSize: 11, color: t.sub }}>{label}</Text>
    </View>
  );
}

export function ReadyScreen({ navigation: _n }: NativeStackScreenProps<RootStackParamList, 'Ready'>) {
  const t = useTheme();
  const complete = useEterna((s) => s.completeOnboarding);
  const firstName = useEterna((s) => s.draft.firstName);
  const routine = useEterna((s) => s.draft.routine);
  const avatar = useEterna((s) => s.draft.avatar);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [fade]);

  return (
    <Screen>
      <Animated.View style={{ flex: 1, opacity: fade, alignItems: 'center', justifyContent: 'center', gap: spacing.l }}>
        <View style={{ alignItems: 'center' }}>
          <Confetti size={280} style={{ position: 'absolute', top: -60 }} />
          <AnimatedCheck size={56} />
          <Entrance spring delay={400} distance={26}>
            <AvatarFigure
              height={260}
              skinTone={avatar.skinTone}
              hairColor={avatar.hairColor}
              style={{ marginTop: spacing.m }}
            />
          </Entrance>
        </View>
        <Entrance delay={650}>
          <Text style={[type.title, { color: t.text, textAlign: 'center' }]}>
            {firstName ? `${firstName}, your space is ready` : 'Your space is ready'}
          </Text>
          <Text style={{ fontSize: 15, color: t.sub, textAlign: 'center', maxWidth: 280, lineHeight: 22, marginTop: 6 }}>
            Your rituals are on the avatar. Tap a glowing area to see what needs attention.
          </Text>
        </Entrance>
        <Entrance delay={800} distance={10}>
          <View style={{ flexDirection: 'row', gap: spacing.s, alignSelf: 'stretch', paddingHorizontal: spacing.s }}>
            <StatChip icon="sparkles-outline" value={String(routine.length || 3)} label="rituals" />
            <StatChip icon="body-outline" value="7" label="zones mapped" />
            <StatChip icon="wallet-outline" value="Ready" label="budget forecast" />
          </View>
        </Entrance>
      </Animated.View>
      <View style={{ paddingBottom: spacing.xxl }}>
        <PrimaryButton title="Enter Eterna" onPress={complete} />
      </View>
    </Screen>
  );
}
