import path from 'path';
import Vinyl from 'vinyl';
import Spritesmith from 'spritesmith';
import { PackOptions, PackResult, SpriteData, SpriteImage } from '../../types';

export function packTextures({ textureName, textures }: PackOptions) {
  return new Promise<PackResult>((resolve, reject) => {
    Spritesmith.run({ src: textures.map(t => new Vinyl({ ...t })) }, function handleImages(err, result) {
      if (err) return reject(err);

      const frames = Object.entries(result.coordinates).reduce(
        (frames, [filepath, coordinates]) => {
          const [group, filename] = [
            path.basename(path.dirname(filepath)),
            path.basename(filepath, path.extname(filepath))
          ];
          return {
            ...frames,
            [`${group}/${filename}`]: { name: filename, ...coordinates, x: -coordinates.x, y: -coordinates.y, index: 0 }
          };
        },
        {} as Record<string, SpriteData>
      );

      const image: SpriteImage = {
        name: textureName,
        ext: '.png',
        ...result.properties,
        content: result.image,
        sourceSet: {}
      };

      resolve({ frames, images: [image] });
    });
  });
}
