import React, { useRef, useState } from 'react';
import { Dimensions, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton, Screen } from '../../components/ui';
import { radii, spacing, type } from '../../theme';
import { useTheme } from '../../store';
import { useT } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Features'>;

/**
 * Value slides, editorial register (Airbnb values-interstitial anatomy):
 * a single soft icon tile, small-caps eyebrow, serif statement, one quiet
 * body line. No avatar figurine.
 */
const SLIDES: {
  id: string;
  eyebrowKey: string;
  titleKey: string;
  bodyKey: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    id: 'avatar',
    eyebrowKey: 'features.avatar.eyebrow',
    titleKey: 'features.avatar.title',
    bodyKey: 'features.avatar.body',
    icon: 'body-outline',
  },
  {
    id: 'memory',
    eyebrowKey: 'features.memory.eyebrow',
    titleKey: 'features.memory.title',
    bodyKey: 'features.memory.body',
    icon: 'time-outline',
  },
  {
    id: 'plan',
    eyebrowKey: 'features.plan.eyebrow',
    titleKey: 'features.plan.title',
    bodyKey: 'features.plan.body',
    icon: 'wallet-outline',
  },
];

export function FeaturesScreen({ navigation }: Props) {
  const t = useTheme();
  const tr = useT();
  const [page, setPage] = useState(0);
  const sv = useRef<ScrollView>(null);
  const W = Dimensions.get('window').width - spacing.xl * 2;

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ScrollView
          ref={sv}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / W))}
        >
          {SLIDES.map((s) => (
            <View
              key={s.id}
              style={{
                width: W,
                minHeight: Dimensions.get('window').height * 0.46,
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.xl,
                paddingHorizontal: spacing.s,
              }}
            >
              <View
                style={{
                  width: 104,
                  height: 104,
                  borderRadius: radii.xl,
                  backgroundColor: t.accentSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name={s.icon} size={46} color={t.accent} />
              </View>
              <View style={{ alignItems: 'center', gap: spacing.s }}>
                <Text style={[type.label, { color: t.accent }]}>{tr(s.eyebrowKey)}</Text>
                <Text style={[type.display, { color: t.text, textAlign: 'center' }]}>{tr(s.titleKey)}</Text>
                <Text style={{ fontSize: 15, lineHeight: 22, color: t.sub, textAlign: 'center', maxWidth: 300 }}>
                  {tr(s.bodyKey)}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: spacing.xxl }}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === page ? 18 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === page ? t.accent : t.faint,
              }}
            />
          ))}
        </View>
      </View>
      <View style={{ paddingBottom: spacing.xxl, paddingTop: spacing.xl }}>
        <PrimaryButton
          title={page < SLIDES.length - 1 ? tr('features.next') : tr('features.createAccount')}
          onPress={() => {
            if (page < SLIDES.length - 1) {
              sv.current?.scrollTo({ x: (page + 1) * W, animated: true });
              setPage(page + 1);
            } else {
              navigation.navigate('SignUp');
            }
          }}
        />
      </View>
    </Screen>
  );
}
