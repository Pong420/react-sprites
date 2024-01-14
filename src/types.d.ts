declare global {
  interface NodeRequire {
    (url: `${string}?sprites`): SpriteModule;
  }
}

declare module '*?sprites' {
  const module: SpriteModule;
  export default module;
}

export interface Texture {
  path: string; // path without file extension is the key or frames
  contents: Buffer;
}

export interface PackOptions {
  textureName: string;
  textures: Texture[];
}

export interface SpriteData {
  name: string; // the texture name ( without file extension )
  width: number;
  height: number;
  x: number;
  y: number;
  index?: number;
}

export interface SpriteImage {
  name: string; // the sprite sheet image name, if multiple sprites generated, it will suffix with -0, -1, -2....
  ext: string; // file extension with dot
  width: number;
  height: number;
  content: Buffer;
  sourceSet: Record<string, SpriteImage>;
}

export interface SpriteModule extends SpriteData {
  /**
   * Check the parseResourcePath in packages/image/loader/store.ts
   * It is not unqiue, I will be duplicated when multiple sprite sheets generated from one source
   */
  key: string;
  /**
   * The sprite sheet image url
   */
  source: string;
  /**
   * Currently, sourceSet only have webp right now
   * We can add more source set like HD / SD in the futures
   * {
   *   webp: SpriteModule
   * }
   */
  sourceSet: Record<string, SpriteModule>;
  /**
   * The directory name of the textures
   */
  group: string;
  /**
   *  <group_name>/<texture_name>
   */
  frameName: string;
  /**
   * The sprite sheet image name, if multiple sprites generated, it will suffix with -0, -1, -2...
   */
  spriteName: string;
  spriteWidth: number;
  spriteHeight: number;

  /**
   * For future use, if we wants HD/SD images
   */
  scaleFactor: number;
}

export type PackResult = {
  frames: Record<string, SpriteData>;
  images: SpriteImage[];
};
