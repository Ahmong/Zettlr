/**
 * Author        : Ahmong
 * Date          : 2021-12-10 21:46
 * LastEditTime  : 2022-01-21 14:41
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
 * Description:     This file contains a utility function to sanitise TeX values.
 *
 * END HEADER
 */

/**
* Escape or remove TeX command characters: # $ % ^ & _ { } ~ \
* @param  {String} val The input.
* @return {String}     The sanitised output.
*/
export default function (val) {
  // First remove those that cannot be rendered
  val = val.replace(/[$^~\\]/g, '')
  // Then escape the rest
  val = val.replace(/(?<!\\)([_#%&{}])/g, '\\$1')
  return val
}
