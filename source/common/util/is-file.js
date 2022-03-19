/**
 * Author        : Ahmong
 * Date          : 2022-01-20 22:01
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
 * Description:     This file contains a utility function to check a file.
 *
 * END HEADER
 */

 const fs = require('fs')

/**
 * Checks if a given path is a valid file
 * @param  {String}  p The path to check
 * @return {Boolean}   True, if it is a valid path + file, and false if not
 */
export default function (p) {
  try {
    let s = fs.lstatSync(p)
    return s.isFile()
  } catch (err) {
    return false
  }
}
