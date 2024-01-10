import { useBackgroundImage, UseImageOptions } from '../hooks/useBackgroundImage';

export interface BackgroundImageProps extends Omit<UseImageOptions, 'backgroundImage'>, React.ComponentProps<'div'> {}

export function BackgroundImage({ source, width, height, scale, style, ...props }: BackgroundImageProps) {
  const image = useBackgroundImage({ source, width, height, scale });
  return <div data-background-image data-image={image.name} {...props} style={{ ...image.style, ...style }} />;
}
