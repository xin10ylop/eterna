import type { ImageSourcePropType } from 'react-native';
import type { AvatarConfig } from '../../types';

/**
 * Avatar fronts.
 *
 * A single clean, high-res front render per (skin tone × hair look). All 18
 * are composited onto one uniform canvas — identical figure scale and
 * position — so switching is a smooth crossfade (no jump) and the fixed zone
 * markers line up on every variant. Static: no rotation, no drag.
 *
 * FRONTS[skinTone][hairLook] — hairLook 0=Long, 1=Bob, 2=Blonde.
 */
export const FRONT_ASPECT = 0.4718;

export const FRONTS: ImageSourcePropType[][] = [
  [
    require('../../../assets/avatar/fronts/s0_long.png'),
    require('../../../assets/avatar/fronts/s0_bob.png'),
    require('../../../assets/avatar/fronts/s0_blonde.png'),
  ],
  [
    require('../../../assets/avatar/fronts/s1_long.png'),
    require('../../../assets/avatar/fronts/s1_bob.png'),
    require('../../../assets/avatar/fronts/s1_blonde.png'),
  ],
  [
    require('../../../assets/avatar/fronts/s2_long.png'),
    require('../../../assets/avatar/fronts/s2_bob.png'),
    require('../../../assets/avatar/fronts/s2_blonde.png'),
  ],
  [
    require('../../../assets/avatar/fronts/s3_long.png'),
    require('../../../assets/avatar/fronts/s3_bob.png'),
    require('../../../assets/avatar/fronts/s3_blonde.png'),
  ],
  [
    require('../../../assets/avatar/fronts/s4_long.png'),
    require('../../../assets/avatar/fronts/s4_bob.png'),
    require('../../../assets/avatar/fronts/s4_blonde.png'),
  ],
  [
    require('../../../assets/avatar/fronts/s5_long.png'),
    require('../../../assets/avatar/fronts/s5_bob.png'),
    require('../../../assets/avatar/fronts/s5_blonde.png'),
  ],
];

/** Flat list, in FRONTS order, for preloading every variant up front. */
export const ALL_FRONTS: ImageSourcePropType[] = FRONTS.flat();

const clamp = (v: number | undefined, hi: number) => (v && v > 0 ? (v > hi ? hi : v | 0) : 0);

export function frontFor(avatar?: AvatarConfig | null): ImageSourcePropType {
  return FRONTS[clamp(avatar?.skinTone, 5)][clamp(avatar?.hairLook, 2)];
}

export function frontAt(skinTone: number, hairLook: number): ImageSourcePropType {
  return FRONTS[clamp(skinTone, 5)][clamp(hairLook, 2)];
}
