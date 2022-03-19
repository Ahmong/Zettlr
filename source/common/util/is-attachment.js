/**
 * Author        : Ahmong
 * Date          : 2021-12-10 21:46
 * LastEditTime  : 2022-01-22 03:03
 * LastEditors   : Ahmong
 * License       : GNU GPL v3
 * ---
 * Description   : 
 * ---
 */
/**
 * BEGIN HEADER
 *
 * Contains:        Utility function
 * CVM-Role:        <none>
 * Maintainer:      Hendrik Erz
 * License:         GNU GPL v3
 *
 * Description:     This file contains a utility function to check for attachments.
 *
 * END HEADER
 */

 const path = require('path')
import isFile from './is-file'

/**
 * This function determines whether or not a given path describes an attachment.
 * @param  {string}  p The path to be checked.
 * @param  {Boolean} skipExistenceCheck Whether or not to skip the existence check
 * @return {Boolean}   Returns true, if the path is an attachment, or false.
 */
export default function (p, skipExistenceCheck = false) {
  let ext = global.config.get('attachmentExtensions')
  let fileExists = skipExistenceCheck ? true : isFile(p)
  return fileExists && ext.includes(path.extname(p).toLowerCase())
}
