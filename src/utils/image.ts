import { SpriteModule } from '../types';

interface ImageAsset {
  element: HTMLImageElement;
  state: 'loading' | 'loaded' | 'unloaded';
}

export const images = new Map<string, ImageAsset>();

/**
 * SpriteModule.key is not unqiue, i will be duplicated when multiple sprite sheets generated from one source
 */
export const spriteImageKey = (module: SpriteModule) => module.key + (module.index ? `_${module.index}` : '');

const stringify = (key: string | SpriteModule) => (typeof key === 'string' ? key : spriteImageKey(key));

export function getImage(key: string | SpriteModule): ImageAsset | undefined {
  return images.get(stringify(key));
}

export function waitForImage(image: ImageAsset) {
  if (image.state === 'loaded') return Promise.resolve(image);

  return new Promise<ImageAsset>(resolve => {
    const callback = (event: Event) => {
      image.element.removeEventListener('load', callback);
      image.element.removeEventListener('error', callback);
      image.state = event.type === 'load' ? 'loaded' : 'unloaded';
      resolve(image);
    };
    image.element.addEventListener('load', callback);
    image.element.addEventListener('error', callback);
  });
}

export function createImage(key: string, value: string | SpriteModule) {
  const element = new Image();
  const image: ImageAsset = { element, state: 'loading' };

  element.src = typeof value === 'string' ? value : value.source;
  setImage(key, image);

  return waitForImage(image);
}

export function createIfNotExists(key: string, value: string | SpriteModule) {
  const image = images.get(key);
  if (!image || image.state === 'unloaded') return createImage(key, value);
  if (image.state === 'loaded') return image;
  if (image.state === 'loading') return waitForImage(image);
  return image;
}

export function getImageWithCallback(module: SpriteModule, callback: (image: ImageAsset) => void) {
  const r = createIfNotExists(spriteImageKey(module), module);
  if (r instanceof Promise) r.then(callback).catch(() => void 0);
  else callback(r);
}

export function setImage(key: string | SpriteModule, image: ImageAsset) {
  images.set(stringify(key), image);
}

export function clearImageElements() {
  images.clear();
}
