import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '../../store';

/**
 * Success check — the ring draws itself, then the check strokes in.
 * Used at moments of completion (booking confirmed, onboarding done).
 * Pure SVG stroke-dash animation, no asset dependencies.
 */
export function AnimatedCheck({ size = 84, onDone }: { size?: number; onDone?: () => void }) {
  const t = useTheme();
  const progress = useRef(new Animated.Value(0)).current;
  const [phase, setPhase] = useState(0); // 0..1 ring, then check

  const R = 38;
  const RING_LEN = 2 * Math.PI * R;
  const CHECK_LEN = 60;

  useEffect(() => {
    const id = progress.addListener(({ value }) => setPhase(value));
    Animated.timing(progress, {
      toValue: 2,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => onDone?.());
    return () => progress.removeListener(id);
  }, [onDone, progress]);

  const ringP = Math.min(1, phase);
  const checkP = Math.max(0, phase - 1);

  return (
    <View accessibilityLabel="Success" style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 96 96">
        <Circle
          cx="48"
          cy="48"
          r={R}
          stroke={t.accent}
          strokeWidth={5}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${RING_LEN}`}
          strokeDashoffset={RING_LEN * (1 - ringP)}
          transform="rotate(-90 48 48)"
        />
        <Path
          d="M32 49 L44 61 L66 38"
          stroke={t.accent}
          strokeWidth={6}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={`${CHECK_LEN}`}
          strokeDashoffset={CHECK_LEN * (1 - checkP)}
        />
      </Svg>
    </View>
  );
}
