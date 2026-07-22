import React, { useEffect, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { IconButton, PrimaryButton, Screen, StepDots } from '../../components/ui';
import { spacing, type } from '../../theme';
import { useTheme } from '../../store';

/** Total questionnaire steps shown in the progress bar (post-auth). */
export const OB_STEPS = 6;

/** True while the keyboard is up ("will" events on iOS so the layout moves
 *  with the keyboard animation, not after it). */
export function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const showEv = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEv = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const s = Keyboard.addListener(showEv, () => setOpen(true));
    const h = Keyboard.addListener(hideEv, () => setOpen(false));
    return () => {
      s.remove();
      h.remove();
    };
  }, []);
  return open;
}

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
  // With the keyboard up, the fixed bottom padding becomes a dead cream band
  // floating above it — collapse it so the CTA hugs the keyboard cleanly.
  const kbOpen = useKeyboardOpen();
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
              // never re-centre while typing — that's the "jump"
              justifyContent: alignTop || kbOpen ? 'flex-start' : 'center',
              gap: spacing.l,
              paddingTop: alignTop ? spacing.l : 0,
              paddingBottom: spacing.xl,
            }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            <View style={{ gap: 6 }}>
              <Text style={[type.display, { color: t.text }]}>{title}</Text>
              {subtitle ? <Text style={[type.body, { color: t.sub, lineHeight: 21 }]}>{subtitle}</Text> : null}
            </View>
            {children}
          </ScrollView>

          <View style={{ paddingBottom: kbOpen ? spacing.s : spacing.xl, gap: spacing.s }}>
            <PrimaryButton title={cta} onPress={onNext} disabled={ctaDisabled} loading={ctaLoading} />
            {kbOpen ? null : footer}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
