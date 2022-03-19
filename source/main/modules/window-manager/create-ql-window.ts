/**
 * Author        : Ahmong
 * Date          : 2021-12-10 21:46
 * LastEditTime  : 2022-03-18 22:55
 * LastEditors   : Ahmong
 * License       : GNU GPL v3
 * ---
 * Description   : '头部注释'
 * ---
 * FilePath      : /source/main/modules/window-manager/create-ql-window.ts
**/
/**
 * @ignore
 * BEGIN HEADER
 *
 * Contains:        createQuicklookWindow function
 * CVM-Role:        Utility function
 * Maintainer:      Hendrik Erz
 * License:         GNU GPL v3
 *
 * Description:     Creates a BrowserWindow using the Quicklook configuration
 *
 * END HEADER
 */

import {
  BrowserWindow,
  BrowserWindowConstructorOptions
} from 'electron'
import path from 'path'
import { MDFileDescriptor } from '../fsal/types'
import { WindowPosition } from './types'
import setWindowChrome from './set-window-chrome'
import preventNavigation from './prevent-navigation'
import attachLogger from './attach-logger'

/**
 * Creates a BrowserWindow with Quicklook Window configuration and loads the
 * corresponding renderer.
 *
 * @param   {MDFileDescriptor}  file  The file to load in the Quicklook
 * @return  {BrowserWindow}           The loaded main window
 */
export default function createQuicklookWindow (file: MDFileDescriptor, conf: WindowPosition): BrowserWindow {

  const preloadUrl = path.join(process.cwd(), (import.meta as any).env.VITE_WIN_PRELOAD_ENTRY)

  const pageUrl = (import.meta as any).env.DEV && (import.meta as any).env.VITE_DEV_SERVER_URL !== undefined
    ? (import.meta as any).env.VITE_DEV_SERVER_URL + (import.meta as any).env.VITE_WIN_QUICKLOOK_ENTRY
    : new URL('../render/win-quicklook/index.html', 'file://' + __dirname).toString();

  global.log.info(`preloadUrl=${preloadUrl}`)
  global.log.info(`pageUrl=${pageUrl}`)

  const winConf: BrowserWindowConstructorOptions = {
    acceptFirstMouse: true,
    minWidth: 300,
    minHeight: 200,
    width: conf.width,
    height: conf.height,
    x: conf.x,
    y: conf.y,
    show: false,
    webPreferences: {
      contextIsolation: true,
      preload: preloadUrl
    }
  }

  // Set the correct window chrome
  setWindowChrome(winConf)

  const window = new BrowserWindow(winConf)

  const effectiveUrl = new URL(pageUrl)
  effectiveUrl.searchParams.append('file', file.path)

  // Load the index.html of the app.
  // The variable QUICKLOOK_WEBPACK_ENTRY is automatically resolved by electron forge / webpack
  window.loadURL(effectiveUrl.toString())
    .catch(e => {
      global.log.error(`Could not load URL ${pageUrl}: ${e.message as string}`, e)
    })

  // EVENT LISTENERS

  // Prevent arbitrary navigation away from our WEBPACK_ENTRY
  preventNavigation(window)

  // Implement main process logging
  attachLogger(window, 'Quicklook Window')

  // Only show window once it is completely initialized + maximize it
  window.once('ready-to-show', function () {
    window.show()
    if (conf.isMaximised) {
      window.maximize()
    }
  })

  // Emitted when the user wants to close the window.
  window.on('close', (event) => {
    let ses = window.webContents.session
    // Do not "clearCache" because that would only delete my own index files
    ses.clearStorageData({
      storages: [
        'appcache',
        'cookies', // Nobody needs cookies except for downloading pandoc etc
        'localstorage',
        'shadercache', // Should never contain anything
        'websql'
      ]
    }).catch(e => {
      global.log.error(`Could not clear session data: ${e.message as string}`, e)
    })
  })

  return window
}
