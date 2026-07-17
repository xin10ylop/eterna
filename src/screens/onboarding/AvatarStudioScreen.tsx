import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Chip } from '../../components/ui';
import { OnboardingShell } from './OnboardingShell';
import { PACKS, matchPack } from '../../components/avatar/config';
import { radii, spacing, type } from '../../theme';
import { useEterna, useTheme } from '../../store';
import {
  BODY_SHAPES,
  HAIR_COLORS,
  HAIR_LENGTHS,
  OUTFIT_COLORS,
  SKIN_TONES,
} from '../../data/seed';
import type { RootStackParamList } from '../../navigation/types';

/**
 * Avatar customization. Six Higgsfield render packs are live (skin tones,
 * blonde, short bob, curvy); `matchPack` picks the closest one and the
 * caption says honestly when a combination is approximate. The preview
 * keeps every pack's front frame mounted and crossfades opacity, so
 * switching is instant and smooth rather than a decode-lag pop.
 */

const PREVIEW_H = 210;

function PackPreview({ activeKey }: { activeKey: string }) {
  const fades = useRef(
    Object.fromEntries(PACKS.map((d) => [d.key, new Animated.Value(d.key === activeKey ? 1 : 0)])),
  ).current;

  useEffect(() => {
    Animated.parallel(
      PACKS.map((d) =>
        Animated.timing(fades[d.key], {
          toValue: d.key === activeKey ? 1 : 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [activeKey, fades]);

  const width = PREVIEW_H * 0.46;
  return (
    <View style={{ height: PREVIEW_H, width, alignItems: 'center', justifyContent: 'flex-end' }}>
      {PACKS.map((d) => (
        <Animated.Image
          key={d.key}
          source={d.pack.frames[0]}
          style={{
            position: 'absolute',
            bottom: 0,
            height: PREVIEW_H,
            width: PREVIEW_H * d.pack.aspect,
            resizeMode: 'contain',
            opacity: fades[d.key],
          }}
          accessibilityLabel={d.key === activeKey ? 'Avatar preview' : undefined}
        />
      ))}
    </View>
  );
}

function Swatches({
  colors,
  value,
  onChange,
  label,
}: {
  colors: string[];
  value: number;
  onChange: (i: number) => void;
  label: string;
}) {
  const t = useTheme();
  return (
    <View style={{ gap: spacing.s }}>
      <Text style={[type.label, { color: t.muted }]}>{label}</Text>
      <View style={{ flexDirection: 'row', gap: spacing.m }}>
        {colors.map((c, i) => (
          <Pressable
            key={c}
            accessibilityRole="button"
            accessibilityLabel={`${label} option ${i + 1}`}
            accessibilityState={{ selected: value === i }}
            onPress={() => onChange(i)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: c,
              borderWidth: value === i ? 3 : 1,
              borderColor: value === i ? t.accent : t.border,
            }}
          />
        ))}
      </View>
    </View>
  );
}

export function AvatarStudioScreen({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, 'AvatarStudio'>) {
  const t = useTheme();
  const profile = useEterna((s) => s.profile);
  const draft = useEterna((s) => s.draft);
  const setAvatar = useEterna((s) => s.setAvatar);
  const showToast = useEterna((s) => s.showToast);
  const avatar = profile ? profile.avatar : draft.avatar;
  // Signed-in users can only be here from Profile (modal) — exit by going
  // back. Deciding on profile presence instead of route params makes the
  // exit safe on every path ('Notifications' only exists pre-sign-in).
  const editingFromProfile = !!profile || (route.params?.fromProfile ?? false);

  const match = matchPack(avatar);

  return (
    <OnboardingShell
      step={editingFromProfile ? null : 5}
      title="Make her yours"
      subtitle="Skin, shape, hair and outfit — your avatar should feel like you."
      cta={editingFromProfile ? 'Save' : 'Continue'}
      onNext={() => {
        if (editingFromProfile) {
          showToast('Saved — she follows your look');
          navigation.goBack();
        } else {
          navigation.navigate('Notifications');
        }
      }}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xl, paddingTop: spacing.s }}>
        <View style={{ alignItems: 'center', gap: spacing.s }}>
          <PackPreview activeKey={match.key} />
          <Text style={{ fontSize: 12, color: t.muted, textAlign: 'center', maxWidth: 280 }}>
            {match.exact
              ? 'Rendered with Higgsfield — she follows your choices.'
              : 'Closest live render shown — this exact combination is still being rendered.'}
          </Text>
        </View>

        <Swatches label="Skin tone" colors={SKIN_TONES} value={avatar.skinTone} onChange={(i) => setAvatar({ skinTone: i })} />

        <View style={{ gap: spacing.s }}>
          <Text style={[type.label, { color: t.muted }]}>Body shape</Text>
          <View style={{ flexDirection: 'row', gap: spacing.s }}>
            {BODY_SHAPES.map((b, i) => (
              <Chip key={b} label={b} selected={avatar.bodyShape === i} onPress={() => setAvatar({ bodyShape: i })} />
            ))}
          </View>
        </View>

        <Swatches label="Hair color" colors={HAIR_COLORS} value={avatar.hairColor} onChange={(i) => setAvatar({ hairColor: i })} />

        <View style={{ gap: spacing.s }}>
          <Text style={[type.label, { color: t.muted }]}>Hair length</Text>
          <View style={{ flexDirection: 'row', gap: spacing.s }}>
            {HAIR_LENGTHS.map((h, i) => (
              <Chip key={h} label={h} selected={avatar.hairLength === i} onPress={() => setAvatar({ hairLength: i })} />
            ))}
          </View>
        </View>

        <Swatches label="Outfit" colors={OUTFIT_COLORS} value={avatar.outfitColor} onChange={(i) => setAvatar({ outfitColor: i })} />

        <View
          style={{
            backgroundColor: t.accentSoft,
            borderRadius: radii.l,
            padding: spacing.l,
          }}
        >
          <Text style={{ fontSize: 13, color: t.text, lineHeight: 19 }}>
            Six render packs are live — skin tones, blonde, short bob, curvy. Every remaining
            combination gets its own pack as they render, and your choices are saved either way.
          </Text>
        </View>
      </ScrollView>
    </OnboardingShell>
  );
}
