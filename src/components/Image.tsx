import { useImageEl, UseImageOptions } from '../hooks/useImageEl';

type ContainerType = 'div' | 'button';

export type ImageProps<T extends ContainerType = 'div'> = UseImageOptions &
  Omit<React.ComponentProps<T>, 'children' | 'draggable'> & { container?: T; draggable?: boolean };

export function Image<T extends ContainerType = 'div'>({
  container,
  source,
  width,
  height,
  scale,
  style,
  draggable = false,
  ...props
}: ImageProps<T>) {
  const image = useImageEl({ source, width, height, scale });

  /**
   * A container is required to support "<img />" with object-fit and scale.
   * Because object-fit does not have similar property like `background-size`, the only way to scale the image is css `transform`
   * But css transoform won't change the actual size which not i expected.
   * For example an image wtih dimension 100px x 100px and scale is set to 0.5
   * The container dimension will become 50px x 50px, but the dimension of image element still 100px x 100px with css `transform: scale(0.5)`
   *
   * Also, container cannot be <picture /> because it cannot configure the width and height
   */
  const Container = (typeof container === 'undefined' ? 'div' : container) as unknown as React.FC<typeof props>;

  return (
    <Container {...props} data-image-container style={{ ...image.containerStyle, ...style }}>
      <img src={image.source} data-image={image.name} draggable={draggable} style={image.style} />
    </Container>
  );
}
