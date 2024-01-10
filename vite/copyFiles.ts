import fs from 'fs-extra';
import path from 'path';
import { PluginOption } from 'vite';

export function copyFiles({ relativeDir = '', files = [] as string[] }) {
  const option: PluginOption = {
    name: copyFiles.name,
    async writeBundle(options) {
      for (const filepath of files) {
        const dist = path.join(options.dir || '', filepath.replace(relativeDir, ''));
        await fs.mkdir(path.dirname(dist), { recursive: true });
        await fs.copy(filepath, dist);
      }
    }
  };
  return option;
}
