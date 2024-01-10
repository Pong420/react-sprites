import { getPreferredSource } from '../utils/AssetsLoader';
import { SpriteModule } from '../types';

export interface UseImageOptions {
  source: SpriteModule;

  /**
   * Scale the image up or down using one of the available properties.
   * Only one property will be used, and their priority follows the sequence below.
   */
  scale?: number;
  width?: number;
  height?: number;
}

const scaleFactor = 1;

export function useImage({
  source: rawSource,
  width: expectedWidth,
  height: expectedHeight,
  scale: expectedScale
}: UseImageOptions) {
  const source = getPreferredSource(rawSource);

  if (!source.width) {
    console.warn(`some thing wrong with the source`, source);
  }

  // This is the natural size of the texture, and it could be scaled during the packing process if the scaleFactor feature is implemented.
  // So, these two values could differ from those in the source files provided by the designer.
  const sourceWidth = source.width;
  const sourceHeight = source.height;

  // Actual size of the texture, the value is the same as source files provided by the designer.
  const actualWidth = sourceWidth / source.scaleFactor;
  const actualHeight = sourceHeight / source.scaleFactor;

  // A factor used to scale the image to the desired dimensions for displaying it on the UI.
  const actualScale =
    typeof expectedScale === 'number'
      ? expectedScale
      : typeof expectedWidth === 'number'
        ? expectedWidth / actualWidth
        : typeof expectedHeight === 'number'
          ? expectedHeight / actualHeight
          : 1;

  // final dimension
  const width = actualWidth * actualScale;
  const height = actualHeight * actualScale;
  const scale = actualScale / scaleFactor;

  return {
    ...source,
    rawSource,
    scale,
    width,
    height,
    sourceWidth,
    sourceHeight,
    actualWidth,
    actualHeight
  };
}
