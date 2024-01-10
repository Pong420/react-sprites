type Data = ReturnType<typeof parseResourcePath>;
type Resolved = Data & { contents: Buffer };

export const resourcePathRegex = /([^/]+)\/([^/]+?)\.(\w+)/;
export const parseResourcePath = (resourcePath: string) => {
  const matches = resourcePath.match(resourcePathRegex);
  if (!matches) return;

  // resourcePath | '<root>/src/assets/pc/betarea/FW_PaysBets_5x.png' |
  // path         | 'betarea/FW_PaysBets_5x.png'                      |
  // group        | 'betarea'                                         |
  // filename     | 'FW_PaysBets_5x'                                  |
  // extension    | 'png'                                             |
  const [path, group, filename, extension] = matches;

  // eslint-disable-next-line no-sparse-arrays
  const [, type] = resourcePath.match(/\/(pc|mobile)\//) || [, 'shared'];
  const [, orientation] = resourcePath.match(/\/(portrait|landscape)\//) || [];
  return {
    // key is a advanaced group, it is not unqiue if multiple sprite generated
    key: [type, orientation, group].filter(Boolean).join('_'),
    type,
    orientation,
    group,
    filename,
    extension,
    path
  };
};

export class TextureStore {
  /**
   * { [key: string]: Map<filename, Data> }
   */
  pending: Record<string, Map<string, Data>> = {};
  resolved: Record<string, Map<string, Resolved>> = {};

  addTexture(resourcePath: string) {
    const data = parseResourcePath(resourcePath);
    if (!data) return;
    this.pending[data.key] = this.pending[data.key] || new Map();
    this.pending[data.key].set(data.filename, data);
  }

  getTextures(key: string) {
    return this.resolved[key];
  }

  resolve(resourcePath: string, contents: Buffer) {
    const data = parseResourcePath(resourcePath);
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
