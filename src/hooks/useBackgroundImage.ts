import { useImage, UseImageOptions } from './useImage';

export type { UseImageOptions };

export function useBackgroundImage(options: UseImageOptions) {
  const image = useImage(options);
  const { source, sourceWidth, sourceHeight, x, y, scale } = image;

  const style: React.CSSProperties = {
    width: sourceWidth * scale + 'px',
    height: sourceHeight * scale + 'px',
    backgroundImage: `url(${source})`,
    backgroundPosition: `${x * scale}px ${y * scale}px`,
    backgroundSize: `${(sourceWidth || 0) * scale}px ${(sourceHeight || 0) * scale}px`
  };

  return { ...image, style };
}
