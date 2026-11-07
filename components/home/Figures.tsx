import type { ReactNode } from 'react'

/** Marks up the numbers in a sentence so the page can highlight them.
 *
 *  Only tokens carrying a unit or a symbol are caught — `6×`, `35%`, `$7,000`,
 *  `2.5s`, `14d`, `2nd`, `30+`, `6 percentage points`. A bare year like 2026
 *  deliberately isn't a figure: highlighting every number turns the page into
 *  confetti and the ones that matter stop standing out.
 */
const FIGURE = new RegExp(
  [
    '\\$[\\d,]+(?:\\.\\d+)?',          // $7,000
    '\\d+\\s+percentage\\s+points?',   // 6 percentage points
    '\\d[\\d,.]*\\s*[×%]',             // 6×, 35%
    '\\d[\\d,.]*(?:ms|s|d|x)\\b',      // 2.5s, 14d, 20ms
    '\\d+(?:st|nd|rd|th)\\b',          // 2nd
    '\\d[\\d,]*\\+',                   // 30+
  ].join('|'),
  'g',
)

export function figures(text: string): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  for (const m of text.matchAll(FIGURE)) {
    const at = m.index!
    if (at > last) out.push(text.slice(last, at))
    out.push(<b className="fig" key={at}>{m[0]}</b>)
    last = at + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}
