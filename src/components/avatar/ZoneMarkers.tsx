import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { ZONES } from '../../data/seed';
import type { ZoneId } from '../../types';
import { useTheme } from '../../store';

/**
 * Fixed zone markers, minimal treatment.
 *
 * Every zone has ONE fixed marker (hair, face, lips, body, hands, hips,
 * legs); the zone aggregates all of its treatments, so the map never gets
 * crowded no matter how much the user tracks.
 *
 * Visual language (calm, no glowing domes over the figure):
 * - Calm zone: invisible. Nothing sits on the body when nothing is due.
 * - Attention zone: a small crisp dot with a thin expanding ring that
 *   pulses once every few seconds, plus a tiny count when 2+ items are due.
 */

export interface ZoneMarkerDatum {
  zone: ZoneId;
  attentionCount: number;
}

const HIT = 44; // minimum touch target

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
  const ring = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!attention) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(ring, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.delay(1200),
        Animated.timing(ring, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [attention, ring]);

  if (!attention) return null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${count} due`}
      onPress={onPress}
      style={{ width: HIT, height: HIT, alignItems: 'center', justifyContent: 'center' }}
    >
      {/* one thin ring, expanding and fading */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 18,
          height: 18,
          borderRadius: 9,
          borderWidth: 1.5,
          borderColor: t.accent,
          opacity: ring.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.55, 0] }),
          transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [0.7, 2.1] }) }],
        }}
      />
      <View
        style={{
          width: 11,
          height: 11,
          borderRadius: 6,
          backgroundColor: t.accent,
          borderWidth: 1.5,
          borderColor: '#FFFFFF',
        }}
      />
      {count > 1 ? (
        <View
          style={{
            position: 'absolute',
            top: 6,
            right: 4,
            minWidth: 14,
            height: 14,
            borderRadius: 7,
            paddingHorizontal: 3,
            backgroundColor: t.text,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: t.bg, fontSize: 9, fontWeight: '700' }}>{count}</Text>
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
