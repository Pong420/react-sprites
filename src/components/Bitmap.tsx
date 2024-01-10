import { useMemo } from 'react';
import { SpriteModule } from '../types';
import { Image } from './Image';

export interface BitmapProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  /**
   * The display value
   */
  text?: string;

  /**
   * The characters assets
   */
  fonts: SpriteModule[] | __WebpackModuleApi.RequireContext;

  /**
   * Spacing between each character, the value could be negative
   */
  spacing?: number;

  /**
   * Scale up/down the image by either one properties
   */
  scale?: number;
  height?: number;

  /**
   * @deprecated
   * Bitmap font should be same height, the scale cannot controlled by width
   */
  width?: undefined;
}

export function Bitmap({ fonts, text = '', spacing, scale, height, ...props }: BitmapProps) {
  const characters = text.split('');

  // fonts will not be changed in most of the times, but do not using `useState` instead of `useMemo`.
  // `useState` not work with some extreme case
  const map = useMemo(() => {
    const frames = Array.isArray(fonts) ? fonts : fonts.keys().map(request => fonts<SpriteModule>(request));
    return frames.reduce(
      (map, frame) => ({
        ...map,
        // Assumed file.name is suffix with last character, e.g. _1, _2, _3, _x
        [frame.name.slice(-1)]: frame
      }),
      {} as Record<string, SpriteModule>
    );
  }, [fonts]);

  return (
    <div {...props} style={{ display: 'flex', height, ...props.style }}>
      {characters.map((c, i) => {
        const source = map[c];
        if (!source) {
          console.error(
            `character "${c}" not find in ${JSON.stringify(map)}.`,
            `Please check the naming of the bitmap assets`
          );
          return null;
        }
        return (
          <Image
            key={i}
            scale={scale}
            height={height}
            source={source}
            style={spacing ? { marginLeft: i > 0 ? spacing : 0 } : {}}
          />
        );
      })}
    </div>
  );
}
