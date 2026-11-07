/** Pull the real contribution calendar off GitHub's public profile fragment and
 *  freeze it into lib/contributions.json, which the homepage reads at build time.
 *
 *  It runs as `prebuild`, so every deploy ships a fresh year — but a failed or
 *  empty fetch leaves the committed JSON alone rather than blanking the graph.
 *  No token: /users/<login>/contributions is the same public HTML the profile
 *  page loads, so there is nothing here that a signed-out visitor can't see.
 */
import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const LOGIN = 'bruceche-cmu-F25'
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'lib', 'contributions.json')

/** Each cell is one day: `<td id="…" data-date="…" data-level="0–4">`, with the
 *  count only in the `<tool-tip for="<that id>">` further down the document.
 *  The table runs weekday-by-weekday, not in date order, so sort before saving. */
function parse(html) {
  const counts = new Map()
  const tip = /<tool-tip[^>]*\bfor="(contribution-day-component-[\d-]+)"[^>]*>([^<]*)<\/tool-tip>/g
  for (let m; (m = tip.exec(html)); ) {
    const n = /^No contributions/i.test(m[2]) ? 0 : Number((m[2].match(/^([\d,]+)\s+contribution/) || [])[1]?.replace(/,/g, '') ?? 0)
    counts.set(m[1], n)
  }

  // attribute order varies between cells, so pull the whole tag and read it apart
  const days = []
  const cell = /<td\b([^>]*\bclass="[^"]*ContributionCalendar-day[^"]*"[^>]*)>/g
  for (let m; (m = cell.exec(html)); ) {
    const attrs = m[1]
    const date = (attrs.match(/\bdata-date="(\d{4}-\d{2}-\d{2})"/) || [])[1]
    if (!date) continue
    const level = Number((attrs.match(/\bdata-level="(\d)"/) || [])[1] ?? 0)
    const id = (attrs.match(/\bid="(contribution-day-component-[\d-]+)"/) || [])[1]
    days.push({ date, level, count: counts.get(id) ?? 0 })
  }

  return days.sort((a, b) => a.date.localeCompare(b.date))
}

/** The "N contributions in the last year" line GitHub prints above the grid. */
function totalFrom(html, days) {
  const m = html.match(/([\d,]+)\s+contributions?\s+in\s+the\s+last\s+year/i)
  if (m) return Number(m[1].replace(/,/g, ''))
  return days.reduce((s, d) => s + d.count, 0)
}

const keep = (why) => {
  if (existsSync(OUT)) {
    console.warn(`contributions: ${why} — keeping the committed ${OUT.split('/').pop()}`)
    process.exit(0)
  }
  console.warn(`contributions: ${why} — writing an empty year`)
  writeFileSync(OUT, JSON.stringify({ login: LOGIN, fetchedAt: null, total: 0, days: [] }, null, 2) + '\n')
  process.exit(0)
}

let html
try {
  const res = await fetch(`https://github.com/users/${LOGIN}/contributions`, {
    headers: { accept: 'text/html', 'user-agent': 'bruce-portfolio-build' },
    signal: AbortSignal.timeout(20_000),
  })
  if (!res.ok) keep(`GitHub answered ${res.status}`)
  html = await res.text()
} catch (e) {
  keep(`fetch failed (${e.message})`)
}

const days = parse(html)
if (days.length < 300) keep(`only ${days.length} days parsed — the markup probably moved`)

const data = { login: LOGIN, fetchedAt: new Date().toISOString().slice(0, 10), total: totalFrom(html, days), days }
const before = existsSync(OUT) ? readFileSync(OUT, 'utf8') : ''
const after = JSON.stringify(data, null, 2) + '\n'
if (before !== after) writeFileSync(OUT, after)
console.log(`contributions: ${days.length} days, ${data.total} contributions, through ${days.at(-1).date}`)
