import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { IOSSwitch, IconButton, PrimaryButton, Screen, SectionLabel, Segmented } from '../../components/ui';
import { CalendarPicker } from '../../components/ui/CalendarPicker';
import { addWeeks, todayISO } from '../../lib/dates';
import { formatAED } from '../../lib/money';
import { PRACTITIONERS } from '../../data/seed';
import { radii, spacing, type } from '../../theme';
import { useEterna, useTheme } from '../../store';
import type { RootStackParamList } from '../../navigation/types';
import type { ClinicService, Treatment, ZoneId } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'AddRitual'>;

/** Body zone for known treatment names, so the right part of the avatar glows. */
const ZONE_HINTS: Record<string, ZoneId> = {
  'Roots touch-up': 'hair', 'Cut & style': 'hair', 'Hair color': 'hair', 'Keratin treatment': 'hair',
  'Blow-dry': 'hair', 'Hair extensions': 'hair', 'Olaplex treatment': 'hair',
  Botox: 'face', Hydrafacial: 'face', 'Signature facial': 'face', Microneedling: 'face',
  'Chemical peel': 'face', 'Skin booster': 'face', 'Brow shaping': 'face', 'Brow lamination': 'face',
  'Lash lift': 'face', 'Lash extensions': 'face', Threading: 'face', 'Teeth whitening': 'face',
  'Lip filler': 'lips',
  'Gel manicure': 'hands', 'Acrylic nails': 'hands',
  Pedicure: 'legs', Waxing: 'legs', 'Leg wax': 'legs',
  'Deep tissue massage': 'torso', 'Body scrub': 'torso', Hammam: 'torso', 'Spray tan': 'torso',
  'Laser hair removal': 'hips', 'Body contouring': 'hips',
};
const SERVICE_ZONE: Record<ClinicService, ZoneId> = {
  Hair: 'hair', Skin: 'face', Nails: 'hands', 'Lashes & Brows': 'face', Spa: 'torso',
};

const UNITS = ['Days', 'Weeks', 'Months'];
const UNIT_MAP: Record<string, 'day' | 'week' | 'month'> = { Days: 'day', Weeks: 'week', Months: 'month' };

/**
 * Add a ritual the way she thinks: pick WHERE first (her clinics), then WHAT
 * from that clinic's own menu (its prices and times), then how often — nothing
 * pre-assumed: she sets the rhythm herself.
 */
export function AddRitualScreen({ navigation }: Props) {
  const t = useTheme();
  const clinics = useEterna((s) => s.clinics);
  const savedIds = useEterna((s) => s.savedClinicIds);
  const addTreatment = useEterna((s) => s.addTreatment);
  const showToast = useEterna((s) => s.showToast);

  const [clinicId, setClinicId] = useState<string>('');
  const [serviceName, setServiceName] = useState<string>('');
  const [oneOff, setOneOff] = useState(false);
  const [atHome, setAtHome] = useState(false);
  const [cadence, setCadence] = useState(0); // 0 = not chosen yet — her call
  const [unit, setUnit] = useState('Weeks');
  const [lastDoneISO, setLastDoneISO] = useState(addWeeks(todayISO(), -2));

  const saved = useMemo(() => clinics.filter((c) => savedIds.includes(c.id)), [clinics, savedIds]);
  const clinic = clinics.find((c) => c.id === clinicId);
  const offering = clinic?.offerings.find((o) => o.name === serviceName);
  const canSubmit = !!clinicId && !!offering && (oneOff || cadence > 0);

  const submit = () => {
    if (!canSubmit) return;
    if (!offering) return;
    const zone = ZONE_HINTS[offering.name] ?? SERVICE_ZONE[offering.service];
    const price = offering.price;
    const treatment: Treatment = {
      id: `t-add-${Date.now()}`,
      name: offering.name,
      zone,
      // a one-off doesn't repeat; the far-past "last done" keeps it visible in
      // event prep until she books it
      cadence: oneOff ? { every: 1, unit: 'month' } : { every: cadence, unit: UNIT_MAP[unit] ?? 'week' },
      clinicId,
      practitionerId: PRACTITIONERS[5]!.id,
      price,
      lastDoneISO: oneOff ? addWeeks(todayISO(), -520) : lastDoneISO,
      reminderOn: true,
      atHome: atHome || undefined,
      oneOff: oneOff || undefined,
    };
    addTreatment(treatment);
    showToast(`Added ${offering.name}`);
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
        {/* 1 · where — her clinics first */}
        <View style={{ gap: spacing.s }}>
          <SectionLabel>Where?</SectionLabel>
          <View style={{ gap: spacing.s }}>
            {saved.map((c) => {
              const sel = clinicId === c.id;
              return (
                <Pressable
                  key={c.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: sel }}
                  onPress={() => {
                    setClinicId(c.id);
                    setServiceName('');
                  }}
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

          </View>
        </View>

        {/* 2 · what — that clinic's own menu, its prices and times */}
        {clinic ? (
          <View style={{ gap: spacing.s }}>
            <SectionLabel>What do you get done at {clinic.name}?</SectionLabel>
            <View
              style={{
                borderRadius: radii.card,
                borderWidth: 1,
                borderColor: t.border,
                overflow: 'hidden',
              }}
            >
              {clinic.offerings.map((o, i) => {
                const sel = serviceName === o.name;
                return (
                  <Pressable
                    key={o.name}
                    accessibilityRole="button"
                    accessibilityState={{ selected: sel }}
                    onPress={() => setServiceName(o.name)}
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
                      <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '600', color: t.text }}>
                        {o.name}
                      </Text>
                      <Text style={{ fontSize: 12.5, color: t.sub, marginTop: 1 }}>
                        {formatAED(o.price)} · {o.mins} min
                      </Text>
                    </View>
                    {sel ? <Ionicons name="checkmark-circle" size={20} color={t.accent} /> : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* 3 · how often — entirely her choice, nothing pre-filled */}
        {clinic && offering ? (
          <>
            <View style={{ gap: spacing.s }}>
              <SectionLabel>How often?</SectionLabel>
              <Segmented
                options={['Repeats', 'Just once']}
                value={oneOff ? 'Just once' : 'Repeats'}
                onChange={(v) => setOneOff(v === 'Just once')}
              />
              {oneOff ? (
                <Text style={{ fontSize: 13, color: t.sub, paddingHorizontal: 4, lineHeight: 19 }}>
                  A one-off. It won't repeat on your avatar, it only shows when you're prepping for an event.
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
                      onPress={() => setCadence((c) => Math.max(0, c - 1))}
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
                    <Text
                      style={{
                        fontSize: 17,
                        fontWeight: '700',
                        color: cadence === 0 ? t.muted : t.text,
                        minWidth: 110,
                        textAlign: 'center',
                      }}
                    >
                      {cadence === 0 ? 'Choose' : `${cadence} ${unit.toLowerCase()}`}
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

            {/* last done — real date, her pick */}
            {oneOff ? null : (
              <View style={{ gap: spacing.s }}>
                <SectionLabel>Last done</SectionLabel>
                <CalendarPicker value={lastDoneISO} onSelect={setLastDoneISO} maxISO={todayISO()} />
              </View>
            )}
          </>
        ) : null}
      </ScrollView>

      <View style={{ position: 'absolute', left: spacing.xl, right: spacing.xl, bottom: spacing.xxl }}>
        <PrimaryButton title="Add to rituals" onPress={submit} disabled={!canSubmit} />
      </View>
    </Screen>
  );
}
