import React, { useMemo, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Field, OptionCard, Segmented, WheelPicker } from '../../components/ui';
import { OnboardingShell } from './OnboardingShell';
import { spacing, type } from '../../theme';
import { useEterna, useTheme } from '../../store';
import { validateName } from '../../lib/validation';
import { useT } from '../../i18n';
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
  const tr = useT();
  const setDraft = useEterna((s) => s.setDraft);
  const draft = useEterna((s) => s.draft);
  const [first, setFirst] = useState(draft.firstName);
  const [last, setLast] = useState(draft.lastName);
  const [e1, setE1] = useState<string | null>(null);
  const [e2, setE2] = useState<string | null>(null);

  return (
    <OnboardingShell
      step={0}
      alignTop
      title={tr('name.title')}
      cta={tr('lang.continue')}
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
          label={tr('name.first')}
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
          label={tr('name.last')}
          value={last}
          onChangeText={(v) => {
            setLast(v);
            if (e2) setE2(null);
          }}
          error={e2}
          autoComplete="family-name"
          textContentType="familyName"
        />
        <WhyWeAsk>{tr('name.whyWeAsk')}</WhyWeAsk>
      </View>
    </OnboardingShell>
  );
}

/* --------------------------------- Birthday --------------------------------- */

const MONTH_KEYS = [
  'birth.jan', 'birth.feb', 'birth.mar', 'birth.apr', 'birth.may', 'birth.jun',
  'birth.jul', 'birth.aug', 'birth.sep', 'birth.oct', 'birth.nov', 'birth.dec',
];

export function BirthdayScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Birthday'>) {
  const tr = useT();
  const setDraft = useEterna((s) => s.setDraft);
  const months = useMemo(() => MONTH_KEYS.map((k) => tr(k)), [tr]);
  const years = useMemo(() => {
    const now = new Date().getFullYear();
    return Array.from({ length: 70 }, (_, i) => String(now - 16 - i));
  }, []);
  const [dayIdx, setDayIdx] = useState(14); // 15th
  const [monthIdx, setMonthIdx] = useState(5); // June — a middle month, so the
  //                                              wheel opens centred, not on Jan
  const [yearIdx, setYearIdx] = useState(14); // ~30

  // days available depend on the chosen month/year (leap Februaries too)
  const daysInMonth = useMemo(
    () => new Date(Number(years[yearIdx]), monthIdx + 1, 0).getDate(),
    [years, yearIdx, monthIdx],
  );
  const days = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => String(i + 1)),
    [daysInMonth],
  );
  // if the month shrank under the picked day (e.g. 31 → Feb), fall back cleanly
  const safeDayIdx = Math.min(dayIdx, daysInMonth - 1);

  // three wheels must fit every phone — on the narrowest screens (320pt) the
  // fixed widths would clip, so the month column absorbs the difference
  const { width: winW } = useWindowDimensions();
  const dayW = 64;
  const yearW = 84;
  const monthW = Math.max(96, Math.min(128, winW - spacing.xl * 2 - dayW - yearW - spacing.s * 2));

  return (
    <OnboardingShell
      step={1}
      title={tr('birth.title')}
      subtitle={tr('birth.subtitle')}
      cta={tr('lang.continue')}
      onNext={() => {
        const iso = `${years[yearIdx]}-${String(monthIdx + 1).padStart(2, '0')}-${String(
          safeDayIdx + 1,
        ).padStart(2, '0')}`;
        setDraft({ birthdayISO: iso });
        navigation.navigate('Clinics');
      }}
    >
      <View style={{ paddingTop: spacing.s, alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.s }}>
          <WheelPicker label={tr('birth.day')} items={days} index={safeDayIdx} onChange={setDayIdx} width={dayW} />
          <WheelPicker label={tr('birth.month')} items={months} index={monthIdx} onChange={setMonthIdx} width={monthW} />
          <WheelPicker label={tr('birth.year')} items={years} index={yearIdx} onChange={setYearIdx} width={yearW} />
        </View>
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
  const tr = useT();
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
      title={tr('metrics.title')}
      subtitle={tr('metrics.subtitle')}
      cta={tr('lang.continue')}
      onNext={submit}
    >
      <View style={{ gap: spacing.xl, paddingTop: spacing.s }}>
        <Segmented
          options={['Metric', 'Imperial']}
          labels={[tr('metrics.metric'), tr('metrics.imperial')]}
          value={unit}
          onChange={setUnit}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'space-evenly' }}>
          {metric ? (
            <>
              <WheelPicker
                label={tr('metrics.height')}
                items={CM.map((v) => `${v} cm`)}
                index={hIdx}
                onChange={setHIdx}
                width={120}
              />
              <WheelPicker
                label={tr('metrics.weight')}
                items={KG.map((v) => `${v} kg`)}
                index={wIdx}
                onChange={setWIdx}
                width={120}
              />
            </>
          ) : (
            <>
              <WheelPicker
                label={tr('metrics.height')}
                items={IN.map(ftIn)}
                index={hIdxIn}
                onChange={setHIdxIn}
                width={120}
              />
              <WheelPicker
                label={tr('metrics.weight')}
                items={LB.map((v) => `${v} lb`)}
                index={wIdxLb}
                onChange={setWIdxLb}
                width={120}
              />
            </>
          )}
        </View>
        <WhyWeAsk>{tr('metrics.whyWeAsk')}</WhyWeAsk>
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

const GROUP_TITLE_KEYS: Record<string, string> = {
  Hair: 'routineq.groupHair',
  Face: 'routineq.groupFace',
  Nails: 'routineq.groupNails',
  Body: 'routineq.groupBody',
};

export function RoutineScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Routine'>) {
  const t = useTheme();
  const tr = useT();
  const setDraft = useEterna((s) => s.setDraft);
  const [picked, setPicked] = useState<string[]>(['Roots touch-up', 'Lip filler', 'Gel manicure']);

  const toggle = (name: string) =>
    setPicked((p) => (p.includes(name) ? p.filter((x) => x !== name) : [...p, name]));

  return (
    <OnboardingShell
      step={2}
      title={tr('routineq.title')}
      subtitle={tr('routineq.subtitle')}
      cta={picked.length ? tr('routineq.continueWith', { n: picked.length }) : tr('routineq.selectAtLeastOne')}
      ctaDisabled={picked.length === 0}
      onNext={() => {
        setDraft({ routine: picked });
        navigation.navigate('Clinics');
      }}
    >
      <View style={{ gap: spacing.xl, paddingTop: spacing.s }}>
        {ROUTINE_GROUPS.map((g) => (
          <View key={g.title} style={{ gap: spacing.s }}>
            <Text style={[type.label, { color: t.muted }]}>{tr(GROUP_TITLE_KEYS[g.title] ?? g.title)}</Text>
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
        <WhyWeAsk>{tr('routineq.whyWeAsk')}</WhyWeAsk>
      </View>
    </OnboardingShell>
  );
}
