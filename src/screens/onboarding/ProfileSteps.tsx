import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Field, OptionCard, Segmented, WheelPicker } from '../../components/ui';
import { OnboardingShell } from './OnboardingShell';
import { spacing, type } from '../../theme';
import { useEterna, useTheme } from '../../store';
import { validateName } from '../../lib/validation';
import type { RootStackParamList } from '../../navigation/types';

/**
 * Profile steps. One question per screen; every screen that asks for personal
 * data carries a one-line "why we ask" caption and a reassurance footnote
 * (Stoic / Hims intake pattern), trust is the whole game for body data.
 */

function WhyWeAsk({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <Text style={{ fontSize: 12, color: t.muted, lineHeight: 17 }}>{children}</Text>
  );
}

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
        // last name is optional — mononyms are common in the Gulf
        const b = last.trim() ? validateName(last, 'last name') : null;
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
          autoComplete="given-name"
          textContentType="givenName"
        />
        <Field
          label="Last name (optional)"
          value={last}
          onChangeText={(v) => {
            setLast(v);
            if (e2) setE2(null);
          }}
          error={e2}
          autoComplete="family-name"
          textContentType="familyName"
        />
        <WhyWeAsk>Only your first name appears in the app, on your greeting, never shared.</WhyWeAsk>
      </View>
    </OnboardingShell>
  );
}

/* --------------------------------- Birthday --------------------------------- */

export function BirthdayScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Birthday'>) {
  const setDraft = useEterna((s) => s.setDraft);
  const years = useMemo(() => {
    const now = new Date().getFullYear();
    return Array.from({ length: 70 }, (_, i) => String(now - 16 - i));
  }, []);
  const [yearIdx, setYearIdx] = useState(14); // a sensible default, ~30

  return (
    <OnboardingShell
      step={1}
      title="What year were you born?"
      subtitle="Used only to tailor treatment cadences to you."
      cta="Continue"
      onNext={() => {
        setDraft({ birthdayISO: `${years[yearIdx]}-01-01` });
        navigation.navigate('Routine');
      }}
    >
      <View style={{ gap: spacing.xl, paddingTop: spacing.s, alignItems: 'center' }}>
        <WheelPicker items={years} index={yearIdx} onChange={setYearIdx} width={140} />
      </View>
    </OnboardingShell>
  );
}

/* ------------------------------ Height & weight ------------------------------ */

const CM = Array.from({ length: 61 }, (_, i) => 140 + i); // 140–200
const KG = Array.from({ length: 101 }, (_, i) => 40 + i); // 40–140
const IN = Array.from({ length: 25 }, (_, i) => 55 + i); // 4'7"–6'7"
const LB = Array.from({ length: 211 }, (_, i) => 90 + i); // 90–300

const ftIn = (inches: number) => `${Math.floor(inches / 12)}'${inches % 12}"`;

export function MetricsScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Metrics'>) {
  const setDraft = useEterna((s) => s.setDraft);
  const [unit, setUnit] = useState('Metric');
  const metric = unit === 'Metric';
  // wheels pre-seeded to sensible defaults (Cal AI pattern)
  const [hIdx, setHIdx] = useState(CM.indexOf(168));
  const [wIdx, setWIdx] = useState(KG.indexOf(58));
  const [hIdxIn, setHIdxIn] = useState(IN.indexOf(66));
  const [wIdxLb, setWIdxLb] = useState(LB.indexOf(128));

  const submit = () => {
    const hCm = metric ? CM[hIdx] : Math.round(IN[hIdxIn] * 2.54);
    const wKg = metric ? KG[wIdx] : Math.round(LB[wIdxLb] * 0.4536);
    setDraft({ heightCm: hCm, weightKg: wKg });
    navigation.navigate('Routine');
  };

  return (
    <OnboardingShell
      step={2}
      title="Your measurements"
      subtitle="They keep body treatments and dosage history in context."
      cta="Continue"
      onNext={submit}
    >
      <View style={{ gap: spacing.xl, paddingTop: spacing.s }}>
        <Segmented options={['Metric', 'Imperial']} value={unit} onChange={setUnit} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-evenly' }}>
          {metric ? (
            <>
              <WheelPicker
                label="Height"
                items={CM.map((v) => `${v} cm`)}
                index={hIdx}
                onChange={setHIdx}
                width={120}
              />
              <WheelPicker
                label="Weight"
                items={KG.map((v) => `${v} kg`)}
                index={wIdx}
                onChange={setWIdx}
                width={120}
              />
            </>
          ) : (
            <>
              <WheelPicker
                label="Height"
                items={IN.map(ftIn)}
                index={hIdxIn}
                onChange={setHIdxIn}
                width={120}
              />
              <WheelPicker
                label="Weight"
                items={LB.map((v) => `${v} lb`)}
                index={wIdxLb}
                onChange={setWIdxLb}
                width={120}
              />
            </>
          )}
        </View>
        <WhyWeAsk>
          This never limits what you can do in Eterna, it only keeps practitioner dosage notes in
          context.
        </WhyWeAsk>
      </View>
    </OnboardingShell>
  );
}

/* ------------------------------- Routine picker ------------------------------ */

const ROUTINE_GROUPS: { title: string; items: { name: string; hint: string }[] }[] = [
  {
    title: 'Hair',
    items: [
      { name: 'Roots touch-up', hint: 'every 4–6 weeks' },
      { name: 'Cut & style', hint: 'every 6–8 weeks' },
      { name: 'Keratin', hint: 'every 3–4 months' },
      { name: 'Extensions', hint: 'every 6–8 weeks' },
    ],
  },
  {
    title: 'Face',
    items: [
      { name: 'Botox', hint: 'every 3–4 months' },
      { name: 'Hydrafacial', hint: 'every 4 weeks' },
      { name: 'Lip filler', hint: 'every 4–6 months' },
      { name: 'Brows & lashes', hint: 'every 3–4 weeks' },
      { name: 'Skin boosters', hint: 'every 2–3 months' },
    ],
  },
  {
    title: 'Nails',
    items: [
      { name: 'Gel manicure', hint: 'every 2–3 weeks' },
      { name: 'Pedicure', hint: 'every 3–4 weeks' },
    ],
  },
  {
    title: 'Body',
    items: [
      { name: 'Laser hair removal', hint: 'every 4–8 weeks' },
      { name: 'Waxing', hint: 'every 3–5 weeks' },
      { name: 'Massage', hint: 'whenever you need it' },
      { name: 'Body contouring', hint: 'course of sessions' },
    ],
  },
];

export function RoutineScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Routine'>) {
  const t = useTheme();
  const setDraft = useEterna((s) => s.setDraft);
  const [picked, setPicked] = useState<string[]>(['Roots touch-up', 'Lip filler', 'Gel manicure']);

  const toggle = (name: string) =>
    setPicked((p) => (p.includes(name) ? p.filter((x) => x !== name) : [...p, name]));

  return (
    <OnboardingShell
      step={2}
      title="What do you keep up with?"
      subtitle="Select everything in your routine, you can always add more later."
      cta={picked.length ? `Continue with ${picked.length}` : 'Select at least one'}
      ctaDisabled={picked.length === 0}
      onNext={() => {
        setDraft({ routine: picked });
        navigation.navigate('Plan');
      }}
    >
      <View style={{ gap: spacing.xl, paddingTop: spacing.s }}>
        {ROUTINE_GROUPS.map((g) => (
          <View key={g.title} style={{ gap: spacing.s }}>
            <Text style={[type.label, { color: t.muted }]}>{g.title}</Text>
            <View style={{ gap: spacing.s }}>
              {g.items.map((item) => (
                <OptionCard
                  key={item.name}
                  multi
                  label={item.name}
                  sublabel={item.hint}
                  selected={picked.includes(item.name)}
                  onPress={() => toggle(item.name)}
                />
              ))}
            </View>
          </View>
        ))}
        <WhyWeAsk>This builds your ritual plan, nothing here is ever shared.</WhyWeAsk>
      </View>
    </OnboardingShell>
  );
}
