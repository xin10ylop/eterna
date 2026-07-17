import React, { useEffect, useRef } from 'react';
import { Animated, Image, Pressable, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IconButton, PrimaryButton, Screen } from '../../components/ui';
import { PACKS } from '../../components/avatar/config';
import { radii, spacing, type } from '../../theme';
import { useEterna, useTheme } from '../../store';
import { HAIR_LOOKS, SKIN_TONES } from '../../data/seed';
import type { RootStackParamList } from '../../navigation/types';

/**
 * Avatar customization. Two axes, each fully rendered: 6 skin tones x 3 hair
 * looks = 18 real Higgsfield packs, so every tap changes the figure. The
 * preview panel is pinned above the controls (it never scrolls away) and
 * every pack's front frame stays mounted, crossfading opacity on change so
 * switching is instant, no decode-lag pop.
 */

const PREVIEW_H = 260;

function StudioPreview({ skinTone, hairLook }: { skinTone: number; hairLook: number }) {
  const t = useTheme();
  const activeKey = `${skinTone}_${hairLook}`;
  // one opacity value per pack, keyed "sk_look"
  const fades = useRef<Record<string, Animated.Value>>(
    Object.fromEntries(
      PACKS.flatMap((row, sk) => row.map((_, li) => [`${sk}_${li}`, new Animated.Value(0)])),
    ),
  ).current;

  useEffect(() => {
    Object.entries(fades).forEach(([k, v]) =>
      Animated.timing(v, {
        toValue: k === activeKey ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start(),
    );
  }, [activeKey, fades]);

  return (
    <View style={{ height: PREVIEW_H, alignItems: 'center', justifyContent: 'flex-end' }}>
      {/* soft blush ground */}
      <View
        style={{
          position: 'absolute',
          bottom: 4,
          width: 190,
          height: 190,
          borderRadius: 95,
          backgroundColor: t.accentSoft,
        }}
      />
      {PACKS.flatMap((row, sk) =>
        row.map((pack, li) => {
          const k = `${sk}_${li}`;
          return (
            <Animated.Image
              key={k}
              source={pack.frames[0]}
              style={{
                position: 'absolute',
                bottom: 0,
                height: PREVIEW_H,
                width: PREVIEW_H * pack.aspect,
                resizeMode: 'contain',
                opacity: fades[k],
              }}
              accessibilityLabel={k === activeKey ? 'Avatar preview' : undefined}
            />
          );
        }),
      )}
    </View>
  );
}

function SkinSwatches({ value, onChange }: { value: number; onChange: (i: number) => void }) {
  const t = useTheme();
  return (
    <View style={{ gap: spacing.s }}>
      <Text style={[type.label, { color: t.muted }]}>Skin tone</Text>
      <View style={{ flexDirection: 'row', gap: spacing.m }}>
        {SKIN_TONES.map((c, i) => (
          <Pressable
            key={c}
            accessibilityRole="button"
            accessibilityLabel={`Skin tone ${i + 1}`}
            accessibilityState={{ selected: value === i }}
            onPress={() => onChange(i)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
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

function HairLooks({
  skinTone,
  value,
  onChange,
}: {
  skinTone: number;
  value: number;
  onChange: (i: number) => void;
}) {
  const t = useTheme();
  return (
    <View style={{ gap: spacing.s }}>
      <Text style={[type.label, { color: t.muted }]}>Hair</Text>
      <View style={{ flexDirection: 'row', gap: spacing.m }}>
        {HAIR_LOOKS.map((look, i) => {
          const sel = value === i;
          const pack = PACKS[skinTone][i];
          return (
            <Pressable
              key={look.key}
              accessibilityRole="button"
              accessibilityLabel={look.label}
              accessibilityState={{ selected: sel }}
              onPress={() => onChange(i)}
              style={{
                flex: 1,
                alignItems: 'center',
                paddingTop: spacing.s,
                paddingBottom: spacing.s,
                borderRadius: radii.l,
                backgroundColor: sel ? t.accentSoft : t.surfaceAlt,
                borderWidth: sel ? 1.5 : 1,
                borderColor: sel ? t.accent : t.border,
                gap: 4,
                overflow: 'hidden',
              }}
            >
              {/* head-crop thumbnail of that look on the current skin tone */}
              <View style={{ height: 54, width: 54, overflow: 'hidden', alignItems: 'center' }}>
                <Image
                  source={pack.frames[0]}
                  style={{ height: 190, width: 190 * pack.aspect, resizeMode: 'contain', marginTop: -6 }}
                />
              </View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: sel ? t.accent : t.text }}>
                {look.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function AvatarStudioScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'AvatarStudio'>) {
  const t = useTheme();
  const profile = useEterna((s) => s.profile);
  const draft = useEterna((s) => s.draft);
  const setAvatar = useEterna((s) => s.setAvatar);
  const showToast = useEterna((s) => s.showToast);
  const avatar = profile ? profile.avatar : draft.avatar;
  // Signed-in => opened from Profile (a modal): Save and go back. Not signed
  // in => onboarding step: Continue to Notifications. Deciding on `profile`
  // makes the exit safe from every entry point, and canGoBack() guards the
  // modal dismissal so navigation can never throw.
  const signedIn = !!profile;

  return (
    <Screen padded={false}>
      {/* header */}
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.s, gap: spacing.l }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.m }}>
          {navigation.canGoBack() ? (
            <IconButton name={signedIn ? 'close' : 'chevron-back'} onPress={() => navigation.goBack()} accessibilityLabel="Back" />
          ) : null}
          {!signedIn ? (
            <Text style={{ fontSize: 12, fontWeight: '600', color: t.muted, letterSpacing: 0.5 }}>
              STEP 6 OF 7
            </Text>
          ) : null}
        </View>
        <View style={{ gap: 6 }}>
          <Text style={[type.display, { color: t.text }]}>Make her yours</Text>
          <Text style={[type.body, { color: t.sub, lineHeight: 21 }]}>
            Choose your skin tone and hair. She updates instantly.
          </Text>
        </View>
      </View>

      {/* pinned preview */}
      <StudioPreview skinTone={avatar.skinTone} hairLook={avatar.hairLook} />

      {/* controls */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingTop: spacing.l, paddingBottom: spacing.l, gap: spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        <SkinSwatches value={avatar.skinTone} onChange={(i) => setAvatar({ skinTone: i })} />
        <HairLooks
          skinTone={avatar.skinTone}
          value={avatar.hairLook}
          onChange={(i) => setAvatar({ hairLook: i })}
        />
        <View style={{ backgroundColor: t.accentSoft, borderRadius: radii.l, padding: spacing.l }}>
          <Text style={{ fontSize: 13, color: t.text, lineHeight: 19 }}>
            Every skin tone and hair look here is a real render, drag her on the Home screen to spin
            the full turnaround.
          </Text>
        </View>
      </ScrollView>

      {/* pinned CTA */}
      <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl, paddingTop: spacing.s }}>
        <PrimaryButton
          title={signedIn ? 'Save' : 'Continue'}
          onPress={() => {
            if (signedIn) {
              showToast('Saved, she follows your look');
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
