import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IconButton, PrimaryButton, Screen, StepDots } from '../../components/ui';
import { AvatarFigure } from '../../components/avatar/AvatarFigure';
import { OB_STEPS } from './OnboardingShell';
import { HAIR_COLORS, SKIN_TONES } from '../../data/seed';
import { radii, spacing, type } from '../../theme';
import { useEterna, useTheme } from '../../store';
import { useT } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';

/** HAIR_COLORS labels come from seed data in English; map them to i18n keys
 *  here rather than editing the data file. */
const HAIR_COLOR_KEYS: Record<string, string> = {
  Brown: 'avatarob.hairBrown',
  Black: 'avatarob.hairBlack',
  Blonde: 'avatarob.hairBlonde',
};

/**
 * Avatar studio. A static, high-res figure with three clean pickers — skin
 * tone, hair length, hair color. Every choice crossfades smoothly (no jump,
 * no lag) because all variants are preloaded and share one uniform frame.
 * No drag.
 */

function PillPicker({
  options,
  value,
  onChange,
}: {
  options: { label: string; swatch?: string }[];
  value: number;
  onChange: (i: number) => void;
}) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: spacing.m }}>
      {options.map((o, i) => {
        const sel = value === i;
        return (
          <Pressable
            key={o.label}
            accessibilityRole="button"
            accessibilityLabel={o.label}
            accessibilityState={{ selected: sel }}
            onPress={() => onChange(i)}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.s,
              paddingVertical: 12,
              borderRadius: radii.l,
              backgroundColor: sel ? t.accentSoft : t.surfaceAlt,
              borderWidth: sel ? 1.5 : 1,
              borderColor: sel ? t.accent : t.border,
            }}
          >
            {o.swatch ? (
              <View
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: o.swatch,
                  borderWidth: 1,
                  borderColor: t.border,
                }}
              />
            ) : null}
            <Text style={{ fontSize: 14, fontWeight: '600', color: sel ? t.accent : t.text }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function AvatarStudioScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'AvatarStudio' | 'AvatarEdit'>) {
  const t = useTheme();
  const tr = useT();
  const profile = useEterna((s) => s.profile);
  const draft = useEterna((s) => s.draft);
  const setAvatar = useEterna((s) => s.setAvatar);
  const showToast = useEterna((s) => s.showToast);
  const avatar = profile ? profile.avatar : draft.avatar;
  const signedIn = !!profile;
  const hairColorOptions = HAIR_COLORS.map((c) => ({
    ...c,
    label: tr(HAIR_COLOR_KEYS[c.label] ?? c.label),
  }));

  return (
    <Screen padded={false}>
      {/* header */}
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.s, gap: spacing.m }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.m }}>
          {navigation.canGoBack() ? (
            <IconButton
              name={signedIn ? 'close' : 'chevron-back'}
              onPress={() => navigation.goBack()}
              accessibilityLabel={tr('avatarob.back')}
            />
          ) : null}
          {!signedIn ? (
            <View style={{ flex: 1 }}>
              <StepDots total={OB_STEPS} index={4} />
            </View>
          ) : null}
        </View>
        <Text style={[type.display, { color: t.text }]}>{tr('avatarob.title')}</Text>
      </View>

      {/* static preview */}
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <AvatarFigure height={300} skinTone={avatar.skinTone} hairColor={avatar.hairColor} />
      </View>

      {/* pickers */}
      <View style={{ paddingHorizontal: spacing.xl, gap: spacing.l }}>
        <View style={{ gap: spacing.s }}>
          <Text style={[type.label, { color: t.muted }]}>{tr('avatarob.skinTone')}</Text>
          <View style={{ flexDirection: 'row', gap: spacing.m }}>
            {SKIN_TONES.map((c, i) => {
              const sel = avatar.skinTone === i;
              return (
                <Pressable
                  key={c}
                  accessibilityRole="button"
                  accessibilityLabel={tr('avatarob.skinToneN', { n: i + 1 })}
                  accessibilityState={{ selected: sel }}
                  onPress={() => setAvatar({ skinTone: i })}
                  style={{
                    flex: 1,
                    aspectRatio: 1,
                    borderRadius: 999,
                    backgroundColor: c,
                    borderWidth: sel ? 3 : 1,
                    borderColor: sel ? t.accent : t.border,
                  }}
                />
              );
            })}
          </View>
        </View>

        <View style={{ gap: spacing.s }}>
          <Text style={[type.label, { color: t.muted }]}>{tr('avatarob.hairColor')}</Text>
          <PillPicker
            options={hairColorOptions}
            value={avatar.hairColor}
            onChange={(i) => setAvatar({ hairColor: i })}
          />
        </View>
      </View>

      {/* pinned CTA */}
      <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl, paddingTop: spacing.l }}>
        <PrimaryButton
          title={signedIn ? tr('avatarob.save') : tr('lang.continue')}
          onPress={() => {
            if (signedIn) {
              showToast(tr('avatarob.saved'));
              if (navigation.canGoBack()) navigation.goBack();
              else navigation.navigate('Tabs');
            } else {
              navigation.navigate('Notifications');
            }
          }}
        />
      </View>
    </Screen>
  );
}
