import { UseImageOptions, useImage } from './useImage';

export type { UseImageOptions };

export function useImageEl(options: UseImageOptions) {
  const image = useImage(options);
  const { source, width, height, sourceWidth, sourceHeight, x, y, scale } = image;

  const containerStyle: React.CSSProperties = {
    width,
    height,
    boxSizing: 'border-box'
  };

  const imageStyle: Partial<CSSStyleDeclaration> & React.CSSProperties = {
    width: `${sourceWidth}px`,
    height: `${sourceHeight}px`,
    display: 'block', // required, the default diplay (inline / inline-block) may cause the image's height to have an extra 4px
    objectFit: 'none',
    objectPosition: `${x}px ${y}px`,
    userSelect: 'none'
  };

  if (!source) {
    imageStyle.visibility = 'hidden';
  }

  if (scale !== 1) {
    imageStyle.transform = `scale(${scale})`;
    imageStyle.transformOrigin = `top left`;
  }

  return { ...image, containerStyle, style: imageStyle };
}
