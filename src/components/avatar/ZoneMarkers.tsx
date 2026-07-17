import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { ZONES } from '../../data/seed';
import type { ZoneId } from '../../types';
import { useTheme } from '../../store';

/**
 * Fixed zone markers — the "aura" treatment.
 *
 * Every zone has ONE fixed marker (hair, face, lips, body, hands, hips,
 * legs); the zone aggregates all of its treatments, so the map never gets
 * crowded no matter how much the user tracks.
 *
 * Visual language:
 * - Calm zone: a faint "glass" ring that recedes — visible, never loud.
 * - Attention zone: a soft luminous aura (radial gradient, no hard edge)
 *   with a crisp core, breathing slowly. Feels like light under the skin
 *   rather than a badge stuck on top.
 * - A zone tracking 2+ due items shows a tiny count so nothing hides.
 */

export interface ZoneMarkerDatum {
  zone: ZoneId;
  attentionCount: number;
}

const AURA = 56; // aura canvas size
const HIT = 44; // minimum touch target

function Aura({ color }: { color: string }) {
  return (
    <Svg width={AURA} height={AURA} viewBox={`0 0 ${AURA} ${AURA}`}>
      <Defs>
        <RadialGradient id="aura" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={color} stopOpacity={0.55} />
          <Stop offset="45%" stopColor={color} stopOpacity={0.22} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={AURA / 2} cy={AURA / 2} r={AURA / 2} fill="url(#aura)" />
    </Svg>
  );
}

function Marker({
  attention,
  count,
  onPress,
  label,
}: {
  attention: boolean;
  count: number;
  onPress: () => void;
  label: string;
}) {
  const t = useTheme();
  const breath = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!attention) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(breath, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [attention, breath]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}${attention ? `, ${count} due` : ''}`}
      onPress={onPress}
      style={{ width: HIT, height: HIT, alignItems: 'center', justifyContent: 'center' }}
    >
      {attention ? (
        <>
          <Animated.View
            style={{
              position: 'absolute',
              opacity: breath.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] }),
              transform: [
                { scale: breath.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.12] }) },
              ],
            }}
          >
            <Aura color={t.accent} />
          </Animated.View>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: t.accent,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.9)',
            }}
          />
          {count > 1 ? (
            <View
              style={{
                position: 'absolute',
                top: 4,
                right: 2,
                minWidth: 15,
                height: 15,
                borderRadius: 8,
                paddingHorizontal: 3,
                backgroundColor: t.accent,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: '#FFFFFF',
              }}
            >
              <Text style={{ color: t.onAccent, fontSize: 9, fontWeight: '700' }}>{count}</Text>
            </View>
          ) : null}
        </>
      ) : (
        <View
          style={{
            width: 14,
            height: 14,
            borderRadius: 7,
            borderWidth: 1.2,
            borderColor: 'rgba(255,255,255,0.95)',
            backgroundColor: 'rgba(28,28,30,0.10)',
          }}
        />
      )}
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
      {ZONES.map((z) => {
        const d = data.find((x) => x.zone === z.id);
        return (
          <View
            key={z.id}
            pointerEvents="box-none"
            style={{
              position: 'absolute',
              left: `${z.marker.xPct}%`,
              top: `${z.marker.yPct}%`,
              marginLeft: -HIT / 2,
              marginTop: -HIT / 2,
            }}
          >
            <Marker
              attention={(d?.attentionCount ?? 0) > 0}
              count={d?.attentionCount ?? 0}
              label={z.label}
              onPress={() => onOpenZone(z.id)}
            />
          </View>
        );
      })}
    </View>
  );
}
