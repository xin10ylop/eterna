import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
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
  const setDraft = useEterna((s) => s.setDraft);
  const [dueOn, setDueOn] = useState(true);
  const [lead, setLead] = useState(5);
  const [apptOn, setApptOn] = useState(true);
  const [apptWhen, setApptWhen] = useState<'morning' | 'dayBefore'>('morning');

  const save = () => {
    setDraft({ remindDaysBefore: dueOn ? lead : 0, apptReminder: apptWhen });
    navigation.navigate('Ready');
  };

  return (
    <OnboardingShell
      step={5}
      title="Your reminders, your way"
      subtitle="Choose exactly when Eterna may nudge you. One quiet note per ritual, never a stream."
      cta="Set reminders"
      onNext={save}
      footer={<GhostButton title="Maybe later" onPress={() => navigation.navigate('Ready')} />}
    >
      <View style={{ gap: spacing.m, paddingTop: spacing.l }}>
        {/* time to book — she picks the lead */}
        <View
          style={{
            backgroundColor: dueOn ? t.accentSoft : t.surfaceAlt,
            borderRadius: radii.l,
            borderWidth: 1,
            borderColor: dueOn ? t.accent : t.border,
            padding: spacing.l,
            gap: spacing.m,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.m }}>
            <Ionicons name="notifications-outline" size={20} color={dueOn ? t.accent : t.muted} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: t.text }}>When something needs booking</Text>
              <Text style={{ fontSize: 13, color: t.sub, marginTop: 1 }}>Ahead of each ritual coming due</Text>
            </View>
            <IOSSwitch on={dueOn} onToggle={() => setDueOn((v) => !v)} />
          </View>
          {dueOn ? (
            <View style={{ flexDirection: 'row', gap: spacing.s }}>
              {[3, 5, 7].map((n) => {
                const on = lead === n;
                return (
                  <Pressable
                    key={n}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    onPress={() => setLead(n)}
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      paddingVertical: 10,
                      borderRadius: radii.m,
                      backgroundColor: on ? t.accent : t.bg,
                      borderWidth: 1,
                      borderColor: on ? t.accent : t.border,
                    }}
                  >
                    <Text style={{ fontSize: 13.5, fontWeight: '700', color: on ? t.onAccent : t.text }}>
                      {n} days ahead
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>

        {/* appointment reminders — she picks the moment */}
        <View
          style={{
            backgroundColor: apptOn ? t.accentSoft : t.surfaceAlt,
            borderRadius: radii.l,
            borderWidth: 1,
            borderColor: apptOn ? t.accent : t.border,
            padding: spacing.l,
            gap: spacing.m,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.m }}>
            <Ionicons name="calendar-outline" size={20} color={apptOn ? t.accent : t.muted} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: t.text }}>Appointment reminders</Text>
              <Text style={{ fontSize: 13, color: t.sub, marginTop: 1 }}>So a booked visit is never missed</Text>
            </View>
            <IOSSwitch on={apptOn} onToggle={() => setApptOn((v) => !v)} />
          </View>
          {apptOn ? (
            <View style={{ flexDirection: 'row', gap: spacing.s }}>
              {(
                [
                  { key: 'morning', label: 'Morning of' },
                  { key: 'dayBefore', label: 'A day before' },
                ] as const
              ).map((o) => {
                const on = apptWhen === o.key;
                return (
                  <Pressable
                    key={o.key}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    onPress={() => setApptWhen(o.key)}
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      paddingVertical: 10,
                      borderRadius: radii.m,
                      backgroundColor: on ? t.accent : t.bg,
                      borderWidth: 1,
                      borderColor: on ? t.accent : t.border,
                    }}
                  >
                    <Text style={{ fontSize: 13.5, fontWeight: '700', color: on ? t.onAccent : t.text }}>
                      {o.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>

        {/* what a nudge looks like */}
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
          You can change any of this later in Profile, per ritual too.
        </Text>
      </View>
    </OnboardingShell>
  );
}

/* ----------------------------------- Ready ----------------------------------- */

export function ReadyScreen({ navigation: _n }: NativeStackScreenProps<RootStackParamList, 'Ready'>) {
  const t = useTheme();
  const complete = useEterna((s) => s.completeOnboarding);
  const firstName = useEterna((s) => s.draft.firstName);
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
          {/* gentle fade, no spring: the figure settles instead of bouncing */}
          <Entrance delay={350} distance={8}>
            <AvatarFigure
              height={280}
              skinTone={avatar.skinTone}
              hairColor={avatar.hairColor}
              style={{ marginTop: spacing.m }}
            />
          </Entrance>
        </View>
        <Entrance delay={600}>
          <Text style={[type.title, { color: t.text, textAlign: 'center' }]}>
            {firstName ? `${firstName}, your space is ready` : 'Your space is ready'}
          </Text>
          <Text style={{ fontSize: 15, color: t.sub, textAlign: 'center', maxWidth: 280, lineHeight: 22, marginTop: 6 }}>
            Your rituals are on the avatar. Tap a glowing area to see what needs attention.
          </Text>
        </Entrance>
      </Animated.View>
      <View style={{ paddingBottom: spacing.xxl }}>
        <PrimaryButton title="Enter Eterna" onPress={complete} />
      </View>
    </Screen>
  );
}
