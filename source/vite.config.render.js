/**
 * Author        : Ahmong
 * Date          : 2022-01-21 15:53
 * LastEditTime  : 2022-03-20 01:16
 * LastEditors   : Ahmong
 * License       : GNU GPL v3
 * ---
 * Description   : 
 * ---
 */
/* eslint-env node */

import {chrome} from '../.electron-vendors.cache.json';
import {join} from 'path';
import {builtinModules} from 'module';
import vue from '@vitejs/plugin-vue';
// import { viteStaticCopy } from 'vite-plugin-static-copy';
import { resolve } from 'path/posix';

const PACKAGE_ROOT = __dirname;

/**
 * @type {import('vite').UserConfig}
 * @see https://vitejs.dev/config/
 */
const config = {
  mode: process.env.MODE,
  // root: PACKAGE_ROOT,
  root: join(PACKAGE_ROOT, '..'),
  envDir: join(PACKAGE_ROOT, '..'),
  envPrefix: 'VITE_',
  resolve: {
    alias: {
      // '/@/': join(PACKAGE_ROOT, 'src') + '/',
    },
  },
  base: '',
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag == 'clr-icon'
        }
      }
    }),
    /*
    viteStaticCopy({
      targets: [
        {
          src: 'source/win-main/index.html',
          dest: 'dist/win-main/index.html'
        }
      ]
    })
    */
  ],
  server: {
    fs: {
      strict: false,
    },
  },
  build: {
    sourcemap: process.env.MODE !== 'production',
    target: `chrome${chrome}`,
    outDir: '../dist/render',
    assetsDir: 'assets',
    minify: process.env.MODE !== 'development',
    rollupOptions: {
      input: {
        'win-main': resolve(PACKAGE_ROOT, 'win-main/index.html'),
        'win-about': resolve(PACKAGE_ROOT, 'win-about/index.html'),
        'win-assets': resolve(PACKAGE_ROOT, 'win-assets/index.html'),
        'win-error': resolve(PACKAGE_ROOT, 'win-error/index.html'),
        'win-log-viewer': resolve(PACKAGE_ROOT, 'win-log-viewer/index.html'),
        'win-paste-image': resolve(PACKAGE_ROOT, 'win-paste-image/index.html'),
        'win-preferences': resolve(PACKAGE_ROOT, 'win-preferences/index.html'),
        'win-print': resolve(PACKAGE_ROOT, 'win-print/index.html'),
        'win-project-properties': resolve(PACKAGE_ROOT, 'win-project-properties/index.html'),
        'win-quicklook': resolve(PACKAGE_ROOT, 'win-quicklook/index.html'),
        'win-stats': resolve(PACKAGE_ROOT, 'win-stats/index.html'),
        'win-tag-manager': resolve(PACKAGE_ROOT, 'win-tag-manager/index.html'),
        'win-update': resolve(PACKAGE_ROOT, 'win-update/index.html'),
      },
      output: {
        dir: 'dist/render',
        entryFileNames: '[name].cjs',
      },
      external: [
        ...builtinModules.flatMap(p => [p, `node:${p}`]),
      ],
    },
    emptyOutDir: true,
    brotliSize: true,
  },
  optimizeDeps: {
    exclude: [
      'fsevents',
    ]
  },
  test: {
    environment: 'happy-dom',
  },
};

export default config;
