<!--
 * Author        : Ahmong
 * Date          : 2021-12-12 20:00
 * LastEditTime  : 2021-12-20 01:10
 * LastEditors   : Ahmong
 * License       : GNU GPL v3
 * ---
 * Description   : The Vue component displays a ZuoWen Editor. It uses the
 *                 HuiwenEditor class to implement the working editor.
 * ---
-->
<template>
  <div
    id="editor"
    ref="editor"
    v-bind:style="{ 'font-size': `${fontSize}px` }"
    v-bind:class="{
      'monospace': !isMarkdown,
    }"
    v-on:wheel="onEditorScroll($event)"
    v-on:mousedown="editorMousedown($event)"
    v-on:mouseup="editorMouseup($event)"
    v-on:mousemove="editorMousemove($event)"
  >
    <div v-show="showSearch" id="editor-search">
      <div class="row">
        <input
          ref="search-input"
          v-model="query"
          type="text"
          v-bind:placeholder="findPlaceholder"
          v-bind:class="{'monospace': regexpSearch }"
          v-on:keypress.enter.exact="searchNext()"
          v-on:keypress.shift.enter.exact="searchPrevious()"
          v-on:keydown.esc.exact="showSearch = false"
        >
        <button
          v-bind:title="regexLabel"
          v-bind:class="{ 'active': regexpSearch }"
          v-on:click="toggleQueryRegexp()"
        >
          <clr-icon shape="regexp"></clr-icon>
        </button>
        <button
          v-bind:title="closeLabel"
          v-on:click="showSearch = false"
        >
          <clr-icon shape="times"></clr-icon>
        </button>
      </div>
      <div class="row">
        <input
          v-model="replaceString"
          type="text"
          v-bind:placeholder="replacePlaceholder"
          v-bind:class="{'monospace': regexpSearch }"
          v-on:keypress.enter.exact="replaceNext()"
          v-on:keypress.shift.enter.exact="replacePrevious()"
          v-on:keypress.alt.enter.exact="replaceAll()"
          v-on:keydown.esc.exact="showSearch = false"
        >
        <button
          v-bind:title="replaceNextLabel"
          v-on:click="replaceNext()"
        >
          <clr-icon shape="two-way-arrows"></clr-icon>
        </button>
        <button
          v-bind:title="replaceAllLabel"
          v-on:click="replaceAll()"
        >
          <clr-icon shape="step-forward-2"></clr-icon>
        </button>
      </div>
    </div>
    <div id="editorarea" ref="editorarea"></div>
  </div>
</template>

<script>
export { default } from './ZuowenEditorScript'
</script>

<style lang="less">
// Editor Geometry

// Editor margins left and right for all breakpoints in both fullscreen and
// normal mode.
@editor-margin-fullscreen-sm:  50px;
@editor-margin-fullscreen-md:  5vw;
@editor-margin-fullscreen-lg:  10vw;
@editor-margin-fullscreen-xl:  20vw;
@editor-margin-fullscreen-xxl: 30vw;

@editor-margin-normal-sm:  20px;
@editor-margin-normal-md:  50px;
@editor-margin-normal-lg: 100px;

#editor {
  width: 100%;
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  background-color: #ffffff;
  transition: 0.2s background-color ease;

  div#editor-search {
    position: absolute;
    width: 300px;
    right: 0;
    z-index: 7; // One less and the scrollbar will on top of the input field
    padding: 5px 10px;

    div.row { display: flex; }

    input {
      flex: 3;
      &.monospace { font-family: monospace; }
    }

    button {
      flex: 1;
      max-width: 24px;
    }
  }

  .CodeMirror {
    // The CodeMirror editor needs to respect the new tabbar; it cannot take
    // up 100 % all for itself anymore.
    margin-left: 0.5em;
    height: 100%;
    font-family: inherit;
    // background: none;

    @media(min-width: 1025px) { margin-left: @editor-margin-normal-lg; }
    @media(max-width: 1024px) { margin-left: @editor-margin-normal-md; }
    @media(max-width:  900px) { margin-left: @editor-margin-normal-sm; }
  }

  // If a code file is loaded, we need to display the editor contents in monospace.
  &.monospace .CodeMirror {
    font-family: monospace;

    // We're using this solarized theme here: https://ethanschoonover.com/solarized/
    // See also the CodeEditor.vue component, which uses the same colours
    @base03:    #002b36;
    @base02:    #073642;
    @base01:    #586e75;
    @base00:    #657b83;
    @base0:     #839496;
    @base1:     #93a1a1;
    @base2:     #eee8d5;
    @base3:     #fdf6e3;
    @yellow:    #b58900;
    @orange:    #cb4b16;
    @red:       #dc322f;
    @magenta:   #d33682;
    @violet:    #6c71c4;
    @blue:      #268bd2;
    @cyan:      #2aa198;
    @green:     #859900;

    color: @base01;
    .cm-string     { color: @green; }
    .cm-string-2   { color: @green; }
    .cm-keyword    { color: @green; }
    .cm-atom       { color: @green; }
    .cm-tag        { color: @blue; }
    .cm-qualifier  { color: @blue; }
    .cm-builtin    { color: @blue; }
    .cm-variable-2 { color: @yellow; }
    .cm-variable   { color: @yellow; }
    .cm-comment    { color: @base1; }
    .cm-attribute  { color: @orange; }
    .cm-property   { color: @magenta; }
    .cm-type       { color: @red; }
    .cm-number     { color: @violet; }
  }

  .CodeMirror-code {
    margin: 5em 0em;
    @media(max-width: 1024px) { margin: @editor-margin-fullscreen-md 0em; }

    .mute { opacity:0.2; }
  }

  .CodeMirror-scroll {
    padding-right: 5em;
    @media(min-width: 1025px) { padding-right: @editor-margin-normal-lg; }
    @media(max-width: 1024px) { padding-right: @editor-margin-normal-md; }
    @media(max-width:  900px) { padding-right: @editor-margin-normal-sm; }
    overflow-x: hidden !important; // Necessary to hide the horizontal scrollbar

    // We need to override a negative margin
    // and a bottom padding from the standard
    // CSS for some calculations to be correct
    // such as the table editor
    margin-bottom: 0px;
    padding-bottom: 0px;
  }

  .CodeMirror.CodeMirror-readonly {
    .CodeMirror-cursor { display: none !important; }
  }

  // Math equations in text mode
  .katex {
    font-size: 1.1em; // reduce font-size of math a bit
    display: inline-block; // needed for display math to behave properly
  }

  // Math equations in display mode
  .katex-display, .katex-display > .katex > .katex-html {
    display: inline-block; // needed for display math to behave properly
    width: 100%; // display math should be centred
    margin-bottom: -0.5em; // counterbalance additional empty line that is added by code mirror due to a bug https://github.com/codemirror/CodeMirror/issues/6600
  }
}

body.dark #editor {
  background-color: rgba(20, 20, 30, 1);
}

body.darwin #editor {
  // On macOS the tabbar is 30px high.
  &:not(.fullscreen) {
    height: calc(100% - 30px);
  }

  div#editor-search {
    background-color: rgba(230, 230, 230, 1);
    border-bottom-left-radius: 6px;
    padding: 6px;
    box-shadow: -2px 2px 4px 1px rgba(0, 0, 0, .3);

    input[type="text"], button {
      border-radius: 0;
      margin: 0;
    }

    button:hover { background-color: rgb(240, 240, 240); }
    button.active { background-color: rgb(200, 200, 200) }
  }
}

body.darwin.dark #editor {
  div#editor-search {
    background-color: rgba(60, 60, 60, 1);
  }
}

body.win32 #editor, body.linux #editor {
  // On Windows, the tab bar is 30px high
  &:not(.fullscreen) {
    height: calc(100% - 30px);
  }

  div#editor-search {
    background-color: rgba(230, 230, 230, 1);
    box-shadow: -2px 2px 4px 1px rgba(0, 0, 0, .3);

    button { max-width: fit-content; }
    button, input { border-width: 1px; }

    button:hover { background-color: rgb(240, 240, 240); }
    button.active { background-color: rgb(200, 200, 200) }
  }
}

// CodeMirror fullscreen
#editor.fullscreen {
    .CodeMirror {
    @media(min-width: 1301px) { margin-left: @editor-margin-fullscreen-xxl !important; }
    @media(max-width: 1300px) { margin-left: @editor-margin-fullscreen-xl  !important; }
    @media(max-width: 1100px) { margin-left: @editor-margin-fullscreen-lg  !important; }
    @media(max-width: 1000px) { margin-left: @editor-margin-fullscreen-md  !important; }
    @media(max-width:  800px) { margin-left: @editor-margin-fullscreen-sm  !important; }

    .CodeMirror-scroll {
      @media(min-width: 1301px) { padding-right: @editor-margin-fullscreen-xxl !important; }
      @media(max-width: 1300px) { padding-right: @editor-margin-fullscreen-xl  !important; }
      @media(max-width: 1100px) { padding-right: @editor-margin-fullscreen-lg  !important; }
      @media(max-width: 1000px) { padding-right: @editor-margin-fullscreen-md  !important; }
      @media(max-width:  800px) { padding-right: @editor-margin-fullscreen-sm  !important; }
    }
  }
}

body.darwin {
    #editor.fullscreen {
     border-top: 1px solid #d5d5d5;
  }

  &.dark {
    #editor.fullscreen {
      border-top-color: #505050;
    }
  }
}

// Define the readability classes
.cm-readability-0   { background-color: hsv(52, 27.6%, 96.5%); color: #444444 !important; }
.cm-readability-1   { background-color: hsv( 1, 19.7%, 89.8%); color: #444444 !important; }
.cm-readability-2   { background-color: hsv( 184, 36%, 93.7%); color: #444444 !important; }
.cm-readability-3   { background-color: hsv( 202, 20.4%, 96.1%); color: #444444 !important; }
.cm-readability-4   { background-color: hsv( 31, 41.9%, 90%); color: #444444 !important; }
.cm-readability-5   { background-color: hsv( 91, 36%, 95%); color: #444444 !important; }
.cm-readability-6   { background-color: hsv( 91, 80%, 91%); color: #444444 !important; }
.cm-readability-7   { background-color: hsv( 52, 60%, 40%); color: #444444 !important; }
.cm-readability-8   { background-color: hsv( 1, 62.4%, 52.5%); color: #444444 !important; }
.cm-readability-9   { background-color: hsv( 184, 70%, 45.5%); color: #444444 !important; }
.cm-readability-10  { background-color: hsv( 201, 89%, 24.5%); color: #444444 !important; }
</style>
