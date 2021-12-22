/**
 * Author        : Ahmong
 * Date          : 2021-12-15 22:44
 * LastEditTime  : 2021-12-22 00:18
 * LastEditors   : Ahmong
 * License       : GNU GPL v3
 * ---
 * Description   : script of ZuowenEditor component.
 * ---
 */

import { defineComponent, nextTick } from 'vue'

import countWords from '../common/util/count-words'
import { ZuowenEditor, WorkingDocState } from '../common/modules/zuowen-editor'
// import CodeMirror from 'codemirror'
import objectToArray from '../common/util/object-to-array'
import { trans } from '../common/i18n-renderer'
import extractYamlFrontmatter from '../common/util/extract-yaml-frontmatter'
import YAML from 'yaml'
import { ZuowenEditorOptions } from '../common/modules/zuowen-editor/get-editor-options'

const ipcRenderer = (window as any).ipc as Electron.IpcRenderer

interface OpenDocInfo {
  path: string
  dir: string // Save the dir to distinguish memory-files from others
  workingDocState: WorkingDocState
  modified: boolean
  readOnly: boolean
  lastWordCount: number
  saveTimeout?: any
}

export default defineComponent({
  name: 'ZuowenEditor',
  components: {
  },
  props: {
  },
  data: function () {
    return {
      /**
       * The underline milkdown editor with ZuoWen Editor custom plugin.
       */
      // eslint-disable-next-line vue/no-reserved-keys
      _zwEditor: null as ZuowenEditor | null,

      editor: null,
      openDocuments: new Map<string, OpenDocInfo>(), // Contains all loaded documents if applicable
      currentlyFetchingFiles: [] as string[], // Contains the paths of files that are right now being fetched
      // Should we perform a regexp search?
      regexpSearch: false,
      showSearch: false, // Set to true to show the search box
      query: '', // Models the search value
      replaceString: '', // Models the replace string
      findTimeout: undefined as NodeJS.Timeout | undefined, // Holds a timeout so that not every single keypress results in a searchNext
      docInfoTimeout: undefined as NodeJS.Timeout | undefined, // Holds a timeout to not update the docInfo every millisecond
      // END: Search options
      // activeDocument: null as OpenDocInfo | null, // Almost like activeFile, only with additional info
      currentPath: '', // the path of activeFile
      anchor: undefined
    }
  },
  computed: {
    findPlaceholder: function () {
      return trans('dialog.find.find_placeholder')
    },
    replacePlaceholder: function () {
      return trans('dialog.find.replace_placeholder')
    },
    replaceNextLabel: function () {
      return trans('dialog.find.replace_next_label')
    },
    replaceAllLabel: function () {
      return trans('dialog.find.replace_all_label')
    },
    closeLabel: function () {
      return trans('dialog.find.close_label')
    },
    regexLabel: function () {
      return trans('dialog.find.regex_label')
    },
    activeFile: function () {
      return this.$store.state.activeFile
    },
    isMarkdown: function () {
      /*
      if (this.activeFile === null) {
        return true // By default, assume Markdown
      } else {
        return this.resolveMode(this.activeFile.ext) === 'multiplex'
      }
      */
      return true
    },
    openFiles: function () {
      return this.$store.state.openFiles
    },
    fontSize: function () {
      return this.$store.state.config['editor.fontSize']
    },
    shouldCountChars: function () {
      return this.$store.state.config['editor.countChars']
    },
    editorConfiguration: function (): ZuowenEditorOptions {
      // We update everything, because not so many values are actually updated
      // right after setting the new configurations. Plus, the user won't update
      // everything all the time, but rather do one initial configuration, so
      // even if we incur a performance penalty, it won't be noticed that much.
      return {
        zettlr: {
          indentUnit: this.$store.state.config['editor.indentUnit'],
          imagePreviewWidth: this.$store.state.config['display.imageWidth'],
          imagePreviewHeight: this.$store.state.config['display.imageHeight'],
          markdownBoldFormatting: this.$store.state.config['editor.boldFormatting'],
          markdownItalicFormatting: this.$store.state.config['editor.italicFormatting'],
          // eslint-disable-next-line @typescript-eslint/dot-notation
          // muteLines: this.$store.state.config['muteLines'],
          // citeStyle: this.$store.state.config['editor.citeStyle'],
          // readabilityAlgorithm: this.$store.state.config['editor.readabilityAlgorithm'],
          zettelkasten: {
            idRE: this.$store.state.config['zkn.idRE'],
            idGen: this.$store.state.config['zkn.idGen'],
            linkStart: this.$store.state.config['zkn.linkStart'],
            linkEnd: this.$store.state.config['zkn.linkEnd'],
            linkWithFilename: this.$store.state.config['zkn.linkWithFilename']
          },
          render: {
            iframes: this.$store.state.config['display.renderIframes'],
            images: this.$store.state.config['display.renderImages'],
            links: this.$store.state.config['display.renderLinks'],
            math: this.$store.state.config['display.renderMath'],
            tasks: this.$store.state.config['display.renderTasks'],
            headingTags: this.$store.state.config['display.renderHTags'],
            tables: this.$store.state.config['editor.enableTableHelper']
          }
        },
        prosemirror: {
          editable: () => {
            return !((this.openDocuments.get(this.currentPath)?.readOnly) ?? true)
          }
        }
      }
    },
    autoSave: function () {
      return this.$store.state.config['editor.autoSave']
    },
    tagDatabase: function () {
      return this.$store.state.tagDatabase
    },
    fsalFiles: function () {
      const tree = this.$store.state.fileTree
      const files = []

      for (const item of tree) {
        if (item.type === 'directory') {
          const contents = objectToArray(item, 'children').filter(descriptor => descriptor.type === 'file')
          files.push(...contents)
        } else if (item.type === 'file') {
          files.push(item)
        }
      }

      return files
    }
  },
  watch: {
    activeFile: function () {
      if (this._zwEditor === null) {
        console.error('Received a file update but the editor was not yet initiated!')
        return
      }

      if (this.activeFile === null) {
        console.log('activeFile switch to null')
        const oldDocInfo = this.openDocuments.get(this.currentPath)
        oldDocInfo !== undefined && (oldDocInfo.workingDocState = this._zwEditor.swapDoc(''))

        this.setCurrentDoc('')
        this.$store.commit('updateTableOfContents', this._zwEditor.tableOfContents)
        return
      }
      console.log('activeFile switch to: ' + String(this.activeFile.path))
      const newActiveDoc = this.openDocuments.get(this.activeFile.path)

      if (newActiveDoc !== undefined) {
        console.log('reuse opened file: ' + newActiveDoc.path)
        // Simply swap it
        const oldDocInfo = this.openDocuments.get(this.currentPath)
        oldDocInfo !== undefined && (oldDocInfo.workingDocState = this._zwEditor.swapDoc(newActiveDoc.workingDocState))

        this.setCurrentDoc(this.activeFile.path)
        this._zwEditor.setOptions({
          zettlr: { markdownImageBasePath: this.activeFile.dir }
        })
        // this.$store.commit('updateTableOfContents', this._zwEditor.tableOfContents)
        this.$store.commit('activeDocumentInfo', this._zwEditor.documentInfo)
      } else if (!this.currentlyFetchingFiles.includes(this.activeFile.path)) {
        console.log('try to fetch file content: ' + String(this.activeFile.path))
        // We have to request the document beforehand
        this.currentlyFetchingFiles.push(this.activeFile.path)
        const fetchingPath = this.activeFile.path
        ipcRenderer.invoke('application', { command: 'get-file-contents', payload: fetchingPath })
          .then((descriptorWithContent) => {
            console.log('file content returned: ' + String(descriptorWithContent.path))
            if (this._zwEditor !== null) {
              const curDocInfo = this.openDocuments.get(this.currentPath)
              curDocInfo !== undefined && (curDocInfo.workingDocState = this._zwEditor.getDoc())

              // parse the doc content as markdown string
              let parseError = false
              try {
                this._zwEditor.swapDoc(descriptorWithContent.content)
              } catch (e) {
                console.log('Parse from markdown string error...')
                console.error(e)
                this._zwEditor.swapDoc('')
                parseError = true
              }

              const newDoc: OpenDocInfo = {
                path: descriptorWithContent.path,
                dir: descriptorWithContent.dir, // Save the dir to distinguish memory-files from others
                workingDocState: this._zwEditor.getDoc(),
                modified: false,
                readOnly: parseError,
                lastWordCount: countWords(descriptorWithContent.content, this.shouldCountChars),
                saveTimeout: undefined // Only used below to save the saveTimeout
              }

              this.openDocuments.set(newDoc.path, newDoc)

              // Let's check whether the active file has in the meantime changed
              // If it has, don't overwrite the current one
              if (this.activeFile.path === descriptorWithContent.path) {
                console.log('same active file still there')
                this._zwEditor.setOptions({
                  zettlr: { markdownImageBasePath: this.activeFile.dir }
                })
                this.setCurrentDoc(newDoc.path)

                // this._zwEditor.swapDoc(newDoc.workingDocState)
                this.$store.commit('updateTableOfContents', this._zwEditor.tableOfContents)
                this.$store.commit('activeDocumentInfo', this._zwEditor.documentInfo)
              } else if (curDocInfo !== undefined) {
                console.log('active file has changed to: ' + String(this.activeFile.path) + '. Resume to current file')
                this._zwEditor.swapDoc(curDocInfo.workingDocState)
                this.setCurrentDoc(curDocInfo.path)
              }
            } else {
              console.log('_zwEditor is null now!!!')
            }
          })
          .catch(e => {
            console.log('Fetching file content error...')
            console.error(e)
          })
          .finally(() => {
            const idx = this.currentlyFetchingFiles.findIndex(e => e === fetchingPath)
            this.currentlyFetchingFiles.splice(idx, 1)
          })
      } else {
        // Else: The file might currently being fetched, so let's wait ...
        console.log('file has been in fetching queue: %s', this.currentlyFetchingFiles.toString())
      }
    },
    openFiles: function () {
      // The openFiles array in the store has changed --> remove all documents
      // that are not present anymore
      for (const key in this.openDocuments.keys) {
        if (undefined === this.openFiles.find(descriptor => descriptor.path === key)) {
          // Remove the document from our array
          this.openDocuments.delete(key)
        }
      }
    },
    query: function () {
      // Make sure to switch the regexp search depending on the search input
      const isRegexp = /^\/.+\/[gimy]{0,4}$/.test(this.query)
      if (isRegexp && !this.regexpSearch) {
        this.regexpSearch = true
      } else if (!isRegexp && this.regexpSearch) {
        this.regexpSearch = false
      }

      // Begin a search
      if (this.findTimeout !== undefined) {
        clearTimeout(this.findTimeout)
        this.findTimeout = undefined
      }

      if (this.regexpSearch) {
        // Don't automatically start a search b/c certain expressions will crash
        // the process (such as searching for /.*/ in a large document)
        return
      }

      this.findTimeout = setTimeout(() => {
        this.searchNext()
        this.findTimeout = undefined
      }, 1000)
    },
    showSearch: function (newValue, oldValue) {
      if (newValue === true && oldValue === false) {
        // The user activated search, so focus the input and run a search (if
        // the query wasnt' empty)
        nextTick()
          .then(() => {
            (this.$refs['search-input'] as HTMLElement).focus()
            this.searchNext()
          })
          .catch(err => console.error(err))
      } else if (newValue === false) {
        // Always "stopSearch" if the input is not shown, since this will clear
        // out, e.g., the matches on the scrollbar
        this._zwEditor?.stopSearch()
      }
    },
    shouldCountChars: function (newVal, oldVal) {
      (this._zwEditor != null) && (this._zwEditor.countChars = newVal)
    }
  },
  mounted: function () {
    // As soon as the component is mounted, initiate the editor
    this._zwEditor = new ZuowenEditor(this.$refs.editorarea as HTMLElement, this.editorConfiguration)

    // We have to set this to the appropriate value after mount, afterwards it
    // will be updated as appropriate.
    this._zwEditor.countChars = this.shouldCountChars

    // Listen to change events on the doc, because if the user pastes
    // more than ten words at once, we need to substract it to not
    // mess with the word count.
    this._zwEditor.onChange((getMarkdown) => {
      const newTextWords = countWords(getMarkdown(), this.shouldCountChars)
      if (newTextWords > 10) {
        const curDocInfo = this.openDocuments.get(this.currentPath)
        curDocInfo !== undefined && (curDocInfo.lastWordCount = countWords(getMarkdown(), this.shouldCountChars))
      }
    })

    // Implement autosaving
    this._zwEditor.onChange((_) => {
      // Do not attempt to autosave if it's off or we're dealing with an in-memory file.
      if (this.autoSave === 'off' || this.currentPath.length > 0) {
        return
      }

      const curDocInfo = this.openDocuments.get(this.currentPath)
      if (curDocInfo !== undefined && curDocInfo.dir !== ':memory:') {
        if (curDocInfo.saveTimeout !== undefined) {
          clearTimeout(curDocInfo.saveTimeout)
          curDocInfo.saveTimeout = undefined
        }

        // Even "immediately" doesn't save RIGHT after you have typed a
        // character. Rather, we take a 250ms window so that the filesystem
        // won't be too stressed. This should still feel very immediate to
        // the user, since the file will more or less be saved once they
        // stop typing.
        const delay = (this.autoSave === 'immediately') ? 250 : 5000

        curDocInfo.saveTimeout = setTimeout(() => {
          this.save(curDocInfo).catch(e => console.error(e))
          curDocInfo.saveTimeout = undefined
        }, delay)
      }
    })

    // Update the document info on corresponding events
    this._zwEditor.onChange((_) => {
      // Announce that the file is modified (if applicable) to the whole application
      const curDocInfo = this.openDocuments.get(this.currentPath)
      if (curDocInfo !== undefined) {
        this.$store.commit('announceModifiedFile', {
          filePath: curDocInfo.path,
          isClean: !curDocInfo.modified
        })
      }
      // Todo: 延迟一段时间再更新 TOC
      this.$store.commit('updateTableOfContents', this._zwEditor?.tableOfContents)
    })

    /*
    this._zwEditor.on('cursorActivity', () => {
      // Don't update every keystroke to not run into performance problems with
      // very long documents, since calculating the word count needs considerable
      // time, and without the delay, typing seems "laggy".
      this.maybeUpdateActiveDocumentInfo()
    })
    */

    this._zwEditor.on('zettelkasten-link', (linkContents) => {
      ipcRenderer.invoke('application', {
        command: 'force-open',
        payload: linkContents
      })
        .catch(err => console.error(err))

      if (global.config.get('zkn.autoSearch') === true) {
        (this.$root as any).startGlobalSearch(linkContents)
      }
    })

    this._zwEditor.on('zettelkasten-tag', (tag) => {
      (this.$root as any).startGlobalSearch(tag)
    })

    // Listen to shortcuts from the main process
    ipcRenderer.on('shortcut', (event, shortcut) => {
      if (shortcut === 'save-file' && this.currentPath.length > 0) {
        const curDocInfo = this.openDocuments.get(this.currentPath)
        curDocInfo !== undefined && (this.save(curDocInfo).catch(e => console.error(e)))
      } else if (shortcut === 'copy-as-html') {
        this._zwEditor?.copyAsHTML()
      } else if (shortcut === 'paste-as-plain') {
        this._zwEditor?.pasteAsPlainText()
      } else if (shortcut === 'search') {
        this.showSearch = !this.showSearch
      }
    })

    ipcRenderer.on('open-file-changed', (event, fileDescriptor) => {
      // This event is emitted by the main process if the user wants to exchange
      // a file with remote changes. It already ships with the file descriptor
      // so all we have to do is find the right file and just swap the contents.
      // We don't need to update anything else, since that has been updated in
      // the application's store already by the time this event arrives.
      const doc = this.openDocuments.get(fileDescriptor.path)

      if (doc !== undefined) {
        // const cur = Object.assign({}, doc.cmDoc.getCursor())
        if (this._zwEditor !== undefined) {
          const result = this._zwEditor?.updateDoc(fileDescriptor.content, doc.workingDocState) ?? null
          if (result !== null) {
            doc.workingDocState = result
          }
        }
        nextTick()
          .then(() => {
            // Wait a little bit for the unwanted modification-events to emit and
            // then immediately revert that status again.
            /*
            doc.cmDoc.markClean()
            doc.cmDoc.setCursor(cur)
            */
            this.$store.commit('announceModifiedFile', {
              filePath: doc.path,
              isClean: true
            })
          })
          .catch(err => console.error(err))
      }
    })

    ipcRenderer.on('save-documents', (event, pathList = []) => {
      // If this event gets emitted, the main process wants
      // some open and modified documents to be saved.
      if (pathList.length === 0) {
        pathList = [...this.openDocuments.keys()]
      }

      const docsToSave = [...this.openDocuments.values()].filter(doc => pathList.includes(doc.path))

      let promises = [] as Array<Promise<void>>
      for (const doc of docsToSave) {
        promises.push(this.save(doc))
      }
      void Promise.all(promises)
    })
  },
  methods: {
    setCurrentDoc (curPath: string): void {
      this.currentPath = curPath
      this._zwEditor?.swapDoc(this.openDocuments.get(this.currentPath)?.workingDocState ?? '')
    },
    maybeUpdateActiveDocumentInfo () {
      if (this.docInfoTimeout !== undefined) {
        return // There will be an update soon enough.
      }

      this.docInfoTimeout = setTimeout(() => {
        this.$store.commit('activeDocumentInfo', this._zwEditor?.documentInfo)
        this.docInfoTimeout = undefined
      }, 1000)
    },
    /*
    jtl (lineNumber) {
      if (this._zwEditor !== null) {
        this._zwEditor.jtl(lineNumber)
      }
    },
    */
    /**
     * Resolves a file extension to a valid CodeMirror mode
     *
     * @param   {string}  ext  The file extension (with leading dot!)
     *
     * @return  {string}       The corresponding CodeMirror mode. Defaults to multiplex
     */
    /*
    resolveMode (ext: string): string {
      switch (ext) {
        case '.tex':
          return 'stex'
        case '.yaml':
        case '.yml':
          return 'yaml'
        case '.json':
          return 'javascript'
        default:
          return 'multiplex'
      }
    },
    */
    async save (doc: OpenDocInfo) {
      if (!doc.modified) {
        return // Nothing to save
      }

      const newContents = this._zwEditor?.toMarkdown(doc.workingDocState) ?? ''
      const currentWordCount = countWords(newContents, this.shouldCountChars)
      const descriptor = {
        path: doc.path,
        newContents: newContents,
        offsetWordCount: currentWordCount - doc.lastWordCount
      }

      doc.lastWordCount = currentWordCount

      const result = await ipcRenderer.invoke('application', {
        command: 'file-save',
        payload: descriptor
      })

      if (result !== true) {
        console.error('Retrieved a falsy result from main, indicating an error with saving the file.')
        return
      }

      // Everything worked out, so clean up
      this.$store.dispatch('regenerateTagSuggestions').catch(e => console.error(e))
      this.$store.commit('announceModifiedFile', {
        filePath: doc.path,
        isClean: !doc.modified
      })

      // Saving can additionally do some changes to the files which are relevant
      // to the autocomplete, so make sure to update that as well. See #2330
      this.updateFileDatabase()
    },
    updateFileDatabase () {
      const fileDatabase = new Map<string, any>()

      for (let file of this.fsalFiles) {
        let fname = file.name.substr(0, file.name.lastIndexOf('.')) as string
        let displayText = fname // Fallback: Only filename
        /*
        if ('frontmatter' in file && file.frontmatter !== null && file.frontmatter.title !== undefined) {
          // (Else) if there is a frontmatter, use that title
          displayText = file.frontmatter.title
        } else if (Boolean(this.$store.state.config['display.useFirstHeadings']) && file.firstHeading != null) {
          // The user wants to use first headings as fallbacks
          displayText = file.firstHeading
        }
        */
        displayText = file.frontmatter?.title ?? ''
        if ((displayText.length === 0) &&
          Boolean(this.$store.state.config['display.useFirstHeadings']) &&
          file.firstHeading != null) {
          displayText = file.firstHeading
        }

        if (file.id !== '') {
          displayText = `${file.id as string}: ${displayText}`
        }

        fileDatabase.set(fname, {
          // Use the ID, if given, or the filename
          'text': (file.id !== '') ? file.id : fname,
          'displayText': displayText,
          'id': file.id
        })
      }

      this._zwEditor?.setCompletionDatabase('files', fileDatabase)
    },
    toggleQueryRegexp () {
      const isRegexp = /^\/.+\/[gimy]{0,4}$/.test(this.query.trim())

      if (isRegexp) {
        const match = /^\/(.+)\/[gimy]{0,4}$/.exec(this.query.trim())
        if (match !== null) {
          this.query = match[1]
        }
      } else {
        this.query = `/${this.query}/`
      }
    },
    executeCommand (cmd: string) {
      // Executes a markdown command on the editor instance
      this._zwEditor?.runCommand(cmd)
      this._zwEditor?.focus()
    },
    // SEARCH FUNCTIONALITY BLOCK
    searchNext () {
      // Make sure to clear out a timeout to prevent Zettlr from auto-searching
      // again after the user deliberately searched by pressing Enter.
      if (this.findTimeout !== undefined) {
        clearTimeout(this.findTimeout)
        this.findTimeout = undefined
      }

      this._zwEditor?.searchNext(this.query)
    },
    searchPrevious () {
      this._zwEditor?.searchPrevious(this.query)
    },
    replaceNext () {
      this._zwEditor?.replaceNext(this.query, this.replaceString)
    },
    replacePrevious () {
      this._zwEditor?.replacePrevious(this.query, this.replaceString)
    },
    replaceAll () {
      this._zwEditor?.replaceAll(this.query, this.replaceString)
    },
    /**
     * Scrolls the editor according to the value if the user scrolls left of the
     * .CodeMirror-scroll element
     *
     * @param   {WheelEvent}  event  The mousewheel event
     */
    onEditorScroll (event: WheelEvent) {
      if (event.target !== this.$refs.editor) {
        return // Only handle if the event's target is the editor itself
      }

      const scroller = (this.$refs.editor as HTMLElement).querySelector('.CodeMirror-scroll')

      if (scroller !== null) {
        scroller.scrollTop += event.deltaY
      }
    },
    /**
     * Triggers when the user presses any mouse button
     *
     * @param   {MouseEvent}  event  The mouse event
     */
    editorMousedown (event: MouseEvent) {
      /*
      // start selecting lines only if we are on the left margin and the left mouse button is pressed
      if (event.target !== this.$refs.editor || event.button !== 0) {
        return
      }

      // set the start point of the selection to be where the mouse was clicked
      this.anchor = this._zwEditor.codeMirror.coordsChar({ left: event.pageX, top: event.pageY })
      this._zwEditor.codeMirror.setSelection(this.anchor)
      */
    },

    editorMousemove (event: MouseEvent) {
      /*
      if (this.anchor === undefined) {
        return
      }
      // get the point where the mouse has moved
      const addPoint = this._zwEditor.codeMirror.coordsChar({ left: event.pageX, top: event.pageY })
      // use the original start point where the mouse first was clicked
      // and change the end point to where the mouse has moved so far
      this._zwEditor.codeMirror.setSelection(this.anchor, addPoint)
      */
    },
    /**
     * Triggers when the user releases any mouse button
     *
     * @param   {MouseEvent}  event  The mouse event
     */
    editorMouseup (event: MouseEvent) {
      /*
      if (this.anchor === undefined) {
        // This event gets also fired when someone, e.g., wants to edit an image
        // caption, so we must explicitly check if we are currently in a left-
        // side selection event, and if we aren't, don't do anything.
        return
      }

      // when the mouse is released, set anchor to undefined to stop adding lines
      this.anchor = undefined
      // Also, make sure the editor is focused.
      this._zwEditor?.focus()
      */
    },
    addKeywordsToFile (keywords: string) {
      // Split the contents of the editor into frontmatter and contents, then
      // add the keywords to the frontmatter, slice everything back together
      // and then overwrite the editor's contents.
      const curDocInfo = this.openDocuments.get(this.currentPath)
      if (curDocInfo === undefined) return

      let { frontmatter, content } = extractYamlFrontmatter(
        this._zwEditor?.toMarkdown(curDocInfo.workingDocState) ?? '') // NOTE: We can keep the linefeed to \n since CodeMirror is set to ALWAYS use \n

      let postFrontmatter = '\n'
      if (frontmatter !== null) {
        if ('keywords' in frontmatter) {
          frontmatter.keywords = frontmatter.keywords.concat(keywords)
        } else if ('tags' in frontmatter) {
          frontmatter.tags = frontmatter.tags.concat(keywords)
        } else {
          frontmatter.keywords = keywords
        }
      } else {
        // Frontmatter was null, so create one
        frontmatter = {}
        frontmatter.keywords = keywords
        postFrontmatter += '\n' // Make sure if we're now ADDING a frontmatter to space it from the content
      }

      // Glue it back together and set it as content
      if (this._zwEditor !== null) {
        this._zwEditor.updateDoc(
          '---\n' + YAML.stringify(frontmatter) + '---' + postFrontmatter + content,
          curDocInfo.workingDocState
        )
      }
    }
  }
})
