import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton, Screen } from '../../components/ui';
import { LANGS, useT } from '../../i18n';
import { radii, spacing, type } from '../../theme';
import { useEterna, useTheme } from '../../store';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Language'>;

/**
 * Its own onboarding step (Speak / Duolingo pattern): one question, big
 * selectable rows, one Continue. Each language is written in itself, so anyone
 * can find hers regardless of the current UI language.
 */
export function LanguageScreen({ navigation }: Props) {
  const t = useTheme();
  const tr = useT();
  const lang = useEterna((s) => s.lang);
  const setLang = useEterna((s) => s.setLang);

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', gap: spacing.xl }}>
        <Text style={[type.display, { color: t.text }]}>{tr('lang.title')}</Text>
        <View style={{ gap: spacing.s }}>
          {LANGS.map((l) => {
            const on = lang === l.code;
            return (
              <Pressable
                key={l.code}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                onPress={() => setLang(l.code)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.m,
                  paddingVertical: 18,
                  paddingHorizontal: spacing.l,
                  borderRadius: radii.l,
                  backgroundColor: on ? t.accentSoft : t.surfaceAlt,
                  borderWidth: 1.5,
                  borderColor: on ? t.accent : t.border,
                  transform: [{ scale: pressed ? 0.99 : 1 }],
                })}
              >
                <Text style={{ flex: 1, fontSize: 17, fontWeight: '600', color: t.text }}>
                  {l.native}
                </Text>
                {on ? <Ionicons name="checkmark-circle" size={22} color={t.accent} /> : null}
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={{ paddingBottom: spacing.xxl }}>
        <PrimaryButton title={tr('lang.continue')} onPress={() => navigation.navigate('Features')} />
      </View>
    </Screen>
  );
}
