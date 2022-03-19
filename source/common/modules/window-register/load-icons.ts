/**
 * Author        : Ahmong
 * Date          : 2021-12-10 21:46
 * LastEditTime  : 2022-03-18 22:07
 * LastEditors   : Ahmong
 * License       : GNU GPL v3
 * ---
 * Description   : '头部注释'
 * ---
 * FilePath      : /source/common/modules/window-register/load-icons.ts
**/
/**
 * @ignore
 * BEGIN HEADER
 *
 * Contains:        Clarity icons helper
 * CVM-Role:        Utility
 * Maintainer:      Wieke Kanters
 * License:         GNU GPL v3
 *
 * Description:     This module loads the clarity library and adds custom icons.
 *
 * END HEADER
 */

import { ClarityIcons } from '@clr/icons'
import '@clr/icons/shapes/all-shapes'

import CodeAltIcon from './icons/clarity-custom/code-alt.svg?raw'
import FootnoteIcon from './icons/clarity-custom/footnote.svg?raw'
import FileExtIcon from './icons/clarity-custom/file-ext.svg?raw'
import IndentedViewListIcon from './icons/clarity-custom/indented-view-list.svg?raw'
import RegExpIcon from './icons/clarity-custom/regexp.svg?raw'

export default async function loadIcons (): Promise<void> {
  ClarityIcons.add({
    'code-alt': CodeAltIcon,
    'file-ext': FileExtIcon,
    'indented-view-list': IndentedViewListIcon,
    'regexp': RegExpIcon,
    'footnote': FootnoteIcon
  })
}
