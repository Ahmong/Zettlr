<template>
  <SplitView
    v-bind:initial-size-percent="[ 20, 80 ]"
    v-bind:minimum-size-percent="[ 20, 20 ]"
    v-bind:split="'horizontal'"
    v-bind:initial-total-width="100"
  >
    <template #view1>
      <SelectableList
        v-bind:items="availableSnippets"
        v-bind:selected-item="currentItem"
        v-bind:editable="true"
        v-on:select="currentItem = $event"
        v-on:add="addSnippet()"
        v-on:remove="removeSnippet()"
      ></SelectableList>
    </template>
    <template #view2>
      <div style="padding: 10px;">
        <p>{{ snippetsExplanation }}</p>

        <p>
          <TextControl
            v-model="currentSnippetText"
            v-bind:inline="true"
            v-bind:disabled="currentItem < 0"
          ></TextControl>
          <ButtonControl
            v-bind:label="renameSnippetLabel"
            v-bind:inline="true"
            v-bind:disabled="availableSnippets.length === 0 || currentSnippetText === availableSnippets[currentItem]"
            v-on:click="renameSnippet()"
          ></ButtonControl>
        </p>

        <CodeEditor
          ref="code-editor"
          v-model="editorContents"
          v-bind:mode="'markdown-snippets'"
          v-bind:readonly="currentItem < 0"
        ></CodeEditor>

        <ButtonControl
          v-bind:primary="true"
          v-bind:label="saveButtonLabel"
          v-bind:inline="true"
          v-bind:disabled="currentItem < 0 || $refs['code-editor'].isClean()"
          v-on:click="saveSnippet()"
        ></ButtonControl>
        <span v-if="savingStatus !== ''" class="saving-status">{{ savingStatus }}</span>
      </div>
    </template>
  </SplitView>
</template>

<script>
/**
 * @ignore
 * BEGIN HEADER
 *
 * Contains:        Defaults
 * CVM-Role:        View
 * Maintainer:      Hendrik Erz
 * License:         GNU GPL v3
 *
 * Description:     This is the defaults file editor view. It allows users to
 *                  modify the provided defaults files.
 *
 * END HEADER
 */

import SplitView from '../common/vue/window/SplitView'
import SelectableList from '../common/vue/form/elements/SelectableList'
import ButtonControl from '../common/vue/form/elements/Button.vue'
import TextControl from '../common/vue/form/elements/Text.vue'
import CodeEditor from '../common/vue/CodeEditor'
import { trans } from '../common/i18n-renderer'

const ipcRenderer = window.ipc

export default {
  name: 'SnippetsTab',
  components: {
    SplitView,
    SelectableList,
    CodeEditor,
    ButtonControl,
    TextControl
  },
  data: function () {
    return {
      currentItem: -1,
      currentSnippetText: '',
      editorContents: '',
      savingStatus: '',
      availableSnippets: []
    }
  },
  computed: {
    saveButtonLabel: function () {
      return trans('dialog.button.save')
    },
    renameSnippetLabel: function () {
      return trans('dialog.snippets.rename')
    },
    snippetsExplanation: function () {
      return trans('dialog.snippets.explanation')
    }
  },
  watch: {
    currentItem: function (newValue, oldValue) {
      this.loadState()
    },
    editorContents: function () {
      if (this.$refs['code-editor'].isClean() === true) {
        this.savingStatus = ''
      } else {
        this.savingStatus = trans('gui.assets_man.status.unsaved_changes')
      }
    }
  },
  created: function () {
    this.updateAvailableSnippets()
  },
  mounted: function () {
    ipcRenderer.on('shortcut', (event, shortcut) => {
      if (shortcut === 'save-file') {
        this.saveSnippet()
      }
    })
  },
  methods: {
    updateAvailableSnippets: function (selectAfterUpdate = undefined) {
      ipcRenderer.invoke('assets-provider', { command: 'list-snippets' })
        .then(data => {
          this.availableSnippets = data
          if (typeof selectAfterUpdate === 'string' && this.availableSnippets.includes(selectAfterUpdate) === true) {
            this.currentItem = this.availableSnippets.indexOf(selectAfterUpdate)
          }
          this.loadState()
        })
        .catch(err => console.error(err))
    },
    loadState: function () {
      if (this.availableSnippets.length === 0) {
        this.editorContents = ''
        this.$refs['code-editor'].markClean()
        this.savingStatus = ''
        this.currentSnippetText = ''
        this.currentItem = -1
        return // No state to load, only an error to avoid
      }

      if (this.currentItem >= this.availableSnippets.length) {
        this.currentItem = this.availableSnippets.length - 1
      } else if (this.currentItem < 0) {
        this.currentItem = 0
      }

      ipcRenderer.invoke('assets-provider', {
        command: 'get-snippet',
        payload: {
          name: this.availableSnippets[this.currentItem]
        }
      })
        .then(data => {
          this.editorContents = data
          this.$refs['code-editor'].markClean()
          this.savingStatus = ''
          this.currentSnippetText = this.availableSnippets[this.currentItem]
        })
        .catch(err => console.error(err))
    },
    saveSnippet: function () {
      this.savingStatus = trans('gui.assets_man.status.saving')

      ipcRenderer.invoke('assets-provider', {
        command: 'set-snippet',
        payload: {
          name: this.availableSnippets[this.currentItem],
          contents: this.editorContents
        }
      })
        .then(() => {
          this.savingStatus = trans('gui.assets_man.status.saved')
          setTimeout(() => {
            this.savingStatus = ''
          }, 1000)
        })
        .catch(err => console.error(err))
    },
    addSnippet: function () {
      // Adds a snippet with empty contents and a generic default name
      const newName = this.ensureUniqueName('snippet')

      ipcRenderer.invoke('assets-provider', {
        command: 'set-snippet',
        payload: {
          name: newName,
          contents: ''
        }
      })
        .then(() => { this.updateAvailableSnippets(newName) })
        .catch(err => console.error(err))
    },
    removeSnippet: function () {
      // Remove the current snippet.
      ipcRenderer.invoke('assets-provider', {
        command: 'remove-snippet',
        payload: { name: this.availableSnippets[this.currentItem] }
      })
        .then(() => { this.updateAvailableSnippets() })
        .catch(err => console.error(err))
    },
    renameSnippet: function () {
      let newVal = this.currentSnippetText

      // Sanitise the name
      newVal = newVal.replace(/[^a-zA-Z0-9_-]/g, '-')

      newVal = this.ensureUniqueName(newVal)

      ipcRenderer.invoke('assets-provider', {
        command: 'rename-snippet',
        payload: {
          name: this.availableSnippets[this.currentItem],
          newName: newVal
        }
      })
        .then(() => { this.updateAvailableSnippets(newVal) })
        .catch(err => console.error(err))
    },
    /**
     * Ensures that the given name candidate describes a unique snippet filename
     *
     * @param   {string}  candidate  The candidate's name
     *
     * @return  {string}             The candidate's name, with a number suffix (-X) if necessary
     */
    ensureUniqueName: function (candidate) {
      if (this.availableSnippets.includes(candidate) === false) {
        return candidate // No duplicate detected
      }

      let count = 1
      const match = /-(\d+)$/.exec(candidate)

      if (match !== null) {
        // The candidate name already ends with a number-suffix --> extract it
        count = parseInt(match[1], 10)
        candidate = candidate.substr(0, candidate.length - match[1].length - 1)
      }

      while (this.availableSnippets.includes(candidate + '-' + count) === true) {
        count++
      }

      return candidate + '-' + count
    }
  }
}
</script>

<style lang="less">
//
</style>
