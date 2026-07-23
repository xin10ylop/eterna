import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { GhostButton, LinkText } from '../../components/ui';
import { AnimatedCheck } from '../../components/anim/AnimatedCheck';
import { OnboardingShell } from './OnboardingShell';
import { radii, spacing } from '../../theme';
import { useEterna, useTheme } from '../../store';
import { passwordStrength } from '../../lib/validation';
import { useT } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';

/**
 * Auth screens, DISPLAY ONLY for now (per product decision): the fields
 * render and behave like the real thing, but nothing is required and no
 * account is created. The full validated flow lives in git history and
 * returns when Supabase auth lands.
 *
 * Layout follows Airbnb's sign-up sheet: email + password joined into one
 * bordered group, a "why we ask" caption under each section, underlined
 * links, and a disabled-until-valid feel without actually blocking the demo.
 */

function JoinedFields({
  children,
  error,
}: {
  children: React.ReactNode;
  error?: boolean;
}) {
  const t = useTheme();
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: error ? t.attention : t.border,
        borderRadius: radii.m,
        backgroundColor: t.surfaceAlt,
        overflow: 'hidden',
      }}
    >
      {children}
    </View>
  );
}

function JoinedInput({
  last,
  ...props
}: React.ComponentProps<typeof TextInput> & { last?: boolean }) {
  const t = useTheme();
  return (
    <TextInput
      placeholderTextColor={t.muted}
      {...props}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 14,
        fontSize: 16,
        color: t.text,
        borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: t.separator,
      }}
    />
  );
}

function Caption({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return <Text style={{ fontSize: 12, color: t.muted, lineHeight: 17 }}>{children}</Text>;
}

/** "or" rule between email and social auth (Airbnb / Etsy pattern). */
function OrDivider() {
  const t = useTheme();
  const tr = useT();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.m }}>
      <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: t.separator }} />
      <Text style={{ fontSize: 12, color: t.muted }}>{tr('auth.or')}</Text>
      <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: t.separator }} />
    </View>
  );
}

/** Outlined social auth button: brand glyph left, centered label (display-only). */
function SocialButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.s,
        paddingVertical: 15,
        borderRadius: radii.m + 2,
        borderWidth: 1,
        borderColor: t.border,
        backgroundColor: t.bg,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Ionicons name={icon} size={19} color={t.text} />
      <Text style={{ fontSize: 15, fontWeight: '600', color: t.text }}>{label}</Text>
    </Pressable>
  );
}

/** Apple + Google, stacked. Display-only: continues the demo flow. */
function SocialAuth({ onContinue }: { onContinue: () => void }) {
  const tr = useT();
  return (
    <View style={{ gap: spacing.s }}>
      <SocialButton icon="logo-apple" label={tr('auth.appleContinue')} onPress={onContinue} />
      <SocialButton icon="logo-google" label={tr('auth.googleContinue')} onPress={onContinue} />
    </View>
  );
}

export function SignUpScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'SignUp'>) {
  const t = useTheme();
  const tr = useT();
  const setDraft = useEterna((s) => s.setDraft);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const strength = passwordStrength(pw);
  const strengthLabel = [
    tr('auth.strength0'),
    tr('auth.strength1'),
    tr('auth.strength2'),
    tr('auth.strength3'),
  ][strength];

  return (
    <OnboardingShell
      step={null}
      alignTop
      title={tr('auth.createTitle')}
      subtitle={tr('auth.privateSub')}
      cta={tr('auth.agreeContinue')}
      onNext={() => {
        if (email.trim()) setDraft({ email: email.trim() });
        navigation.navigate('Verify');
      }}
      footer={<GhostButton title={tr('auth.haveAccount')} onPress={() => navigation.navigate('SignIn')} />}
    >
      <View style={{ gap: spacing.m, paddingTop: spacing.s }}>
        <JoinedFields>
          <JoinedInput
            value={email}
            onChangeText={setEmail}
            placeholder={tr('auth.emailPlaceholder')}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            accessibilityLabel={tr('auth.emailPlaceholder')}
          />
          <JoinedInput
            last
            value={pw}
            onChangeText={setPw}
            placeholder={tr('auth.passwordCreatePlaceholder')}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            accessibilityLabel={tr('auth.passwordPlaceholder')}
          />
        </JoinedFields>
        {pw.length > 0 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s }}>
            <View style={{ flexDirection: 'row', gap: 4, flex: 1 }}>
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: i < strength ? t.accent : t.faint,
                  }}
                />
              ))}
            </View>
            <Text style={{ fontSize: 12, color: t.sub }}>{strengthLabel}</Text>
          </View>
        ) : null}
        <Caption>
          {tr('auth.emailCaption')} {tr('auth.demoContinue')}
        </Caption>
        {/* Airbnb pattern: no checkbox — a legal line with tappable links, and
            the CTA itself is the agreement ("Agree and continue") */}
        <Text style={{ fontSize: 12.5, color: t.sub, lineHeight: 19 }}>
          {tr('auth.byAgreeing')}{' '}
          <Text
            accessibilityRole="link"
            onPress={() => navigation.navigate('Legal', { doc: 'terms' })}
            style={{ fontWeight: '700', textDecorationLine: 'underline', color: t.text }}
          >
            {tr('auth.terms')}
          </Text>{' '}
          {tr('auth.acknowledge')}{' '}
          <Text
            accessibilityRole="link"
            onPress={() => navigation.navigate('Legal', { doc: 'privacy' })}
            style={{ fontWeight: '700', textDecorationLine: 'underline', color: t.text }}
          >
            {tr('auth.privacy')}
          </Text>
          .
        </Text>
        <OrDivider />
        <SocialAuth
          onContinue={() => {
            setDraft({ email: 'you@icloud.com' });
            navigation.navigate('Name');
          }}
        />
      </View>
    </OnboardingShell>
  );
}

export function SignInScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'SignIn'>) {
  const tr = useT();
  const setDraft = useEterna((s) => s.setDraft);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');

  return (
    <OnboardingShell
      step={null}
      alignTop
      title={tr('auth.welcomeBack')}
      cta={tr('auth.signIn')}
      onNext={() => {
        if (email.trim()) setDraft({ email: email.trim() });
        navigation.navigate('Name');
      }}
      footer={<GhostButton title={tr('auth.createInstead')} onPress={() => navigation.navigate('SignUp')} />}
    >
      <View style={{ gap: spacing.m, paddingTop: spacing.s }}>
        <JoinedFields>
          <JoinedInput
            value={email}
            onChangeText={setEmail}
            placeholder={tr('auth.emailPlaceholder')}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            accessibilityLabel={tr('auth.emailPlaceholder')}
          />
          <JoinedInput
            last
            value={pw}
            onChangeText={setPw}
            placeholder={tr('auth.passwordPlaceholder')}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
            textContentType="password"
            accessibilityLabel={tr('auth.passwordPlaceholder')}
          />
        </JoinedFields>
        <Caption>{tr('auth.demoContinue')}</Caption>
        <OrDivider />
        <SocialAuth
          onContinue={() => {
            setDraft({ email: 'you@icloud.com' });
            navigation.navigate('Name');
          }}
        />
      </View>
    </OnboardingShell>
  );
}

export function VerifyScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Verify'>) {
  const t = useTheme();
  const tr = useT();
  const email = useEterna((s) => s.draft.email);
  const [code, setCode] = useState('');
  const [done, setDone] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const onChange = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
    if (digits.length === 6 && !done) setDone(true);
  };

  return (
    <OnboardingShell
      step={null}
      alignTop
      title={tr('auth.checkInbox')}
      subtitle={tr('auth.checkInboxSub', { email: email || tr('auth.yourEmail') })}
      cta={tr('auth.verify')}
      onNext={() => navigation.navigate('Name')}
      footer={
        <View style={{ alignItems: 'center', paddingVertical: 6 }}>
          <LinkText onPress={() => { setCode(''); setDone(false); }}>
            {tr('auth.sendAgain')}
          </LinkText>
        </View>
      }
    >
      <View style={{ paddingTop: spacing.l, gap: spacing.l, alignItems: 'center' }}>
        {/* one bordered field, wide letterspaced digits (Airbnb confirm-code pattern) */}
        <View
          style={{ width: '100%' }}
          onStartShouldSetResponder={() => {
            inputRef.current?.focus();
            return true;
          }}
        >
          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={onChange}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            caretHidden
            accessibilityLabel={tr('auth.codeInputLabel')}
            style={{
              width: '100%',
              paddingVertical: 18,
              borderRadius: radii.m,
              borderWidth: code.length > 0 && code.length < 6 ? 2 : 1,
              borderColor: done ? t.positive : code.length > 0 ? t.accent : t.border,
              backgroundColor: t.surfaceAlt,
              textAlign: 'center',
              fontSize: 28,
              fontWeight: '600',
              letterSpacing: 14,
              color: t.text,
            }}
            placeholder="······"
            placeholderTextColor={t.faint}
          />
        </View>
        {done ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s }}>
            <AnimatedCheck size={28} />
            <Text style={{ fontSize: 14, fontWeight: '600', color: t.positive }}>
              {tr('auth.codeLooksGood')}
            </Text>
          </View>
        ) : null}
      </View>
    </OnboardingShell>
  );
}
