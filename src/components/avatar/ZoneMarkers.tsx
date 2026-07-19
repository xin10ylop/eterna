import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { AVATAR_MARKERS } from '../../data/seed';
import type { ZoneId } from '../../types';
import { useTheme } from '../../store';

/**
 * Four fixed markers on the avatar — hair, face, body, hands.
 *
 * Each shows a small, refined "glass bead" at its fixed position so the map is
 * always legible. A marker that needs attention lifts into a soft accent dome
 * (radial glow) with a solid core and a gentle breath, plus a count when
 * several items are due. Calm and clean — no hard-edged blobs.
 */

export interface ZoneMarkerDatum {
  zone: ZoneId;
  attentionCount: number;
}

const HIT = 44;
const DOME = 46;

function Dome({ color }: { color: string }) {
  return (
    <Svg width={DOME} height={DOME}>
      <Defs>
        <RadialGradient id="d" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={color} stopOpacity={0.5} />
          <Stop offset="40%" stopColor={color} stopOpacity={0.22} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={DOME / 2} cy={DOME / 2} r={DOME / 2} fill="url(#d)" />
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
        Animated.timing(breath, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(breath, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [attention, breath]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}${attention ? `, ${count} due` : ', on track'}`}
      onPress={onPress}
      style={{ width: HIT, height: HIT, alignItems: 'center', justifyContent: 'center' }}
    >
      {attention ? (
        <>
          <Animated.View
            style={{
              position: 'absolute',
              opacity: breath.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }),
              transform: [{ scale: breath.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.1] }) }],
            }}
          >
            <Dome color={t.accent} />
          </Animated.View>
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: t.accent,
              borderWidth: 1.5,
              borderColor: 'rgba(255,255,255,0.95)',
            }}
          />
          {count > 1 ? (
            <View
              style={{
                position: 'absolute',
                top: 3,
                right: 2,
                minWidth: 15,
                height: 15,
                borderRadius: 8,
                paddingHorizontal: 3,
                backgroundColor: t.text,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: t.bg, fontSize: 9, fontWeight: '700' }}>{count}</Text>
            </View>
          ) : null}
        </>
      ) : (
        // calm zone: a quiet glass bead
        <View
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: 'rgba(255,255,255,0.55)',
            borderWidth: 1,
            borderColor: 'rgba(70,55,45,0.28)',
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
