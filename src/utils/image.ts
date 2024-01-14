import { SpriteModule } from '../types';

/**
 * Can be change to singleton share between projects
 * Or put into context and get it hooks
 */

declare global {
  interface Window {
    'react-sprites/images': Record<string, IImage>;
  }
}

interface IImage {
  element: HTMLImageElement;
  state: 'loading' | 'loaded' | 'error';
}

/**
 * SpriteModule.key is not unqiue, i will be duplicated when multiple sprite sheets generated from one source
 */
export const spriteImageKey = (module: SpriteModule) => module.key + (module.index ? `_${module.index}` : '');

export function getImage(key: string | SpriteModule): IImage | undefined {
  return window['react-sprites/images']?.[typeof key === 'string' ? key : spriteImageKey(key)];
}

export function waitForImage(image: IImage) {
  return new Promise<IImage>(resolve => {
    const callback = (event: Event) => {
      image.element.removeEventListener('load', callback);
      image.element.removeEventListener('error', callback);
      image.state = event.type === 'load' ? 'loaded' : 'error';
      resolve(image);
    };
    image.element.addEventListener('load', callback);
    image.element.addEventListener('error', callback);
  });
}

export function createImage(key: string, value: string | SpriteModule) {
  const element = new Image();
  const image: IImage = { element, state: 'loading' };

  element.src = typeof value === 'string' ? value : value.source;
  setImage(key, image);

  return waitForImage(image);
}

export function createIfNotExists(key: string, value: string | SpriteModule) {
  const image = window['react-sprites/images']?.[key];
  if (!image || image.state === 'error') return createImage(key, value);
  if (image.state === 'loaded') return image;
  if (image.state === 'loading') return waitForImage(image);
  return image;
}

export function getImageLoaded(module: SpriteModule, callback: (image: IImage) => void) {
  const r = createIfNotExists(spriteImageKey(module), module);
  if (r instanceof Promise) r.then(callback).catch(() => void 0);
  else callback(r);
}

export function setImage(key: string | SpriteModule, img: IImage) {
  window['react-sprites/images'][typeof key === 'string' ? key : spriteImageKey(key)] = img;
}

export function clearImageElements() {
  window['react-sprites/images'] = {};
}

// check window is defined for SSR
if (typeof window !== 'undefined' && !window['react-sprites/images']) {
  window['react-sprites/images'] = {};
}
