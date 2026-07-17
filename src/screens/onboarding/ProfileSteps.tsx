import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Chip, Field, Segmented } from '../../components/ui';
import { OnboardingShell } from './OnboardingShell';
import { spacing, type } from '../../theme';
import { useEterna, useTheme } from '../../store';
import { validateHeightCm, validateName, validateWeightKg } from '../../lib/validation';
import type { RootStackParamList } from '../../navigation/types';

/* ----------------------------------- Name ----------------------------------- */

export function NameScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Name'>) {
  const setDraft = useEterna((s) => s.setDraft);
  const draft = useEterna((s) => s.draft);
  const [first, setFirst] = useState(draft.firstName);
  const [last, setLast] = useState(draft.lastName);
  const [e1, setE1] = useState<string | null>(null);
  const [e2, setE2] = useState<string | null>(null);

  return (
    <OnboardingShell
      step={0}
      title="What should we call you?"
      cta="Continue"
      onNext={() => {
        const a = validateName(first, 'first name');
        const b = validateName(last, 'last name');
        setE1(a);
        setE2(b);
        if (a || b) return;
        setDraft({ firstName: first.trim(), lastName: last.trim() });
        navigation.navigate('Birthday');
      }}
    >
      <View style={{ gap: spacing.l, paddingTop: spacing.s }}>
        <Field
          label="First name"
          value={first}
          onChangeText={(v) => {
            setFirst(v);
            if (e1) setE1(null);
          }}
          error={e1}
          placeholder="Lina"
          autoComplete="given-name"
          textContentType="givenName"
          autoFocus
        />
        <Field
          label="Last name"
          value={last}
          onChangeText={(v) => {
            setLast(v);
            if (e2) setE2(null);
          }}
          error={e2}
          placeholder="Haddad"
          autoComplete="family-name"
          textContentType="familyName"
        />
      </View>
    </OnboardingShell>
  );
}

/* --------------------------------- Birthday --------------------------------- */

export function BirthdayScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Birthday'>) {
  const t = useTheme();
  const setDraft = useEterna((s) => s.setDraft);
  const now = new Date();
  const years = useMemo(
    () => Array.from({ length: 70 }, (_, i) => now.getFullYear() - 16 - i),
    [now],
  );
  const [year, setYear] = useState<number | null>(null);
  const [agreed, setAgreed] = useState(false);

  return (
    <OnboardingShell
      step={1}
      title="What year were you born?"
      subtitle="Used only to tailor treatment cadences to you."
      cta="Continue"
      ctaDisabled={year === null || !agreed}
      onNext={() => {
        if (year === null) return;
        setDraft({ birthdayISO: `${year}-01-01` });
        navigation.navigate('Metrics');
      }}
    >
      <View style={{ gap: spacing.l, paddingTop: spacing.s }}>
        <ScrollView
          style={{ maxHeight: 260 }}
          contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s }}
          showsVerticalScrollIndicator={false}
        >
          {years.map((y) => (
            <Chip key={y} label={String(y)} selected={year === y} onPress={() => setYear(y)} />
          ))}
        </ScrollView>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: agreed }}
          onPress={() => setAgreed(!agreed)}
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
            I agree to the Terms of Service and acknowledge the Privacy Policy. Health-related data
            stays on this device in the demo.
          </Text>
        </Pressable>
      </View>
    </OnboardingShell>
  );
}

/* ------------------------------ Height & weight ------------------------------ */

export function MetricsScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Metrics'>) {
  const t = useTheme();
  const setDraft = useEterna((s) => s.setDraft);
  const [unit, setUnit] = useState('Metric');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const metric = unit === 'Metric';

  const submit = () => {
    const h = parseFloat(height.replace(',', '.'));
    const w = parseFloat(weight.replace(',', '.'));
    const hCm = metric ? h : Math.round(h * 2.54); // inches → cm
    const wKg = metric ? w : Math.round(w * 0.4536); // lb → kg
    const e = validateHeightCm(hCm) ?? validateWeightKg(wKg);
    setErr(e);
    if (e) return;
    setDraft({ heightCm: Math.round(hCm), weightKg: Math.round(wKg) });
    navigation.navigate('Routine');
  };

  return (
    <OnboardingShell
      step={2}
      title="Your measurements"
      subtitle="They keep body treatments and dosage history in context."
      cta="Continue"
      ctaDisabled={!height || !weight}
      onNext={submit}
    >
      <View style={{ gap: spacing.l, paddingTop: spacing.s }}>
        <Segmented options={['Metric', 'Imperial']} value={unit} onChange={setUnit} />
        <Field
          label={metric ? 'Height (cm)' : 'Height (inches)'}
          value={height}
          onChangeText={setHeight}
          placeholder={metric ? '168' : '66'}
          keyboardType="numeric"
        />
        <Field
          label={metric ? 'Weight (kg)' : 'Weight (lb)'}
          value={weight}
          onChangeText={setWeight}
          placeholder={metric ? '58' : '128'}
          keyboardType="numeric"
        />
        {err ? <Text style={{ color: t.attention, fontSize: 13 }}>{err}</Text> : null}
      </View>
    </OnboardingShell>
  );
}

/* ------------------------------- Routine picker ------------------------------ */

const ROUTINE_GROUPS: { title: string; items: string[] }[] = [
  { title: 'Hair', items: ['Roots touch-up', 'Cut & style', 'Keratin', 'Extensions'] },
  { title: 'Face', items: ['Botox', 'Hydrafacial', 'Lip filler', 'Brows & lashes', 'Skin boosters'] },
  { title: 'Nails', items: ['Gel manicure', 'Pedicure'] },
  { title: 'Body', items: ['Laser hair removal', 'Waxing', 'Massage', 'Body contouring'] },
];

export function RoutineScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Routine'>) {
  const t = useTheme();
  const setDraft = useEterna((s) => s.setDraft);
  const [picked, setPicked] = useState<string[]>(['Roots touch-up', 'Lip filler', 'Gel manicure']);

  const toggle = (name: string) =>
    setPicked((p) => (p.includes(name) ? p.filter((x) => x !== name) : [...p, name]));

  return (
    <OnboardingShell
      step={3}
      title="What do you keep up with?"
      subtitle="Select everything in your routine — you can always add more later."
      cta={picked.length ? `Continue with ${picked.length}` : 'Select at least one'}
      ctaDisabled={picked.length === 0}
      onNext={() => {
        setDraft({ routine: picked });
        navigation.navigate('AvatarStudio');
      }}
    >
      <View style={{ gap: spacing.xl, paddingTop: spacing.s }}>
        {ROUTINE_GROUPS.map((g) => (
          <View key={g.title} style={{ gap: spacing.s }}>
            <Text style={[type.label, { color: t.muted }]}>{g.title}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s }}>
              {g.items.map((item) => (
                <Chip key={item} label={item} selected={picked.includes(item)} onPress={() => toggle(item)} />
              ))}
            </View>
          </View>
        ))}
      </View>
    </OnboardingShell>
  );
}
