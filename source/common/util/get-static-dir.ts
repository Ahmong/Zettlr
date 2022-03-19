/**
 * Author        : Ahmong
 * Date          : 2022-01-22 21:38
 * LastEditTime  : 2022-03-19 14:53
 * LastEditors   : Ahmong
 * License       : GNU GPL v3
 * ---
 * Description   : Get the static dir which contains assets files: lang, fonts, etc.
 * ---
 */

import path from "path"

export function getStaticDir(fallback: string): string {
  if ( (import.meta as any).env.DEV && (import.meta as any).env.VITE_DEV_STATIC_DIR) {
    return path.join(process.cwd(), (import.meta as any).env.VITE_DEV_STATIC_DIR);
  } else {
    return fallback
  }
}