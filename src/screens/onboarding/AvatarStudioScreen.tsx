import React from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Chip } from '../../components/ui';
import { OnboardingShell } from './OnboardingShell';
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
 * Avatar customization. Choices persist on the profile and define which
 * avatar render pack the app requests. Additional packs (per skin tone,
 * body shape, hair, outfit) are generated with Higgsfield and slot into
 * `components/avatar/config.ts` — until a matching pack exists, the default
 * render represents the avatar and the selection is kept.
 */

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
  const fromProfile = route.params?.fromProfile ?? false;
  const profile = useEterna((s) => s.profile);
  const draft = useEterna((s) => s.draft);
  const setAvatar = useEterna((s) => s.setAvatar);
  const avatar = profile ? profile.avatar : draft.avatar;

  return (
    <OnboardingShell
      step={fromProfile ? null : 4}
      title="Make her yours"
      subtitle="Skin, shape, hair and outfit — your avatar should feel like you."
      cta={fromProfile ? 'Save' : 'Continue'}
      onNext={() => (fromProfile ? navigation.goBack() : navigation.navigate('Notifications'))}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xl, paddingTop: spacing.s }}>
        <View style={{ alignItems: 'center' }}>
          <Image
            source={require('../../../assets/avatar/front.png')}
            style={{ height: 200, width: 200 * 0.442, resizeMode: 'contain' }}
            accessibilityLabel="Avatar preview"
          />
          <Text style={{ fontSize: 12, color: t.muted, marginTop: spacing.s, textAlign: 'center' }}>
            Preview renders update as new avatar packs are added.
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
            Rotate her on the Home screen — a full 3D avatar arrives with the next render pack.
          </Text>
        </View>
      </ScrollView>
    </OnboardingShell>
  );
}
