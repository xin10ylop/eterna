import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { AVATAR_MARKERS } from '../../data/seed';
import type { ZoneId } from '../../types';
import { useTheme } from '../../store';

/**
 * Fixed glowing markers on the avatar — hair, face, body, hands, feet.
 *
 * Each body part carries a small "pearl" of warm light: a luminous bead with a
 * white-hot core and a soft glow halo, so it reads as a clean modern glow — not
 * a bare dot, not a muddy blob. A part that needs attention brightens and
 * breathes (the glow gently pulses) and shows a count when several items are
 * due; calm parts stay a quiet dim pearl. Positions are fixed % of the display
 * box, measured against the figure so each pearl sits exactly on its part.
 */

export interface ZoneMarkerDatum {
  zone: ZoneId;
  attentionCount: number;
}

const CANVAS = 54;
const C = CANVAS / 2;
const GLOW = '#F2A97E'; // luminous warm glow — reads as light on every skin tone

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

function Marker({
  id,
  attention,
  count,
  onPress,
  label,
}: {
  id: string;
  attention: boolean;
  count: number;
  onPress: () => void;
  label: string;
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

  const haloR = attention ? 13 : 10;
  const orbR = attention ? 7 : 5;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={attention ? `${label}, ${count} due` : label}
      onPress={onPress}
      hitSlop={8}
      style={{ width: CANVAS, height: CANVAS, alignItems: 'center', justifyContent: 'center' }}
    >
      <AnimatedSvg
        width={CANVAS}
        height={CANVAS}
        style={
          attention
            ? {
                opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] }),
                transform: [
                  { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.93, 1.07] }) },
                ],
              }
            : undefined
        }
      >
        <Defs>
          <RadialGradient id={`halo-${id}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={GLOW} stopOpacity={0.7} />
            <Stop offset="55%" stopColor={GLOW} stopOpacity={0.26} />
            <Stop offset="100%" stopColor={GLOW} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id={`orb-${id}`} cx="42%" cy="38%" r="65%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.98} />
            <Stop offset="42%" stopColor={GLOW} stopOpacity={0.95} />
            <Stop offset="100%" stopColor={t.accent} stopOpacity={0.95} />
          </RadialGradient>
        </Defs>
        {/* soft glow halo */}
        <Circle cx={C} cy={C} r={haloR} fill={`url(#halo-${id})`} opacity={attention ? 1 : 0.4} />
        {/* luminous bead */}
        <Circle cx={C} cy={C} r={orbR} fill={`url(#orb-${id})`} opacity={attention ? 1 : 0.55} />
        {/* specular highlight */}
        <Ellipse
          cx={C - 3}
          cy={C - 3.5}
          rx={2.4}
          ry={1.7}
          fill="#FFFFFF"
          opacity={attention ? 0.85 : 0.4}
        />
      </AnimatedSvg>
      {count > 1 ? (
        <View
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            minWidth: 17,
            height: 17,
            borderRadius: 9,
            paddingHorizontal: 4,
            backgroundColor: t.accent,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1.5,
            borderColor: '#fff',
          }}
        >
          <Text style={{ color: t.onAccent, fontSize: 9.5, fontWeight: '800' }}>{count}</Text>
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
              marginLeft: -CANVAS / 2,
              marginTop: -CANVAS / 2,
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
