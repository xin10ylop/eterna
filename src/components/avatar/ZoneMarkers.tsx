import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { AVATAR_MARKERS } from '../../data/seed';
import type { ZoneId } from '../../types';
import type { GlowStatus, ZoneGlowInfo } from '../../services/logic';

/**
 * Status glow on the avatar — head, body, hands, feet. All four areas ALWAYS
 * glow, so the map is complete at a glance:
 *   calm — a soft "dark white" (warm greige) glow, the slowest breath.
 *          "Nothing needed here", and the area stays clearly tappable.
 *   soon — a dense maroon glow whose breath ACCELERATES as the due date nears
 *          (a countdown she can feel: slow when the window opens, urgent when
 *          it's almost due).
 *   due  — red, the fastest breath of all, largest and brightest.
 * One sentence covers it: light means all good, maroon means coming up, red
 * means overdue — and the faster it breathes, the closer it is.
 * A marker's status is the most urgent among the zones it covers.
 */

const CANVAS = 74;

// Colour holds out to ~42% before it fades and opacity floors sit high, so each
// glow reads even at the dim end of the breath. A low `core` keeps the hue
// saturated (a high white centre would wash it out against the warm figure);
// calm inverts that — it IS the white centre, soft on purpose.
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
  // calm: a "dark white" — warm greige deep enough to read over skin (hands,
  // torso), with a restrained white core so the hue isn't washed out. Still
  // the slowest breath of the three.
  calm: { rgb: '134,102,84', core: 0.42, mid: 0.82, period: 2800, oMin: 0.64, oMax: 0.9, sMin: 0.96, sMax: 1.05, r: 20 },
  // soon's period is a placeholder — it's recomputed from urgency below
  soon: { rgb: '96,40,24', core: 0.14, mid: 0.78, period: 2400, oMin: 0.85, oMax: 1.0, sMin: 0.9, sMax: 1.15, r: 22 },
  due: { rgb: '188,34,24', core: 0.3, mid: 0.74, period: 1100, oMin: 0.88, oMax: 1.0, sMin: 0.9, sMax: 1.2, r: 23 },
};

// The maroon countdown: the window just opened → slow; due tomorrow → fast.
// Red (1100ms) stays fastest so the hierarchy never inverts.
const SOON_PERIOD_FAR = 2400;
const SOON_PERIOD_NEAR = 1400;

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

const RANK: Record<GlowStatus, number> = { calm: 0, soon: 1, due: 2 };

function worst(a: ZoneGlowInfo, b: ZoneGlowInfo): ZoneGlowInfo {
  if (RANK[b.status] !== RANK[a.status]) return RANK[b.status] > RANK[a.status] ? b : a;
  return b.urgency > a.urgency ? b : a;
}

/** The breathing orb itself, shared by the avatar markers and the guide's
 *  legend swatches. `id` must be unique per mounted orb (gradient ids are
 *  global to the SVG registry). */
function BreathingOrb({
  status,
  urgency,
  id,
  canvas = CANVAS,
}: {
  status: GlowStatus;
  urgency: number;
  id: string;
  canvas?: number;
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

  const c = canvas / 2;
  const r = s.r * (canvas / CANVAS);

  return (
    <AnimatedSvg
      width={canvas}
      height={canvas}
      style={{
        opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [s.oMin, s.oMax] }),
        transform: [
          { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [s.sMin, s.sMax] }) },
        ],
      }}
    >
      <Defs>
        <RadialGradient id={`glow-${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={s.core} />
          <Stop offset="42%" stopColor={`rgb(${s.rgb})`} stopOpacity={s.mid} />
          <Stop offset="100%" stopColor={`rgb(${s.rgb})`} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={c} cy={c} r={r} fill={`url(#glow-${id})`} />
    </AnimatedSvg>
  );
}

/** A small live sample of one glow state, for the guide's legend — it breathes
 *  at the real speed, so the difference is SEEN, not described. */
export function GlowSwatch({
  status,
  urgency = 0,
  size = 46,
}: {
  status: GlowStatus;
  urgency?: number;
  size?: number;
}) {
  return (
    <View style={{ width: size, height: size }}>
      <BreathingOrb status={status} urgency={urgency} id={`swatch-${status}`} canvas={size} />
    </View>
  );
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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={10}
      style={{ width: CANVAS, height: CANVAS, alignItems: 'center', justifyContent: 'center' }}
    >
      <BreathingOrb status={status} urgency={urgency} id={label} />
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
