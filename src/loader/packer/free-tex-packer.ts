import path from 'path';
import { fileURLToPath } from 'url';
import { packAsync, PackerType, TexturePackerOptions } from 'free-tex-packer-core';
import { PackOptions, PackResult, SpriteImage, SpriteData } from '../../types';
import { compareFileNames } from '../sort';

export interface File {
  name: string;
  ext: string;
  content: string | Buffer;
}

export interface PackerJSON {
  frames: Record<string, SpriteData>;
  size: { width: number; height: number };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function packTextures({ textureName, textures }: PackOptions): Promise<PackResult> {
  const packerOptions: TexturePackerOptions = {
    textureName,
    allowRotation: false,
    packer: 'OptimalPacker' as PackerType,

    // below options that should not be overriden
    tinify: false,
    removeFileExtension: true,
    exporter: {
      fileExt: 'json',
      template: path.join(__dirname, '..', 'json.mst')
    }
  };

  const outputs = await packAsync(textures, packerOptions);
  const files = outputs.map((o): File => {
    const ext = path.extname(o.name);
    const name = o.name.slice(0, -ext.length);
    return { name, ext, content: o.buffer };
  });

  const metadata = files.reduce(
    (map, file) => {
      if (file.ext === '.json') {
        const packed = JSON.parse(file.content.toString('utf-8')) as PackerJSON;
        return { ...map, [file.name]: packed };
      }
      return map;
    },
    {} as Record<string, PackerJSON>
  );

  let frames: PackerJSON['frames'] = {};
  const images: SpriteImage[] = [];

  for (const file of files) {
    if (file.ext === '.json') {
      // index will be deifned if multiple sprite sheets generated
      // eslint-disable-next-line no-sparse-arrays
      const [, , index] = file.name.match(/(.*)-(\d+)$/) || [, file.name, 0];

      /**
       * {
       *  '<group>/<filename>': { name: string, width: number, height: number, x: number, y: number },
       *  '<group>/<filename>': { name: string, width: number, height: number, x: number, y: number },
       *  ...
       * },
       */
      const newFrames = metadata[file.name].frames;

      for (const k in newFrames) {
        const frameName = k.replaceAll('&#x2f;', '/');
        frames = { ...frames, [frameName]: { ...newFrames[k], name: file.name, index: Number(index) } };
      }
    } else {
      const image: SpriteImage = {
        name: file.name,
        ext: file.ext,
        content: file.content as Buffer,
        ...metadata[file.name].size,
        sourceSet: {}
      };

      images.push(image);
    }
  }

  return { frames, images: images.sort((a, b) => compareFileNames(a.name, b.name)) };
}
