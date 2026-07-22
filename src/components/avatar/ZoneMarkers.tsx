import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { AVATAR_MARKERS } from '../../data/seed';
import type { ZoneId } from '../../types';
import type { GlowStatus, ZoneGlowInfo } from '../../services/logic';

/**
 * Status glow on the avatar — head, body, hands, feet.
 *
 * Two colours only, so the rule fits in one sentence: maroon means coming up,
 * red means overdue — and the faster it breathes, the closer it is.
 *   calm — a whisper of light, barely there. Keeps the area visibly tappable
 *          without reading as a status.
 *   soon — a dense maroon glow whose breath ACCELERATES as the due date nears
 *          (a countdown she can feel: slow when the window opens, urgent when
 *          it's almost due).
 *   due  — red, the fastest breath of all, largest and brightest.
 * A marker's status is the most urgent among the zones it covers.
 */

const CANVAS = 74;
const C = CANVAS / 2;

// Colour holds out to ~42% before it fades and opacity floors sit high, so each
// glow reads even at the dim end of the breath. A low `core` keeps the hue
// saturated (a high white centre would wash it out against the warm figure).
const STYLE: Record<
  GlowStatus,
  {
    rgb: string;
    core: number;
    mid: number;
    period: number;
    oMin: number;
    oMax: number;
    sMin: number;
    sMax: number;
    r: number;
  }
> = {
  // calm is deliberately quiet: warm white, small, slow — presence, not alarm
  calm: { rgb: '255,252,246', core: 0.5, mid: 0.36, period: 3600, oMin: 0.35, oMax: 0.6, sMin: 0.95, sMax: 1.03, r: 16 },
  // soon's period is a placeholder — it's recomputed from urgency below
  soon: { rgb: '112,50,28', core: 0.14, mid: 0.74, period: 3000, oMin: 0.85, oMax: 1.0, sMin: 0.9, sMax: 1.15, r: 22 },
  due: { rgb: '188,34,24', core: 0.3, mid: 0.74, period: 1100, oMin: 0.88, oMax: 1.0, sMin: 0.9, sMax: 1.2, r: 23 },
};

// The maroon countdown: the window just opened → slow; due tomorrow → fast.
// Red (1100ms) stays fastest so the hierarchy never inverts.
const SOON_PERIOD_FAR = 3000;
const SOON_PERIOD_NEAR = 1600;

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

const RANK: Record<GlowStatus, number> = { calm: 0, soon: 1, due: 2 };

function worst(a: ZoneGlowInfo, b: ZoneGlowInfo): ZoneGlowInfo {
  if (RANK[b.status] !== RANK[a.status]) return RANK[b.status] > RANK[a.status] ? b : a;
  return b.urgency > a.urgency ? b : a;
}

function Glow({
  status,
  urgency,
  label,
  onPress,
}: {
  status: GlowStatus;
  urgency: number;
  label: string;
  onPress: () => void;
}) {
  const s = STYLE[status];
  const period =
    status === 'soon'
      ? Math.round(SOON_PERIOD_FAR - (SOON_PERIOD_FAR - SOON_PERIOD_NEAR) * urgency)
      : s.period;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    pulse.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: period / 2, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: period / 2, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, period]);

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
            <Stop offset="42%" stopColor={`rgb(${s.rgb})`} stopOpacity={s.mid} />
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
  zoneGlows: Partial<Record<ZoneId, ZoneGlowInfo>>;
  onOpenZone: (zone: ZoneId) => void;
}) {
  return (
    <View style={{ position: 'absolute', inset: 0 }} pointerEvents="box-none">
      {AVATAR_MARKERS.map((m) => {
        const info = m.zones.reduce<ZoneGlowInfo>(
          (acc, z) => worst(acc, zoneGlows[z] ?? { status: 'calm', urgency: 0 }),
          { status: 'calm', urgency: 0 },
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
            <Glow
              status={info.status}
              urgency={info.urgency}
              label={m.label}
              onPress={() => onOpenZone(m.id)}
            />
          </View>
        );
      })}
    </View>
  );
}
