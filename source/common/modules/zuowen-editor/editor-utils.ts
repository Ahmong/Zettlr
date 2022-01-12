/**
 * Author        : Ahmong
 * Date          : 2021-12-12 23:30
 * LastEditTime  : 2022-01-11 23:41
 * LastEditors   : Ahmong
 * License       : GNU GPL v3
 * ---
 * Description   : create a milkdown editor class
 * ---
 */

import {
  defaultValueCtx,
  Editor as mdEditor,
  editorStateCtx,
  editorViewCtx,
  editorViewOptionsCtx,
  EditorViewReady,
  MilkdownPlugin,
  parserCtx,
  rootCtx,
  serializerCtx,
} from '@milkdown/core'
import { AtomList } from '@milkdown/utils';
import { AllSelection, EditorProps, EditorState, Slice } from '@milkdown/prose'
import { clipboard } from '@milkdown/plugin-clipboard'
import { cursor } from '@milkdown/plugin-cursor'
import { emoji } from '@milkdown/plugin-emoji'
import { history } from '@milkdown/plugin-history'
import { indent } from '@milkdown/plugin-indent'
import { listener, listenerCtx } from '@milkdown/plugin-listener'
import { math } from '@milkdown/plugin-math'
import { prism } from '@milkdown/plugin-prism'
import { tablePlugin } from '@milkdown/plugin-table'
import { tooltip } from '@milkdown/plugin-tooltip'
import {
  zwmarkdown,
  baseDirDefault,
  getParserOption,
  parserOptionsCtx,
  repoSchemeDefault,
  setParserOption
} from 'preset-zwmarkdown'
import { zwnord } from 'theme-zwnord'

import { ZuowenEditor } from '.'

// const extZwmarkdown = AtomList.create([...zwmarkdown, tablePlugin(), urlPlugin(), strikeThrough(), taskListItem()]);
// const extZwmarkdown = AtomList.create([...zwmarkdown, tablePlugin()]);

const complete =
  (callback: () => void): MilkdownPlugin =>
    () =>
      async (ctx) => {
        await ctx.wait(EditorViewReady)
        callback()
      }

export const createEditor = (
  root: HTMLElement | null,
  defaultValue: string = '',
  // readOnly: boolean | undefined,
  setEditorReady?: (ready: boolean) => void,
  onChange?: (getMarkdown: () => string) => void
): mdEditor => {
  const editor = mdEditor.make()
    .config((ctx) => {
      ctx.set(rootCtx, root)
      ctx.set(defaultValueCtx, defaultValue)
      // ctx.set(editorViewOptionsCtx, { editable: () => !(readOnly ?? false) })
      ctx.set(listenerCtx, { markdown: (onChange != null) ? [onChange] : [] })
    })
    .use(zwnord)
    .use(zwmarkdown)
    // .use(extZwmarkdown)
    .use(complete(() => { setEditorReady?.(true) }))
    .use(clipboard)
    .use(listener)
    .use(history)
    .use(cursor)
    .use(prism)
    .use(tooltip)
    .use(emoji)
    .use(indent)

  return editor
}

/**
 * Set editorViewOptions (Aka EditorProps in prosemirror).
 *
 * @param   {mdEditor}                   editor  milkdown editor for config
 * @param   {EditorProps<HuiwenEditor>}  props   the options
 *
 * @return  {void}
 */
export function setEditorViewOptions (editor: mdEditor, props: EditorProps<ZuowenEditor> = {}): void {
  editor.config((ctx) => {
    ctx.update(editorViewOptionsCtx, viewOptions => {
      return Object.assign(viewOptions, props)
    })
  })
}

export function toMarkdown (editor: mdEditor, state: EditorState): string {
  return editor.action((ctx) => {
    const serializer = ctx.get(serializerCtx)
    return serializer(state.doc)
  })
}

export function updateDoc (editor: mdEditor, content: EditorState | string, baseDir?: string): EditorState {
  return editor.action((ctx) => {
    const view = ctx.get(editorViewCtx)
    const oldState = view.state

    console.log('try to set option: baseDir=' + baseDir)
    if (baseDir?.length ?? 0 > 0) {
      setParserOption(ctx, baseDir + '/', baseDirDefault)
      const optBaseDir = getParserOption(ctx, baseDirDefault)
      console.log('set option to: baseDir=' + optBaseDir)
    }

    if (typeof content === 'string') {
      const parser = ctx.get(parserCtx)
      let doc = parser(content)
      if (!doc) {
        doc = parser('')
        console.error('Markdown file parse error, content:"'
                      + doc?.slice(0, 40).toJSON
                      + ' ..."')
      }
      if (doc) {
        let newState = oldState.apply(oldState.tr.setSelection(new AllSelection(oldState.doc)))
        newState = newState.apply(newState.tr.replaceSelectionWith(doc,  false))
        view.updateState(newState)
        ctx.set(editorStateCtx, newState)
      }
    } else {
      view.updateState(content)
      ctx.set(editorStateCtx, view.state)
    }
    return oldState
  })
}

export function getDoc (editor: mdEditor): EditorState {
  return editor.action((ctx) => {
    const state = ctx.get(editorViewCtx).state
    ctx.set(editorStateCtx, state)
    return state
  })
}

export function setRepoScheme (editor: mdEditor, scheme: string) {
  return editor.action((ctx) => {
    if (scheme?.length > 0) {
      setParserOption(ctx, scheme, repoSchemeDefault)
    }
  })
}
