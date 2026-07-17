import React from 'react';
import { Image, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GhostButton, PrimaryButton, Screen } from '../../components/ui';
import { spacing, type } from '../../theme';
import { useTheme } from '../../store';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  const t = useTheme();
  return (
    <Screen>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.l }}>
        <Image
          source={require('../../../assets/avatar/front.png')}
          style={{ height: 320, width: 320 * 0.442, resizeMode: 'contain' }}
          accessibilityLabel="Eterna avatar"
        />
        <Text
          style={{
            fontFamily: type.serif,
            fontSize: 40,
            letterSpacing: 8,
            color: t.text,
          }}
        >
          ETERNA
        </Text>
        <Text style={{ fontSize: 16, color: t.sub, textAlign: 'center', lineHeight: 23, maxWidth: 280 }}>
          Everything you do to feel beautiful, remembered in one place.
        </Text>
      </View>
      <View style={{ paddingBottom: spacing.xxl, gap: spacing.xs }}>
        <PrimaryButton title="Get started" onPress={() => navigation.navigate('Features')} />
        <GhostButton title="I already have an account" onPress={() => navigation.navigate('SignIn')} />
      </View>
    </Screen>
  );
}
