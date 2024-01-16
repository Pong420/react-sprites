import { Image, ImageProps } from './Image';
import { UseImageOptions } from '../hooks/useImage';
import { buttonStyle, useImageButton, UseImageButtonOptions } from '../hooks/useImageButton';

export interface ImageButtonProps
  extends UseImageButtonOptions,
    Omit<ImageProps<'button'>, 'source'>,
    Omit<UseImageOptions, 'source'> {}

export function ImageButton({ normal, hover, down, width, height, scale, style, ...props }: ImageButtonProps) {
  const { source, handlers } = useImageButton({ normal, hover, down, ...props });
  return (
    <Image
      container="button"
      {...props}
      {...handlers}
      style={{ ...buttonStyle, ...style }}
      source={source}
      width={width}
      height={height}
      scale={scale}
    />
  );
}
