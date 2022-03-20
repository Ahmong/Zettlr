/**
 * Author        : Ahmong
 * Date          : 2022-01-21 15:48
 * LastEditTime  : 2022-03-20 02:35
 * LastEditors   : Ahmong
 * License       : GNU GPL v3
 * ---
 * Description   : 
 * ---
 */
import {chrome} from '../.electron-vendors.cache.json';
import {join} from 'path';
import {builtinModules} from 'module';

const PACKAGE_ROOT = __dirname + '/..';

/**
 * @type {import('vite').UserConfig}
 * @see https://vitejs.dev/config/
 */
const config = {
  mode: process.env.mode,
  root: PACKAGE_ROOT,
  envDir: PACKAGE_ROOT,
  resolve: {
    alias: {
      // '/@/': join(PACKAGE_ROOT, 'src') + '/',
    },
  },
  build: {
    sourcemap: 'inline',
    target: `chrome${chrome}`,
    // outDir: 'dist/preload',
    outDir: (process.env.mode === 'development') ? 'out/dev/preload' : 'dist/preload',
    assetsDir: 'assets',
    minify: process.env.mode !== 'development',
    lib: {
      entry: 'source/preload/index.ts',
      formats: ['cjs'],
    },
    rollupOptions: {
      external: [
        'electron',
        'fsevents',
        ...builtinModules.flatMap(p => [p, `node:${p}`]),
      ],
      output: {
        entryFileNames: 'preload.cjs',
      },
    },
    emptyOutDir: true,
    brotliSize: false,
  },
  optimizeDeps: {
    exclude: [
      'fsevents',
    ]
  },
};

export default config;
