import React, { useRef } from 'react';
import { Animated, View, type StyleProp, type ViewStyle } from 'react-native';
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
  // fade out as the burst ends, instead of vanishing on the last frame
  const fade = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ width: size, height: size * 1.25, opacity: fade }, style]}
    >
      <LottieView
        source={require('../../../assets/lottie/confetti.json')}
        autoPlay
        loop={false}
        onAnimationFinish={() =>
          Animated.timing(fade, { toValue: 0, duration: 600, useNativeDriver: true }).start()
        }
        style={{ width: '100%', height: '100%' }}
      />
    </Animated.View>
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
