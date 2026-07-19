import React, { useEffect, useRef } from 'react';
import { Animated, View, type StyleProp, type ViewStyle } from 'react-native';
import { ALL_FRONTS, FRONTS, FRONT_ASPECT } from './config';
import { useTheme } from '../../store';

/**
 * Static avatar figure.
 *
 * Every variant is mounted once and preloaded; changing skin tone or hair
 * crossfades opacity (220ms) between them. Because all fronts share one
 * uniform canvas, the figure never jumps — only the skin and hair change.
 * No drag, no rotation. Zone markers are passed as children and overlaid.
 */
export function AvatarFigure({
  height,
  skinTone,
  hairLook,
  children,
  style,
}: {
  height: number;
  skinTone: number;
  hairLook: number;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const width = height * FRONT_ASPECT;
  const activeIndex = clamp(skinTone, 5) * 3 + clamp(hairLook, 2);

  const fades = useRef(ALL_FRONTS.map((_, i) => new Animated.Value(i === activeIndex ? 1 : 0))).current;
  useEffect(() => {
    Animated.parallel(
      fades.map((v, i) =>
        Animated.timing(v, {
          toValue: i === activeIndex ? 1 : 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [activeIndex, fades]);

  return (
    <View style={[{ alignItems: 'center' }, style]}>
      <View style={{ width, height }}>
        {FRONTS.flat().map((src, i) => (
          <Animated.Image
            key={i}
            source={src}
            fadeDuration={0}
            accessibilityLabel={i === activeIndex ? 'Your avatar' : undefined}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              resizeMode: 'contain',
              opacity: fades[i],
            }}
          />
        ))}
        {children}
      </View>
      {/* soft ground shadow */}
      <View
        style={{
          width: width * 0.46,
          height: 13,
          borderRadius: 999,
          backgroundColor: t.shadow,
          opacity: 0.4,
          marginTop: -6,
          transform: [{ scaleY: 0.5 }],
        }}
      />
    </View>
  );
}

function clamp(v: number, hi: number) {
  return v > 0 ? (v > hi ? hi : v | 0) : 0;
}
