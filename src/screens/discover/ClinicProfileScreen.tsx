import React, { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { IconButton, Screen } from '../../components/ui';
import { formatAED } from '../../lib/money';
import { radii, spacing, type } from '../../theme';
import { useEterna, useTheme } from '../../store';
import { useT } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ClinicProfile'>;

/**
 * A clinic's profile, like she'd expect from Maps or Instagram: logo, name,
 * Google rating, what kind of place it is, where it is (one tap to Maps) —
 * and the services behind a "check them" interaction with search, because a
 * real clinic can list 10 or 100.
 */
export function ClinicProfileScreen({ navigation, route }: Props) {
  const t = useTheme();
  const tr = useT();
  const clinic = useEterna((s) => s.clinics.find((c) => c.id === route.params.clinicId));
  const savedIds = useEterna((s) => s.savedClinicIds);
  const toggleSaved = useEterna((s) => s.toggleSavedClinic);
  const showToast = useEterna((s) => s.showToast);
  const [showServices, setShowServices] = useState(false);
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!clinic) return [];
    const q = query.trim().toLowerCase();
    return q ? clinic.offerings.filter((o) => o.name.toLowerCase().includes(q)) : clinic.offerings;
  }, [clinic, query]);

  if (!clinic) {
    return (
      <Screen>
        <Text style={{ marginTop: 100, textAlign: 'center', color: t.sub }}>{tr('discover.none')}</Text>
      </Screen>
    );
  }
  const saved = savedIds.includes(clinic.id);

  const openMaps = () => {
    const q = encodeURIComponent(`${clinic.name}, ${clinic.address ?? 'Dubai'}`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`);
  };

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: spacing.s }}>
        <IconButton name="chevron-back" onPress={() => navigation.goBack()} accessibilityLabel="Back" />
      </View>

      <ScrollView
        style={{ marginTop: spacing.s }}
        contentContainerStyle={{ gap: spacing.l, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* identity */}
        <View style={{ alignItems: 'center', gap: spacing.s }}>
          {/* logo placeholder — becomes the clinic's uploaded logo later */}
          <View
            style={{
              width: 84,
              height: 84,
              borderRadius: 24,
              backgroundColor: t.accentSoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 34, fontWeight: '700', color: t.accent }}>{clinic.name[0]}</Text>
          </View>
          <Text style={[type.title, { color: t.text, textAlign: 'center' }]}>{clinic.name}</Text>
          {/* Google rating line */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Ionicons name="star" size={14} color="#E8A33D" />
            <Text style={{ fontSize: 14.5, fontWeight: '700', color: t.text }}>
              {clinic.rating.toFixed(1)}
            </Text>
            <Text style={{ fontSize: 13.5, color: t.sub }}>
              · {tr('discover.googleReviews', { n: clinic.reviews ?? 0 })}
            </Text>
          </View>
          {/* what kind of place */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
            {clinic.services.map((s) => (
              <View
                key={s}
                style={{
                  backgroundColor: t.surfaceAlt,
                  borderWidth: 1,
                  borderColor: t.border,
                  borderRadius: radii.pill,
                  paddingHorizontal: 11,
                  paddingVertical: 4,
                }}
              >
                <Text style={{ fontSize: 12.5, fontWeight: '600', color: t.sub }}>
                  {tr('filter.' + s)}
                </Text>
              </View>
            ))}
            {clinic.homeService ? (
              <View
                style={{
                  backgroundColor: t.accentSoft,
                  borderRadius: radii.pill,
                  paddingHorizontal: 11,
                  paddingVertical: 4,
                }}
              >
                <Text style={{ fontSize: 12.5, fontWeight: '600', color: t.accent }}>
                  {tr('discover.homeService')}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* location — one tap to Google Maps */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tr('discover.openMaps')}
          onPress={openMaps}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.m,
            backgroundColor: t.surface,
            borderRadius: radii.card,
            borderWidth: 1,
            borderColor: t.border,
            padding: spacing.m,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: t.accentSoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="location" size={18} color={t.accent} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={{ fontSize: 14.5, fontWeight: '600', color: t.text }}>
              {clinic.address ?? 'Dubai'}
            </Text>
            <Text style={{ fontSize: 12.5, color: t.sub, marginTop: 1 }}>
              {clinic.distanceKm > 0 ? `${clinic.distanceKm} km · ` : ''}
              {tr('discover.openMaps')}
            </Text>
          </View>
          <Ionicons name="open-outline" size={17} color={t.accent} />
        </Pressable>

        {/* services — behind a tap, searchable: could be 10, could be 100 */}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: showServices }}
          onPress={() => setShowServices((v) => !v)}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.m,
            backgroundColor: t.surface,
            borderRadius: radii.card,
            borderWidth: 1,
            borderColor: t.border,
            padding: spacing.m,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: t.accentSoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="list" size={18} color={t.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14.5, fontWeight: '600', color: t.text }}>
              {tr('discover.servicesTitle')}
            </Text>
            <Text style={{ fontSize: 12.5, color: t.sub, marginTop: 1 }}>
              {tr('discover.servicesCount', { n: clinic.offerings.length })}
            </Text>
          </View>
          <Ionicons name={showServices ? 'chevron-up' : 'chevron-down'} size={17} color={t.muted} />
        </Pressable>

        {showServices ? (
          <View style={{ gap: spacing.s, marginTop: -spacing.s }}>
            {clinic.offerings.length > 6 ? (
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
              }}
            >
              {results.map((o, i) => (
                <View
                  key={o.name}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.m,
                    paddingVertical: 12,
                    paddingHorizontal: spacing.m,
                    backgroundColor: t.bg,
                    borderTopWidth: i === 0 ? 0 : 1,
                    borderTopColor: t.separator,
                  }}
                >
                  <Text numberOfLines={1} style={{ flex: 1, fontSize: 14.5, fontWeight: '600', color: t.text }}>
                    {o.name}
                  </Text>
                  <Text style={{ fontSize: 12.5, color: t.sub }}>
                    {formatAED(o.price)} · {o.mins} {tr('clinics.min')}
                  </Text>
                </View>
              ))}
              {results.length === 0 ? (
                <Text style={{ fontSize: 13.5, color: t.sub, padding: spacing.m }}>
                  {tr('discover.none')}
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* one clear action */}
      <View style={{ position: 'absolute', left: spacing.xl, right: spacing.xl, bottom: spacing.xxl }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            if (!saved) {
              toggleSaved(clinic.id);
              showToast(`${clinic.name} ✓`);
            }
          }}
          style={({ pressed }) => ({
            paddingVertical: 15,
            borderRadius: radii.l,
            alignItems: 'center',
            backgroundColor: saved ? t.faint : t.accent,
            transform: [{ scale: pressed && !saved ? 0.98 : 1 }],
          })}
        >
          <Text style={{ color: saved ? t.sub : t.onAccent, fontSize: 16, fontWeight: '700' }}>
            {saved ? tr('discover.inMyClinics') : tr('discover.addToMyClinics')}
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
