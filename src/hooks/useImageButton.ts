import { useEffect, useState } from 'react';
import { SpriteModule } from '../types';

type Handlers = Pick<React.ComponentProps<'button'>, 'onMouseDown' | 'onMouseUp' | 'onMouseEnter' | 'onMouseLeave'>;

export interface UseImageButtonOptions extends Handlers {
  normal: SpriteModule;
  hover?: SpriteModule;
  down?: SpriteModule;
}

export const buttonStyle = {
  padding: 0,
  background: 'none',
  border: 'none'
};

export function useImageButton({ normal, hover, down, ...props }: UseImageButtonOptions): {
  source: SpriteModule;
  handlers: Handlers;
} {
  const [source, setSource] = useState<SpriteModule | undefined>(normal);

  const handlers: Handlers = {
    onMouseDown: down
      ? event => {
          props.onMouseDown?.(event);
          setSource(down);
        }
      : props.onMouseDown,
    onMouseEnter: hover
      ? event => {
          props.onMouseEnter?.(event);
          setSource(a => (a === down ? a : hover));
        }
      : props.onMouseEnter,
    onMouseLeave: hover
      ? event => {
          props.onMouseLeave?.(event);
          setSource(normal);
        }
      : props.onMouseLeave
  };

  // for mouse down then leave the button area
  useEffect(() => {
    if (!down || source !== down) return;
    const handler = () => setSource(normal);
    window.addEventListener('mouseup', handler);
    return () => window.removeEventListener('mouseup', handler);
  }, [normal, down, source]);

  return { source: source || normal, handlers };
}
