import React, { useState } from 'react';
import { Modal, Pressable, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Path, Rect as SvgRect } from 'react-native-svg';
import { Entrance } from './anim/Entrance';
import { radii, spacing } from '../theme';
import { useTheme } from '../store';
import { useT } from '../i18n';

/**
 * First-run guided tour — the coach-mark pattern from Gymshark / My BMW /
 * monday.com on Mobbin: the REAL screen stays underneath, everything dims
 * except the element being explained, and one small card says what it does
 * with a step counter and Next. Tapping anywhere also advances, Skip is
 * always available, and the last step is a centered send-off card.
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
}

const PAD = 10; // breathing room between the element and the cutout edge
const RADIUS = 18;
const CARD_EST = 200; // rough card height used only to pick above/below

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

export function GuideTour({ steps, onDone }: { steps: GuideStep[]; onDone: () => void }) {
  const t = useTheme();
  const tx = useT();
  const { width: W, height: H } = useWindowDimensions();
  const [i, setI] = useState(0);

  if (steps.length === 0) return null;
  const step = steps[Math.min(i, steps.length - 1)];
  const last = i >= steps.length - 1;
  const next = () => (last ? onDone() : setI(i + 1));

  // Card goes under the spotlight when there's room, above it otherwise, and
  // pinned near the bottom when neither fits (a very tall spotlight).
  let pos: { top: number } | { bottom: number } | 'center' = 'center';
  if (step.rect) {
    const below = H - (step.rect.y + step.rect.h + PAD);
    if (below >= CARD_EST) pos = { top: step.rect.y + step.rect.h + PAD + 14 };
    else if (step.rect.y - PAD >= CARD_EST) pos = { bottom: H - step.rect.y + PAD + 14 };
    else pos = { bottom: 42 };
  }

  return (
    <Modal visible transparent statusBarTranslucent animationType="fade" onRequestClose={onDone}>
      <View style={{ flex: 1 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={last ? tx('guide.done') : tx('guide.next')}
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
          style={[
            { position: 'absolute', left: spacing.xl, right: spacing.xl },
            pos === 'center' ? { top: 0, bottom: 0, justifyContent: 'center' } : pos,
          ]}
        >
          {/* re-keyed per step so the card gently re-enters on each advance */}
          <Entrance key={step.key} distance={10}>
            <View
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
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.s }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: t.muted, flex: 1 }}>
                  {tx('guide.step', { n: i + 1, total: steps.length })}
                </Text>
                {!last ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={onDone}
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
                    {last ? tx('guide.done') : tx('guide.next')}
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
