/**
 * Author        : Ahmong
 * Date          : 2021-12-10 21:46
 * LastEditTime  : 2022-01-22 02:23
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
 * Description:     This file contains a utility function to check a path.
 *
 * END HEADER
 */

 const fs = require('fs')

/**
 * Checks if a given path is a valid directory
 * @param  {String}  p The path to check
 * @return {Boolean}   True, if p is valid and also a directory
 */
export default function (p) {
  try {
    let s = fs.lstatSync(p)
    return s.isDirectory()
  } catch (err) {
    return false
  }
}
