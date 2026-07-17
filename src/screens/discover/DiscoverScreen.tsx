import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Card, Chip, Screen } from '../../components/ui';
import { ClinicCardSkeleton } from '../../components/anim/Shimmer';
import { radii, spacing, type } from '../../theme';
import { useEterna, useTheme } from '../../store';
import type { RootStackParamList, TabParamList } from '../../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Discover'>,
  NativeStackScreenProps<RootStackParamList>
>;

const FILTERS = ['All', 'Hair', 'Skin', 'Nails', 'Lashes & Brows', 'Spa'];

/** Discover — find and save new places. Booking a specific ritual lives in
 *  the Book flow; here you explore, save, and request open slots. */
export function DiscoverScreen(_props: Props) {
  const t = useTheme();
  const clinics = useEterna((s) => s.clinics);
  const savedIds = useEterna((s) => s.savedClinicIds);
  const toggleSaved = useEterna((s) => s.toggleSavedClinic);
  const showToast = useEterna((s) => s.showToast);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [expanded, setExpanded] = useState<string | null>(null);
  // Skeleton pass on first open — becomes the real fetch state with Supabase.
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(id);
  }, []);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clinics.filter((c) => {
      if (filter !== 'All' && c.category !== filter) return false;
      if (q && !c.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [clinics, filter, query]);

  return (
    <Screen>
      <View style={{ paddingTop: spacing.s, gap: spacing.m }}>
        <Text style={[type.largeTitle, { color: t.text }]}>Discover</Text>
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
            placeholder="Salons, clinics, spas"
            placeholderTextColor={t.muted}
            style={{ flex: 1, paddingVertical: 12, fontSize: 16, color: t.text }}
            autoCorrect={false}
            accessibilityLabel="Search places"
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={18} color={t.muted} />
            </Pressable>
          ) : null}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.s }}>
          {FILTERS.map((f) => (
            <Chip key={f} label={f} selected={filter === f} onPress={() => setFilter(f)} />
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={{ marginTop: spacing.l }}
        contentContainerStyle={{ gap: spacing.m, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <>
            <ClinicCardSkeleton />
            <ClinicCardSkeleton />
            <ClinicCardSkeleton />
            <ClinicCardSkeleton />
          </>
        ) : list.length === 0 ? (
          <Card>
            <Text style={{ fontSize: 14, color: t.sub }}>No places match your search.</Text>
          </Card>
        ) : (
          list.map((c) => {
            const saved = savedIds.includes(c.id);
            const open = expanded === c.id;
            return (
              <Card key={c.id} onPress={() => setExpanded(open ? null : c.id)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.m }}>
                  <View
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: radii.m,
                      backgroundColor: t.accentSoft,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 18, fontWeight: '700', color: t.accent }}>
                      {c.name[0]}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: t.text }}>{c.name}</Text>
                    <Text style={{ fontSize: 13, color: t.sub, marginTop: 1 }}>
                      {c.category}
                      {c.rating > 0 ? ` · ${c.rating.toFixed(1)}` : ''}
                      {c.distanceKm > 0 ? ` · ${c.distanceKm} km` : ''}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={saved ? `Remove ${c.name} from my clinics` : `Save ${c.name}`}
                    onPress={() => {
                      toggleSaved(c.id);
                      showToast(saved ? 'Removed from your clinics' : 'Saved to your clinics');
                    }}
                    style={({ pressed }) => ({
                      width: 38,
                      height: 38,
                      borderRadius: 19,
                      backgroundColor: saved ? t.accentSoft : t.surfaceAlt,
                      alignItems: 'center',
                      justifyContent: 'center',
                      transform: [{ scale: pressed ? 0.9 : 1 }],
                    })}
                  >
                    <Ionicons
                      name={saved ? 'bookmark' : 'bookmark-outline'}
                      size={17}
                      color={saved ? t.accent : t.muted}
                    />
                  </Pressable>
                </View>
                {open && c.slots.length > 0 ? (
                  <View style={{ marginTop: spacing.m, borderTopWidth: 1, borderTopColor: t.separator, paddingTop: spacing.m }}>
                    <Text style={[type.label, { color: t.muted, marginBottom: spacing.s }]}>
                      Next available
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s }}>
                      {c.slots.map((s) => (
                        <Pressable
                          key={s}
                          accessibilityRole="button"
                          onPress={() => showToast(`Requested ${s} at ${c.name}`)}
                          style={({ pressed }) => ({
                            paddingVertical: 9,
                            paddingHorizontal: 14,
                            borderRadius: radii.pill,
                            backgroundColor: t.accentSoft,
                            transform: [{ scale: pressed ? 0.94 : 1 }],
                          })}
                        >
                          <Text style={{ fontSize: 13, fontWeight: '600', color: t.accent }}>{s}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ) : null}
              </Card>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}
