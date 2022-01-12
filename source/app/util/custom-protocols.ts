/**
 * Author        : Ahmong
 * Date          : 2021-12-10 21:46
 * LastEditTime  : 2022-01-12 12:11
 * LastEditors   : Ahmong
 * License       : GNU GPL v3
 * ---
 * Description   : 
 * ---
 */
/**
 * @ignore
 * BEGIN HEADER
 *
 * CVM-Role:        Utility function
 * Maintainer:      Hendrik Erz
 * License:         GNU GPL v3
 *
 * Description:     Registers custom protocols for the application.
 *
 * END HEADER
 */

import { protocol } from 'electron'

export default function registerCustomProtocols (): void {
  // Make it possible to safely load external files
  // In order to load files, the 'safe-file' protocol has to be used instead of 'file'
  // https://stackoverflow.com/a/61623585/873661
  const protocolName = 'safe-file'

  // TODO: restrict the requested file to config dir
  global.log.info(`Registering custom protocol ${protocolName}`)
  protocol.registerFileProtocol(protocolName, (request, callback) => {
    const url = request.url.replace(`${protocolName}://`, '')
    try {
      // eslint-disable-next-line node/no-callback-literal
      return callback({
        path: decodeURIComponent(url),
        // Prevent that local files are cached
        headers: { 'Cache-control': 'no-store', 'pragma': 'no-cache' }
      })
    } catch (err: any) {
      global.log.error(`Error loading external file: ${err.message as string}`, err)
    }
  })
}
