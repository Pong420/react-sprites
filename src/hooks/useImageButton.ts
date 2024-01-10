import { useState } from 'react';
import { SpriteModule } from '../types';

type Handlers = Pick<React.ComponentProps<'button'>, 'onMouseDown' | 'onMouseUp' | 'onMouseEnter' | 'onMouseLeave'>;

export interface UseImageButtonOptions extends Handlers {
  normal: SpriteModule;
  hover?: SpriteModule;
  down?: SpriteModule;
}

export function useImageButton({ normal, hover, down, ...props }: UseImageButtonOptions): {
  source: SpriteModule;
  handlers: Handlers;
} {
  const [source, setSource] = useState<SpriteModule | undefined>(normal);

  const handlers: Handlers = {
    onMouseDown:
      (down || props.onMouseDown) &&
      (event => {
        setSource(down);
        props.onMouseDown?.(event);
      }),
    onMouseUp:
      (down || props.onMouseUp) &&
      (event => {
        setSource(a => (a === down ? hover : normal));
        props.onMouseUp?.(event);
      }),
    onMouseEnter:
      (hover || props.onMouseEnter) &&
      (event => {
        setSource(a => (a === down ? a : hover));
        props.onMouseEnter?.(event);
      }),
    onMouseLeave:
      (hover || props.onMouseLeave) &&
      (event => {
        setSource(normal);
        props.onMouseLeave?.(event);
      })
  };

  return { source: source || normal, handlers };
}
