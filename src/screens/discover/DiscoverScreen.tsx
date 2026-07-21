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
import { useT } from '../../i18n';
import type { RootStackParamList, TabParamList } from '../../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Discover'>,
  NativeStackScreenProps<RootStackParamList>
>;

const FILTERS = ['All', 'Hair', 'Skin', 'Nails', 'Lashes & Brows', 'Spa'];

/** Discover, find and save new places. Booking a specific ritual lives in
 *  the Book flow; here you explore, save, and request open slots. */
export function DiscoverScreen(_props: Props) {
  const t = useTheme();
  const tr = useT();
  const clinics = useEterna((s) => s.clinics);
  const savedIds = useEterna((s) => s.savedClinicIds);
  const toggleSaved = useEterna((s) => s.toggleSavedClinic);
  const showToast = useEterna((s) => s.showToast);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [homeOnly, setHomeOnly] = useState(false);
  const [womenOnly, setWomenOnly] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [slotChoice, setSlotChoice] = useState<string | null>(null);
  // Skeleton pass on first open, becomes the real fetch state with Supabase.
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(id);
  }, []);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clinics
      .filter((c) => {
        if (filter !== 'All' && c.category !== filter) return false;
        if (homeOnly && !c.homeService) return false;
        if (womenOnly && !c.womenOnly) return false;
        if (q && !c.name.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => (b.sponsored ? 1 : 0) - (a.sponsored ? 1 : 0));
  }, [clinics, filter, homeOnly, womenOnly, query]);

  return (
    <Screen>
      <View style={{ paddingTop: spacing.s, gap: spacing.m }}>
        <Text style={[type.largeTitle, { color: t.text }]}>{tr('discover.title')}</Text>
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
            placeholder={tr('discover.search')}
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
            <Chip key={f} label={tr('filter.' + f)} selected={filter === f} onPress={() => setFilter(f)} />
          ))}
        </ScrollView>
        <View style={{ flexDirection: 'row', gap: spacing.s }}>
          <Chip label={tr('common.atHome')} selected={homeOnly} onPress={() => setHomeOnly((v) => !v)} />
          <Chip label={tr('filter.womenOnly')} selected={womenOnly} onPress={() => setWomenOnly((v) => !v)} />
        </View>
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
            <Text style={{ fontSize: 14, color: t.sub }}>{tr('discover.none')}</Text>
          </Card>
        ) : (
          list.map((c) => {
            const saved = savedIds.includes(c.id);
            const open = expanded === c.id;
            const chosen = open ? slotChoice : null;
            return (
              <Card
                key={c.id}
                onPress={() => {
                  setExpanded(open ? null : c.id);
                  setSlotChoice(null);
                }}
              >
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
                    {c.sponsored ? (
                      <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.5, color: t.muted, marginBottom: 2 }}>
                        {tr('common.sponsored')}
                      </Text>
                    ) : null}
                    {/* Airbnb result line: name left, star + rating right */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s }}>
                      <Text numberOfLines={1} style={{ flex: 1, fontSize: 16, fontWeight: '600', color: t.text }}>
                        {c.name}
                      </Text>
                      {c.rating > 0 ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                          <Ionicons name="star" size={12} color={t.text} />
                          <Text style={{ fontSize: 13, fontWeight: '600', color: t.text }}>
                            {c.rating.toFixed(1)}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={{ fontSize: 13, color: t.sub, marginTop: 1 }}>
                      {tr('filter.' + c.category)}
                      {c.distanceKm > 0 ? ` · ${c.distanceKm} km` : ''}
                      {c.homeService ? ` · ${tr('discover.homeService')}` : ''}
                      {c.slots.length > 0 ? ` · ${tr('discover.slotsOpen', { n: c.slots.length })}` : ''}
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
                  <View style={{ marginTop: spacing.m, borderTopWidth: 1, borderTopColor: t.separator, paddingTop: spacing.m, gap: spacing.s }}>
                    <Text style={[type.label, { color: t.muted }]}>Next available</Text>
                    {/* Uber option rows: outcome subline, selected = 2px ink outline */}
                    {c.slots.map((s) => {
                      const sel = chosen === s;
                      return (
                        <Pressable
                          key={s}
                          accessibilityRole="button"
                          accessibilityState={{ selected: sel }}
                          onPress={() => setSlotChoice(sel ? null : s)}
                          style={({ pressed }) => ({
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: spacing.m,
                            paddingVertical: 11,
                            paddingHorizontal: spacing.m,
                            borderRadius: radii.l,
                            borderWidth: sel ? 2 : 1,
                            borderColor: sel ? t.text : t.border,
                            backgroundColor: sel ? t.surfaceAlt : t.bg,
                            transform: [{ scale: pressed ? 0.98 : 1 }],
                          })}
                        >
                          <Ionicons name="time-outline" size={17} color={sel ? t.text : t.muted} />
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 15, fontWeight: '600', color: t.text }}>{s}</Text>
                            <Text style={{ fontSize: 12, color: t.sub, marginTop: 1 }}>
                              45 min · with first available
                            </Text>
                          </View>
                          {sel ? <Ionicons name="checkmark-circle" size={19} color={t.accent} /> : null}
                        </Pressable>
                      );
                    })}
                    {/* CTA names the selection (Uber confirm pattern) */}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ disabled: !chosen }}
                      onPress={() => {
                        if (!chosen) return;
                        showToast(`Requested ${chosen} at ${c.name}`);
                        setExpanded(null);
                        setSlotChoice(null);
                      }}
                      style={({ pressed }) => ({
                        marginTop: spacing.xs,
                        paddingVertical: 13,
                        borderRadius: radii.l,
                        alignItems: 'center',
                        backgroundColor: chosen ? t.accent : t.faint,
                        transform: [{ scale: pressed && chosen ? 0.98 : 1 }],
                      })}
                    >
                      <Text style={{ color: chosen ? t.onAccent : t.sub, fontSize: 15, fontWeight: '700' }}>
                        {chosen ? `Request ${chosen}` : 'Pick a time'}
                      </Text>
                    </Pressable>
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
