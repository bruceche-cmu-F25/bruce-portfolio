/** The four hours the homepage can be in.
 *
 *  The painting and the page's accent colour are the same setting: `data-hour`
 *  on <html>. It is written twice — once by HOUR_BOOT before the first paint, so
 *  nobody sees dusk pink flash past on a night visit, and again by the scene
 *  whenever the visitor steps the clock on. Keep the rule in `hourNow` and the
 *  one inlined in HOUR_BOOT the same.
 */

export type Hour = 'dusk' | 'night' | 'dawn' | 'day'

export const HOURS: Hour[] = ['dusk', 'night', 'dawn', 'day']

export const THEME_TRANSITION_MS = 1100

export const HOUR_LABEL: Record<Hour, string> = {
  dusk: 'dusk',
  night: 'deep night',
  dawn: 'first light',
  day: 'daylight',
}

/** Four parts of the visitor's own day. */
export function hourNow(d = new Date()): Hour {
  const h = d.getHours()
  if (h >= 4 && h < 10) return 'dawn'
  if (h >= 10 && h < 16) return 'day'
  if (h >= 16 && h < 21) return 'dusk'
  return 'night'
}

/** Runs in <head>, before anything is painted. Same thresholds as hourNow.
 *  `?still` — what scripts/og-image.sh loads — is pinned to dusk, so the share
 *  preview doesn't come out a different colour depending on when it was shot. */
export const HOUR_BOOT =
  `try{var h=new Date().getHours(),s=location.search.indexOf('still')>-1;` +
  `document.documentElement.dataset.hour=s?'dusk':(h>=4&&h<10?'dawn':h>=10&&h<16?'day':h>=16&&h<21?'dusk':'night')}catch(e){}`

/** Whatever the boot script decided, for a component mounting after it. */
export function hourFromDocument(): Hour {
  const set = typeof document !== 'undefined' ? document.documentElement.dataset.hour : undefined
  return HOURS.includes(set as Hour) ? (set as Hour) : hourNow()
}
