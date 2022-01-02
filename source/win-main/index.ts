/**
 * @ignore
 * BEGIN HEADER
 *
 * Contains:        Main window entry file
 * CVM-Role:        <none>
 * Maintainer:      Hendrik Erz
 * License:         GNU GPL v3
 *
 * Description:     Main entry point for the main application window.
 *
 * END HEADER
 */

import windowRegister from '../common/modules/window-register'
import { createApp } from 'vue'
// import { createStore } from 'vuex'
import App from './App.vue'
import createStore from './store'
import PopupProvider from './popup-provider'

const ipcRenderer = (window as any).ipc as Electron.IpcRenderer

// The first thing we have to do is run the window controller
windowRegister()

const appStore = createStore()

// Create the Vue app. We additionally use appStore, which exposes $store, and
// PopupProvider, which exposes $showPopover, $togglePopover, and $closePopover
const app = createApp(App).use(appStore).use(PopupProvider).mount('#app')

document.addEventListener('dragover', function (event) {
  event.preventDefault()
  return false
}, false)

// Set the <html>'s font size to the editor.fontSize setting.
function updateBaseFontSize (): void {
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  let fontSize = Number(app.$store.state.config['editor.fontSize'] as string)
  if (fontSize < 10) {
    fontSize = 10
  } else if (fontSize > 32) {
    fontSize = 32
  }

  document.documentElement.style.setProperty('--base-font-size', fontSize.toString(10) + 'px')
}

// Set editor font size first time.
updateBaseFontSize()

let browser: Record<string, any> = {}
if (typeof navigator !== 'undefined' && typeof document !== 'undefined') {
  const ieEdge = /Edge\/(\d+)/.exec(navigator.userAgent)
  const ieUpto10 = /MSIE \d/.test(navigator.userAgent)
  const ie11up = /Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(navigator.userAgent)

  let ie = browser.ie = !!(ieUpto10 || (ie11up != null) || (ieEdge != null))
  browser.ie_version = ieUpto10 ? Object.keys(document).includes('documentMode') || 6 : ie11up ? +ie11up[1] : ieEdge ? +ieEdge[1] : null
  browser.gecko = !ie && /gecko\/(\d+)/i.test(navigator.userAgent)
  browser.gecko_version = (Boolean(browser.gecko)) && +(/Firefox\/(\d+)/.exec(navigator.userAgent) ?? [ 0, 0 ])[1]
  let chrome = !ie && /Chrome\/(\d+)/.exec(navigator.userAgent)
  browser.chrome = !!chrome
  browser.chrome_version = chrome && +chrome[1]
  // Is true for both iOS and iPadOS for convenience
  browser.safari = !ie && navigator.vendor.includes('Apple Computer')
  browser.ios = browser.safari && (/Mobile\/\w+/.test(navigator.userAgent) || navigator.maxTouchPoints > 2)
  browser.mac = browser.ios || navigator.platform.includes('Mac')
  browser.android = /Android \d/.test(navigator.userAgent)
  browser.webkit = 'webkitFontSmoothing' in document.documentElement.style
  browser.webkit_version = browser.webkit && +(/\bAppleWebKit\/(\d+)/.exec(navigator.userAgent) ?? [ 0, 0 ])[1]
}
console.log('browser: ' + JSON.stringify(browser))

// On drop, tell the renderer to tell main that there's something to
// handle.
document.addEventListener('drop', (event) => {
  event.preventDefault()
  if (event.dataTransfer === null) {
    return
  }

  // Retrieve all paths
  let f = []
  for (let i = 0; i < event.dataTransfer.files.length; i++) {
    const file = event.dataTransfer.files.item(i)
    if (file !== null) {
      f.push(file.path)
    }
  }

  ipcRenderer.invoke('application', { command: 'handle-drop', payload: f })
    .catch(e => console.error(e))
  return false
}, false)

// -----------------------------------------------------------------------------

/**
 * Listen to update events
 */
function updateColouredTags (): void {
  ipcRenderer.invoke('tag-provider', {
    command: 'get-coloured-tags'
  })
    .then(tags => {
      app.$store.commit('colouredTags', tags)
    })
    .catch(e => console.error(e))
}

ipcRenderer.on('coloured-tags', (event) => {
  // Update the tags
  updateColouredTags()
})

// Send the first update for tags
updateColouredTags()

// -----------------------------------------------------------------------------

function updateCitationDatabase (): void {
  ipcRenderer.invoke('citeproc-provider', { command: 'get-items' })
    .then(cslData => {
      app.$store.commit('updateCSLItems', cslData)
    })
    .catch(err => console.error(err))
}

ipcRenderer.on('citeproc-provider', (event, message) => {
  if (message === 'database-changed') {
    updateCitationDatabase()
  }
})

updateCitationDatabase()

// -----------------------------------------------------------------------------

// Update the configuration if some value changes
ipcRenderer.on('config-provider', (event, { command, payload }) => {
  if (command === 'update') {
    app.$store.commit('updateConfig', payload)
    // TODO: 在消息 updateConfig 发送处设置延迟，以免过于频繁刷新界面
    updateBaseFontSize()
  }
})

// -----------------------------------------------------------------------------

// Listen for updates to the tag database
ipcRenderer.on('tags', (event) => {
  ipcRenderer.invoke('tag-provider', { command: 'get-tags-database' })
    .then(tags => {
      app.$store.commit('updateTagDatabase', tags)
    })
    .catch(e => console.error(e))
})

// Also send an initial update
ipcRenderer.invoke('tag-provider', { command: 'get-tags-database' })
  .then(tags => {
    app.$store.commit('updateTagDatabase', tags)
  })
  .catch(e => console.error(e))

// -----------------------------------------------------------------------------
let filetreeUpdateLock = false
let openDirectoryLock = false
let activeFileUpdateLock = false
// Listen for broadcasts from main in order to update the filetree
ipcRenderer.on('fsal-state-changed', (event, kind: string) => {
  if (kind === 'filetree') {
    if (filetreeUpdateLock) {
      return
    }

    filetreeUpdateLock = true
    app.$store.dispatch('filetreeUpdate')
      .catch(e => console.error(e))
      .finally(() => { filetreeUpdateLock = false })
  } else if (kind === 'openDirectory') {
    if (openDirectoryLock) {
      return
    }

    openDirectoryLock = true
    app.$store.dispatch('updateOpenDirectory')
      .catch(e => console.error(e))
      .finally(() => { openDirectoryLock = false })
  } else if (kind === 'activeFile') {
    if (activeFileUpdateLock) {
      return
    }

    activeFileUpdateLock = true
    app.$store.dispatch('updateActiveFile')
      .catch(e => console.error(e))
      .finally(() => { activeFileUpdateLock = false })
  } else if (kind === 'openFiles') {
    app.$store.dispatch('updateOpenFiles')
      .catch(e => console.error(e))
  }
})

// Initial update
filetreeUpdateLock = true
openDirectoryLock = true
activeFileUpdateLock = true
app.$store.dispatch('filetreeUpdate')
  .catch(e => console.error(e))
  .finally(() => { filetreeUpdateLock = false })
app.$store.dispatch('updateOpenDirectory')
  .catch(e => console.error(e))
  .finally(() => { openDirectoryLock = false })
app.$store.dispatch('updateActiveFile')
  .catch(e => console.error(e))
  .finally(() => { activeFileUpdateLock = false })
app.$store.dispatch('updateOpenFiles')
  .catch(e => console.error(e))

// -----------------------------------------------

// Further shortcuts we have to listen to
ipcRenderer.on('shortcut', (event, command) => {
  // Retrieve the correct contexts first
  const dirDescriptor = app.$store.state.selectedDirectory
  const fileDescriptor = app.$store.state.activeFile

  if (command === 'new-dir') {
    if (dirDescriptor === null) {
      return // Cannot create a new directory
    }

    ipcRenderer.invoke('application', {
      command: 'dir-new',
      payload: { path: dirDescriptor.path }
    })
      .catch(err => console.error(err))
  } else if (command === 'delete-file') {
    if (fileDescriptor === null) {
      return // Cannot remove file
    }

    ipcRenderer.invoke('application', {
      command: 'file-delete',
      payload: { path: fileDescriptor.path }
    })
      .catch(err => console.error(err))
  } else if (command === 'delete-dir') {
    if (dirDescriptor === null) {
      return // Cannot remove dir
    }

    ipcRenderer.invoke('application', {
      command: 'dir-delete',
      payload: { path: dirDescriptor.path }
    })
      .catch(err => console.error(err))
  }
})
