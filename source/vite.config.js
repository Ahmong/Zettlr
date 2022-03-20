/**
 * Author        : Ahmong
 * Date          : 2022-01-21 14:15
 * LastEditTime  : 2022-03-20 02:36
 * LastEditors   : Ahmong
 * License       : GNU GPL v3
 * ---
 * Description   : 
 * ---
 */
import {node} from '../.electron-vendors.cache.json';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import vue from '@vitejs/plugin-vue';
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
  resolve: {
    alias: {
      // '/@/': join(PACKAGE_ROOT, 'source') + '/',
    },
    conditions: [
      'import',
      'module',
      'default',
      process.env.mode,
    ],
  },
  plugins: [
  ],
  publicDir: 'static',
  envDir: PACKAGE_ROOT,
  envPrefix: 'VITE_',
  build: {
    sourcemap: true,
    target: `node${node}`,
    outDir: (process.env.mode === 'development') ? 'out/dev/main' : 'dist/main',
    assetsDir: '.',
    minify: process.env.mode !== 'development',
    lib: {
      entry: 'source/main.ts',
      formats: ['cjs'],
    },
    rollupOptions: {
      external: [
        'electron',
        'electron-devtools-installer',
        'fsevents',
        'glob',
        'uuid',
        ...builtinModules.flatMap(p => [p, `node:${p}`]),
      ],
      output: {
        entryFileNames: '[name].cjs',
        minifyInternalExports: false,
      },
    },
    emptyOutDir: true,
    brotliSize: false,
  },
};

export default config;
