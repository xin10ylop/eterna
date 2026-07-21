import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { LANGS, useLang, useT } from '../i18n';
import { radii, spacing } from '../theme';
import { useEterna, useTheme } from '../store';

/** Three-way language switch — English / العربية / Français. Switching to or
 *  from Arabic flips RTL, which fully mirrors on the next app start. */
export function LanguagePicker() {
  const t = useTheme();
  const lang = useLang();
  const setLang = useEterna((s) => s.setLang);
  const showToast = useEterna((s) => s.showToast);
  const tr = useT();

  return (
    <View style={{ flexDirection: 'row', gap: spacing.s }}>
      {LANGS.map((l) => {
        const sel = lang === l.code;
        return (
          <Pressable
            key={l.code}
            accessibilityRole="button"
            accessibilityLabel={l.native}
            accessibilityState={{ selected: sel }}
            onPress={() => {
              const flipsRtl = (l.code === 'ar') !== (lang === 'ar');
              setLang(l.code);
              if (flipsRtl) showToast(tr('profile.restartRTL'));
            }}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 15,
              borderRadius: radii.pill,
              backgroundColor: sel ? t.accent : t.surfaceAlt,
              borderWidth: 1,
              borderColor: sel ? t.accent : t.border,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: sel ? t.onAccent : t.text }}>
              {l.native}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
