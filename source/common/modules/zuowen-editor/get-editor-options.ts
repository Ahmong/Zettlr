/**
 * Author        : Ahmong
 * Date          : 2021-12-12 22:24
 * LastEditTime  : 2021-12-19 22:35
 * LastEditors   : Ahmong
 * License       : GNU GPL v3
 * ---
 * Description   : This utility function can merge editor options
 *                 and return a valid editor option object. This is
 *                 especially useful if you want to update a large chunk
 *                 of options at once
 * ---
**/

import { EditorProps } from '@milkdown/prose'
import { ZuowenEditor } from './index'

// const generateKeymap = require('./generate-keymap.js')

interface ZuowenEditorOptions {
  prosemirror?: EditorProps<ZuowenEditor>
  zettlr?: ZettlrOptions
}

interface ZettlrOptions {
  // Element rendering
  render?: {
    iframes?: boolean
    images?: boolean
    links?: boolean
    math?: boolean
    tasks?: boolean
    headingTags?: boolean
    tables?: boolean
    wysiwyg?: boolean
  }
  // Set to true to start the full screen mode
  fullScreen?: boolean
  // Placeholder for empty instances, necessary to maintain the styling
  placeholder?: string
  // Soft-wrap longer lines
  lineWrapping?: boolean
  // Pandoc requires 4 spaces indentation, which is the default
  indentUnit?: number
  // Maximum width of images
  imagePreviewWidth?: number
  // Maximum height of images
  imagePreviewHeight?: number
  // Zettelkasten elements; necessary for the renderers
  zettelkasten?: {
    // How to determine IDs
    idRE?: string
    // How to generate IDs
    idGen?: string
    // Zettelkasten link start
    linkStart?: string
    // Zettelkasten link end
    linkEnd?: string
    // Should link with filename?
    linkWithFilename?: boolean
  }
  // The base path used to render the image in case of relative URLs
  markdownImageBasePath?: string
  // The characters used for bold formatting
  markdownBoldFormatting?: string
  // The characters used for italic formatting
  markdownItalicFormatting?: string
}

/**
 * Returns Editor default options, with sound settings for Zettlr applied.
 */
const getEditorDefaultOptions = function (): ZuowenEditorOptions {
  return {
    /**
     * prosemirror-view OPTIONS
     */
    prosemirror: {
      // Determines the distance (in pixels) between the cursor and the end of
      // the visible viewport at which point, when scrolling the cursor into
      // view, scrolling takes place.
      scrollThreshold: 10,
      // Determines the extra space (in pixels) that is left above or below
      // the cursor when it is scrolled into view.
      scrollMargin: 10
    },

    /**
     * ZETTLR-SPECIFIC OPTIONS
     *
     * These options regulate internal behaviour of the custom plugins Zettlr
     * uses to display certain things, render elements, and the likes. We need
     * to pass this in the CodeMirror options, because many plugins hook in
     * directly to the CodeMirror instance, and are only instantiated by the
     * MarkdownEditor class.
     */
    zettlr: {
      // Element rendering
      render: {
        iframes: true,
        images: true,
        links: true,
        math: true,
        tasks: true,
        headingTags: true,
        tables: true,
        wysiwyg: false
      },
      // Set to true to start the full screen mode
      fullScreen: false,
      // Placeholder for empty instances, necessary to maintain the styling
      placeholder: ' ',
      // Soft-wrap longer lines
      lineWrapping: true,
      // Pandoc requires 4 spaces indentation, which is the default
      indentUnit: 4,
      // Maximum width of images
      imagePreviewWidth: 100,
      // Maximum height of images
      imagePreviewHeight: 100,
      // Zettelkasten elements; necessary for the renderers
      zettelkasten: {
        idRE: '(\\d{14})', // How to determine IDs
        linkStart: '[[', // Zettelkasten link start
        linkEnd: ']]', // Zettelkasten link end
        linkWithFilename: false // Should link with filename?
      },
      // The base path used to render the image in case of relative URLs
      markdownImageBasePath: '',
      // The characters used for bold formatting
      markdownBoldFormatting: '**',
      // The characters used for italic formatting
      markdownItalicFormatting: '_'
    }
  }
}

export { ZuowenEditorOptions, ZettlrOptions, getEditorDefaultOptions }
