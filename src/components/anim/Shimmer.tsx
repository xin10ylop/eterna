import React, { useEffect, useRef } from 'react';
import { Animated, View, type DimensionValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { radii } from '../../theme';
import { useTheme } from '../../store';

/** Skeleton shimmer bar, shown while content is "fetching".
 *  A soft light band sweeps across a muted base. */
export function Shimmer({
  width = '100%',
  height = 16,
  radius = radii.s,
  style,
}: {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: object;
}) {
  const t = useTheme();
  const x = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(x, { toValue: 1, duration: 1100, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [x]);

  return (
    <View
      style={[
        { width, height, borderRadius: radius, backgroundColor: t.surface, overflow: 'hidden' },
        style,
      ]}
    >
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          width: '60%',
          transform: [
            {
              translateX: x.interpolate({
                inputRange: [0, 1],
                outputRange: [-200, 400],
              }),
            },
          ],
        }}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.85)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
}

/** Skeleton for a clinic card while Discover "loads". */
export function ClinicCardSkeleton() {
  const t = useTheme();
  return (
    <View
      style={{
        backgroundColor: t.surface,
        borderRadius: radii.l,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <Shimmer width={46} height={46} radius={radii.m} style={{ backgroundColor: t.surfaceAlt }} />
      <View style={{ flex: 1, gap: 8 }}>
        <Shimmer width="55%" height={14} style={{ backgroundColor: t.surfaceAlt }} />
        <Shimmer width="35%" height={11} style={{ backgroundColor: t.surfaceAlt }} />
      </View>
    </View>
  );
}
