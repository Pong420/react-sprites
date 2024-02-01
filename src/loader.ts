import webpack from 'webpack';
import { once, EventEmitter } from 'events';
import { interpolateName } from 'loader-utils';
import { TextureCache } from './loader/cache';
import { compareFileNames } from './loader/sort';
import { TextureStore, parseResourcePath } from './loader/store';
import { SpriteImage, SpriteModule } from './types';

/**
 * Usage:
 * Add to webpack rules configuration
 * {
 *   test: [/\.png$/, /\.jpe?g$/],
 *   resourceQuery: /sprites/,
 *   use: [
 *     {
 *       loader: require.resolve('react-sprites/loader.js')
 *     }
 *   ]
 * }
 *
 * In source code,`import` and `require` the textures with `?sprites`
 *
 * ```
 * import source from '@/assets/pc/<directory>/<filename>.png?sprites';
 * <Image source={require('@/assets/pc/<directory>/<filename>.png?sprites')} />;
 * <SequenceAnim frames={require.context('@/assets/pc/<directory>/?sprites') />;
 * ```
 *
 * Note:
 * 1. If "image2" is added after Webpack has started, a new sprite will generated and including both "image1" and "image2."
 *    I think this could be fixed with HMR handling, maybe refers to
 *    https://github.com/webpack-contrib/mini-css-extract-plugin
 *
 * 2. Webpack limited the number of parallel processed modules. The default value is 100.
 *    See https://webpack.js.org/configuration/other-options/#parallelism
 *
 *    For example, if you have 120 textures that you want to pack into sprite sheets.
 *    The picth loader can only record the first 100 images, leading to incorrect sprite generation.
 *    To solve this, `parallelism` in webpack configuration is set to Infinity.
 */

export interface SpriteLoaderOptions {
  /**
   * free-tex-packer: https://github.com/odrick/free-tex-packer
   * spritesmith: https://github.com/twolfson/spritesmith
   *
   * The compile time of two packer are similar. `spritesmith` a bit faster
   * `free-tex-packer` has not been updated for a long time, and the author is no longer active.
   * `spritesmith` is more active
   *
   * However, `free-tex-packer` will generate multiple sprite sheets if the total source images too large.
   * `spritesmith` bundle all images into single sprite sheet.
   *
   * Information from another texture packer software,
   * Bigger textures might not be displayed on some devices or might cause jittering sprites.
   * So @default "free-tex-packer" is used
   */
  packer?: 'free-tex-packer' | 'spritesmith';

  /**
   * If the texture sizes are double the original size, set the scaleFactor to 0.5.
   * Then Image component will automaticall scale down to expeceted dimension.
   * Not sure this help for image resolution.
   *
   * Maybe it's related
   * https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio
   */
  scaleFactor?: number;

  /**
   * Optimizing image size by reducing quality can result in a significant reduction in file size.
   */
  optimization?: (options: SpriteImage[]) => Promise<SpriteImage[]>;

  /**
   * Times for waiting all textures resolved, higher value is required for lesser cpu
   */
  waitFor?: number;

  /**
   * Directory for saving sprite image outputs
   * Cache will not be used if the value not defined
   */
  cacheDir?: string;
}

const emitter = new EventEmitter();
emitter.setMaxListeners(Infinity);

const tasks = new Map<string, Promise<unknown>>();
const textureStore = new TextureStore();

export const raw = true;

// ptiching loader
// https://webpack.js.org/api/loaders/#pitching-loader
// It will be processed before the normal loader.
export const pitch: webpack.PitchLoaderDefinitionFunction = function () {
  textureStore.addTexture(this.resourcePath, this.rootContext);
};

// normal loader
export default async function loader(this: webpack.LoaderContext<SpriteLoaderOptions>, source: Buffer) {
  const logger = this.getLogger('react-sprites');

  const data = parseResourcePath(this.resourcePath, this.rootContext);

  if (!data) return logger.warn(`Cannot get data from ${this.resourcePath}`);
  if (!this._compiler || !this._compilation)
    return logger.warn(`Internal Error, _compiler or _compilation is not defined`);

  const { packer = 'free-tex-packer', ...options } = this.getOptions();

  const { key } = data;
  const { packTextures } = await (packer === 'free-tex-packer'
    ? import('./loader/packer/free-tex-packer')
    : import('./loader/packer/spritesmith'));

  const webpackCache = this._compilation.getCache(`sprits-loader/${packer}`);
  const textureCache = new TextureCache(options.cacheDir ? `${options.cacheDir}/${packer}` : '');

  const assetModuleFilename = this._compiler.options.output.assetModuleFilename || '';
  const emitImage = (image: SpriteImage) => {
    const _assetModuleFilename =
      typeof assetModuleFilename === 'string'
        ? assetModuleFilename.replace('[name]', image.name).replace('[ext]', image.ext)
        : image.name;

    const pathname = interpolateName(this, _assetModuleFilename, {
      content: image.content
    });

    this.emitFile(pathname, image.content, undefined, { immutable: true });

    return pathname;
  };

  const pathKey = (image: SpriteImage) => `${image.name}${image.ext}`;

  const run = async () => {
    await once(emitter, key);

    const startTime = Date.now();

    const textureMap = textureStore.getTextures(key);
    if (!textureMap) throw new Error(`Internal error, textures ${key} not found`);

    const textures = Array.from(textureMap, ([, texture]) => texture).sort((a, b) =>
      compareFileNames(a.filename, b.filename)
    );

    const createETag = (content: string | Buffer) =>
      webpackCache.getLazyHashedEtag(new webpack.sources.RawSource(content));

    const eTag = [
      createETag(JSON.stringify(options.optimization || {})),
      ...textures.map(texture => createETag(texture.contents))
    ].reduce((result, item) => webpackCache.mergeEtags(result, item));

    const hash = eTag.toString();

    let packed = await textureCache.getCache(key, hash);
    if (!packed) {
      packed = await packTextures({ textureName: data.group, textures });

      const optimizeFn = options.optimization;
      if (optimizeFn) {
        packed.images = await optimizeFn([...packed.images]);
      }

      await textureCache.setCache(key, hash, packed);
    }

    const paths = packed.images.reduce(function reducer(paths, image): Record<string, string> {
      const pathname = emitImage(image);

      for (const k in image.sourceSet) {
        paths = reducer(paths, image.sourceSet[k]);
      }

      return { ...paths, [pathKey(image)]: pathname };
    }, {} as Record<string, string>);

    const totalTime = Date.now() - startTime;

    logger.info(
      `${key} generate ${packed.images.length} sprite sheets with ${textures.length} textures in ${totalTime}ms`
    );

    return { ...packed, paths };
  };

  // TODO:
  // Loader Dependencies
  // https://webpack.js.org/contribute/writing-a-loader/#loader-dependencies
  // this.addContextDependency(path.dirname(this.resourcePath));

  let task = tasks.get(key) as ReturnType<typeof run> | undefined;
  if (!task) {
    task = run();
    tasks.set(key, task);
  }

  await new Promise<void>(resolve => setTimeout(resolve, typeof options.waitFor === 'number' ? options.waitFor : 1000));

  if (textureStore.resolve(this.resourcePath, this.rootContext, source)) {
    emitter.emit(key);
  }

  const { frames, images, paths } = await task;

  // Delete the task to generate a new sprite when a new image is added.
  tasks.delete(key);

  // Value of frameKey depends on `packTextures` function
  const frameName = `${data.group}/${data.filename}`;
  const frame = frames[frameName];
  const index = frame?.index ?? 0;
  const image = images[index];

  const replacement = `__REPLACE_WEBPACK_PUBLIC_PATH__`;
  const imageToModule = (image: SpriteImage): SpriteModule => {
    return {
      ...frame,
      key,
      name: data.filename,
      source: replacement + paths[pathKey(image)],
      group: data.group,
      frameName,
      spriteName: image.name,
      spriteWidth: image.width,
      spriteHeight: image.height,
      scaleFactor: options?.scaleFactor || 1,
      sourceSet: Object.entries(image.sourceSet).reduce(
        (r, [k, v]) => ({ ...r, [k]: imageToModule(v) }),
        {} as SpriteModule['sourceSet']
      )
    };
  };

  const spritesModule = JSON.stringify(imageToModule(image)).replace(
    new RegExp(`('|")${replacement}`, 'g'),
    // __webpack_public_path__ is a closure variable defined by webpack
    (_, quotation) => `__webpack_public_path__ + ${quotation}`
  );

  return `
    module.exports = ${spritesModule};
  `;
}
