import { useRef, useEffect } from 'react';
import { useImageEl, UseImageOptions } from '../hooks/useImageEl';
import { getImage, spriteImageKey } from '../utils/image';

/**
 * @deprecated
 * Designed for sequence animation, but seems canvas is better.
 *
 * Similar to `Image` component but the image element will be reused and won't be reloaded (Even when the "Disable cache" option is enabled in the developer tools)
 *
 * However, `onClick` event will not work, related to `trapClickOnNonInteractiveElement`
 * https://github.com/facebook/react/blob/main/packages/react-dom-bindings/src/client/ReactDOMComponent.js
 */

export interface ImageNodeProps
  extends Omit<UseImageOptions, 'backgroundImage'>,
    Omit<React.ComponentProps<'div'>, 'children'> {
  draggable?: boolean;
}

export function ImageNode({ source, width, height, scale, draggable = false, ...divProps }: ImageNodeProps) {
  const image = useImageEl({ source, width, height, scale });

  const containerRef = useRef<HTMLDivElement>(null);

  // Cache image elements, mainly for SequenceAnim component
  // Do not place it outside of component to ensure that memory is released after the component is removed.
  const cacheRef = useRef<Record<string, HTMLImageElement>>({});

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const key = spriteImageKey(image);

    let el = cacheRef.current[key];

    if (!el) {
      const node = getImage(image)?.element;
      if (node) {
        el = node.cloneNode(true) as HTMLImageElement;
      } else {
        el = new Image();
        el.src = image.source;
      }

      cacheRef.current[key] = el;
    }

    for (const s in image.style) {
      const value = image.style[s];
      if (typeof value === 'undefined') {
        delete el.style[s];
      } else {
        el.style[s] = value;
      }
    }

    el.setAttribute('data-image', image.name);
    el.setAttribute('draggable', String(draggable));

    container.appendChild(el);

    return () => {
      el?.parentElement?.removeChild(el);
    };
  }, [image, draggable]);

  return (
    <div {...divProps} data-image-container ref={containerRef} style={{ ...image.containerStyle, ...divProps.style }} />
  );
}
