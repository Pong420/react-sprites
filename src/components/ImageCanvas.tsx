import { useEffect, useRef } from 'react';
import { useImageEl, UseImageOptions } from '../hooks/useImageEl';
import { getImageElement } from '../utils/AssetsLoader';

export interface ImageCanvasProps extends UseImageOptions, Omit<React.ComponentProps<'canvas'>, 'width' | 'height'> {}

/**
 * Designed for sequence animation
 * With the `Image` Component. If the aniamtion contains a many images ( not frames ) and "Disable Cache" option is enabled in develop tool. You may see the animation blinking due the image are reloaded every time
 *
 * With the `Image` component, if the animation contains many images (not frames) and the 'Disable Cache' option is enabled in the developer tools,
 * You may observe the animation blinking as the images are reloaded every time
 *
 * With canvas we can reuse the image element from AssetsLoader with out reloading.
 */
export function ImageCanvas({ source, width, height, scale, ...props }: ImageCanvasProps) {
  const image = useImageEl({ source, width, height, scale });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // simple cache as fallback
  const cacheRef = useRef<Record<string, HTMLImageElement>>({});

  useEffect(() => {
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;

    let el = getImageElement(image) || cacheRef.current[image.source];
    if (!el) {
      el = new Image();
      el.src = image.source;
      cacheRef.current[image.source] = el;
    }

    context.clearRect(0, 0, image.width, image.height);
    context.drawImage(el, -image.x, -image.y, image.actualWidth, image.actualHeight, 0, 0, image.width, image.height);
  }, [image]);

  return (
    <canvas
      ref={canvasRef}
      {...props}
      style={{ display: 'block', userSelect: 'none', ...props.style }}
      width={image.width}
      height={image.height}
    />
  );
}
