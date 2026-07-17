import type { ImageSourcePropType } from 'react-native';
import type { AvatarConfig } from '../../types';

/**
 * Avatar render packs.
 *
 * Each pack is an 8-view turnaround (one frame every 45°, frame 0 facing the
 * camera) generated with Higgsfield from the base figure and sliced into
 * transparent frames. Every pack declares which studio choices it actually
 * represents; `matchPack` scores the declared coverage against the user's
 * choices (skin tone outweighs hair length, then hair color, then body
 * shape) and reports whether the match is exact — the studio uses that to
 * say honestly when a combination is still approximate. A true GLB mesh
 * viewer can replace this behind the same props (priced, not yet generated).
 */
export interface AvatarPack {
  /** Ordered clockwise, frame 0 = facing the camera. */
  frames: ImageSourcePropType[];
  /** Source aspect ratio, width / height. */
  aspect: number;
}

interface PackDef {
  key: string;
  pack: AvatarPack;
  /** Indices into the studio's swatch arrays that this pack represents. */
  skinTones: number[];
  hairColors: number[];
  hairLengths: number[];
  bodyShapes: number[];
}

export const BASE_PACK: AvatarPack = {
  frames: [
    require('../../../assets/avatar/base/b0.png'),
    require('../../../assets/avatar/base/b1.png'),
    require('../../../assets/avatar/base/b2.png'),
    require('../../../assets/avatar/base/b3.png'),
    require('../../../assets/avatar/base/b4.png'),
    require('../../../assets/avatar/base/b5.png'),
    require('../../../assets/avatar/base/b6.png'),
    require('../../../assets/avatar/base/b7.png'),
  ],
  aspect: 0.4304,
};

export const TAN_PACK: AvatarPack = {
  frames: [
    require('../../../assets/avatar/tan/t0.png'),
    require('../../../assets/avatar/tan/t1.png'),
    require('../../../assets/avatar/tan/t2.png'),
    require('../../../assets/avatar/tan/t3.png'),
    require('../../../assets/avatar/tan/t4.png'),
    require('../../../assets/avatar/tan/t5.png'),
    require('../../../assets/avatar/tan/t6.png'),
    require('../../../assets/avatar/tan/t7.png'),
  ],
  aspect: 0.4296,
};

export const DEEP_PACK: AvatarPack = {
  frames: [
    require('../../../assets/avatar/deep/d0.png'),
    require('../../../assets/avatar/deep/d1.png'),
    require('../../../assets/avatar/deep/d2.png'),
    require('../../../assets/avatar/deep/d3.png'),
    require('../../../assets/avatar/deep/d4.png'),
    require('../../../assets/avatar/deep/d5.png'),
    require('../../../assets/avatar/deep/d6.png'),
    require('../../../assets/avatar/deep/d7.png'),
  ],
  aspect: 0.4279,
};

export const BLONDE_PACK: AvatarPack = {
  frames: [
    require('../../../assets/avatar/blonde/g0.png'),
    require('../../../assets/avatar/blonde/g1.png'),
    require('../../../assets/avatar/blonde/g2.png'),
    require('../../../assets/avatar/blonde/g3.png'),
    require('../../../assets/avatar/blonde/g4.png'),
    require('../../../assets/avatar/blonde/g5.png'),
    require('../../../assets/avatar/blonde/g6.png'),
    require('../../../assets/avatar/blonde/g7.png'),
  ],
  aspect: 0.3942,
};

export const SHORT_PACK: AvatarPack = {
  frames: [
    require('../../../assets/avatar/short/s0.png'),
    require('../../../assets/avatar/short/s1.png'),
    require('../../../assets/avatar/short/s2.png'),
    require('../../../assets/avatar/short/s3.png'),
    require('../../../assets/avatar/short/s4.png'),
    require('../../../assets/avatar/short/s5.png'),
    require('../../../assets/avatar/short/s6.png'),
    require('../../../assets/avatar/short/s7.png'),
  ],
  aspect: 0.4364,
};

export const CURVY_PACK: AvatarPack = {
  frames: [
    require('../../../assets/avatar/curvy/c0.png'),
    require('../../../assets/avatar/curvy/c1.png'),
    require('../../../assets/avatar/curvy/c2.png'),
    require('../../../assets/avatar/curvy/c3.png'),
    require('../../../assets/avatar/curvy/c4.png'),
    require('../../../assets/avatar/curvy/c5.png'),
    require('../../../assets/avatar/curvy/c6.png'),
    require('../../../assets/avatar/curvy/c7.png'),
  ],
  aspect: 0.4182,
};

export const DEFAULT_PACK: AvatarPack = BASE_PACK;

/** Swatch coverage per pack. Indices refer to seed.ts swatch arrays:
 *  SKIN_TONES 0..5 light→deep · HAIR_COLORS [dark brown, brown, caramel,
 *  blonde, black, gray] · HAIR_LENGTHS [short, medium, long] ·
 *  BODY_SHAPES [slim, balanced, curvy]. */
export const PACKS: PackDef[] = [
  { key: 'base', pack: BASE_PACK, skinTones: [0, 1, 2], hairColors: [0, 1], hairLengths: [1, 2], bodyShapes: [0, 1] },
  { key: 'tan', pack: TAN_PACK, skinTones: [3], hairColors: [0, 1], hairLengths: [1, 2], bodyShapes: [0, 1] },
  { key: 'deep', pack: DEEP_PACK, skinTones: [4, 5], hairColors: [0, 4], hairLengths: [1, 2], bodyShapes: [0, 1] },
  { key: 'blonde', pack: BLONDE_PACK, skinTones: [0, 1, 2], hairColors: [2, 3], hairLengths: [1, 2], bodyShapes: [0, 1] },
  { key: 'short', pack: SHORT_PACK, skinTones: [0, 1, 2], hairColors: [0, 1], hairLengths: [0], bodyShapes: [0, 1] },
  { key: 'curvy', pack: CURVY_PACK, skinTones: [0, 1, 2], hairColors: [0, 1], hairLengths: [1, 2], bodyShapes: [2] },
];

export interface PackMatch {
  key: string;
  pack: AvatarPack;
  /** True when every chosen dimension is represented by this pack. */
  exact: boolean;
}

/** Weighted closest-pack match: skin tone > hair length > hair color > shape. */
export function matchPack(avatar?: AvatarConfig | null): PackMatch {
  if (!avatar) return { key: 'base', pack: BASE_PACK, exact: true };
  let best = PACKS[0];
  let bestScore = -1;
  for (const d of PACKS) {
    const score =
      (d.skinTones.includes(avatar.skinTone) ? 8 : 0) +
      (d.hairLengths.includes(avatar.hairLength) ? 4 : 0) +
      (d.hairColors.includes(avatar.hairColor) ? 2 : 0) +
      (d.bodyShapes.includes(avatar.bodyShape) ? 1 : 0);
    if (score > bestScore) {
      bestScore = score;
      best = d;
    }
  }
  const exact =
    best.skinTones.includes(avatar.skinTone) &&
    best.hairLengths.includes(avatar.hairLength) &&
    best.hairColors.includes(avatar.hairColor) &&
    best.bodyShapes.includes(avatar.bodyShape);
  return { key: best.key, pack: best.pack, exact };
}

export function packForAvatar(avatar?: AvatarConfig | null): AvatarPack {
  return matchPack(avatar).pack;
}
