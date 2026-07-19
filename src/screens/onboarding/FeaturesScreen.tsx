import React, { useRef, useState } from 'react';
import { Dimensions, Image, ScrollView, Text, View, type ImageSourcePropType } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PrimaryButton, Screen } from '../../components/ui';
import { EDITIONS } from '../../components/avatar/config';
import { spacing, type } from '../../theme';
import { useTheme } from '../../store';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Features'>;

/**
 * Value slides, editorial register (Airbnb values-interstitial anatomy):
 * small-caps eyebrow, serif statement, one quiet body line, with the
 * Higgsfield avatar renders as the imagery.
 */
const SLIDES: {
  eyebrow: string;
  title: string;
  body: string;
  image: ImageSourcePropType;
  aspect: number;
}[] = [
  {
    eyebrow: 'The avatar',
    title: 'Your beauty, mapped',
    body: 'Every treatment lives on her: hair, face, lips, hands, body. A soft glow shows what needs attention.',
    image: EDITIONS[0].pack.frames[0],
    aspect: EDITIONS[0].pack.aspect,
  },
  {
    eyebrow: 'The memory',
    title: 'Never lose track again',
    body: 'Roots, filler, lashes, laser: each on its own rhythm, remembered with every product and practitioner note.',
    image: EDITIONS[1].pack.frames[0],
    aspect: EDITIONS[1].pack.aspect,
  },
  {
    eyebrow: 'The plan',
    title: 'Plan it. Budget it.',
    body: 'See what is coming in a calendar, and know what this month and next will cost before it happens.',
    // a 3/4 turn of the same character, so the slide reads as "3D"
    image: EDITIONS[0].pack.frames[5],
    aspect: EDITIONS[0].pack.aspect,
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
                  width: 190,
                  height: 230,
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                }}
              >
                <Image
                  source={s.image}
                  style={{ height: 220, width: 220 * s.aspect, resizeMode: 'contain' }}
                  accessibilityLabel={s.eyebrow}
                />
              </View>
              <View style={{ alignItems: 'center', gap: spacing.s }}>
                <Text style={[type.label, { color: t.accent }]}>{s.eyebrow}</Text>
                <Text style={[type.display, { color: t.text, textAlign: 'center' }]}>{s.title}</Text>
                <Text style={{ fontSize: 15, lineHeight: 22, color: t.sub, textAlign: 'center', maxWidth: 300 }}>
                  {s.body}
                </Text>
              </View>
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
