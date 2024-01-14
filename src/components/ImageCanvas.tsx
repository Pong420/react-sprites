import { useEffect, useRef } from 'react';
import { useImageEl, UseImageOptions } from '../hooks/useImageEl';
import { getImageLoaded } from '../utils/image';

export interface ImageCanvasProps extends UseImageOptions, Omit<React.ComponentProps<'canvas'>, 'width' | 'height'> {
  /**
   * Allow you to access the canvas 2d context
   * So you may apply some filter / effect, like erasings, grayscale, brightness
   *
   * import { grayscale, brightness } from 'react-sprites'
   * <ImageCanvas context={grayscale} />
   */
  context?: (context: CanvasRenderingContext2D, image: ReturnType<typeof useImageEl>) => void;
}

/**
 * Initially designed for sequence animation, later realized that canvas can apply some effects that image elements can't.
 * Feels like it better then the `Image` component,
 * However, I'm unsure about the performance implications if a lot of canvas elements are used.
 *
 * For sequence animation,
 * With the `Image` component, if the animation contains many images (not frames) and the 'Disable Cache' option is enabled in the developer tools,
 * You may observe the animation blinking as the images are reloaded every time
 * With canvas we can reuse the image element from `AssetsLoader` without reloading the image url.
 */
export function ImageCanvas({ source, width, height, scale, context, ...props }: ImageCanvasProps) {
  const image = useImageEl({ source, width, height, scale });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancel = false;

    const ctx2d = canvasRef.current?.getContext('2d', {
      willReadFrequently: true
    });
    if (!ctx2d) return;

    getImageLoaded(image, i => {
      if (cancel) return;
      ctx2d.clearRect(0, 0, image.width, image.height);
      ctx2d.drawImage(
        i.element,
        -image.x,
        -image.y,
        image.actualWidth,
        image.actualHeight,
        0,
        0,
        image.width,
        image.height
      );

      context?.(ctx2d, image);
    });
    return () => {
      cancel = true;
    };
  }, [image, context]);

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
