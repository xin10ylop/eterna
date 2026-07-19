import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, Image, View } from 'react-native';
import { DEFAULT_PACK, type AvatarPack } from './config';
import { useTheme } from '../../store';

/**
 * Rotatable 3D avatar.
 *
 * The pack is a 36-frame turntable rendered from one real GLB mesh, so
 * scrubbing frames on a horizontal drag reads as true 3D rotation with a
 * perfectly consistent character. The pan responder claims horizontal drags
 * in the CAPTURE phase, so it rotates even when the drag starts over an
 * overlay marker; a tap (no travel) still falls through to the markers. A
 * light momentum keeps her turning after a flick.
 */
export function AvatarViewer({
  height,
  pack = DEFAULT_PACK,
  children,
  onFrameChange,
}: {
  height: number;
  pack?: AvatarPack;
  /** Overlay layer (zone markers), shown only on the front frame. */
  children?: React.ReactNode;
  onFrameChange?: (index: number) => void;
}) {
  const t = useTheme();
  const width = height * pack.aspect;
  const frameCount = pack.frames.length;
  const [frame, setFrame] = useState(0);
  const frameRef = useRef(0);
  const startFrame = useRef(0);
  const momentum = useRef<ReturnType<typeof setInterval> | null>(null);

  const setFrameSafe = (next: number) => {
    const n = ((next % frameCount) + frameCount) % frameCount;
    if (n !== frameRef.current) {
      frameRef.current = n;
      setFrame(n);
      onFrameChange?.(n);
    }
  };

  useEffect(() => {
    // reset to front when the edition (frame count/pack) changes
    frameRef.current = 0;
    setFrame(0);
    return () => {
      if (momentum.current) clearInterval(momentum.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pack]);

  const stopMomentum = () => {
    if (momentum.current) {
      clearInterval(momentum.current);
      momentum.current = null;
    }
  };

  const pan = useMemo(() => {
    // one full turn per ~1.4 widths of drag
    const stepPx = (width * 1.4) / frameCount;
    return PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_e, g) =>
        Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2,
      onPanResponderGrant: () => {
        stopMomentum();
        startFrame.current = frameRef.current;
      },
      onPanResponderMove: (_e, g) => {
        setFrameSafe(startFrame.current - Math.round(g.dx / stepPx));
      },
      onPanResponderRelease: (_e, g) => {
        // flick momentum: spin down over ~0.8s
        let v = -(g.vx * 1000) / stepPx / 60; // frames per tick
        if (Math.abs(v) < 0.4) return;
        v = Math.max(-3, Math.min(3, v));
        momentum.current = setInterval(() => {
          v *= 0.92;
          setFrameSafe(frameRef.current + Math.round(v) || frameRef.current + (v > 0 ? 1 : -1));
          if (Math.abs(v) < 0.25) stopMomentum();
        }, 33);
      },
      onPanResponderTerminate: stopMomentum,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, frameCount]);

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width, height }} {...pan.panHandlers}>
        <Image
          source={pack.frames[frame] ?? pack.frames[0]}
          accessibilityLabel="Your avatar, drag to rotate"
          style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
          fadeDuration={0}
        />
        {frame === 0 ? children : null}
      </View>
      {/* ground shadow */}
      <View
        style={{
          width: width * 0.5,
          height: 14,
          borderRadius: 999,
          backgroundColor: t.shadow,
          opacity: 0.45,
          marginTop: -6,
          transform: [{ scaleY: 0.5 }],
        }}
      />
    </View>
  );
}
