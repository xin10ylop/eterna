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
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.m }}>
      <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: t.separator }} />
      <Text style={{ fontSize: 12, color: t.muted }}>or</Text>
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
  return (
    <View style={{ gap: spacing.s }}>
      <SocialButton icon="logo-apple" label="Continue with Apple" onPress={onContinue} />
      <SocialButton icon="logo-google" label="Continue with Google" onPress={onContinue} />
    </View>
  );
}

export function SignUpScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'SignUp'>) {
  const t = useTheme();
  const setDraft = useEterna((s) => s.setDraft);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [agreed, setAgreed] = useState(false);
  const strength = passwordStrength(pw);
  const strengthLabel = ['Too short', 'Okay', 'Good', 'Strong'][strength];

  return (
    <OnboardingShell
      step={null}
      title="Create your account"
      subtitle="Your rituals stay private to you."
      cta="Continue"
      ctaDisabled={!agreed}
      onNext={() => {
        if (email.trim()) setDraft({ email: email.trim() });
        navigation.navigate('Verify');
      }}
      footer={<GhostButton title="I already have an account" onPress={() => navigation.navigate('SignIn')} />}
    >
      <View style={{ gap: spacing.m, paddingTop: spacing.s }}>
        <JoinedFields>
          <JoinedInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            accessibilityLabel="Email"
          />
          <JoinedInput
            last
            value={pw}
            onChangeText={setPw}
            placeholder="Password (8+ characters)"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            accessibilityLabel="Password"
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
          We'll email booking confirmations and ritual reminders, nothing else. Demo preview: you
          can continue without filling this in.
        </Caption>
        {/* terms belong here, where the account is created */}
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: agreed }}
          onPress={() => setAgreed((v) => !v)}
          style={{ flexDirection: 'row', gap: spacing.m, alignItems: 'flex-start' }}
        >
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              borderWidth: 1.5,
              borderColor: agreed ? t.accent : t.muted,
              backgroundColor: agreed ? t.accent : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 1,
            }}
          >
            {agreed ? <Text style={{ color: t.onAccent, fontSize: 13, fontWeight: '800' }}>✓</Text> : null}
          </View>
          <Text style={{ flex: 1, fontSize: 13, color: t.sub, lineHeight: 19 }}>
            I agree to the Terms of Service and acknowledge the Privacy Policy.
          </Text>
        </Pressable>
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
  const setDraft = useEterna((s) => s.setDraft);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');

  return (
    <OnboardingShell
      step={null}
      title="Welcome back"
      cta="Sign in"
      onNext={() => {
        if (email.trim()) setDraft({ email: email.trim() });
        navigation.navigate('Name');
      }}
      footer={<GhostButton title="Create an account instead" onPress={() => navigation.navigate('SignUp')} />}
    >
      <View style={{ gap: spacing.m, paddingTop: spacing.s }}>
        <JoinedFields>
          <JoinedInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            accessibilityLabel="Email"
          />
          <JoinedInput
            last
            value={pw}
            onChangeText={setPw}
            placeholder="Password"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
            textContentType="password"
            accessibilityLabel="Password"
          />
        </JoinedFields>
        <Caption>Demo preview: you can continue without filling this in.</Caption>
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
      title="Check your inbox"
      subtitle={`Enter the 6-digit code we sent to ${email || 'your email'}. Demo preview: continue any time.`}
      cta="Verify"
      onNext={() => navigation.navigate('Name')}
      footer={
        <View style={{ alignItems: 'center', paddingVertical: 6 }}>
          <LinkText onPress={() => { setCode(''); setDone(false); }}>
            Didn't get it? Send again
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
            accessibilityLabel="6-digit code"
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
              Code looks good
            </Text>
          </View>
        ) : null}
      </View>
    </OnboardingShell>
  );
}
