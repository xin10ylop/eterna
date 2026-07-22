import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatAED } from '../lib/money';
import { radii, spacing } from '../theme';
import { useTheme } from '../store';
import { useT } from '../i18n';
import type { ClinicOffering } from '../types';

/**
 * ONE way to show a clinic's services everywhere in the app: a search field
 * (a clinic can list 10 or 100) over a fixed-height box she scrolls inside.
 * Three behaviours, same look:
 *   read — just look (clinic profile)
 *   pick — choose exactly one (adding a ritual)
 *   tick — keep several (my clinics, onboarding)
 */
export function ServiceMenu({
  offerings,
  mode = 'read',
  pickedName,
  onPick,
  tickedNames,
  onToggle,
  maxHeight = 300,
}: {
  offerings: ClinicOffering[];
  mode?: 'read' | 'pick' | 'tick';
  pickedName?: string;
  onPick?: (name: string) => void;
  tickedNames?: string[];
  onToggle?: (name: string) => void;
  maxHeight?: number;
}) {
  const t = useTheme();
  const tr = useT();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? offerings.filter((o) => o.name.toLowerCase().includes(q)) : offerings;
  }, [offerings, query]);

  return (
    <View style={{ gap: spacing.s }}>
      {offerings.length > 6 ? (
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
          <Ionicons name="search" size={15} color={t.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={tr('discover.searchServices')}
            placeholderTextColor={t.muted}
            accessibilityLabel={tr('discover.searchServices')}
            style={{ flex: 1, paddingVertical: 10, fontSize: 14.5, color: t.text }}
          />
        </View>
      ) : null}

      <View
        style={{
          borderRadius: radii.card,
          borderWidth: 1,
          borderColor: t.border,
          overflow: 'hidden',
          maxHeight,
        }}
      >
        <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
          {results.map((o, i) => {
            const picked = mode === 'pick' && pickedName === o.name;
            const ticked = mode === 'tick' && (tickedNames ?? []).includes(o.name);
            const active = picked || ticked;
            const row = (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.m,
                  paddingVertical: 12,
                  paddingHorizontal: spacing.m,
                  backgroundColor: active ? t.accentSoft : t.bg,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: t.separator,
                }}
              >
                {mode === 'tick' ? (
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      borderWidth: 1.5,
                      borderColor: ticked ? t.accent : t.muted,
                      backgroundColor: ticked ? t.accent : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {ticked ? <Ionicons name="checkmark" size={14} color={t.onAccent} /> : null}
                  </View>
                ) : null}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={{ fontSize: 14.5, fontWeight: '600', color: t.text }}>
                    {o.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: t.sub, marginTop: 1 }}>
                    {formatAED(o.price)} · {o.mins} {tr('clinics.min')}
                  </Text>
                </View>
                {picked ? <Ionicons name="checkmark-circle" size={20} color={t.accent} /> : null}
              </View>
            );
            if (mode === 'read') return <View key={o.name}>{row}</View>;
            return (
              <Pressable
                key={o.name}
                accessibilityRole={mode === 'tick' ? 'checkbox' : 'button'}
                accessibilityState={mode === 'tick' ? { checked: ticked } : { selected: picked }}
                onPress={() => (mode === 'tick' ? onToggle?.(o.name) : onPick?.(o.name))}
              >
                {row}
              </Pressable>
            );
          })}
          {results.length === 0 ? (
            <Text style={{ fontSize: 13.5, color: t.sub, padding: spacing.m }}>
              {tr('discover.none')}
            </Text>
          ) : null}
        </ScrollView>
      </View>
    </View>
  );
}
