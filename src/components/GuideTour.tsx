import React, { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Path, Rect as SvgRect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Entrance } from './anim/Entrance';
import { GlowSwatch } from './avatar/ZoneMarkers';
import { radii, spacing } from '../theme';
import { useTheme } from '../store';
import { useT } from '../i18n';

/**
 * Guided tour — the coach-mark pattern from Gymshark / My BMW / monday.com on
 * Mobbin: the REAL screen stays underneath, everything dims except the element
 * being explained, and one small card says what it does with a global step
 * counter and Next. The tour runs in chapters across the tabs; each screen
 * renders its own GuideTour for its steps, and the offset/total props keep a
 * single "3 of 8" count across all of them. Tapping anywhere advances, Skip
 * ends the whole tour.
 */

export interface GuideRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface GuideStep {
  key: string;
  title: string;
  body: string;
  /** Element to spotlight, in window coordinates. null = no spotlight, the
   *  card sits centered over a full dim (the closing step). */
  rect: GuideRect | null;
  /** Extra display inside the card: 'glows' shows the live three-state glow
   *  legend, breathing at real speed. */
  legend?: 'glows';
}

const PAD = 10; // breathing room between the element and the cutout edge
const RADIUS = 18;
const GAP = 14; // spotlight edge → card
const EDGE = 10; // card → screen safe edge

/** Full-screen rect with a rounded hole punched out (evenodd fill). */
function cutoutPath(W: number, H: number, r: GuideRect): string {
  const x = r.x - PAD;
  const y = r.y - PAD;
  const w = r.w + PAD * 2;
  const h = r.h + PAD * 2;
  const rad = Math.min(RADIUS, w / 2, h / 2);
  return (
    `M0 0H${W}V${H}H0Z` +
    `M${x + rad} ${y}H${x + w - rad}` +
    `A${rad} ${rad} 0 0 1 ${x + w} ${y + rad}V${y + h - rad}` +
    `A${rad} ${rad} 0 0 1 ${x + w - rad} ${y + h}H${x + rad}` +
    `A${rad} ${rad} 0 0 1 ${x} ${y + h - rad}V${y + rad}` +
    `A${rad} ${rad} 0 0 1 ${x + rad} ${y}Z`
  );
}

/** Measure a set of refs in window coordinates once `active` turns true.
 *  Returns null until measured; keys whose refs are absent are omitted. */
export function useGuideRects(
  active: boolean,
  refs: Record<string, React.RefObject<View | null>>,
  delay = 500,
): Record<string, GuideRect> | null {
  const [rects, setRects] = useState<Record<string, GuideRect> | null>(null);
  useEffect(() => {
    if (!active) {
      setRects(null);
      return;
    }
    // let entrance animations and the tab switch settle before measuring
    const timer = setTimeout(() => {
      Promise.all(
        Object.entries(refs).map(
          ([key, ref]) =>
            new Promise<[string, GuideRect] | null>((res) => {
              if (!ref.current) return res(null);
              ref.current.measureInWindow((x, y, w, h) =>
                res(w > 0 && h > 0 ? [key, { x, y, w, h }] : null),
              );
            }),
        ),
      ).then((entries) => {
        const m: Record<string, GuideRect> = {};
        for (const e of entries) if (e) m[e[0]] = e[1];
        setRects(m);
      });
    }, delay);
    return () => clearTimeout(timer);
    // refs hold stable RefObjects; only re-measure when activation changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, delay]);
  return rects;
}

function GlowLegend() {
  const t = useTheme();
  const tx = useT();
  const items = [
    { status: 'calm' as const, urgency: 0, label: tx('guide.legend.calm'), sub: tx('guide.legend.calmSub') },
    { status: 'soon' as const, urgency: 0.65, label: tx('guide.legend.soon'), sub: tx('guide.legend.soonSub') },
    { status: 'due' as const, urgency: 1, label: tx('guide.legend.due'), sub: tx('guide.legend.dueSub') },
  ];
  return (
    <View
      style={{
        flexDirection: 'row',
        marginTop: spacing.s,
        backgroundColor: t.surfaceAlt,
        borderRadius: radii.m,
        paddingVertical: spacing.m,
      }}
    >
      {items.map((it) => (
        <View key={it.status} style={{ flex: 1, alignItems: 'center', gap: 2 }}>
          <GlowSwatch status={it.status} urgency={it.urgency} size={44} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: t.text }}>{it.label}</Text>
          <Text style={{ fontSize: 10.5, color: t.muted }}>{it.sub}</Text>
        </View>
      ))}
    </View>
  );
}

export function GuideTour({
  steps,
  offset,
  total,
  onComplete,
  onSkip,
}: {
  steps: GuideStep[];
  /** Global steps completed before this chapter (drives the counter). */
  offset: number;
  /** Global step count across all chapters. */
  total: number;
  /** This chapter's steps are done — advance the tour. */
  onComplete: () => void;
  /** She opted out — end the whole tour. */
  onSkip: () => void;
}) {
  const t = useTheme();
  const tx = useT();
  const { width: W, height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [i, setI] = useState(0);
  const [cardH, setCardH] = useState(0);

  if (steps.length === 0) return null;
  const step = steps[Math.min(i, steps.length - 1)];
  const globalIndex = offset + Math.min(i, steps.length - 1) + 1;
  const globalLast = globalIndex >= total;
  const next = () => (i >= steps.length - 1 ? onComplete() : setI(i + 1));

  // Card under the spotlight when there's room, above it otherwise, clamped
  // inside the safe area either way — measured height, no guessing.
  const est = cardH || 190;
  const topMin = insets.top + EDGE;
  const topMax = H - insets.bottom - EDGE - est;
  let top: number;
  if (!step.rect) {
    top = Math.max(topMin, (H - est) / 2);
  } else {
    const belowStart = step.rect.y + step.rect.h + PAD + GAP;
    const aboveEnd = step.rect.y - PAD - GAP;
    if (belowStart + est <= H - insets.bottom - EDGE) top = belowStart;
    else if (aboveEnd - est >= topMin) top = aboveEnd - est;
    else top = topMax; // very tall spotlight — sit at the bottom edge
    top = Math.min(Math.max(top, topMin), Math.max(topMin, topMax));
  }

  return (
    <Modal visible transparent statusBarTranslucent animationType="fade" onRequestClose={onSkip}>
      <View style={{ flex: 1 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={globalLast ? tx('guide.done') : tx('guide.next')}
          onPress={next}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <Svg width={W} height={H}>
            {step.rect ? (
              <>
                <Path d={cutoutPath(W, H, step.rect)} fill="rgba(30,18,14,0.66)" fillRule="evenodd" />
                <SvgRect
                  x={step.rect.x - PAD}
                  y={step.rect.y - PAD}
                  width={step.rect.w + PAD * 2}
                  height={step.rect.h + PAD * 2}
                  rx={RADIUS}
                  fill="none"
                  stroke="rgba(255,255,255,0.85)"
                  strokeWidth={1.5}
                />
              </>
            ) : (
              <Path d={`M0 0H${W}V${H}H0Z`} fill="rgba(30,18,14,0.72)" />
            )}
          </Svg>
        </Pressable>

        <View
          pointerEvents="box-none"
          style={{ position: 'absolute', left: spacing.xl, right: spacing.xl, top }}
        >
          {/* re-keyed per step so the card gently re-enters on each advance */}
          <Entrance key={step.key} distance={10}>
            <View
              onLayout={(e) => setCardH(e.nativeEvent.layout.height)}
              style={{
                backgroundColor: t.bg,
                borderRadius: radii.l,
                padding: spacing.l,
                gap: 6,
                shadowColor: '#000',
                shadowOpacity: 0.22,
                shadowRadius: 18,
                shadowOffset: { width: 0, height: 8 },
                elevation: 8,
              }}
            >
              <Text style={{ fontSize: 16.5, fontWeight: '700', color: t.text }}>{step.title}</Text>
              <Text style={{ fontSize: 13.5, color: t.sub, lineHeight: 19 }}>{step.body}</Text>
              {step.legend === 'glows' ? <GlowLegend /> : null}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.s }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: t.muted, flex: 1 }}>
                  {tx('guide.step', { n: globalIndex, total })}
                </Text>
                {!globalLast ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={onSkip}
                    hitSlop={8}
                    style={{ paddingVertical: 8, paddingHorizontal: 12 }}
                  >
                    <Text style={{ fontSize: 13.5, fontWeight: '600', color: t.sub }}>
                      {tx('guide.skip')}
                    </Text>
                  </Pressable>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  onPress={next}
                  style={({ pressed }) => ({
                    paddingVertical: 9,
                    paddingHorizontal: 20,
                    borderRadius: radii.pill,
                    backgroundColor: t.accent,
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Text style={{ fontSize: 14, fontWeight: '700', color: t.onAccent }}>
                    {globalLast ? tx('guide.done') : tx('guide.next')}
                  </Text>
                </Pressable>
              </View>
            </View>
          </Entrance>
        </View>
      </View>
    </Modal>
  );
}
