import React, { useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Field, GhostButton } from '../../components/ui';
import { OnboardingShell } from './OnboardingShell';
import { spacing } from '../../theme';
import { useEterna, useTheme } from '../../store';
import { authService } from '../../services/auth';
import {
  passwordStrength,
  validateCode,
  validateEmail,
  validatePassword,
} from '../../lib/validation';
import type { RootStackParamList } from '../../navigation/types';

/* --------------------------------- Sign up --------------------------------- */

export function SignUpScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'SignUp'>) {
  const t = useTheme();
  const setDraft = useEterna((s) => s.setDraft);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const strength = passwordStrength(pw);
  const strengthLabel = ['Too short', 'Okay', 'Good', 'Strong'][strength];

  const submit = async () => {
    const e1 = validateEmail(email);
    const e2 = validatePassword(pw);
    setEmailErr(e1);
    setPwErr(e2);
    if (e1 || e2) return;
    setLoading(true);
    const res = await authService.signUp(email.trim(), pw);
    setLoading(false);
    if (res.ok) {
      setDraft({ email: email.trim() });
      navigation.navigate('Verify');
    } else {
      setEmailErr(res.error);
    }
  };

  return (
    <OnboardingShell
      step={null}
      title="Create your account"
      subtitle="Your rituals stay private to you."
      cta="Continue"
      onNext={submit}
      ctaLoading={loading}
      footer={<GhostButton title="I already have an account" onPress={() => navigation.navigate('SignIn')} />}
    >
      <View style={{ gap: spacing.l, paddingTop: spacing.s }}>
        <Field
          label="Email"
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            if (emailErr) setEmailErr(null);
          }}
          error={emailErr}
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
            onChangeText={(v) => {
              setPw(v);
              if (pwErr) setPwErr(null);
            }}
            error={pwErr}
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
      </View>
    </OnboardingShell>
  );
}

/* --------------------------------- Sign in --------------------------------- */

export function SignInScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'SignIn'>) {
  const setDraft = useEterna((s) => s.setDraft);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const e1 = validateEmail(email);
    const e2 = pw ? null : 'Enter your password.';
    setEmailErr(e1);
    setPwErr(e2);
    if (e1 || e2) return;
    setLoading(true);
    const res = await authService.signIn(email.trim(), pw);
    setLoading(false);
    if (res.ok) {
      // Demo shortcut: an existing account still walks the profile steps so
      // the full flow is reviewable end to end.
      setDraft({ email: email.trim() });
      navigation.navigate('Name');
    }
  };

  return (
    <OnboardingShell
      step={null}
      title="Welcome back"
      cta="Sign in"
      onNext={submit}
      ctaLoading={loading}
      footer={<GhostButton title="Create an account instead" onPress={() => navigation.navigate('SignUp')} />}
    >
      <View style={{ gap: spacing.l, paddingTop: spacing.s }}>
        <Field
          label="Email"
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            if (emailErr) setEmailErr(null);
          }}
          error={emailErr}
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
          onChangeText={(v) => {
            setPw(v);
            if (pwErr) setPwErr(null);
          }}
          error={pwErr}
          placeholder="Your password"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password"
          textContentType="password"
        />
      </View>
    </OnboardingShell>
  );
}

/* ----------------------------- Verify (6 digits) ---------------------------- */

export function VerifyScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Verify'>) {
  const t = useTheme();
  const email = useEterna((s) => s.draft.email);
  const [code, setCode] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const submit = async () => {
    const e = validateCode(code);
    setErr(e);
    if (e) return;
    setLoading(true);
    const res = await authService.verifyCode(email, code);
    setLoading(false);
    if (res.ok) navigation.navigate('Name');
    else setErr(res.error);
  };

  return (
    <OnboardingShell
      step={null}
      title="Check your inbox"
      subtitle={`We sent a 6-digit code to ${email || 'your email'}. In this demo, any 6 digits work.`}
      cta="Verify"
      onNext={submit}
      ctaDisabled={code.length !== 6}
      ctaLoading={loading}
      footer={<GhostButton title="Resend code" onPress={() => setCode('')} />}
    >
      <View style={{ paddingTop: spacing.l, gap: spacing.m }}>
        {/* One hidden input drives six boxes — pastes and autofill just work. */}
        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={(v) => {
            setCode(v.replace(/\D/g, '').slice(0, 6));
            if (err) setErr(null);
          }}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          style={{ position: 'absolute', opacity: 0, height: 1, width: 1 }}
          autoFocus
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
        {err ? <Text style={{ color: t.attention, textAlign: 'center' }}>{err}</Text> : null}
      </View>
    </OnboardingShell>
  );
}
