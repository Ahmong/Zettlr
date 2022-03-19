/**
 * Author        : Ahmong
 * Date          : 2021-12-10 21:46
 * LastEditTime  : 2022-01-21 14:31
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
 * Description:     Sorts an array of strings with PDF at the top.
 *
 * END HEADER
 */

const pdfRE = /\.pdf$/i

/**
 * Sorting function that sorts PDF files to be at the top
 * @param {String} a The first comparator
 * @param {String} b The second comparator
 */
export default function (a, b) {
  let isAPDF = pdfRE.test(a)
  let isBPDF = pdfRE.test(b)

  if (isAPDF && isBPDF) return 0
  if (isAPDF) return -1
  if (isBPDF) return 1
  return 0
}
