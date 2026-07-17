import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GhostButton, PrimaryButton, Screen } from '../../components/ui';
import { Entrance } from '../../components/anim/Entrance';
import { spacing, type } from '../../theme';
import { useTheme } from '../../store';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  const t = useTheme();
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
        <Entrance spring distance={28}>
          <Image
            source={require('../../../assets/avatar/front.png')}
            style={{ height: 320, width: 320 * 0.442, resizeMode: 'contain' }}
            accessibilityLabel="Eterna avatar"
          />
        </Entrance>
        <Animated.Text
          style={{
            fontFamily: type.serif,
            fontSize: 40,
            color: t.text,
            opacity: brand,
            letterSpacing: brand.interpolate({ inputRange: [0, 1], outputRange: [2, 8] }),
          }}
        >
          ETERNA
        </Animated.Text>
        <Entrance delay={650}>
          <Text style={{ fontSize: 16, color: t.sub, textAlign: 'center', lineHeight: 23, maxWidth: 280 }}>
            Everything you do to feel beautiful, remembered in one place.
          </Text>
        </Entrance>
      </View>
      <Entrance delay={850} distance={10}>
        <View style={{ paddingBottom: spacing.xxl, gap: spacing.xs }}>
          <PrimaryButton title="Get started" onPress={() => navigation.navigate('Features')} />
          <GhostButton title="I already have an account" onPress={() => navigation.navigate('SignIn')} />
        </View>
      </Entrance>
    </Screen>
  );
}
