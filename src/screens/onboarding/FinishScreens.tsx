import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
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
import { useT } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';

/* ------------------------------- Notifications ------------------------------- */

/**
 * One decision only: reminders on or off. The fine-tuning (how many days
 * ahead, the moment of day) is deliberately NOT here — it will be designed
 * later; for now everything runs on gentle defaults she can change in
 * Profile.
 */
export function NotificationsScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'Notifications'>) {
  const t = useTheme();
  const tr = useT();
  const setDraft = useEterna((s) => s.setDraft);
  const [on, setOn] = useState(true);

  const save = () => {
    setDraft({ notificationsOn: on });
    navigation.navigate('Ready');
  };

  return (
    <OnboardingShell
      step={5}
      title={tr('reminders.title')}
      subtitle={tr('reminders.subtitle')}
      cta={tr('lang.continue')}
      onNext={save}
      footer={<GhostButton title={tr('reminders.maybeLater')} onPress={() => navigation.navigate('Ready')} />}
    >
      <View style={{ gap: spacing.m, paddingTop: spacing.l }}>
        <View
          style={{
            backgroundColor: on ? t.accentSoft : t.surfaceAlt,
            borderRadius: radii.l,
            borderWidth: 1,
            borderColor: on ? t.accent : t.border,
            padding: spacing.l,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.m }}>
            <Ionicons name="notifications-outline" size={20} color={on ? t.accent : t.muted} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: t.text }}>{tr('reminders.enable')}</Text>
              <Text style={{ fontSize: 13, color: t.sub, marginTop: 1 }}>
                {tr('reminders.enableSub')}
              </Text>
            </View>
            <IOSSwitch on={on} onToggle={() => setOn((v) => !v)} />
          </View>
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
            {tr('reminders.sampleBody', { treatment: 'Lip filler', clinic: 'Jamila Skin Clinic', time: '15:30' })}
          </Text>
        </View>
        <Text style={{ fontSize: 12, color: t.muted, lineHeight: 17 }}>
          {tr('reminders.footnote')}
        </Text>
      </View>
    </OnboardingShell>
  );
}

/* ----------------------------------- Ready ----------------------------------- */

export function ReadyScreen({ navigation: _n }: NativeStackScreenProps<RootStackParamList, 'Ready'>) {
  const t = useTheme();
  const tr = useT();
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
            {firstName ? tr('ready.titleWithName', { name: firstName }) : tr('ready.title')}
          </Text>
          <Text style={{ fontSize: 15, color: t.sub, textAlign: 'center', maxWidth: 280, lineHeight: 22, marginTop: 6 }}>
            {tr('ready.subtitle')}
          </Text>
        </Entrance>
      </Animated.View>
      <View style={{ paddingBottom: spacing.xxl }}>
        <PrimaryButton title={tr('ready.enter')} onPress={complete} />
      </View>
    </Screen>
  );
}
