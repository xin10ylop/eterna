import type { ImageSourcePropType } from 'react-native';
import type { AvatarConfig } from '../../types';

/**
 * Avatar render packs.
 *
 * Each pack is an 8-view turnaround (one frame every 45°, frame 0 facing the
 * camera) generated with Higgsfield from the base figure and sliced into
 * transparent frames. `packForAvatar` maps the studio's skin-tone choice to
 * the closest generated pack; unmatched combinations fall back to the nearest
 * tone so a selection never breaks the viewer. A true GLB mesh viewer can
 * replace this component behind the same props (priced, not yet generated).
 */
export interface AvatarPack {
  /** Ordered clockwise, frame 0 = facing the camera. */
  frames: ImageSourcePropType[];
  /** Source aspect ratio, width / height. */
  aspect: number;
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

export const DEFAULT_PACK: AvatarPack = BASE_PACK;

/** Closest generated pack for the studio's skin-tone pick (0 = lightest). */
export function packForAvatar(avatar?: AvatarConfig | null): AvatarPack {
  if (!avatar) return BASE_PACK;
  if (avatar.skinTone >= 4) return DEEP_PACK;
  if (avatar.skinTone === 3) return TAN_PACK;
  return BASE_PACK;
}
