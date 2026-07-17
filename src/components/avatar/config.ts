import type { ImageSourcePropType } from 'react-native';

/**
 * Avatar render pack.
 *
 * The viewer is turntable-ready: give it N frames (views of the same figure
 * every 360/N degrees, starting front) and dragging rotates the figure.
 * Today the pack contains the single front render; the pipeline for the
 * 8-view pack and per-variant packs (skin tone / body shape / hair / outfit,
 * generated with Higgsfield) drops new frames in here without touching the
 * viewer. A true GLB mesh viewer can replace this component behind the same
 * props once texturing credits are available.
 */
export interface AvatarPack {
  /** Ordered clockwise, frame 0 = facing the camera. */
  frames: ImageSourcePropType[];
  /** Source aspect ratio, width / height. */
  aspect: number;
}

export const DEFAULT_PACK: AvatarPack = {
  frames: [require('../../../assets/avatar/front.png')],
  aspect: 442 / 1000,
};
