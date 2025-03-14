<template>
  <div id="custom-css">
    <p id="custom-css-info" v-html="customCSSInfo"></p>
    <CodeEditor
      ref="code-editor"
      v-model="css"
      v-bind:mode="'css'"
    ></CodeEditor>
    <ButtonControl
      v-bind:primary="true"
      v-bind:label="saveButtonLabel"
      v-bind:inline="true"
      v-on:click="handleClick('save')"
    ></ButtonControl>
    <span v-if="savingStatus !== ''" class="saving-status">{{ savingStatus }}</span>
  </div>
</template>

<script>
/**
 * @ignore
 * BEGIN HEADER
 *
 * Contains:        CustomCSS
 * CVM-Role:        View
 * Maintainer:      Hendrik Erz
 * License:         GNU GPL v3
 *
 * Description:     Entry point app component for the Custom CSS editor.
 *
 * END HEADER
 */

import { trans } from '../common/i18n-renderer'
import CodeEditor from '../common/vue/CodeEditor'
import ButtonControl from '../common/vue/form/elements/Button'

const ipcRenderer = window.ipc

export default {
  name: 'CustomCSS',
  components: {
    CodeEditor,
    ButtonControl
  },
  data: function () {
    return {
      customCSSTitle: trans('dialog.custom_css.title'),
      customCSSInfo: trans('dialog.custom_css.info'),
      css: '',
      savingStatus: ''
    }
  },
  computed: {
    statusbarControls: function () {
      return [
        {
          type: 'button',
          label: trans('dialog.button.save'),
          id: 'save',
          icon: '',
          buttonClass: 'primary' // It's a primary button
        },
        {
          type: 'button',
          label: trans('dialog.button.cancel'),
          id: 'cancel',
          icon: ''
        }
      ]
    },
    saveButtonLabel: function () {
      return trans('dialog.button.save')
    }
  },
  watch: {
    css: function () {
      if (this.$refs['code-editor'].isClean() === true) {
        this.savingStatus = ''
      } else {
        this.savingStatus = trans('gui.assets_man.status.unsaved_changes')
      }
    }
  },
  created: function () {
    ipcRenderer.invoke('css-provider', {
      command: 'get-custom-css'
    })
      .then(css => {
        this.css = css
      })
      .catch(e => console.error(e))
  },
  mounted: function () {
    ipcRenderer.on('shortcut', (event, shortcut) => {
      if (shortcut === 'save-file') {
        this.handleClick('save')
      }
    })
  },
  methods: {
    handleClick: function (controlID) {
      if (controlID === 'save') {
        this.savingStatus = trans('gui.assets_man.status.saving')
        ipcRenderer.invoke('css-provider', {
          command: 'set-custom-css',
          css: this.css
        })
          .then(() => {
            this.savingStatus = ''
          })
          .catch(e => {
            this.savingStatus = trans('gui.assets_man.status.save_error')
            console.error(e)
          })
      }
    }
  }
}
</script>

<style lang="less">
div#custom-css {
  overflow: auto; // Enable scrolling, if necessary
  padding: 10px;
  width: 100vw;
}

p#custom-css-info {
  margin-bottom: 20px;
}
</style>
