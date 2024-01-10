import fs from 'fs-extra';
import path from 'path';
import { PackResult } from '../types';
import { BinaryLike, createHash } from 'crypto';

type CacheItem = {
  hash: string;
  data: PackResult;
};

export type File = { name: string; content: Buffer };

const hash = (content: BinaryLike) => {
  const hash = createHash('md5');
  hash.update(content);
  return hash.digest('hex');
};

export class TextureCache {
  constructor(protected cacheDir = '') {}

  protected getPath = (key: string) => path.join(this.cacheDir, `${key}.json`);

  setCacheDir(cacheDir: string) {
    this.cacheDir = cacheDir;
  }

  readFile(filepath: string) {
    return fs.readFileSync(path.join(this.cacheDir, filepath.replace(/^buffer:/, '')));
  }

  protected update(data: Record<string, unknown> | unknown[], k: string, r: unknown) {
    return Array.isArray(data) ? [...data, r] : { ...data, [k]: r };
  }

  stringify<T extends Record<string, unknown> | unknown[]>(data: T, files: File[] = [], prefix = ''): T {
    return Object.entries(data).reduce(
      (res, [k, value]) => {
        if (value && typeof value === 'object') {
          if (value instanceof Buffer) {
            const name = `${prefix}.${hash(value)}`;
            files.push({ name, content: value });
            return this.update(res, k, `buffer:${name}`);
          }
          return this.update(res, k, this.stringify(value as T, files, prefix));
        }
        return this.update(res, k, value);
      },
      (Array.isArray(data) ? [] : {}) as Record<string, unknown> | unknown[]
    ) as T;
  }

  parse<T extends Record<string, unknown> | unknown[]>(data: T): T {
    return Object.entries(data).reduce(
      (res, [k, value]) => {
        if (value && typeof value === 'object') {
          return this.update(res, k, this.parse(value as T));
        } else if (typeof value === 'string' && value.startsWith('buffer:')) {
          return this.update(res, k, this.readFile(value));
        }
        return this.update(res, k, value);
      },
      (Array.isArray(data) ? [] : {}) as Record<string, unknown> | unknown[]
    ) as T;
  }

  async getCache(key: string, hash: string) {
    if (!this.cacheDir) return;
    const content = await fs.readFile(this.getPath(key), 'utf-8').catch(() => void 0);
    const cached = content ? (JSON.parse(content) as CacheItem) : undefined;

    if (cached && cached.hash === hash) {
      return this.parse<PackResult>(cached.data);
    }
  }

  async setCache(key: string, hash: string, data: PackResult) {
    if (!this.cacheDir) return;
    const item: CacheItem = { hash, data };
    const files: File[] = [];
    const content = this.stringify(item, files, key);
    await fs.outputFile(this.getPath(key), JSON.stringify(content));
    await Promise.all(files.map(f => fs.writeFile(path.join(this.cacheDir, f.name), f.content)));
  }
}
