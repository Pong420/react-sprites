import { useImage, UseImageOptions } from './useImage';

export type { UseImageOptions };

/**
 * separate into hook more flexible than putting in component
 */
export function useBackgroundImage(options: UseImageOptions) {
  const image = useImage(options);
  const { source, sourceWidth, sourceHeight, spriteWidth, spriteHeight, x, y, scale } = image;

  const style: React.CSSProperties = {
    width: sourceWidth * scale + 'px',
    height: sourceHeight * scale + 'px',
    backgroundImage: `url(${source})`,
    backgroundPosition: `${x * scale}px ${y * scale}px`,
    backgroundSize: `${spriteWidth * scale}px ${spriteHeight * scale}px`
  };

  return { ...image, style };
}
