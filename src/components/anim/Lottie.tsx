import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import LottieView from 'lottie-react-native';

/**
 * Lottie moments, used sparingly (Duolingo's placement, Stoic's volume):
 * celebration bursts at completion points, sparkles while something is being
 * prepared. Never during input.
 */

export function Confetti({
  size = 300,
  style,
}: {
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View pointerEvents="none" style={[{ width: size, height: size * 1.25 }, style]}>
      <LottieView
        source={require('../../../assets/lottie/confetti.json')}
        autoPlay
        loop={false}
        style={{ width: '100%', height: '100%' }}
      />
    </View>
  );
}

export function Sparkles({
  size = 160,
  style,
}: {
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View pointerEvents="none" style={[{ width: size, height: size }, style]}>
      <LottieView
        source={require('../../../assets/lottie/sparkles.json')}
        autoPlay
        loop
        style={{ width: '100%', height: '100%' }}
      />
    </View>
  );
}
