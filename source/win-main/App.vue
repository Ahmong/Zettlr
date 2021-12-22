<!--
 * Author        : Ahmong
 * Date          : 2021-12-10 21:46
 * LastEditTime  : 2021-12-20 00:09
 * LastEditors   : Ahmong
 * License       : GNU GPL v3
 * ---
 * Description   : Root component
 * ---
-->
<template>
  <WindowChrome
    v-bind:title="title"
    v-bind:titlebar="false"
    v-bind:menubar="true"
    v-bind:show-toolbar="true"
    v-bind:toolbar-labels="false"
    v-bind:toolbar-controls="toolbarControls"
    v-on:toolbar-toggle="handleToggle($event)"
    v-on:toolbar-click="handleClick($event)"
  >
    <SplitView
      ref="file-manager-split"
      v-bind:initial-size-percent="[ 20, 80 ]"
      v-bind:minimum-size-percent="[ 10, 50 ]"
      v-bind:split="'horizontal'"
    >
      <template #view1>
        <!-- File manager in the left side of the split view -->
        <FileManager
          v-show="mainSplitViewVisibleComponent === 'fileManager'"
          ref="file-manager"
        ></FileManager>
        <!-- ... or the global search, if selected -->
        <GlobalSearch
          v-show="mainSplitViewVisibleComponent === 'globalSearch'"
          ref="global-search"
          v-on:jtl="$refs['editor'].jtl($event)"
        >
        </GlobalSearch>
      </template>
      <template #view2>
        <!-- Another split view in the right side -->
        <SplitView
          ref="editor-sidebar-split"
          v-bind:initial-size-percent="[ 80, 20 ]"
          v-bind:minimum-size-percent="[ 50, 10 ]"
          v-bind:split="'horizontal'"
        >
          <template #view1>
            <!-- First side: Editor -->
            <DocumentTabs
              v-show="!distractionFree"
            ></DocumentTabs>
            <ZuowenEditor
              ref="editor"
            ></ZuowenEditor>
          </template>
          <template #view2>
            <!-- Second side: Sidebar -->
            <MainSidebar></MainSidebar>
          </template>
        </SplitView>
      </template>
    </SplitView>
  </WindowChrome>
</template>

<script>
export { default } from './AppScript'
</script>

<style lang="less">
//
</style>
