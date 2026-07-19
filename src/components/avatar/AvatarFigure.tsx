import React, { useEffect, useRef, useState } from 'react';
import { Animated, View, type StyleProp, type ViewStyle } from 'react-native';
import { FRONT_ASPECT, frontAt } from './config';
import { useTheme } from '../../store';

/**
 * Static avatar figure with a true cross-dissolve.
 *
 * When skin/length/color changes, the new render is layered ON TOP of the
 * current one at opacity 0 and fades to 1; the old layer stays fully visible
 * underneath until the fade completes, so there is never a blank flash or a
 * "disappear then appear". All variants share one uniform canvas, so the
 * figure never jumps. Images are preloaded at app start (see App bootstrap),
 * so a layer never waits on the network. No drag, no rotation.
 */
export function AvatarFigure({
  height,
  skinTone,
  hairLength,
  hairColor,
  children,
  style,
}: {
  height: number;
  skinTone: number;
  hairLength: number;
  hairColor: number;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const width = height * FRONT_ASPECT;

  // a small stack of layers; the newest fades in over the rest
  const [layers, setLayers] = useState(() => [
    { key: 0, src: frontAt(skinTone, hairLength, hairColor), anim: new Animated.Value(1) },
  ]);
  const nextKey = useRef(1);
  const lastSig = useRef(`${skinTone}-${hairLength}-${hairColor}`);

  useEffect(() => {
    const sig = `${skinTone}-${hairLength}-${hairColor}`;
    if (sig === lastSig.current) return;
    lastSig.current = sig;
    const anim = new Animated.Value(0);
    const layer = { key: nextKey.current++, src: frontAt(skinTone, hairLength, hairColor), anim };
    setLayers((prev) => [...prev, layer]);
    Animated.timing(anim, { toValue: 1, duration: 240, useNativeDriver: true }).start(() => {
      // once fully faded in, drop the layers beneath it
      setLayers((prev) => prev.slice(prev.indexOf(layer)));
    });
  }, [skinTone, hairLength, hairColor]);

  return (
    <View style={[{ alignItems: 'center' }, style]}>
      <View style={{ width, height }}>
        {layers.map((l) => (
          <Animated.Image
            key={l.key}
            source={l.src}
            fadeDuration={0}
            accessibilityLabel="Your avatar"
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              resizeMode: 'contain',
              opacity: l.anim,
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
