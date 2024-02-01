import nodePath from 'path';

type Data = ReturnType<typeof parseResourcePath>;
type Resolved = Data & { contents: Buffer };

export const resourcePathRegex = /([^/]+)\/([^/]+?)\.(\w+)/;
export const parseResourcePath = (resourcePath: string, rootContext: string) => {
  const matches = resourcePath.match(resourcePathRegex);
  if (!matches) return;

  // resourcePath | '<root>/src/assets/pc/betarea/FW_PaysBets_5x.png' |
  // path         | 'betarea/FW_PaysBets_5x.png'                      |
  // group        | 'betarea'                                         |
  // filename     | 'FW_PaysBets_5x'                                  |
  // extension    | 'png'                                             |
  const [path, group, filename, extension] = matches;

  /**
   * pre-defined keys
   * Textures under the same directory will pack into sprite sheets. The directory name will used as a key.
   * If there are two data source `/pc/main/` and `/mobile/main/`, the key will be duplicated.
   * So use some pre-defined keys to prevents conflict
   */
  const keys =
    resourcePath
      .replace(rootContext, '') // remove root context, because the root context could may have `/Desktop/` directory
      .match(/(pc|mobile|desktop|portrait|landscape|lazy|shared|common|locales)/gi)
      ?.map(s => s.toLowerCase().replace(/desktop/, 'pc')) || [];

  return {
    key: Array.from(new Set([...keys, group])).join('_'),
    group,
    filename,
    extension,
    path, // required for free-tex-packer.ts,
    dirname: nodePath.dirname(resourcePath)
  };
};

export class TextureStore {
  /**
   * { [key: string]: Map<filename, Data> }
   */
  pending: Record<string, Map<string, Data>> = {};
  resolved: Record<string, Map<string, Resolved>> = {};

  addTexture(resourcePath: string, rootContext: string) {
    const data = parseResourcePath(resourcePath, rootContext);
    if (!data) return;

    this.pending[data.key] = this.pending[data.key] || new Map();

    for (const [, d] of this.pending[data.key]) {
      if (d && d.dirname !== data.dirname) {
        throw new Error(
          `These two directories ${d.dirname}, ${data.dirname} resulting duplicated key ${data.key}. Try to rename one of them or put into pre-defined dirname`
        );
      }
    }

    this.pending[data.key].set(data.filename, data);
  }

  getTextures(key: string) {
    return this.resolved[key];
  }

  resolve(resourcePath: string, rootContext: string, contents: Buffer) {
    const data = parseResourcePath(resourcePath, rootContext);
    if (!data) return;
    const { key } = data;

    this.resolved[key] = this.resolved[key] || new Map();
    this.resolved[key].set(data.filename, { ...data, contents });
    return this.pending[key].size === this.resolved[key].size;
  }

  size(key: string) {
    return this.resolved[key]?.size ?? 0;
  }
}
