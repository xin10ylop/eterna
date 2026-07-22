import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { IOSSwitch, IconButton, PrimaryButton, Screen, SectionLabel, Segmented } from '../../components/ui';
import { addWeeks, todayISO } from '../../lib/dates';
import { formatAED } from '../../lib/money';
import { PRACTITIONERS } from '../../data/seed';
import { radii, spacing, type } from '../../theme';
import { useEterna, useTheme } from '../../store';
import type { RootStackParamList } from '../../navigation/types';
import type { Clinic, Treatment, ZoneId } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'AddRitual'>;

type CatalogItem = { name: string; zone: ZoneId; price: number; cadence: number };

/** A broad catalogue — too many to fit, so it's searchable. */
const CATALOG: CatalogItem[] = [
  { name: 'Roots touch-up', zone: 'hair', price: 380, cadence: 6 },
  { name: 'Cut & style', zone: 'hair', price: 280, cadence: 8 },
  { name: 'Hair color', zone: 'hair', price: 450, cadence: 8 },
  { name: 'Keratin treatment', zone: 'hair', price: 700, cadence: 16 },
  { name: 'Blow-dry', zone: 'hair', price: 120, cadence: 2 },
  { name: 'Hair extensions', zone: 'hair', price: 1200, cadence: 8 },
  { name: 'Olaplex treatment', zone: 'hair', price: 200, cadence: 4 },
  { name: 'Botox', zone: 'face', price: 960, cadence: 16 },
  { name: 'Lip filler', zone: 'lips', price: 1120, cadence: 12 },
  { name: 'Hydrafacial', zone: 'face', price: 440, cadence: 4 },
  { name: 'Signature facial', zone: 'face', price: 350, cadence: 4 },
  { name: 'Microneedling', zone: 'face', price: 600, cadence: 4 },
  { name: 'Chemical peel', zone: 'face', price: 500, cadence: 6 },
  { name: 'Skin booster', zone: 'face', price: 900, cadence: 12 },
  { name: 'Brow shaping', zone: 'face', price: 140, cadence: 3 },
  { name: 'Brow lamination', zone: 'face', price: 300, cadence: 6 },
  { name: 'Lash lift', zone: 'face', price: 320, cadence: 6 },
  { name: 'Lash extensions', zone: 'face', price: 400, cadence: 3 },
  { name: 'Threading', zone: 'face', price: 60, cadence: 2 },
  { name: 'Teeth whitening', zone: 'face', price: 1500, cadence: 26 },
  { name: 'Gel manicure', zone: 'hands', price: 180, cadence: 3 },
  { name: 'Acrylic nails', zone: 'hands', price: 250, cadence: 3 },
  { name: 'Pedicure', zone: 'legs', price: 220, cadence: 4 },
  { name: 'Laser hair removal', zone: 'hips', price: 480, cadence: 6 },
  { name: 'Waxing', zone: 'legs', price: 200, cadence: 4 },
  { name: 'Deep tissue massage', zone: 'torso', price: 340, cadence: 4 },
  { name: 'Body scrub', zone: 'torso', price: 280, cadence: 6 },
  { name: 'Hammam', zone: 'torso', price: 300, cadence: 4 },
  { name: 'Spray tan', zone: 'torso', price: 200, cadence: 2 },
  { name: 'Body contouring', zone: 'hips', price: 800, cadence: 4 },
  { name: 'Something else', zone: 'torso', price: 200, cadence: 6 },
];

const ZONE_LABEL: Record<ZoneId, string> = {
  hair: 'Hair',
  face: 'Face',
  lips: 'Lips',
  torso: 'Body',
  hands: 'Hands',
  hips: 'Hips',
  legs: 'Legs',
};

const LAST_OPTS = ['Today', '2 weeks ago', '1 month ago'];
const UNITS = ['Days', 'Weeks', 'Months'];
const UNIT_MAP: Record<string, 'day' | 'week' | 'month'> = { Days: 'day', Weeks: 'week', Months: 'month' };

/** Which kind of salon a zone's rituals belong to, so a new ritual defaults to a
 *  sensible clinic instead of whatever happens to be first. */
const ZONE_CATEGORY: Record<ZoneId, Clinic['category']> = {
  hair: 'Hair',
  face: 'Skin',
  lips: 'Skin',
  torso: 'Spa',
  hands: 'Nails',
  hips: 'Spa',
  legs: 'Spa',
};

/** Add a ritual: search the catalogue, set cadence, pick where (your clinics or
 *  browse Discover, or add your own). */
export function AddRitualScreen({ navigation }: Props) {
  const t = useTheme();
  const clinics = useEterna((s) => s.clinics);
  const savedIds = useEterna((s) => s.savedClinicIds);
  const addTreatment = useEterna((s) => s.addTreatment);
  const addOwnClinic = useEterna((s) => s.addOwnClinic);
  const showToast = useEterna((s) => s.showToast);

  const [query, setQuery] = useState('');
  const [pick, setPick] = useState<CatalogItem>(CATALOG[0]!);
  const [last, setLast] = useState('2 weeks ago');
  const [cadence, setCadence] = useState(pick.cadence);
  const [unit, setUnit] = useState('Weeks');
  const matchClinic = (zone: ZoneId): string => {
    const sc = clinics.filter((c) => savedIds.includes(c.id));
    return sc.find((c) => c.category === ZONE_CATEGORY[zone])?.id ?? sc[0]?.id ?? '';
  };
  const [clinicId, setClinicId] = useState<string>(matchClinic(CATALOG[0]!.zone));
  const [ownName, setOwnName] = useState('');
  const [oneOff, setOneOff] = useState(false);
  const [atHome, setAtHome] = useState(false);

  const saved = useMemo(() => clinics.filter((c) => savedIds.includes(c.id)), [clinics, savedIds]);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? CATALOG.filter((c) => c.name.toLowerCase().includes(q)) : CATALOG;
  }, [query]);

  const lastISO =
    last === 'Today' ? todayISO() : last === '2 weeks ago' ? addWeeks(todayISO(), -2) : addWeeks(todayISO(), -4);

  const submit = () => {
    if (!clinicId) return;
    const practitioner = PRACTITIONERS[5]!;
    const treatment: Treatment = {
      id: `t-add-${Date.now()}`,
      name: pick.name,
      zone: pick.zone,
      // a one-off doesn't repeat; a far-past "last done" keeps it showing as
      // still-to-do in event prep until it's booked
      cadence: oneOff ? { every: 1, unit: 'month' } : { every: cadence, unit: UNIT_MAP[unit] ?? 'week' },
      clinicId,
      practitionerId: practitioner.id,
      price: pick.price,
      lastDoneISO: oneOff ? addWeeks(todayISO(), -520) : lastISO,
      reminderOn: true,
      atHome: atHome || undefined,
      oneOff: oneOff || undefined,
    };
    addTreatment(treatment);
    showToast('Added to your rituals');
    navigation.goBack();
  };

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.m, paddingTop: spacing.s }}>
        <IconButton name="close" onPress={() => navigation.goBack()} accessibilityLabel="Close" />
        <Text style={[type.title, { color: t.text }]}>Add a ritual</Text>
      </View>

      <ScrollView
        style={{ marginTop: spacing.l }}
        contentContainerStyle={{ gap: spacing.xl, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* what — searchable list */}
        <View style={{ gap: spacing.s }}>
          <SectionLabel>What is it?</SectionLabel>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.s,
              backgroundColor: t.surface,
              borderRadius: radii.m,
              borderWidth: 1,
              borderColor: t.border,
              paddingHorizontal: 12,
            }}
          >
            <Ionicons name="search" size={16} color={t.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search treatments"
              placeholderTextColor={t.muted}
              style={{ flex: 1, paddingVertical: 11, fontSize: 15, color: t.text }}
              autoCorrect={false}
              accessibilityLabel="Search treatments"
            />
            {query ? (
              <Pressable onPress={() => setQuery('')} accessibilityLabel="Clear">
                <Ionicons name="close-circle" size={17} color={t.muted} />
              </Pressable>
            ) : null}
          </View>
          <View
            style={{
              maxHeight: 280,
              borderRadius: radii.l,
              borderWidth: 1,
              borderColor: t.border,
              overflow: 'hidden',
            }}
          >
            <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
              {results.map((c, i) => {
                const sel = pick.name === c.name;
                return (
                  <Pressable
                    key={c.name}
                    accessibilityRole="button"
                    accessibilityState={{ selected: sel }}
                    onPress={() => {
                      setPick(c);
                      setCadence(c.cadence);
                      // catalogue intervals are in weeks; keep the unit in sync
                      setUnit('Weeks');
                      // default to a clinic that actually does this kind of ritual
                      setClinicId(matchClinic(c.zone));
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.m,
                      paddingVertical: 12,
                      paddingHorizontal: spacing.m,
                      backgroundColor: sel ? t.accentSoft : t.bg,
                      borderTopWidth: i === 0 ? 0 : 1,
                      borderTopColor: t.separator,
                    }}
                  >
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: t.text }}>{c.name}</Text>
                      <Text style={{ fontSize: 12.5, color: t.sub, marginTop: 1 }}>
                        {ZONE_LABEL[c.zone]} · {formatAED(c.price)}
                      </Text>
                    </View>
                    {sel ? <Ionicons name="checkmark-circle" size={20} color={t.accent} /> : null}
                  </Pressable>
                );
              })}
              {results.length === 0 ? (
                <Text style={{ fontSize: 14, color: t.sub, padding: spacing.l }}>No matches.</Text>
              ) : null}
            </ScrollView>
          </View>
        </View>

        {/* last done */}
        <View style={{ gap: spacing.s }}>
          <SectionLabel>Last done</SectionLabel>
          <Segmented options={LAST_OPTS} value={last} onChange={setLast} />
        </View>

        {/* how often — repeats on a cadence, or a one-off for an event */}
        <View style={{ gap: spacing.s }}>
          <SectionLabel>How often?</SectionLabel>
          <Segmented
            options={['Repeats', 'Just once']}
            value={oneOff ? 'Just once' : 'Repeats'}
            onChange={(v) => setOneOff(v === 'Just once')}
          />
          {oneOff ? (
            <Text style={{ fontSize: 13, color: t.sub, paddingHorizontal: 4, lineHeight: 19 }}>
              A one-off — it won't repeat on your avatar, it only shows when you're prepping for an event.
            </Text>
          ) : (
            <>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing.xl,
                  backgroundColor: t.surface,
                  borderRadius: radii.card,
                  paddingVertical: spacing.l,
                }}
              >
                <Pressable
                  accessibilityLabel="Less often"
                  onPress={() => setCadence((c) => Math.max(1, c - 1))}
                  style={({ pressed }) => ({
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: t.surfaceAlt,
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: [{ scale: pressed ? 0.9 : 1 }],
                  })}
                >
                  <Ionicons name="remove" size={18} color={t.accent} />
                </Pressable>
                <Text style={{ fontSize: 17, fontWeight: '700', color: t.text, minWidth: 96, textAlign: 'center' }}>
                  {cadence} {unit.toLowerCase()}
                </Text>
                <Pressable
                  accessibilityLabel="More often"
                  onPress={() => setCadence((c) => Math.min(365, c + 1))}
                  style={({ pressed }) => ({
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: t.surfaceAlt,
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: [{ scale: pressed ? 0.9 : 1 }],
                  })}
                >
                  <Ionicons name="add" size={18} color={t.accent} />
                </Pressable>
              </View>
              <Segmented options={UNITS} value={unit} onChange={setUnit} />
            </>
          )}
        </View>

        {/* at home */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.m }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: t.text }}>At home</Text>
            <Text style={{ fontSize: 12.5, color: t.sub, marginTop: 1 }}>
              A home-visit beautician instead of the salon.
            </Text>
          </View>
          <IOSSwitch on={atHome} onToggle={() => setAtHome((v) => !v)} />
        </View>

        {/* where */}
        <View style={{ gap: spacing.s }}>
          <SectionLabel>Where do you get it done?</SectionLabel>
          <View style={{ gap: spacing.s }}>
            {saved.map((c) => {
              const sel = clinicId === c.id;
              return (
                <Pressable
                  key={c.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: sel }}
                  onPress={() => setClinicId(c.id)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.m,
                    backgroundColor: t.surface,
                    borderRadius: radii.l,
                    borderWidth: sel ? 1.5 : 1,
                    borderColor: sel ? t.accent : t.border,
                    padding: spacing.m,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  })}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: radii.s,
                      backgroundColor: t.accentSoft,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontWeight: '700', color: t.accent }}>{c.name[0]}</Text>
                  </View>
                  <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: t.text }}>{c.name}</Text>
                  {sel ? <Ionicons name="checkmark-circle" size={22} color={t.accent} /> : null}
                </Pressable>
              );
            })}

            {/* browse in Discover */}
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('Tabs', { screen: 'Discover' })}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.s,
                paddingVertical: 12,
                borderRadius: radii.l,
                borderWidth: 1,
                borderColor: t.border,
                transform: [{ scale: pressed ? 0.99 : 1 }],
              })}
            >
              <Ionicons name="search" size={15} color={t.accent} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: t.accent }}>Browse clinics</Text>
            </Pressable>

            {/* add your own */}
            <View style={{ flexDirection: 'row', gap: spacing.s }}>
              <TextInput
                value={ownName}
                onChangeText={setOwnName}
                placeholder="Add your own clinic"
                placeholderTextColor={t.muted}
                accessibilityLabel="Add your own clinic"
                style={{
                  flex: 1,
                  backgroundColor: t.surface,
                  borderRadius: radii.m,
                  borderWidth: 1,
                  borderColor: t.border,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 15,
                  color: t.text,
                }}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add clinic"
                onPress={() => {
                  const name = ownName.trim();
                  if (!name) return;
                  const clinic = addOwnClinic(name);
                  setClinicId(clinic.id);
                  setOwnName('');
                  showToast(`Added ${name}`);
                }}
                style={({ pressed }) => ({
                  paddingHorizontal: 18,
                  borderRadius: radii.m,
                  backgroundColor: ownName.trim() ? t.accent : t.faint,
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                })}
              >
                <Text style={{ color: ownName.trim() ? t.onAccent : t.sub, fontWeight: '600' }}>Add</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', left: spacing.xl, right: spacing.xl, bottom: spacing.xxl }}>
        <PrimaryButton title="Add to rituals" onPress={submit} disabled={!clinicId} />
      </View>
    </Screen>
  );
}
