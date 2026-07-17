import React, { useRef, useState } from 'react';
import { Dimensions, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton, Screen } from '../../components/ui';
import { radii, spacing, type } from '../../theme';
import { useTheme } from '../../store';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Features'>;

const SLIDES: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  {
    icon: 'body-outline',
    title: 'Your beauty, mapped',
    body: 'Every treatment lives on your avatar — hair, face, lips, hands, body. One glance shows what needs attention.',
  },
  {
    icon: 'time-outline',
    title: 'Never lose track again',
    body: 'Roots, filler, lashes, laser — each on its own rhythm. Eterna remembers every session, product and practitioner note.',
  },
  {
    icon: 'wallet-outline',
    title: 'Plan it. Budget it.',
    body: 'See upcoming appointments in a calendar and know what this month — and next — will cost before it happens.',
  },
];

export function FeaturesScreen({ navigation }: Props) {
  const t = useTheme();
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
            <View key={s.title} style={{ width: W, alignItems: 'center', gap: spacing.l, paddingHorizontal: spacing.s }}>
              <View
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: radii.xl,
                  backgroundColor: t.accentSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name={s.icon} size={44} color={t.accent} />
              </View>
              <Text style={[type.title, { color: t.text, textAlign: 'center' }]}>{s.title}</Text>
              <Text style={{ fontSize: 15, lineHeight: 22, color: t.sub, textAlign: 'center', maxWidth: 300 }}>
                {s.body}
              </Text>
            </View>
          ))}
        </ScrollView>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: spacing.xl }}>
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
      <View style={{ paddingBottom: spacing.xxl }}>
        <PrimaryButton
          title={page < SLIDES.length - 1 ? 'Next' : 'Create my account'}
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
