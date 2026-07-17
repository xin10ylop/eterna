import React, { useMemo, useRef, useState } from 'react';
import { Animated, Image, PanResponder, View } from 'react-native';
import { DEFAULT_PACK, type AvatarPack } from './config';
import { useTheme } from '../../store';

/**
 * Rotatable avatar.
 *
 * - Multi-frame pack: horizontal drag scrubs through the turntable frames.
 * - Single-frame pack (current): drag applies a subtle perspective tilt and
 *   springs back, so the gesture language is already in place.
 */
export function AvatarViewer({
  height,
  pack = DEFAULT_PACK,
  children,
  onFrameChange,
}: {
  height: number;
  pack?: AvatarPack;
  /** Overlay layer (zone markers) rendered in the image box. */
  children?: React.ReactNode;
  onFrameChange?: (index: number) => void;
}) {
  const t = useTheme();
  const width = height * pack.aspect;
  const frameCount = pack.frames.length;
  const [frame, setFrame] = useState(0);
  const tilt = useRef(new Animated.Value(0)).current;
  const dragFrame = useRef(0);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) =>
          Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderGrant: () => {
          dragFrame.current = frame;
        },
        onPanResponderMove: (_e, g) => {
          if (frameCount > 1) {
            // one full turn per ~1.5 screen widths of drag
            const stepPx = (width * 1.5) / frameCount;
            const next =
              ((dragFrame.current + Math.round(-g.dx / stepPx)) % frameCount + frameCount) %
              frameCount;
            setFrame((prev) => {
              if (prev !== next) onFrameChange?.(next);
              return next;
            });
          } else {
            tilt.setValue(Math.max(-1, Math.min(1, g.dx / 140)));
          }
        },
        onPanResponderRelease: () => {
          if (frameCount === 1) {
            Animated.spring(tilt, { toValue: 0, friction: 5, useNativeDriver: true }).start();
          }
        },
      }),
    [frame, frameCount, onFrameChange, tilt, width],
  );

  return (
    <View style={{ alignItems: 'center' }} {...pan.panHandlers}>
      <Animated.View
        style={{
          width,
          height,
          transform: [
            { perspective: 800 },
            {
              rotateY: tilt.interpolate({
                inputRange: [-1, 1],
                outputRange: ['-10deg', '10deg'],
              }),
            },
          ],
        }}
      >
        <Image
          source={pack.frames[frame] ?? pack.frames[0]}
          accessibilityLabel="Your avatar"
          style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
        />
        {frame === 0 ? children : null}
      </Animated.View>
      {/* ground shadow */}
      <View
        style={{
          width: width * 0.55,
          height: 14,
          borderRadius: 999,
          backgroundColor: t.shadow,
          opacity: 0.5,
          marginTop: -8,
          transform: [{ scaleY: 0.5 }],
        }}
      />
    </View>
  );
}
