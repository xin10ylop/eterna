import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { AVATAR_MARKERS } from '../../data/seed';
import type { ZoneId } from '../../types';
import type { GlowStatus } from '../../services/logic';

/**
 * Status glow on the avatar — hair, face, body, hands, feet.
 *
 * No dot, no object: the body part itself glows, and colour + rhythm carry the
 * status. All good = a clean white light, slow and calm. Coming up = a deep
 * clay, medium. Book now = a warm red, quicker and stronger. Warmer + faster =
 * more urgent. A marker's status is the most urgent among the zones it covers.
 */

const CANVAS = 66;
const C = CANVAS / 2;

// Colour + rhythm carry the status; darker + faster = more urgent. `core` is the
// white centre's opacity — lower on soon/due so the deeper colour reads instead
// of washing out to white.
const STYLE: Record<
  GlowStatus,
  { rgb: string; core: number; period: number; oMin: number; oMax: number; sMin: number; sMax: number; r: number }
> = {
  calm: { rgb: '255,255,255', core: 0.92, period: 4200, oMin: 0.34, oMax: 0.62, sMin: 0.9, sMax: 1.04, r: 16 },
  soon: { rgb: '150,58,36', core: 0.42, period: 3200, oMin: 0.56, oMax: 0.88, sMin: 0.86, sMax: 1.12, r: 18 },
  due: { rgb: '178,38,28', core: 0.42, period: 1500, oMin: 0.62, oMax: 1.0, sMin: 0.86, sMax: 1.18, r: 19 },
};

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

function worst(a: GlowStatus, b: GlowStatus): GlowStatus {
  if (a === 'due' || b === 'due') return 'due';
  if (a === 'soon' || b === 'soon') return 'soon';
  return 'calm';
}

function Glow({
  status,
  label,
  onPress,
}: {
  status: GlowStatus;
  label: string;
  onPress: () => void;
}) {
  const s = STYLE[status];
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    pulse.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: s.period / 2, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: s.period / 2, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, s.period]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={10}
      style={{ width: CANVAS, height: CANVAS, alignItems: 'center', justifyContent: 'center' }}
    >
      <AnimatedSvg
        width={CANVAS}
        height={CANVAS}
        style={{
          opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [s.oMin, s.oMax] }),
          transform: [
            { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [s.sMin, s.sMax] }) },
          ],
        }}
      >
        <Defs>
          <RadialGradient id={`glow-${label}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={s.core} />
            <Stop offset="34%" stopColor={`rgb(${s.rgb})`} stopOpacity={0.62} />
            <Stop offset="100%" stopColor={`rgb(${s.rgb})`} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={C} cy={C} r={s.r} fill={`url(#glow-${label})`} />
      </AnimatedSvg>
    </Pressable>
  );
}

export function ZoneMarkers({
  zoneGlows,
  onOpenZone,
}: {
  zoneGlows: Partial<Record<ZoneId, GlowStatus>>;
  onOpenZone: (zone: ZoneId) => void;
}) {
  return (
    <View style={{ position: 'absolute', inset: 0 }} pointerEvents="box-none">
      {AVATAR_MARKERS.map((m) => {
        const status = m.zones.reduce<GlowStatus>(
          (acc, z) => worst(acc, zoneGlows[z] ?? 'calm'),
          'calm',
        );
        return (
          <View
            key={m.id}
            style={{
              position: 'absolute',
              left: `${m.marker.xPct}%`,
              top: `${m.marker.yPct}%`,
              marginLeft: -CANVAS / 2,
              marginTop: -CANVAS / 2,
            }}
          >
            <Glow status={status} label={m.label} onPress={() => onOpenZone(m.id)} />
          </View>
        );
      })}
    </View>
  );
}
