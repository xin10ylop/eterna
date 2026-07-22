import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GhostButton, PrimaryButton, Screen } from '../../components/ui';
import { Entrance } from '../../components/anim/Entrance';
import { Sparkles } from '../../components/anim/Lottie';
import { spacing, type } from '../../theme';
import { useTheme } from '../../store';
import { useT } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  const t = useTheme();
  const tr = useT();
  // Brand intro: the wordmark breathes open (letter-spacing widens as it fades in).
  const brand = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(brand, {
      toValue: 1,
      duration: 900,
      delay: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // letterSpacing is not native-driver animatable
    }).start();
  }, [brand]);

  return (
    <Screen>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.l }}>
        <Entrance spring distance={20}>
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={150} style={{ position: 'absolute', top: -70 }} />
            <Animated.Text
              style={{
                fontFamily: type.serif,
                fontSize: 46,
                color: t.text,
                opacity: brand,
                letterSpacing: brand.interpolate({ inputRange: [0, 1], outputRange: [2, 10] }),
              }}
            >
              ETERNA
            </Animated.Text>
          </View>
        </Entrance>
        <Entrance delay={650}>
          <Text style={{ fontSize: 16, color: t.sub, textAlign: 'center', lineHeight: 23, maxWidth: 280 }}>
            {tr('welcome.tagline')}
          </Text>
        </Entrance>
      </View>
      <Entrance delay={850} distance={10}>
        <View style={{ paddingBottom: spacing.xxl, gap: spacing.xs }}>
          <PrimaryButton title={tr('welcome.getStarted')} onPress={() => navigation.navigate('Language')} />
          <GhostButton title={tr('welcome.haveAccount')} onPress={() => navigation.navigate('SignIn')} />
        </View>
      </Entrance>
    </Screen>
  );
}
