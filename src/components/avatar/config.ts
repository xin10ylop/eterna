import type { ImageSourcePropType } from 'react-native';
import type { AvatarConfig } from '../../types';

/**
 * Avatar fronts.
 *
 * VARIANTS[skinTone][hairColor] — every variant is the SAME mesh-rendered
 * figure recolored (skin masked by hue so the cream outfit is never touched;
 * hair recolored separately). Because the pixels are identical except for
 * skin/hair color, placement is exactly the same on every variant and the
 * crossfade is seamless (nothing moves). Tiny WebP, preloaded at launch.
 *
 * skinTone: 0..4 (light→deep)  ·  hairColor: 0=Brown 1=Black 2=Blonde
 */
export const FRONT_ASPECT = 0.4603;

// prettier-ignore
export const VARIANTS: ImageSourcePropType[][] = [
  [require('../../../assets/avatar/fronts/s0_brown.webp'), require('../../../assets/avatar/fronts/s0_black.webp'), require('../../../assets/avatar/fronts/s0_blonde.webp')],
  [require('../../../assets/avatar/fronts/s1_brown.webp'), require('../../../assets/avatar/fronts/s1_black.webp'), require('../../../assets/avatar/fronts/s1_blonde.webp')],
  [require('../../../assets/avatar/fronts/s2_brown.webp'), require('../../../assets/avatar/fronts/s2_black.webp'), require('../../../assets/avatar/fronts/s2_blonde.webp')],
  [require('../../../assets/avatar/fronts/s3_brown.webp'), require('../../../assets/avatar/fronts/s3_black.webp'), require('../../../assets/avatar/fronts/s3_blonde.webp')],
  [require('../../../assets/avatar/fronts/s4_brown.webp'), require('../../../assets/avatar/fronts/s4_black.webp'), require('../../../assets/avatar/fronts/s4_blonde.webp')],
];

/** Flat list for preloading every variant up front. */
export const ALL_FRONTS: ImageSourcePropType[] = VARIANTS.flat();

const clamp = (v: number | undefined, hi: number) => (v && v > 0 ? (v > hi ? hi : v | 0) : 0);

export function frontFor(avatar?: AvatarConfig | null): ImageSourcePropType {
  return VARIANTS[clamp(avatar?.skinTone, 4)][clamp(avatar?.hairColor, 2)];
}

export function frontAt(skinTone: number, hairColor: number): ImageSourcePropType {
  return VARIANTS[clamp(skinTone, 4)][clamp(hairColor, 2)];
}
