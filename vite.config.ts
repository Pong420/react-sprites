import fs from 'fs-extra';
import path from 'path';
import dts from 'vite-plugin-dts';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { builtinModules } from 'module';
import { copyFiles } from './vite/copyFiles';

const watchMode = process.argv.includes('--watch');
const srcDir = path.join(__dirname, 'src');

const deps = [path.join(__dirname, 'package.json')].reduce((deps, pathname) => {
  if (pathname.endsWith('package.json')) {
    const pkg = fs.readJsonSync(pathname) as Record<string, unknown>;
    return [
      ...deps,
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.devDependencies || {}),
      ...Object.keys(pkg.peerDependencies || {}),
      ...Object.keys(pkg.optionalDependencies || {}),
    ];
  }
  return deps;
}, [] as string[]);

export default defineConfig({
  plugins: [
    react(),
    dts(),
    copyFiles({
      relativeDir: srcDir,
      files: [path.join(srcDir, 'loader', 'json.mst')],
    }),
  ],
  build: {
    target: 'esnext',
    sourcemap: 'inline',
    emptyOutDir: !watchMode,
    minify: false,
    lib: {
      entry: [path.join('src', 'index.ts'), path.join('src', 'loader.ts')],
    },
    rollupOptions: {
      output: [
        {
          format: 'es',
          preserveModules: true,
          entryFileNames: '[name].js',
        },
      ],
      preserveEntrySignatures: 'strict',
      external: [
        /node_modules/,
        'react/jsx-runtime',
        ...builtinModules,
        ...builtinModules.map((m) => `node:${m}`),
        ...Array.from(new Set(deps), (d) => new RegExp(`^${d}`)),
      ],
    },
  },
});
