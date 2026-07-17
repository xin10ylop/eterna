import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingShell } from './OnboardingShell';
import { Sparkles } from '../../components/anim/Lottie';
import { Entrance } from '../../components/anim/Entrance';
import { radii, spacing } from '../../theme';
import { useEterna, useTheme } from '../../store';
import type { RootStackParamList } from '../../navigation/types';

/**
 * "Preparing your plan" (Stoic / Cal AI pattern): a sequential checklist that
 * checks off while sparkles play, then reveals a personalized recap of what
 * Eterna will do with the questionnaire answers — the promise before the
 * avatar studio asks for anything more.
 */

const STEPS = ['Mapping your zones', 'Setting your cadences', 'Fitting your budget'];
const STEP_MS = 900;

function ChecklistRow({ state, label }: { state: 'done' | 'busy' | 'todo'; label: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.m, paddingVertical: 10 }}>
      {state === 'done' ? (
        <Ionicons name="checkmark-circle" size={22} color={t.positive} />
      ) : state === 'busy' ? (
        <ActivityIndicator size="small" color={t.accent} />
      ) : (
        <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: t.faint }} />
      )}
      <Text
        style={{
          fontSize: 15,
          fontWeight: state === 'todo' ? '400' : '600',
          color: state === 'todo' ? t.muted : t.text,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export function PlanScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Plan'>) {
  const t = useTheme();
  const routine = useEterna((s) => s.draft.routine);
  const firstName = useEterna((s) => s.draft.firstName);
  const [phase, setPhase] = useState(0); // 0..STEPS.length building, then reveal
  const fade = useRef(new Animated.Value(0)).current;
  const ready = phase >= STEPS.length;

  useEffect(() => {
    if (ready) {
      Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      return;
    }
    const id = setTimeout(() => setPhase((p) => p + 1), STEP_MS);
    return () => clearTimeout(id);
  }, [phase, ready, fade]);

  const zoneCount = useMemo(() => {
    const zones = new Set<string>();
    for (const r of routine) {
      if (/roots|cut|keratin|extension/i.test(r)) zones.add('hair');
      else if (/lip/i.test(r)) zones.add('lips');
      else if (/botox|facial|brows|skin/i.test(r)) zones.add('face');
      else if (/manicure/i.test(r)) zones.add('hands');
      else zones.add('body');
    }
    return Math.max(1, zones.size);
  }, [routine]);

  const rows = [
    {
      icon: 'body-outline' as const,
      title: `${routine.length} rituals on your avatar`,
      body: `Across ${zoneCount} ${zoneCount === 1 ? 'zone' : 'zones'} — each one glows softly when it needs attention.`,
    },
    {
      icon: 'time-outline' as const,
      title: 'Cadences tuned to you',
      body: 'Roots, filler, lashes — each on its own rhythm, remembered with every session.',
    },
    {
      icon: 'wallet-outline' as const,
      title: 'A budget that looks ahead',
      body: 'Know what this month and next will cost before it happens.',
    },
  ];

  return (
    <OnboardingShell
      step={4}
      title={ready ? (firstName ? `${firstName}, here's your plan` : "Here's your plan") : 'One moment…'}
      subtitle={ready ? 'Built from your answers — refine it any time.' : 'Eterna is preparing your space.'}
      cta="Continue"
      ctaDisabled={!ready}
      onNext={() => navigation.navigate('AvatarStudio')}
    >
      {!ready ? (
        <View style={{ paddingTop: spacing.l, alignItems: 'center', gap: spacing.l }}>
          <Sparkles size={140} />
          <View style={{ alignSelf: 'stretch' }}>
            {STEPS.map((s, i) => (
              <ChecklistRow
                key={s}
                label={s}
                state={i < phase ? 'done' : i === phase ? 'busy' : 'todo'}
              />
            ))}
          </View>
        </View>
      ) : (
        <Animated.View style={{ opacity: fade, gap: spacing.m, paddingTop: spacing.l }}>
          {rows.map((r, i) => (
            <Entrance key={r.title} delay={i * 120} distance={14}>
              <View
                style={{
                  flexDirection: 'row',
                  gap: spacing.m,
                  alignItems: 'flex-start',
                  backgroundColor: t.surfaceAlt,
                  borderRadius: radii.l,
                  borderWidth: 1,
                  borderColor: t.border,
                  padding: spacing.l,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: t.accentSoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name={r.icon} size={20} color={t.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: t.text }}>{r.title}</Text>
                  <Text style={{ fontSize: 13, color: t.sub, lineHeight: 19, marginTop: 2 }}>
                    {r.body}
                  </Text>
                </View>
              </View>
            </Entrance>
          ))}
        </Animated.View>
      )}
    </OnboardingShell>
  );
}
