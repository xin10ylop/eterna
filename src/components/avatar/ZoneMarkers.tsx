import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { AVATAR_MARKERS } from '../../data/seed';
import type { ZoneId } from '../../types';
import { useTheme } from '../../store';

/**
 * Attention glows on the avatar — hair, face, body, hands.
 *
 * A body part that needs attention softly glows from within: a large, soft
 * radial light in the accent color that breathes (no hard dot, no dome). Calm
 * parts show nothing. Each glow is tappable and shows a small count when
 * several items are due.
 */

export interface ZoneMarkerDatum {
  zone: ZoneId;
  attentionCount: number;
}

const GLOW = 130; // glow canvas size (px)
const HIT = 64; // touch target

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

function Marker({
  attention,
  count,
  onPress,
  label,
  id,
}: {
  attention: boolean;
  count: number;
  onPress: () => void;
  label: string;
  id: string;
}) {
  const t = useTheme();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!attention) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [attention, pulse]);

  if (!attention) return null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${count} due`}
      onPress={onPress}
      style={{ width: HIT, height: HIT, alignItems: 'center', justifyContent: 'center' }}
    >
      {/* soft light from within — two overlaid glows for depth */}
      <AnimatedSvg
        width={GLOW}
        height={GLOW}
        style={{
          position: 'absolute',
          opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }),
          transform: [
            { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1.12] }) },
          ],
        }}
      >
        <Defs>
          <RadialGradient id={`g-${id}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={t.accent} stopOpacity={0.5} />
            <Stop offset="32%" stopColor={t.accent} stopOpacity={0.28} />
            <Stop offset="64%" stopColor={t.accent} stopOpacity={0.1} />
            <Stop offset="100%" stopColor={t.accent} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={GLOW / 2} cy={GLOW / 2} r={GLOW / 2} fill={`url(#g-${id})`} />
      </AnimatedSvg>
      {count > 1 ? (
        <View
          style={{
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            paddingHorizontal: 4,
            backgroundColor: t.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: t.onAccent, fontSize: 10, fontWeight: '800' }}>{count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function ZoneMarkers({
  data,
  onOpenZone,
}: {
  data: ZoneMarkerDatum[];
  onOpenZone: (zone: ZoneId) => void;
}) {
  return (
    <View style={{ position: 'absolute', inset: 0 }} pointerEvents="box-none">
      {AVATAR_MARKERS.map((m) => {
        const count = m.zones.reduce(
          (s, z) => s + (data.find((x) => x.zone === z)?.attentionCount ?? 0),
          0,
        );
        return (
          <View
            key={m.id}
            style={{
              position: 'absolute',
              left: `${m.marker.xPct}%`,
              top: `${m.marker.yPct}%`,
              marginLeft: -HIT / 2,
              marginTop: -HIT / 2,
            }}
          >
            <Marker
              id={m.id}
              attention={count > 0}
              count={count}
              label={m.label}
              onPress={() => onOpenZone(m.id)}
            />
          </View>
        );
      })}
    </View>
  );
}
