import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IconButton, PrimaryButton, Screen } from '../../components/ui';
import { AvatarViewer } from '../../components/avatar/AvatarViewer';
import { EDITIONS, editionFor } from '../../components/avatar/config';
import { radii, spacing, type } from '../../theme';
import { useEterna, useTheme } from '../../store';
import type { RootStackParamList } from '../../navigation/types';

/**
 * Avatar studio. One choice, done well: pick an edition of the same fully-3D
 * character (Higgsfield image-to-3D mesh, rendered to a 360° turntable) and
 * spin her with a drag. No cosmetic toggles that don't actually render.
 */

export function AvatarStudioScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'AvatarStudio'>) {
  const t = useTheme();
  const profile = useEterna((s) => s.profile);
  const draft = useEterna((s) => s.draft);
  const setAvatar = useEterna((s) => s.setAvatar);
  const showToast = useEterna((s) => s.showToast);
  const avatar = profile ? profile.avatar : draft.avatar;
  // Signed-in => opened from Profile (a full-screen modal): Save and go back.
  // Not signed in => onboarding step: Continue. Deciding on `profile` with a
  // canGoBack guard keeps the exit safe from every entry point.
  const signedIn = !!profile;

  return (
    <Screen padded={false}>
      {/* header */}
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.s, gap: spacing.m }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.m }}>
          {navigation.canGoBack() ? (
            <IconButton
              name={signedIn ? 'close' : 'chevron-back'}
              onPress={() => navigation.goBack()}
              accessibilityLabel="Back"
            />
          ) : null}
          {!signedIn ? <Text style={[type.label, { color: t.muted }]}>Step 6 of 7</Text> : null}
        </View>
        <View style={{ gap: 4 }}>
          <Text style={[type.display, { color: t.text }]}>Make her yours</Text>
          <Text style={[type.body, { color: t.sub, lineHeight: 21 }]}>
            She is fully 3D. Drag to spin her.
          </Text>
        </View>
      </View>

      {/* 3D turntable */}
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <AvatarViewer height={340} pack={editionFor(avatar).pack} />
        <Text style={{ textAlign: 'center', fontSize: 12, color: t.muted, marginTop: spacing.s }}>
          Drag left or right to turn her
        </Text>
      </View>

      {/* edition picker */}
      <View style={{ paddingHorizontal: spacing.xl, gap: spacing.s }}>
        <Text style={[type.label, { color: t.muted }]}>Edition</Text>
        <View style={{ flexDirection: 'row', gap: spacing.m }}>
          {EDITIONS.map((e, i) => {
            const sel = (avatar.edition ?? 0) === i;
            return (
              <Pressable
                key={e.key}
                accessibilityRole="button"
                accessibilityLabel={`${e.label} edition`}
                accessibilityState={{ selected: sel }}
                onPress={() => setAvatar({ edition: i })}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing.s,
                  paddingVertical: 13,
                  borderRadius: radii.l,
                  backgroundColor: sel ? t.accentSoft : t.surfaceAlt,
                  borderWidth: sel ? 1.5 : 1,
                  borderColor: sel ? t.accent : t.border,
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: e.swatch,
                    borderWidth: 1,
                    borderColor: t.border,
                  }}
                />
                <Text style={{ fontSize: 14, fontWeight: '600', color: sel ? t.accent : t.text }}>
                  {e.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* pinned CTA */}
      <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl, paddingTop: spacing.l }}>
        <PrimaryButton
          title={signedIn ? 'Save' : 'Continue'}
          onPress={() => {
            if (signedIn) {
              showToast('Saved');
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
