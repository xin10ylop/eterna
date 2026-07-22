import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Card, Chip, IconButton, Screen } from '../../components/ui';
import { ClinicCardSkeleton } from '../../components/anim/Shimmer';
import { GuideTour, useGuideRects, type GuideStep } from '../../components/GuideTour';
import { formatAED } from '../../lib/money';
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
export function DiscoverScreen({ navigation }: Props) {
  const t = useTheme();
  const tr = useT();
  const clinics = useEterna((s) => s.clinics);
  const savedIds = useEterna((s) => s.savedClinicIds);
  const toggleSaved = useEterna((s) => s.toggleSavedClinic);
  const showToast = useEterna((s) => s.showToast);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [homeOnly, setHomeOnly] = useState(false);
  // Skeleton pass on first open, becomes the real fetch state with Supabase.
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(id);
  }, []);

  // guided tour, chapter "discover": one step on the search box
  const guideStage = useEterna((s) => s.guideStage);
  const guideOffset = useEterna((s) => s.guideOffset);
  const guideTotal = useEterna((s) => s.guideTotal);
  const setGuide = useEterna((s) => s.setGuide);
  const searchRef = useRef<View>(null);
  const guideRects = useGuideRects(guideStage === 'discover', { search: searchRef }, 500);
  const guideSteps = useMemo<GuideStep[] | null>(() => {
    if (guideStage !== 'discover' || !guideRects?.search) return null;
    return [
      {
        key: 'discover',
        rect: guideRects.search,
        title: tr('guide.discover.title'),
        body: tr('guide.discover.body'),
      },
    ];
  }, [guideStage, guideRects, tr]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clinics
      // her own added clinics live in "My clinics", not the public directory
      .filter((c) => !c.id.startsWith('c-own-'))
      .filter((c) => {
        // a clinic offers several services; it matches when any of them does
        if (filter !== 'All' && !c.services.includes(filter as (typeof c.services)[number])) return false;
        if (homeOnly && !c.homeService) return false;
        if (q && !c.name.toLowerCase().includes(q)) return false;
        return true;
      })
      // sponsored first (paid placement), then nearest, then best-rated
      .sort((a, b) => {
        const sp = (b.sponsored ? 1 : 0) - (a.sponsored ? 1 : 0);
        if (sp !== 0) return sp;
        if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
        return b.rating - a.rating;
      });
  }, [clinics, filter, homeOnly, query]);

  return (
    <Screen>
      <View style={{ paddingTop: spacing.s, gap: spacing.m }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={[type.largeTitle, { color: t.text }]}>{tr('discover.title')}</Text>
          <IconButton
            name="bookmark-outline"
            onPress={() => navigation.navigate('MyClinics')}
            accessibilityLabel={tr('clinics.title')}
          />
        </View>
        <View
          ref={searchRef}
          collapsable={false}
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
            returnKeyType="search"
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
        </View>
      </View>

      <ScrollView
        style={{ marginTop: spacing.l }}
        contentContainerStyle={{ gap: spacing.m, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
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
            return (
              <Card
                key={c.id}
                onPress={() => navigation.navigate('ClinicProfile', { clinicId: c.id })}
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
                    <Text numberOfLines={1} style={{ fontSize: 13, color: t.sub, marginTop: 1 }}>
                      {c.services.map((s) => tr('filter.' + s)).join(' · ')}
                      {c.distanceKm > 0 ? ` · ${c.distanceKm} km` : ''}
                      {c.homeService ? ` · ${tr('discover.homeService')}` : ''}
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
              </Card>
            );
          })
        )}
      </ScrollView>
      {guideSteps ? (
        <GuideTour
          steps={guideSteps}
          offset={guideOffset}
          total={guideTotal}
          onComplete={() => {
            setGuide({ stage: 'budget', offset: guideOffset + guideSteps.length });
            navigation.navigate('Budget');
          }}
          onSkip={() => setGuide({ stage: null, offset: 0 })}
        />
      ) : null}
    </Screen>
  );
}
