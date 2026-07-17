import React, { useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Field, GhostButton } from '../../components/ui';
import { OnboardingShell } from './OnboardingShell';
import { spacing } from '../../theme';
import { useEterna, useTheme } from '../../store';
import { passwordStrength } from '../../lib/validation';
import type { RootStackParamList } from '../../navigation/types';

/**
 * Auth screens — DISPLAY ONLY for now (per product decision): the fields
 * render and behave like the real thing, but nothing is required and no
 * account is created. The full validated flow lives in git history and
 * returns when Supabase auth lands.
 */

export function SignUpScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'SignUp'>) {
  const t = useTheme();
  const setDraft = useEterna((s) => s.setDraft);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const strength = passwordStrength(pw);
  const strengthLabel = ['Too short', 'Okay', 'Good', 'Strong'][strength];

  return (
    <OnboardingShell
      step={null}
      title="Create your account"
      subtitle="Your rituals stay private to you."
      cta="Continue"
      onNext={() => {
        if (email.trim()) setDraft({ email: email.trim() });
        navigation.navigate('Verify');
      }}
      footer={<GhostButton title="I already have an account" onPress={() => navigation.navigate('SignIn')} />}
    >
      <View style={{ gap: spacing.l, paddingTop: spacing.s }}>
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
        />
        <View style={{ gap: 6 }}>
          <Field
            label="Password"
            value={pw}
            onChangeText={setPw}
            placeholder="At least 8 characters"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
          />
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
        </View>
        <Text style={{ fontSize: 12, color: t.muted }}>
          Demo preview: you can continue without filling this in.
        </Text>
      </View>
    </OnboardingShell>
  );
}

export function SignInScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'SignIn'>) {
  const t = useTheme();
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
      <View style={{ gap: spacing.l, paddingTop: spacing.s }}>
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
        />
        <Field
          label="Password"
          value={pw}
          onChangeText={setPw}
          placeholder="Your password"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password"
          textContentType="password"
        />
        <Text style={{ fontSize: 12, color: t.muted }}>
          Demo preview: you can continue without filling this in.
        </Text>
      </View>
    </OnboardingShell>
  );
}

export function VerifyScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Verify'>) {
  const t = useTheme();
  const email = useEterna((s) => s.draft.email);
  const [code, setCode] = useState('');
  const inputRef = useRef<TextInput>(null);

  return (
    <OnboardingShell
      step={null}
      title="Check your inbox"
      subtitle={`We sent a 6-digit code to ${email || 'your email'}. Demo preview: continue any time.`}
      cta="Verify"
      onNext={() => navigation.navigate('Name')}
      footer={<GhostButton title="Resend code" onPress={() => setCode('')} />}
    >
      <View style={{ paddingTop: spacing.l, gap: spacing.m }}>
        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          style={{ position: 'absolute', opacity: 0, height: 1, width: 1 }}
        />
        <View
          style={{ flexDirection: 'row', gap: spacing.s, justifyContent: 'center' }}
          onStartShouldSetResponder={() => {
            inputRef.current?.focus();
            return true;
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => {
            const ch = code[i] ?? '';
            const active = i === code.length;
            return (
              <View
                key={i}
                style={{
                  width: 46,
                  height: 56,
                  borderRadius: 12,
                  borderWidth: active ? 2 : 1,
                  borderColor: active ? t.accent : t.border,
                  backgroundColor: t.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 24, fontWeight: '600', color: t.text }}>{ch}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </OnboardingShell>
  );
}
