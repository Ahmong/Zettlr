/**
 * Author        : Ahmong
 * Date          : 2022-01-21 15:53
 * LastEditTime  : 2022-03-20 14:54
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
  mode: process.env.mode,
  root: PACKAGE_ROOT,
  // root: join(PACKAGE_ROOT, '..'),
  envDir: join(PACKAGE_ROOT, '..'),
  envPrefix: 'VITE_',
  resolve: {
    alias: {
      // '/@/': join(PACKAGE_ROOT, '') + '/',
      '/@/': join(PACKAGE_ROOT, '') + '/',
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
      strict: true,
    },
  },
  build: {
    sourcemap: process.env.mode !== 'production',
    target: `chrome${chrome}`,
    outDir: '../dist/render',
    assetsDir: 'assets',
    minify: process.env.mode !== 'development',
    rollupOptions: {
      input: {
        'win-main': 'win-main-index.html',
        'win-about': 'win-about-index.html',
        'win-assets': 'win-assets-index.html',
        'win-error': 'win-error-index.html',
        'win-log-viewer': 'win-log-viewer-index.html',
        'win-paste-image': 'win-paste-image-index.html',
        'win-preferences': 'win-preferences-index.html',
        'win-print': 'win-print-index.html',
        'win-project-properties': 'win-project-properties-index.html',
        'win-quicklook': 'win-quicklook-index.html',
        'win-stats': 'win-stats-index.html',
        'win-tag-manager': 'win-tag-manager-index.html',
        'win-update': 'win-update-index.html',
      },
      output: {
        dir: 'dist/render',
        entryFileNames: '[name].js',
      },
      /*
      external: [
        ...builtinModules.flatMap(p => [p, `node:${p}`]),
      ],
      */
    },
    emptyOutDir: true,
    brotliSize: true,
  },
  optimizeDeps: {
    /*
    exclude: [
      'fsevents',
    ]
    */
  },
  test: {
    environment: 'happy-dom',
  },
};

export default config;
