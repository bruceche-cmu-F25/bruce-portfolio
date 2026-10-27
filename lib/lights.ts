/** Night: the desk after dark, under a lamp. A visitor who flips the switch is
 *  remembered in their own browser; one who never has gets their system's
 *  dark mode. The share preview (?still) is always shot by day. */
export const NIGHT_KEY = 'bruceche-notebook-night'

/** Run in the page before the notebook is painted, so a night visit never
 *  flashes the daytime desk first. Notebook takes over once it's running. */
export const LIGHTS_BOOT =
  `try{if(!new URLSearchParams(location.search).has('still')){var s=localStorage.getItem('${NIGHT_KEY}');` +
  `if(s==='on'||(s===null&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.setAttribute('data-night','')}}catch(e){}`
