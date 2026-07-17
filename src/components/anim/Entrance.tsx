import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

/**
 * Staged entrance — fade + rise with a soft spring. Give siblings
 * increasing `delay` for an orchestrated page-load sequence.
 */
export function Entrance({
  children,
  delay = 0,
  distance = 18,
  spring = false,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
  spring?: boolean;
  style?: object;
}) {
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = spring
      ? Animated.spring(v, { toValue: 1, delay, friction: 7, tension: 60, useNativeDriver: true })
      : Animated.timing(v, {
          toValue: 1,
          duration: 420,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        });
    anim.start();
  }, [delay, spring, v]);

  return (
    <Animated.View
      style={[
        {
          opacity: v,
          transform: [
            { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) },
          ],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}
