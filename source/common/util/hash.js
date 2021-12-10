/**
 * BEGIN HEADER
 *
 * Contains:        Utility function
 * CVM-Role:        <none>
 * Maintainer:      Hendrik Erz
 * License:         GNU GPL v3
 *
 * Description:     This file contains a utility function to hash strings.
 *
 * END HEADER
 */

/**
* Basic hashing function (thanks to https://stackoverflow.com/a/7616484)
* @param  {String} string The string that should be hashed
* @param  {seed} Number   The seed
* @return {Number}        The hash of the given string
*
module.exports = function (string) {
  let hash = 0
  let i, chr

  if (string.length === 0) return hash

  for (i = 0; i < string.length; i++) {
    chr = string.charCodeAt(i)
    hash = ((hash << 5) - hash) + chr
    hash |= 0 // Convert to 32bit integer
  }
  return hash
}
*/

/**
 * Basic hashing function (thanks to https://stackoverflow.com/a/7616484)
 * 上面的算法会返回负数，然后在 fsal-cache 中会截取返回值的前两个字符，这样就包含了
 * 负号 “-”，以此作为 cache 文件的名称的话，文件名中带有负号，不方便使用。
 * 因此改用同一个 stack 话题中 bryc 发布的算法 cryb53。
 * 更多分析参考：https://softwareengineering.stackexchange.com/questions/49550/which-hashing-algorithm-is-best-for-uniqueness-and-speed
 * @param  {String} string The string that should be hashed
 * @param  {Number} seed   The seed
 * @return {Number}        The hash of the given string
 */
module.exports = function (string, seed = 0) {
  let h1 = 0xdeadbeef ^ seed
  let h2 = 0x41c6ce57 ^ seed
  for (let i = 0, ch; i < string.length; i++) {
    ch = string.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return 4294967296 * (2097151 & h2) + (h1 >>> 0)
}
