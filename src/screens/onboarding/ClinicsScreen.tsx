import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { GhostButton } from '../../components/ui';
import { OnboardingShell } from './OnboardingShell';
import { formatAED } from '../../lib/money';
import { radii, spacing } from '../../theme';
import { useEterna, useTheme } from '../../store';
import type { RootStackParamList } from '../../navigation/types';

/**
 * "Where do you go?" — tap a place to open its menu, tick what you do there.
 * That's the whole interaction; skippable, editable later in My clinics.
 */
export function ClinicsScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Clinics'>) {
  const t = useTheme();
  const clinics = useEterna((s) => s.clinics);
  const myServices = useEterna((s) => s.myServices);
  const toggleMyService = useEterna((s) => s.toggleMyService);
  const [open, setOpen] = useState<string | null>(null);

  const chosenCount = Object.values(myServices).reduce((n, list) => n + list.length, 0);

  return (
    <OnboardingShell
      step={3}
      alignTop
      title="Where do you go?"
      subtitle="Tap a place and tick what you do there. Change it any time."
      cta={chosenCount > 0 ? `Continue with ${chosenCount}` : 'Continue'}
      onNext={() => navigation.navigate('Plan')}
      footer={<GhostButton title="Skip for now" onPress={() => navigation.navigate('Plan')} />}
    >
      <View style={{ gap: spacing.s, paddingTop: spacing.s }}>
        {clinics.map((c) => {
          const mine = myServices[c.id] ?? [];
          const isOpen = open === c.id;
          return (
            <View
              key={c.id}
              style={{
                backgroundColor: t.surfaceAlt,
                borderRadius: radii.l,
                borderWidth: 1,
                borderColor: mine.length > 0 ? t.accent : t.border,
                overflow: 'hidden',
              }}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
                onPress={() => setOpen(isOpen ? null : c.id)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.m,
                  padding: spacing.m,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 11,
                    backgroundColor: t.accentSoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '700', color: t.accent }}>{c.name[0]}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '600', color: t.text }}>
                    {c.name}
                  </Text>
                  {mine.length > 0 ? (
                    <Text style={{ fontSize: 12, color: t.accent, marginTop: 1 }}>
                      {mine.length} chosen
                    </Text>
                  ) : null}
                </View>
                <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={17} color={t.muted} />
              </Pressable>
              {isOpen
                ? c.offerings.map((o) => {
                    const on = mine.includes(o.name);
                    return (
                      <Pressable
                        key={o.name}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: on }}
                        onPress={() => toggleMyService(c.id, o.name)}
                        style={({ pressed }) => ({
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: spacing.m,
                          paddingVertical: 11,
                          paddingHorizontal: spacing.m,
                          backgroundColor: on ? t.accentSoft : 'transparent',
                          opacity: pressed ? 0.7 : 1,
                        })}
                      >
                        <View
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 11,
                            borderWidth: 1.5,
                            borderColor: on ? t.accent : t.muted,
                            backgroundColor: on ? t.accent : 'transparent',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {on ? <Ionicons name="checkmark" size={14} color={t.onAccent} /> : null}
                        </View>
                        <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: t.text }}>
                          {o.name}
                        </Text>
                        <Text style={{ fontSize: 12.5, color: t.sub }}>
                          {formatAED(o.price)} · {o.mins} min
                        </Text>
                      </Pressable>
                    );
                  })
                : null}
            </View>
          );
        })}
      </View>
    </OnboardingShell>
  );
}
