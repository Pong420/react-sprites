import { Image } from './Image';
import { useImageButton, UseImageButtonOptions } from '../hooks/useImageButton';

export interface ImageButtonProps extends UseImageButtonOptions, React.ComponentProps<'button'> {}

export function ImageButton({ normal, hover, down, style, ...props }: ImageButtonProps) {
  const { source, handlers } = useImageButton({ normal, hover, down, ...props });
  return (
    <button
      {...props}
      {...handlers}
      style={{
        padding: 0,
        background: 'none',
        border: 'none',
        ...style
      }}
    >
      <Image source={source} />
    </button>
  );
}
