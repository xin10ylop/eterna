import type { ImageSourcePropType } from 'react-native';
import type { AvatarConfig } from '../../types';

/**
 * Avatar fronts.
 *
 * VARIANTS[skinTone][hairLength][hairColor] — a single clean, high-res front
 * render per combination. Skin tone comes from a real render (so the cream
 * outfit stays correct); hair color is a reliable hair-only recolor; length
 * is Long or Short. All variants share ONE uniform canvas (identical figure
 * scale and position), so switching is a smooth crossfade — never a jump —
 * and the fixed zone markers line up on every variant. Static: no rotation.
 *
 * skinTone: 0..4  ·  hairLength: 0=Long 1=Short  ·  hairColor: 0=Brown 1=Black 2=Blonde
 */
export const FRONT_ASPECT = 0.4766;

// prettier-ignore
export const VARIANTS: ImageSourcePropType[][][] = [
  [ // s0
    [require('../../../assets/avatar/fronts/s0_long_brown.webp'), require('../../../assets/avatar/fronts/s0_long_black.webp'), require('../../../assets/avatar/fronts/s0_long_blonde.webp')],
    [require('../../../assets/avatar/fronts/s0_bob_brown.webp'), require('../../../assets/avatar/fronts/s0_bob_black.webp'), require('../../../assets/avatar/fronts/s0_bob_blonde.webp')],
  ],
  [ // s2
    [require('../../../assets/avatar/fronts/s2_long_brown.webp'), require('../../../assets/avatar/fronts/s2_long_black.webp'), require('../../../assets/avatar/fronts/s2_long_blonde.webp')],
    [require('../../../assets/avatar/fronts/s2_bob_brown.webp'), require('../../../assets/avatar/fronts/s2_bob_black.webp'), require('../../../assets/avatar/fronts/s2_bob_blonde.webp')],
  ],
  [ // s3
    [require('../../../assets/avatar/fronts/s3_long_brown.webp'), require('../../../assets/avatar/fronts/s3_long_black.webp'), require('../../../assets/avatar/fronts/s3_long_blonde.webp')],
    [require('../../../assets/avatar/fronts/s3_bob_brown.webp'), require('../../../assets/avatar/fronts/s3_bob_black.webp'), require('../../../assets/avatar/fronts/s3_bob_blonde.webp')],
  ],
  [ // s4
    [require('../../../assets/avatar/fronts/s4_long_brown.webp'), require('../../../assets/avatar/fronts/s4_long_black.webp'), require('../../../assets/avatar/fronts/s4_long_blonde.webp')],
    [require('../../../assets/avatar/fronts/s4_bob_brown.webp'), require('../../../assets/avatar/fronts/s4_bob_black.webp'), require('../../../assets/avatar/fronts/s4_bob_blonde.webp')],
  ],
  [ // s5
    [require('../../../assets/avatar/fronts/s5_long_brown.webp'), require('../../../assets/avatar/fronts/s5_long_black.webp'), require('../../../assets/avatar/fronts/s5_long_blonde.webp')],
    [require('../../../assets/avatar/fronts/s5_bob_brown.webp'), require('../../../assets/avatar/fronts/s5_bob_black.webp'), require('../../../assets/avatar/fronts/s5_bob_blonde.webp')],
  ],
];

/** Flat list for preloading every variant up front. */
export const ALL_FRONTS: ImageSourcePropType[] = VARIANTS.flat(2);

const clamp = (v: number | undefined, hi: number) => (v && v > 0 ? (v > hi ? hi : v | 0) : 0);

export function frontFor(avatar?: AvatarConfig | null): ImageSourcePropType {
  return VARIANTS[clamp(avatar?.skinTone, 4)][clamp(avatar?.hairLength, 1)][clamp(avatar?.hairColor, 2)];
}

export function frontAt(skinTone: number, hairLength: number, hairColor: number): ImageSourcePropType {
  return VARIANTS[clamp(skinTone, 4)][clamp(hairLength, 1)][clamp(hairColor, 2)];
}
