import type { ImageSourcePropType } from 'react-native';
import type { AvatarConfig } from '../../types';

/**
 * Avatar editions.
 *
 * Each edition is one real 3D character (Higgsfield image-to-3D GLB mesh),
 * rendered to a 36-frame 360° turntable. Because every frame comes from the
 * SAME mesh, the pose, hands and proportions are identical at every angle —
 * the turntable just scrubs frames as you drag, so it spins like true 3D and
 * works everywhere (no in-app GL). Frames rendered offline with three.js in
 * headless Chromium (see design tooling), 10° apart.
 */
export interface AvatarPack {
  /** 36 frames, clockwise, frame 0 = facing the camera. */
  frames: ImageSourcePropType[];
  /** Source aspect ratio, width / height. */
  aspect: number;
}

export interface AvatarEdition {
  key: string;
  label: string;
  /** Skin swatch shown on the edition picker. */
  swatch: string;
  pack: AvatarPack;
}

const LIGHT_FRAMES: ImageSourcePropType[] = [
  require('../../../assets/avatar/editions/light/f0.png'),
  require('../../../assets/avatar/editions/light/f1.png'),
  require('../../../assets/avatar/editions/light/f2.png'),
  require('../../../assets/avatar/editions/light/f3.png'),
  require('../../../assets/avatar/editions/light/f4.png'),
  require('../../../assets/avatar/editions/light/f5.png'),
  require('../../../assets/avatar/editions/light/f6.png'),
  require('../../../assets/avatar/editions/light/f7.png'),
  require('../../../assets/avatar/editions/light/f8.png'),
  require('../../../assets/avatar/editions/light/f9.png'),
  require('../../../assets/avatar/editions/light/f10.png'),
  require('../../../assets/avatar/editions/light/f11.png'),
  require('../../../assets/avatar/editions/light/f12.png'),
  require('../../../assets/avatar/editions/light/f13.png'),
  require('../../../assets/avatar/editions/light/f14.png'),
  require('../../../assets/avatar/editions/light/f15.png'),
  require('../../../assets/avatar/editions/light/f16.png'),
  require('../../../assets/avatar/editions/light/f17.png'),
  require('../../../assets/avatar/editions/light/f18.png'),
  require('../../../assets/avatar/editions/light/f19.png'),
  require('../../../assets/avatar/editions/light/f20.png'),
  require('../../../assets/avatar/editions/light/f21.png'),
  require('../../../assets/avatar/editions/light/f22.png'),
  require('../../../assets/avatar/editions/light/f23.png'),
  require('../../../assets/avatar/editions/light/f24.png'),
  require('../../../assets/avatar/editions/light/f25.png'),
  require('../../../assets/avatar/editions/light/f26.png'),
  require('../../../assets/avatar/editions/light/f27.png'),
  require('../../../assets/avatar/editions/light/f28.png'),
  require('../../../assets/avatar/editions/light/f29.png'),
  require('../../../assets/avatar/editions/light/f30.png'),
  require('../../../assets/avatar/editions/light/f31.png'),
  require('../../../assets/avatar/editions/light/f32.png'),
  require('../../../assets/avatar/editions/light/f33.png'),
  require('../../../assets/avatar/editions/light/f34.png'),
  require('../../../assets/avatar/editions/light/f35.png'),
];

const DEEP_FRAMES: ImageSourcePropType[] = [
  require('../../../assets/avatar/editions/deep/f0.png'),
  require('../../../assets/avatar/editions/deep/f1.png'),
  require('../../../assets/avatar/editions/deep/f2.png'),
  require('../../../assets/avatar/editions/deep/f3.png'),
  require('../../../assets/avatar/editions/deep/f4.png'),
  require('../../../assets/avatar/editions/deep/f5.png'),
  require('../../../assets/avatar/editions/deep/f6.png'),
  require('../../../assets/avatar/editions/deep/f7.png'),
  require('../../../assets/avatar/editions/deep/f8.png'),
  require('../../../assets/avatar/editions/deep/f9.png'),
  require('../../../assets/avatar/editions/deep/f10.png'),
  require('../../../assets/avatar/editions/deep/f11.png'),
  require('../../../assets/avatar/editions/deep/f12.png'),
  require('../../../assets/avatar/editions/deep/f13.png'),
  require('../../../assets/avatar/editions/deep/f14.png'),
  require('../../../assets/avatar/editions/deep/f15.png'),
  require('../../../assets/avatar/editions/deep/f16.png'),
  require('../../../assets/avatar/editions/deep/f17.png'),
  require('../../../assets/avatar/editions/deep/f18.png'),
  require('../../../assets/avatar/editions/deep/f19.png'),
  require('../../../assets/avatar/editions/deep/f20.png'),
  require('../../../assets/avatar/editions/deep/f21.png'),
  require('../../../assets/avatar/editions/deep/f22.png'),
  require('../../../assets/avatar/editions/deep/f23.png'),
  require('../../../assets/avatar/editions/deep/f24.png'),
  require('../../../assets/avatar/editions/deep/f25.png'),
  require('../../../assets/avatar/editions/deep/f26.png'),
  require('../../../assets/avatar/editions/deep/f27.png'),
  require('../../../assets/avatar/editions/deep/f28.png'),
  require('../../../assets/avatar/editions/deep/f29.png'),
  require('../../../assets/avatar/editions/deep/f30.png'),
  require('../../../assets/avatar/editions/deep/f31.png'),
  require('../../../assets/avatar/editions/deep/f32.png'),
  require('../../../assets/avatar/editions/deep/f33.png'),
  require('../../../assets/avatar/editions/deep/f34.png'),
  require('../../../assets/avatar/editions/deep/f35.png'),
];

export const EDITIONS: AvatarEdition[] = [
  { key: 'light', label: 'Light', swatch: '#E7C6A8', pack: { frames: LIGHT_FRAMES, aspect: 0.4574 } },
  { key: 'deep', label: 'Deep', swatch: '#5C3A26', pack: { frames: DEEP_FRAMES, aspect: 0.4392 } },
];

const clampEdition = (v?: number) => (v && v >= 0 && v < EDITIONS.length ? v | 0 : 0);

export function editionFor(avatar?: AvatarConfig | null): AvatarEdition {
  return EDITIONS[clampEdition(avatar?.edition)];
}

export function packFor(avatar?: AvatarConfig | null): AvatarPack {
  return editionFor(avatar).pack;
}

export const DEFAULT_PACK: AvatarPack = EDITIONS[0].pack;
