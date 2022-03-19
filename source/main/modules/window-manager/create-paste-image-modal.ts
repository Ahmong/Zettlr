/**
 * Author        : Ahmong
 * Date          : 2021-12-10 21:46
 * LastEditTime  : 2022-03-18 22:49
 * LastEditors   : Ahmong
 * License       : GNU GPL v3
 * ---
 * Description   : '头部注释'
 * ---
 * FilePath      : /source/main/modules/window-manager/create-paste-image-modal.ts
**/
/**
 * @ignore
 * BEGIN HEADER
 *
 * Contains:        createPasteImageModal function
 * CVM-Role:        Utility function
 * Maintainer:      Hendrik Erz
 * License:         GNU GPL v3
 *
 * Description:     Creates a BrowserWindow with an entry point according to
 *                  the function arguments.
 *
 * END HEADER
 */

import {
  BrowserWindow,
  BrowserWindowConstructorOptions
} from 'electron'
import path from 'path'
import attachLogger from './attach-logger'
import preventNavigation from './prevent-navigation'
import setWindowChrome from './set-window-chrome'

/**
 * Creates a BrowserWindow with print window configuration and loads the
 * corresponding renderer.
 *
 * @return  {BrowserWindow}           The loaded print window
 */
export default function createPasteImageModal (win: BrowserWindow, startPath: string): BrowserWindow {

  const preloadUrl = path.join(process.cwd(), (import.meta as any).env.VITE_WIN_PRELOAD_ENTRY)

  const pageUrl = (import.meta as any).env.DEV && (import.meta as any).env.VITE_DEV_SERVER_URL !== undefined
    ? (import.meta as any).env.VITE_DEV_SERVER_URL + (import.meta as any).env.VITE_WIN_PASTE_IMAGE_ENTRY
    : new URL('../render/win-paste-image/index.html', 'file://' + __dirname).toString();

  const winConf: BrowserWindowConstructorOptions = {
    acceptFirstMouse: true,
    width: 700,
    height: 600,
    modal: true,
    parent: win,
    show: false,
    fullscreenable: false,
    webPreferences: {
      contextIsolation: true,
      preload: preloadUrl
    }
  }

  // Set the correct window chrome
  setWindowChrome(winConf, true)

  const window = new BrowserWindow(winConf)

  const effectiveUrl = new URL(pageUrl)
  // Add the initial target path to the search params
  effectiveUrl.searchParams.append('startPath', startPath)

  // Load the index.html of the app.
  window.loadURL(effectiveUrl.toString())
    .catch(e => {
      global.log.error(`Could not load URL ${pageUrl}: ${e.message as string}`, e)
    })

  // EVENT LISTENERS

  // Prevent arbitrary navigation away from our WEBPACK_ENTRY
  preventNavigation(window)

  // Implement main process logging
  attachLogger(window, 'Paste Image Modal')

  // Only show window once it is completely initialized + maximize it
  window.once('ready-to-show', function () {
    window.show()
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
