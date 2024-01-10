export interface Texture {
  path: string; // path without file extension is the key or frames
  contents: Buffer;
}

export interface PackOptions {
  textureName: string;
  textures: Texture[];
}

/**
 * Except index, SpriteData is depends on `json.mst`
 */
export interface SpriteData {
  name: string; // single texture name
  width: number;
  height: number;
  x: number;
  y: number;
  index?: number;
}

export interface SpriteImage {
  name: string; // the sprite image name, if multiple sprites generated, it will suffix with -0, -1, -2....
  ext: string; // file extension with dot
  width: number;
  height: number;
  content: Buffer;
  sourceSet: Record<string, SpriteImage>;
}

export interface SpriteModule extends SpriteData {
  key: string;
  name: string; // texture name
  source: string;
  /**
   * Currently, sourceSet only have webp right now
   * We can add more source set like HD / SD in the futures
   * {
   *   webp: SpriteModule
   * }
   */
  sourceSet: Record<string, SpriteModule>;
  group: string;
  frameName: string;
  spriteName: string; // same as SpriteImage['name']
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
