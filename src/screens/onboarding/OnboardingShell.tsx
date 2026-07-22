import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { IconButton, PrimaryButton, Screen, StepDots } from '../../components/ui';
import { spacing, type } from '../../theme';
import { useTheme } from '../../store';

/** Total questionnaire steps shown in the progress bar (post-auth). */
export const OB_STEPS = 7;

/**
 * Shared onboarding scaffold: back button, thin step progress, one big
 * question, content, pinned CTA. Pattern adapted from Tonal / MacroFactor
 * account setup flows (one question per screen, generous headline).
 */
export function OnboardingShell({
  step,
  title,
  subtitle,
  children,
  cta,
  onNext,
  ctaDisabled,
  ctaLoading,
  footer,
  alignTop,
}: {
  step: number | null;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  cta: string;
  onNext: () => void;
  ctaDisabled?: boolean;
  ctaLoading?: boolean;
  footer?: React.ReactNode;
  /** Text-input steps top-align: centring + keyboard = the layout jumps. */
  alignTop?: boolean;
}) {
  const t = useTheme();
  const nav = useNavigation();
  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ paddingTop: spacing.s, gap: spacing.l, flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.m }}>
            {nav.canGoBack() ? (
              <IconButton name="chevron-back" onPress={() => nav.goBack()} accessibilityLabel="Back" />
            ) : null}
            {step !== null ? (
              <View style={{ flex: 1 }}>
                <StepDots total={OB_STEPS} index={step} />
              </View>
            ) : (
              <View style={{ flex: 1 }} />
            )}
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: alignTop ? 'flex-start' : 'center',
              gap: spacing.l,
              paddingTop: alignTop ? spacing.l : 0,
              paddingBottom: spacing.xl,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={{ gap: 6 }}>
              <Text style={[type.display, { color: t.text }]}>{title}</Text>
              {subtitle ? <Text style={[type.body, { color: t.sub, lineHeight: 21 }]}>{subtitle}</Text> : null}
            </View>
            {children}
          </ScrollView>

          <View style={{ paddingBottom: spacing.xl, gap: spacing.s }}>
            <PrimaryButton title={cta} onPress={onNext} disabled={ctaDisabled} loading={ctaLoading} />
            {footer}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
