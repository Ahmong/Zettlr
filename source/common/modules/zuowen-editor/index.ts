/**
 * Author        : Ahmong
 * Date          : 2021-12-12 20:46
 * LastEditTime  : 2021-12-22 00:47
 * LastEditors   : Ahmong
 * License       : GNU GPL v3
 * ---
 * Description   : This module contains the functionality to spin up a fully
 *                 functioning Milkdown editor.
 * ---
**/

/* eslint-disable @typescript-eslint/prefer-readonly */

import { EditorState, Slice } from '@milkdown/prose'
import {
  Editor as mdEditor,
  editorStateOptionsCtx,
  editorViewCtx,
  parserCtx,
  serializerCtx,
  editorStateCtx,
  schemaCtx
} from '@milkdown/core'
import { listenerCtx } from '@milkdown/plugin-listener'

/**
 * UTILITY FUNCTIONS
 */

import { createEditor, setEditorViewOptions, toMarkdown } from './editor-utils'
import { ZuowenEditorOptions, getEditorDefaultOptions } from './get-editor-options'
import safeAssign from '../../util/safe-assign'

/**
 * APIs
 */
import { EventEmitter } from 'events'

// type EditorViewOptions = Omit<ConstructorParameters<typeof EditorView>[1], 'state'>

interface WorkingDocState {
  editorState: EditorState | null
  docChange?: boolean
  // editorViewOptions: typeof editorViewOptionsCtx
}

// const ipcRenderer = (window as any).ipc as Electron.IpcRenderer
// const clipboard = (window as any).clipboard as Electron.Clipboard

class ZuowenEditor extends EventEmitter {
  /**
   * Holds the actual Milkdown instance
   *
   * @var {mdEditor}
   */
  private _instance: mdEditor

  /**
   * Contains the anchor element to which the instance will attach
   * itself.
   *
   * @var {HTMLElement}
   */
  private _anchorElement

  /**
   * Can hold a close-callback from an opened context menu
   *
   * @var {Function}
   */
  // private _contextCloseCallback

  /**
   * The editor options
   *
   * @var  {ZuowenEditorOptions}
   */
  private _mdOptions = getEditorDefaultOptions()

  /**
   * If true, the selections and potentially other values returned by the
   * instance will represent char counts instead of word counts.
   *
   * @var {boolean}
   */
  private _countChars = false

  /**
   * Creates a new ZuowenEditor instance attached to the anchorElement
   *
   * @param   {HTMLElement|string}  anchorElement   The anchor element (either a DOM node or an ID to be used with document.getElementById)
   * @param   {Object}          [cmOptions={}]  If no object is provided, the instance will be instantiated with default options.
   */
  constructor (
    anchorElement: HTMLElement | string,
    zwOptions: ZuowenEditorOptions) {
    super() // Set up the event emitter

    // Parse the anchorElement until we get something useful
    if (typeof anchorElement === 'string' && document.getElementById(anchorElement) !== null) {
      this._anchorElement = document.getElementById(anchorElement)
    } else if (anchorElement instanceof Element) {
      this._anchorElement = anchorElement
    } else {
      throw new Error(`Could not instantiate ZuowenEditor: anchorElement must be an ID or a DOM node (received: ${typeof anchorElement})`)
    }

    // Now, instantiate CodeMirror with the defaults
    // this._instance = CodeMirror.fromTextArea(this._anchorElement, this._cmOptions)
    this._instance = createEditor(this._anchorElement)

    // Register the readonly handler for editorble prop
    setEditorViewOptions(this._instance, zwOptions.prosemirror)

    void this._instance.create()

    // Immediately afterwards, set the new options passed to overwrite
    // this.setOptions(cmOptions)

    // Set the special CodeMirror-readonly class on the wrapper, because each
    // editor instance is readonly initially, and needs to be enabled
    // programmatically by setting MarkdownEditor::readonly = false.
    /*
    this._instance.getWrapperElement().classList.add('CodeMirror-readonly')
    */

    // Indicate interactive elements while either the Command or Control-key is
    // held down.
    /*
    document.addEventListener('keydown', (event) => {
      const cmd = process.platform === 'darwin' && event.metaKey
      const ctrl = process.platform !== 'darwin' && event.ctrlKey

      if (!cmd && !ctrl) {
        return
      }

      const wrapper = this._instance.getWrapperElement()
      const elements = wrapper.querySelectorAll('.cma, .cm-zkn-link, .cm-zkn-tag')

      elements.forEach(element => {
        element.classList.add('meta-key')
      })
    })
    */

    // And don't forget to remove the classes again
    /*
    document.addEventListener('keyup', (event) => {
      if (![ 'Meta', 'Control' ].includes(event.key)) {
        return // Not the right released key
      }

      const wrapper = this._instance.getWrapperElement()
      const elements = wrapper.querySelectorAll('.cma, .cm-zkn-link, .cm-zkn-tag')

      elements.forEach(element => {
        element.classList.remove('meta-key')
      })
    })
    */

    // Propagate necessary events to the master process
    /*
    this._instance.on('change', (cm, changeObj) => {
      this.emit('change', changeObj)
    })

    this._instance.on('cursorActivity', (cm) => {
      this.emit('cursorActivity')
    })

    this._instance.on('mousedown', (cm, event) => {
      // Open links on both Cmd and Ctrl clicks - otherwise stop handling event
      if (process.platform === 'darwin' && !event.metaKey) return true
      if (process.platform !== 'darwin' && !event.ctrlKey) return true

      let cursor = this._instance.coordsChar({ left: event.clientX, top: event.clientY })
      let tokenInfo = this._instance.getTokenAt(cursor)

      if (tokenInfo.type === null) {
        return true
      }

      let tokenList = tokenInfo.type.split(' ')

      if (tokenList.includes('zkn-link')) {
        event.preventDefault()
        event.codemirrorIgnore = true
        this.emit('zettelkasten-link', tokenInfo.string)
      } else if (tokenList.includes('zkn-tag')) {
        event.preventDefault()
        event.codemirrorIgnore = true
        this.emit('zettelkasten-tag', tokenInfo.string)
      }
    })
    */

    // Display a context menu if appropriate
    /*
    this._instance.getWrapperElement().addEventListener('contextmenu', (event) => {
      const shouldSelectWordUnderCursor = displayContextMenu(event, this._instance.isReadOnly(), (command) => {
        switch (command) {
          case 'cut':
          case 'copy':
          case 'paste':
            // NOTE: We do not send selectAll to main albeit there is such a command
            // because in the specific case of CodeMirror this results in unwanted
            // behaviour.
            // Needs to be issued from main on the holding webContents
            ipcRenderer.send('window-controls', { command: command })
            break
          case 'pasteAsPlain':
            this.pasteAsPlainText()
            break
          case 'copyAsHTML':
            this.copyAsHTML()
            break
          default:
            this._instance.execCommand(command)
            break
        }
        // In any case, re-focus the editor, either for cut/copy/paste to work
        // or to resume working afterwards
        this._instance.focus()
      }, (wordToReplace) => {
        // Simply replace the selection with the given word
        this._instance.replaceSelection(wordToReplace)
      })

      // If applicable, select the word under cursor
      if (shouldSelectWordUnderCursor) {
        this._instance.execCommand('selectWordUnderCursor')
      }
    })
    */

    /*
    // Listen to updates from the assets provider
    ipcRenderer.on('assets-provider', (event, which) => {
      if (which === 'snippets-updated') {
        // The snippet list has been updated, so we must reflect this.
        this.updateSnippetAutocomplete().catch(err => console.error(err))
      }
    })

    // Initial retrieval of snippets
    this.updateSnippetAutocomplete().catch(err => console.error(err))
    */
  } // END CONSTRUCTOR

  // SEARCH FUNCTIONALITY
  searchNext (term: string): void {
    // searchNext(this._instance, term)
  }

  searchPrevious (term: string): void {
    // searchPrevious(this._instance, term)
  }

  replaceNext (term: string, replacement: string): void {
    // replaceNext(this._instance, term, replacement)
  }

  replacePrevious (term: string, replacement: string): void {
    // replacePrevious(this._instance, term, replacement)
  }

  replaceAll (term: string, replacement: string): void {
    // replaceAll(this._instance, term, replacement)
  }

  stopSearch (): void {
    // stopSearch()
  }

  /**
   * Pastes the clipboard contents as plain text, regardless of any formatted
   * text present.
   */
  pasteAsPlainText (): void {
  /*
    let plainText = clipboard.readText()

    // Simple programmatical paste.
    if (plainText.length > 0) {
      this._instance.replaceSelection(plainText)
    }
  */
  }

  /**
   * Copies the current editor contents into the clipboard as HTML
   */
  copyAsHTML (): void {
  /*
    if (!this._instance.somethingSelected()) return
    let md = this._instance.getSelections().join(' ')
    let html = md2html(md)
    // Write both the HTML and the Markdown
    // (as fallback plain text) to the clipboard
    clipboard.write({ 'text': md, 'html': html })
  */
  }

  /**
   * Small function that jumps to a specific line in the editor.
   *
   * @param  {Number} line The line to pull into view
   */
  /*
  jtl (line) {
    const { from, to } = this._instance.getViewport()
    const viewportSize = to - from
    // scrollIntoView first and foremost pulls something simply into view, but
    // we want it to be at the top of the window as expected by the user, so
    // we need to pull in a full viewport, beginning at the corresponding line
    // and expanding unto one full viewport size.
    let lastLine = line + viewportSize

    // CodeMirror will not sanitise the viewport size.
    if (lastLine >= this._instance.doc.lineCount()) {
      lastLine = this._instance.doc.lineCount() - 1
    }

    this._instance.scrollIntoView({
      from: {
        line: line,
        ch: 0
      },
      to: {
        line: lastLine,
        ch: 0
      }
    })
  }
  */

  /**
   * Sets the current options with a new options object, which will be merged
   */
  setOptions (newOptions: ZuowenEditorOptions): void {
    // Before actually merging the options, we have to detect changes in the
    // rendering preferences.
    let shouldRemoveMarkers = false

    // If one of these options has changed from true to false, remove all
    // markers below and have the remaining markers re-rendered afterwards.
    const oldOpt = this._mdOptions.zettlr?.render
    const newOpt = newOptions.zettlr?.render

    if (typeof oldOpt !== 'undefined' && typeof newOpt !== 'undefined') {
      let key: keyof typeof oldOpt
      for (key in oldOpt) {
        if (!(key in (newOpt ?? {}))) {
          continue
        }

        if ((oldOpt[key] ?? false) && !(newOpt[key] ?? false)) {
          shouldRemoveMarkers = true
          break
        }
      }
    }

    if (shouldRemoveMarkers) {
      // If shouldRemoveMarkers is true, one of the rendering options has been
      // disabled, so we must remove all markers and then re-render only those
      // that should still be displayed.
      /*
      const markers = this._instance.doc.getAllMarks()
      for (const marker of markers) {
        marker.clear()
      }
      */
    }

    // Now, we can safely merge the options
    this._mdOptions = safeAssign(newOptions, this._mdOptions)

    // Next, set all options on the CodeMirror instance. This will internally
    // fire all necessary events, apart from those we need to fire manually.
    setEditorViewOptions(this._instance, this._mdOptions.prosemirror)
  }

  /**
   * Returns an option with the given name
   *
   * @param   {String}  name  The name of the key to request
   *
   * @return  {Mixed}         The value of the key
   */
  /*
  getOption (name) {
    return this._cmOptions[name]
  }
  */

  /**
   * Swaps the current editting Document with a new one
   *
   * @param   {WorkingDocState}   newDoc    The new editting document instance
   *
   * @return  {WorkingDocState | undefined} The previous editting document instance
   */
  swapDoc (newDoc: WorkingDocState | string): WorkingDocState {
    let newState: EditorState | null | undefined

    if (typeof newDoc === 'string') {
      newState = this._instance.action((ctx) => {
        const parser = ctx.get(parserCtx)
        const doc = parser(newDoc)
        if (doc == null) return
        const schema = ctx.get(schemaCtx)
        const view = ctx.get(editorViewCtx)
        const state = view.state
        const plugins = state.plugins
        const options = ctx.get(editorStateOptionsCtx)
        return EditorState.create({
          schema,
          doc,
          plugins,
          ...options
        })
      })
    } else {
      newState = newDoc.editorState
    }

    const oldDoc = this._instance.action((ctx) => {
      const editorView = ctx.get(editorViewCtx)
      const oldState = editorView.state

      if (newState !== null) {
        editorView.updateState(newState as EditorState)
      }
      ctx.set(editorStateCtx, editorView.state)
      return { editorState: oldState }
    })

    this.focus()
    return oldDoc
  }

  /**
   * Update the working doc with new content.
   *
   * @param   {string}           content  the content to be updated
   *
   * @return  {WorkingDocState}           the Working document instance
   */
  updateDoc (content: string, workingState: WorkingDocState): WorkingDocState {
    const result = this._instance.action((ctx) => {
      const parser = ctx.get(parserCtx)
      let state = workingState?.editorState ?? null
      if (state === null) {
        state = ctx.get(editorViewCtx).state
      }
      const doc = parser(content)
      if (doc == null) return null
      // view.dispatch(state.tr.replace(0, state.doc.content.size, new Slice(doc.content, 0, 0)))
      const tr = state.tr.replace(0, state.doc.content.size, new Slice(doc.content, 0, 0))
      state = state.apply(tr)
      return { editorState: state, docChanged: tr.docChanged }
    })
    if (result === null) {
      return workingState
    } else {
      return result
    }
  }

  /**
   * Get the current working doc state
   *
   * @return  {WorkingDocState}
   */
  getDoc (): WorkingDocState {
    return this._instance.action((ctx) => {
      const editorState = ctx.get(editorViewCtx).state
      ctx.set(editorStateCtx, editorState)
      return { editorState }
    })
  }

  /**
   * Output doc content to markdown
   *
   * @param   {WorkingDocState}  docState  docState for output
   *
   * @return  {string}                     markdown string
   */
  toMarkdown (docState?: WorkingDocState): string {
    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
    if (docState !== undefined && docState.editorState !== null) {
      return toMarkdown(this._instance, docState.editorState)
    } else {
      return ''
    }
  }

  /**
   * Runs a command on the underlying milkdown instance
   */
  runCommand (cmd: string): void {
    // this._instance.execCommand(cmd)
  }

  /**
   * Issues a focus command to the underlying instance
   */
  focus (): void {
    this._instance.action((ctx) => {
      const editorView = ctx.get(editorViewCtx)

      editorView.focus()
    })
  }

  onChange (callback: (getMarkdown: () => string) => void): void {
    this._instance.config((ctx) => {
      ctx.update(listenerCtx, listener => {
        if (listener.markdown !== undefined) {
          listener.markdown.push(callback)
        } else {
          listener.markdown = [callback]
        }
        return listener
      })
    })
  }

  /**
   * Sets an autocomplete database of given type to a new value
   *
   * @param   {String}  type      The type of the database
   * @param   {Map<string, any>}  database  The show-hint-addon compatible database
   */
  setCompletionDatabase (type: string, database: Map<string, any>): void {
    // setAutocompleteDatabase(type, database)
  }

  /**
   * Updates the list of available snippets.
   */
  /*
  async updateSnippetAutocomplete () {
    const snippetList = await ipcRenderer.invoke('assets-provider', { command: 'list-snippets' })

    const snippetsDB = []

    for (const snippet of snippetList) {
      const content = await ipcRenderer.invoke('assets-provider', {
        command: 'get-snippet',
        payload: { name: snippet }
      })

      snippetsDB.push({
        displayText: snippet,
        text: content
      })
    }

    this.setCompletionDatabase('snippets', snippetsDB)
  }
  */

  /* * * * * * * * * * * *
   * GETTERS AND SETTERS *
   * * * * * * * * * * * */

  /**
   * This function builds a table of contents based on the editor contents
   *
   * @return {Array} An array containing objects with all headings
   */
  get tableOfContents (): any[] {
    // return generateTableOfContents(this.value)
    return []
  }

  /**
   * Returns info about the editor instance
   *
   * @return  {Object}  An object containing, e.g., words, chars, selections.
   */
  get documentInfo (): object {
    let ret = {
      'words': this.wordCount,
      'chars': this.charCount,
      'chars_wo_spaces': this.charCountWithoutSpaces,
      // 'cursor': Object.assign({}, this._instance.getCursor()),
      'cursor': {},
      'selections': []
    }

    /*
    if (this._instance.somethingSelected()) {
      // Write all selections into the file info object
      let selectionText = this._instance.getSelections()
      let selectionBounds = this._instance.listSelections()
      for (let i = 0; i < selectionText.length; i++) {
        ret.selections.push({
          'selectionLength': countWords(selectionText[i], this._countChars),
          'start': Object.assign({}, selectionBounds[i].anchor),
          'end': Object.assign({}, selectionBounds[i].head)
        })
      }
    }
    */

    return ret
  }

  /**
   * Should the editor return char counts instead of word counts where appropriate?
   *
   * @param   {boolean}  shouldCountChars  The value
   */
  set countChars (shouldCountChars) {
    this._countChars = shouldCountChars
  }

  /**
   * Returns whether the editor returns char counts in appropriate places.
   *
   * @return  {boolean}  Whether the editor counts chars or words.
   */
  get countChars (): boolean {
    return this._countChars
  }

  /**
   * Whether the editor is in fullscreen mode
   *
   * @return  {Boolean}  True if the editor option for fullScreen is set
   */
  /*
  get isFullscreen () {
    return this._cmOptions.fullScreen
  }
  */

  /**
   * Enters or exits the editor fullscreen mode
   *
   * @param   {Boolean}  shouldBeFullscreen  Whether the editor should be in fullscreen
   */
  /*
  set isFullscreen (shouldBeFullscreen) {
    this.setOptions({ 'fullScreen': shouldBeFullscreen })

    // Refresh to reflect the size changes
    this._instance.refresh()
  }
  */

  /**
   * Whether the editor is currently in typewriter
   *
   * @return  {Boolean}  True if typewriter mode is active
   */
  /*
  get hasTypewriterMode () {
    return this._cmOptions.zettlr.typewriterMode
  }
  */

  /**
   * Activates or deactivates typewriter mode
   *
   * @param   {Boolean}  shouldBeTypewriter  True or False
   */
  /*
  set hasTypewriterMode (shouldBeTypewriter) {
    this.setOptions({ 'zettlr': { 'typewriterMode': shouldBeTypewriter } })
  }
  */

  /**
   * Determines whether the editor is in distraction free mode
   *
   * @return  {boolean}  True or false
   */
  /*
  get distractionFree () {
    return this._cmOptions.fullScreen
  }
  */

  /**
   * Sets the editor into or out of distraction free
   *
   * @param   {boolean}  shouldBeFullscreen  Whether the editor should be in distraction free
   */
  /*
  set distractionFree (shouldBeFullscreen) {
    this.setOptions({ fullScreen: shouldBeFullscreen })

    if (this.distractionFree) {
      this._instance.getWrapperElement().classList.add('CodeMirror-fullscreen')
    } else {
      this._instance.getWrapperElement().classList.remove('CodeMirror-fullscreen')
    }
  }
  */

  /**
   * Returns whether or not the readability mode is currently active
   *
   * @return  {boolean}  True if the readability mode is active
   */
  /*
  get readabilityMode () {
    return this._readabilityMode
  }
  */

  /**
   * Sets the readability mode
   *
   * @param   {boolean}  shouldBeReadability  Whether or not the mode should be active
   */
  /*
  set readabilityMode (shouldBeReadability) {
    if (shouldBeReadability && !this._readabilityMode) {
      // Switch to readability
      this.setOptions({ 'mode': 'readability' })
      this._readabilityMode = true
    } else if (!shouldBeReadability && this._readabilityMode) {
      // Switch off from readability
      this.setOptions({ 'mode': this._currentDocumentMode })
      this._readabilityMode = false
    }
  }
  */

  /**
   * Whether the instance is currently readonly
   *
   * @return  {Boolean}  True if users cannot edit the contents
   */
  /*
  get readOnly () {
    return this._cmOptions.readOnly
  }
  */

  /**
   * Sets the readonly flag on the instance
   *
   * @param   {Boolean}  shouldBeReadonly  Whether the editor contents should be readonly
   */
  /*
  set readOnly (shouldBeReadonly) {
    // Make sure we only set readOnly if the state has changed to prevent any
    // lag due to the setOptions handler taking quite some time.
    if (this.readOnly === shouldBeReadonly) {
      return
    }

    this.setOptions({ readOnly: shouldBeReadonly })

    // Set a special class to indicate not that it's an empty document,
    // but rather that none is open atm
    if (shouldBeReadonly) {
      this._instance.getWrapperElement().classList.add('CodeMirror-readonly')
    } else {
      this._instance.getWrapperElement().classList.remove('CodeMirror-readonly')
    }
  }
  */

  /**
   * Returns the current contents of the editor
   *
   * @return  {String}  The editor contents
   */
  get value (): String {
    return this._instance.action((ctx) => {
      const editorView = ctx.get(editorViewCtx)
      const serializer = ctx.get(serializerCtx)
      return serializer(editorView.state.doc)
    })
  }

  /**
   * Returns the word count of the editor contents
   *
   * @return  {Number}  The word count
   */
  get wordCount (): number {
    // return countWords(this.value, false)
    return 0
  }

  /**
   * Returns the char count of the editor contents
   *
   * @return  {Number}  The number of characters
   */
  get charCount (): number {
    // return countWords(this.value, true)
    return 0
  }

  /**
   * Return the amount of characters without spaces
   *
   * @return  {Number}  The number of chars without spaces
   */
  get charCountWithoutSpaces (): number {
    // return countWords(this.value.replace(/ +/g, ''), true)
    return 0
  }

  /**
   * Returns the underlying milkdown instance
   *
   * @return  {mdEditor}  The milkdown instance
   */
  get milkdown (): mdEditor {
    return this._instance
  }
}

export { ZuowenEditor, WorkingDocState }
