import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Card, Chip, IconButton, PrimaryButton, Screen, SectionLabel, Segmented } from '../../components/ui';
import { addWeeks, todayISO } from '../../lib/dates';
import { PRACTITIONERS } from '../../data/seed';
import { radii, spacing, type } from '../../theme';
import { useEterna, useTheme } from '../../store';
import type { RootStackParamList } from '../../navigation/types';
import type { Treatment, ZoneId } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'AddRitual'>;

const CATALOG: { name: string; zone: ZoneId; price: number; cadence: number }[] = [
  { name: 'Lash lift', zone: 'face', price: 60, cadence: 8 },
  { name: 'Brow lamination', zone: 'face', price: 55, cadence: 6 },
  { name: 'Teeth whitening', zone: 'face', price: 150, cadence: 26 },
  { name: 'Skin booster', zone: 'face', price: 190, cadence: 12 },
  { name: 'Massage', zone: 'torso', price: 85, cadence: 4 },
  { name: 'Hand care', zone: 'hands', price: 35, cadence: 3 },
  { name: 'Body scrub', zone: 'hips', price: 70, cadence: 6 },
  { name: 'Something else', zone: 'torso', price: 50, cadence: 6 },
];

const LAST_OPTS = ['Today', '2 weeks ago', '1 month ago'];

/** Add a ritual: what, cadence, where (your clinics or add your own). */
export function AddRitualScreen({ navigation }: Props) {
  const t = useTheme();
  const clinics = useEterna((s) => s.clinics);
  const savedIds = useEterna((s) => s.savedClinicIds);
  const addTreatment = useEterna((s) => s.addTreatment);
  const addOwnClinic = useEterna((s) => s.addOwnClinic);
  const showToast = useEterna((s) => s.showToast);

  const [pick, setPick] = useState(CATALOG[0]!);
  const [last, setLast] = useState('2 weeks ago');
  const [cadence, setCadence] = useState(pick.cadence);
  const [clinicId, setClinicId] = useState<string>(savedIds[0] ?? '');
  const [ownName, setOwnName] = useState('');

  const saved = useMemo(() => clinics.filter((c) => savedIds.includes(c.id)), [clinics, savedIds]);

  const lastISO =
    last === 'Today' ? todayISO() : last === '2 weeks ago' ? addWeeks(todayISO(), -2) : addWeeks(todayISO(), -4);

  const submit = () => {
    if (!clinicId) return;
    const practitioner = PRACTITIONERS[5]!;
    const treatment: Treatment = {
      id: `t-add-${Date.now()}`,
      name: pick.name,
      zone: pick.zone,
      cadenceWeeks: cadence,
      clinicId,
      practitionerId: practitioner.id,
      priceEUR: pick.price,
      lastDoneISO: lastISO,
      reminderOn: true,
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
        <View style={{ gap: spacing.s }}>
          <SectionLabel>What is it?</SectionLabel>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s }}>
            {CATALOG.map((c) => (
              <Chip
                key={c.name}
                label={c.name}
                selected={pick.name === c.name}
                onPress={() => {
                  setPick(c);
                  setCadence(c.cadence);
                }}
              />
            ))}
          </View>
        </View>

        <View style={{ gap: spacing.s }}>
          <SectionLabel>Last done</SectionLabel>
          <Segmented options={LAST_OPTS} value={last} onChange={setLast} />
        </View>

        <View style={{ gap: spacing.s }}>
          <SectionLabel>Repeat every</SectionLabel>
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xl }}>
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
              <Text style={{ fontSize: 17, fontWeight: '700', color: t.text, minWidth: 90, textAlign: 'center' }}>
                {cadence} weeks
              </Text>
              <Pressable
                accessibilityLabel="More often"
                onPress={() => setCadence((c) => Math.min(52, c + 1))}
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
          </Card>
        </View>

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
                      width: 38,
                      height: 38,
                      borderRadius: radii.s,
                      backgroundColor: t.accentSoft,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontWeight: '700', color: t.accent }}>{c.name[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: t.text }}>{c.name}</Text>
                    <Text style={{ fontSize: 13, color: t.sub }}>
                      {c.category}
                      {c.distanceKm > 0 ? ` · ${c.distanceKm} km` : ''}
                    </Text>
                  </View>
                  {sel ? <Ionicons name="checkmark-circle" size={22} color={t.accent} /> : null}
                </Pressable>
              );
            })}
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
