import React, { useEffect, useRef } from 'react';
import { Animated, Image, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { GhostButton, PrimaryButton, Screen } from '../../components/ui';
import { AnimatedCheck } from '../../components/anim/AnimatedCheck';
import { Entrance } from '../../components/anim/Entrance';
import { OnboardingShell } from './OnboardingShell';
import { radii, spacing, type } from '../../theme';
import { useEterna, useTheme } from '../../store';
import type { RootStackParamList } from '../../navigation/types';

/* ------------------------------- Notifications ------------------------------- */

export function NotificationsScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'Notifications'>) {
  const t = useTheme();
  return (
    <OnboardingShell
      step={5}
      title="Stay ahead of your rituals"
      subtitle="A quiet reminder 5 days before anything is due. Never spam."
      cta="Turn on reminders"
      onNext={() => navigation.navigate('Ready')}
      footer={<GhostButton title="Maybe later" onPress={() => navigation.navigate('Ready')} />}
    >
      <View style={{ alignItems: 'center', paddingTop: spacing.xxl }}>
        <View
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: t.accentSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="notifications-outline" size={52} color={t.accent} />
        </View>
        <View
          style={{
            marginTop: spacing.xl,
            backgroundColor: t.surface,
            borderRadius: radii.l,
            padding: spacing.l,
            width: '100%',
            gap: 4,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '700', color: t.text }}>Eterna</Text>
          <Text style={{ fontSize: 13, color: t.sub }}>
            Lip filler is due Friday. Atelier Peau has 15:30 open.
          </Text>
        </View>
      </View>
    </OnboardingShell>
  );
}

/* ----------------------------------- Ready ----------------------------------- */

export function ReadyScreen({ navigation: _n }: NativeStackScreenProps<RootStackParamList, 'Ready'>) {
  const t = useTheme();
  const complete = useEterna((s) => s.completeOnboarding);
  const firstName = useEterna((s) => s.draft.firstName);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [fade]);

  return (
    <Screen>
      <Animated.View style={{ flex: 1, opacity: fade, alignItems: 'center', justifyContent: 'center', gap: spacing.l }}>
        <AnimatedCheck size={64} />
        <Entrance spring delay={500} distance={26}>
          <Image
            source={require('../../../assets/avatar/front.png')}
            style={{ height: 280, width: 280 * 0.442, resizeMode: 'contain' }}
            accessibilityLabel="Your avatar"
          />
        </Entrance>
        <Entrance delay={750}>
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
