import { BrowserWindow, dialog, MessageBoxOptions, MessageBoxReturnValue } from 'electron'
import { CodeFileDescriptor, DirDescriptor, MDFileDescriptor } from '../../fsal/types'
import { trans } from '../../../../common/i18n-main'

/**
 * Displays a dialog to confirm the removal of the given descriptor.
 *
 * @param   {BrowserWindow}                                      win         The Window to attach to
 * @param   {MDFileDescriptor|CodeFileDescriptor|DirDescriptor}  descriptor  The descriptor
 *
 * @return  {Promise<boolean>}                                               Returns true if the confirmation was successful.
 */
export default async function confirmRemove (win: BrowserWindow|null, descriptor: MDFileDescriptor|CodeFileDescriptor|DirDescriptor): Promise<boolean> {
  const options: MessageBoxOptions = {
    type: 'warning',
    buttons: [ 'Ok', trans('system.error.cancel_remove') ],
    defaultId: 0,
    cancelId: 1,
    title: trans('system.error.remove_title'),
    message: trans('system.error.remove_message', descriptor.name)
  }

  let response: MessageBoxReturnValue
  // DEBUG: Again trying to resolve the bug #1645.
  if (win !== null && [ 'darwin', 'win32' ].includes(process.platform)) {
    response = await dialog.showMessageBox(win, options)
  } else {
    response = await dialog.showMessageBox(options)
  }

  // 0 = Ok, 1 = Cancel
  return response.response === 0
}
