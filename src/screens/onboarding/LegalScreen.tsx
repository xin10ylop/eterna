import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IconButton, Screen } from '../../components/ui';
import { spacing, type } from '../../theme';
import { useTheme } from '../../store';
import { useT } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Legal'>;

/** Placeholder legal copy until counsel writes the real thing. Keys only here;
 *  the actual strings live in the i18n dictionaries under `legal.*`. */
const DOC_KEYS: Record<'terms' | 'privacy', { titleKey: string; sectionKeys: { h: string; p: string }[] }> = {
  terms: {
    titleKey: 'legal.termsTitle',
    sectionKeys: [
      { h: 'legal.terms.s1.h', p: 'legal.terms.s1.b' },
      { h: 'legal.terms.s2.h', p: 'legal.terms.s2.b' },
      { h: 'legal.terms.s3.h', p: 'legal.terms.s3.b' },
      { h: 'legal.terms.s4.h', p: 'legal.terms.s4.b' },
      { h: 'legal.terms.s5.h', p: 'legal.terms.s5.b' },
      { h: 'legal.terms.s6.h', p: 'legal.terms.s6.b' },
    ],
  },
  privacy: {
    titleKey: 'legal.privacyTitle',
    sectionKeys: [
      { h: 'legal.privacy.s1.h', p: 'legal.privacy.s1.b' },
      { h: 'legal.privacy.s2.h', p: 'legal.privacy.s2.b' },
      { h: 'legal.privacy.s3.h', p: 'legal.privacy.s3.b' },
      { h: 'legal.privacy.s4.h', p: 'legal.privacy.s4.b' },
      { h: 'legal.privacy.s5.h', p: 'legal.privacy.s5.b' },
      { h: 'legal.privacy.s6.h', p: 'legal.privacy.s6.b' },
    ],
  },
};

export function LegalScreen({ navigation, route }: Props) {
  const t = useTheme();
  const tr = useT();
  const doc = DOC_KEYS[route.params.doc];
  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.m, paddingTop: spacing.s }}>
        <IconButton name="chevron-back" onPress={() => navigation.goBack()} accessibilityLabel={tr('legal.back')} />
        <Text style={[type.title, { color: t.text }]}>{tr(doc.titleKey)}</Text>
      </View>
      <ScrollView
        style={{ marginTop: spacing.l }}
        contentContainerStyle={{ gap: spacing.l, paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ fontSize: 12.5, color: t.muted }}>
          {tr('legal.previewNote')}
        </Text>
        {doc.sectionKeys.map((s) => (
          <View key={s.h} style={{ gap: 4 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: t.text }}>{tr(s.h)}</Text>
            <Text style={{ fontSize: 14, color: t.sub, lineHeight: 21 }}>{tr(s.p)}</Text>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}
