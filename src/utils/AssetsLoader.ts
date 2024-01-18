import { SpriteModule } from '../types';
import { isWebpSupported } from './isWebpSupported';
import { clearImageElements, spriteImageKey, createIfNotExists } from './image';

export type AssetLoaderPayload =
  | __WebpackModuleApi.RequireContext
  | Pick<RawAsset, 'key' | 'url'> // this allow to customise the key
  | SpriteModule
  | LoaderAsset
  | string;

interface RawAsset {
  key: string;
  url: string;
  ext: string;
  payload?: SpriteModule;
}

interface LoaderAsset {
  key: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  load: () => Promise<any>;
}

interface LoadCallbackArg {
  asset: RawAsset | LoaderAsset;
  loaded: number;
  total: number;
  percentage: number;
}

const parseURL = (url: string): RawAsset => {
  const matches = url.match(/[^/]+(?=\.(\w+)$)/);
  const [basename = '', ext = ''] = matches || [];
  return { key: basename.replace(/\..*$/, ''), ext, url };
};

const supportWebp = isWebpSupported();

export function getPreferredSource(module: SpriteModule) {
  if (supportWebp) {
    const webpModule = module.sourceSet['webp'];
    if (webpModule && webpModule.width) {
      return webpModule;
    }
  }
  return module;
}

/**
 * Assets preload helper, work with any resource
 */
export class AssetsLoader {
  destroyed = false;

  protected tasks = new Map<string, Promise<unknown>>();

  protected fromPayloads(payloads: AssetLoaderPayload[]) {
    return payloads.reduce(function normalise(assets, p): Record<string, RawAsset | LoaderAsset> {
      if (typeof p === 'string') {
        const asset = parseURL(p);
        return { ...assets, [asset.key]: asset };
      }

      if ('source' in p) {
        const key = spriteImageKey(p);
        return { ...assets, [key]: { ...parseURL(p.source), key, payload: p } };
      }

      // this allow custom key
      if ('key' in p && 'url' in p) {
        return { ...assets, [p.key]: { ...parseURL(p.url), key: p.key } };
      }

      if ('key' in p && p['load']) {
        return { ...assets, [p.key]: p };
      }

      if (typeof p === 'function') {
        if (p instanceof Promise) {
          // tried support lazy mode of require.context but
          // seems not meaningful and cannot implement correctly
          throw new Error('require.content with lazy option is not supported');
        }

        const ctx = p;
        return ctx
          .keys()
          .map(k => ctx<string | SpriteModule>(k))
          .reduce(normalise, assets);
      }

      return assets;
    }, {} as Record<string, RawAsset | LoaderAsset>);
  }

  async load(
    payloads?: AssetLoaderPayload[],
    onLoad?: (arg: LoadCallbackArg) => void,
    onError?: (arg: LoadCallbackArg) => void
  ) {
    if (this.destroyed) return console.warn('Trying to load assets but AssetsLoader already destroyed');
    if (!payloads || !payloads.length) return;

    const assets = this.fromPayloads(payloads);
    const entries = Object.entries(assets);
    const total = entries.length;

    let loaded = 0;
    let percentage = 0;

    const tasks = entries.map(async ([, asset]) => {
      try {
        let task = this.tasks.get(asset.key);
        if (!task) {
          if ('load' in asset) {
            task = asset.load();
          } else if (/(png|jpe?g|webp)$/.test(asset.ext)) {
            task = this.loadImage(asset);
          } else {
            task = this.loadRaw(asset);
          }
          this.tasks.set(asset.key, task);
        }
        await task;
        loaded += 1;
        percentage = (loaded / total) * 100;
        onLoad?.({ asset, loaded, percentage, total });
      } catch (error) {
        onError?.({ asset, loaded, percentage, total });
        console.error(error);
      }
    });

    await Promise.all(tasks);
  }

  /**
   * for customization
   */
  async loadRaw(asset: RawAsset) {
    return window.fetch(asset.url);
  }

  async loadImage({ key, url, payload }: RawAsset) {
    const source = payload ? getPreferredSource(payload).source : url;
    await createIfNotExists(key, source);
  }

  destroy() {
    this.destroyed = true;
    /**
     * clear because not sure if it will consume memory resources.
     */
    clearImageElements();
  }
}
