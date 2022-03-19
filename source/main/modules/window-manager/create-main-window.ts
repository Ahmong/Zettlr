/**
 * Author        : Ahmong
 * Date          : 2022-01-21 12:52
 * LastEditTime  : 2022-03-19 18:49
 * LastEditors   : Ahmong
 * License       : GNU GPL v3
 * ---
 * Description   : 
 * ---
 */
/**
 * @ignore
 * BEGIN HEADER
 *
 * Contains:        createMainWindow function
 * CVM-Role:        Utility function
 * Maintainer:      Hendrik Erz
 * License:         GNU GPL v3
 *
 * Description:     Creates a new BrowserWindow instance with main window
 *                  configuration, as well as registering all hooks that have
 *                  to be called either way.
 *
 * END HEADER
 */

import {
  BrowserWindow,
  BrowserWindowConstructorOptions
} from 'electron'
import path from 'path'
import { WindowPosition } from './types.d'
import setWindowChrome from './set-window-chrome'
import preventNavigation from './prevent-navigation'
import attachLogger from './attach-logger'
import { url } from 'inspector'

/**
 * Creates a BrowserWindow with main window configuration and loads the main
 * renderer.
 *
 * @return  {BrowserWindow}  The loaded main window
 */
export default function createMainWindow (conf: WindowPosition): BrowserWindow {

  const preloadUrl = path.join(__dirname, '../preload/preload.cjs')

  const pageUrl = (import.meta as any).env.DEV && (import.meta as any).env.VITE_DEV_SERVER_URL !== undefined
    ? (import.meta as any).env.VITE_DEV_SERVER_URL + (import.meta as any).env.VITE_WIN_MAIN_ENTRY
    : new URL('../render/win-main/index.html', 'file://' + __filename).toString();

  global.log.info('__dirname=' + __dirname)
  global.log.info(`preloadUrl=${preloadUrl}`)
  global.log.info(`pageUrl=${pageUrl}`)

  const winConf: BrowserWindowConstructorOptions = {
    width: conf.width,
    height: conf.height,
    x: conf.x,
    y: conf.y,
    acceptFirstMouse: true,
    minWidth: 300,
    minHeight: 200,
    show: false,
    webPreferences: {
      contextIsolation: true,
      preload: preloadUrl
    }
  }

  setWindowChrome(winConf)

  const window = new BrowserWindow(winConf)

  // Load the index.html of the app.
  // The variable MAIN_WINDOW_WEBPACK_ENTRY is automatically resolved by electron forge / webpack
  window.loadURL(pageUrl)
    .catch(e => {
      global.log.error(`Could not load URL ${pageUrl}: ${e.message as string}`, e)
    })

  // EVENT LISTENERS
  // Prevent arbitrary navigation away from our WEBPACK_ENTRY
  preventNavigation(window)
  // Implement main process logging
  attachLogger(window, 'Main Window')

  // Only show window once it is completely initialized + maximize it
  window.once('ready-to-show', function () {
    window.show()

    if (conf.isMaximised) {
      window.maximize()
    }

    if (import.meta.env.DEV) {
      window?.webContents.openDevTools();
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
