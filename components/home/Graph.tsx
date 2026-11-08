'use client'

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import data from '@/lib/contributions.json'
import styles from './Graph.module.css'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const at = (iso: string) => new Date(`${iso}T00:00:00Z`)

const pretty = (iso: string) => {
  const date = at(iso)
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`
}

const description = (day: typeof data.days[number]) =>
  `${day.count === 0 ? 'No' : day.count} contribution${day.count === 1 ? '' : 's'} on ${pretty(day.date)}`

function nextDay(index: number, key: string, boundary: boolean, lead: number, length: number) {
  const row = (lead + index) % 7
  const offsets: Record<string, number> = { ArrowUp: -1, ArrowDown: 1, ArrowLeft: -7, ArrowRight: 7 }
  const target = key === 'Home' ? boundary ? 0 : index - row
    : key === 'End' ? boundary ? length - 1 : index + 6 - row
      : key in offsets ? index + offsets[key] : null
  return target === null ? null : Math.max(0, Math.min(length - 1, target))
}

export default function Graph() {
  const days = data.days
  const instructionsId = useId()
  const cells = useRef<(HTMLButtonElement | null)[]>([])
  // the readout opens on the most recent day with something on it — "no
  // contributions today" is a flat thing to greet anyone with
  const latest = (() => { for (let i = days.length - 1; i >= 0; i--) if (days[i].count > 0) return i; return days.length - 1 })()
  const [activeIndex, setActiveIndex] = useState(latest)
  const [selectedIndex, setSelectedIndex] = useState(latest)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const scroller = useRef<HTMLDivElement>(null)

  // on a narrow screen the year overflows; start at its recent end
  useEffect(() => {
    const el = scroller.current
    if (el && el.scrollWidth > el.clientWidth) el.scrollLeft = el.scrollWidth
  }, [])

  if (!days.length) return null

  const lead = at(days[0].date).getUTCDay()
  const columns = Math.ceil((lead + days.length) / 7)
  const months: { key: string; label: string; col: number; span: number }[] = []
  days.forEach((day, index) => {
    const date = at(day.date)
    const col = Math.floor((lead + index) / 7) + 1
    const last = months[months.length - 1]
    if (!last || last.key !== `${date.getUTCFullYear()}-${date.getUTCMonth()}`) {
      months.push({ key: `${date.getUTCFullYear()}-${date.getUTCMonth()}`, label: MONTHS[date.getUTCMonth()], col, span: 1 })
    }
  })
  months.forEach((month, index) => { month.span = Math.max(1, (months[index + 1]?.col ?? columns + 1) - month.col) })
  const shown = months.filter(month => month.span >= 2)
  const cols = { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }
  const detailIndex = hoveredIndex ?? selectedIndex

  const selectDay = (index: number) => {
    setActiveIndex(index)
    setSelectedIndex(index)
  }

  const moveDay = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const target = nextDay(index, event.key, event.ctrlKey || event.metaKey, lead, days.length)
    if (target === null || event.altKey) return
    event.preventDefault()
    setHoveredIndex(null)
    selectDay(target)
    cells.current[target]?.focus({ preventScroll: true })
    cells.current[target]?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' })
  }

  return (
    <section className="graph" aria-label="GitHub activity">
      <p className={styles.total}><strong>{data.total.toLocaleString('en-US')}</strong> public contributions in the past year</p>
      <p id={instructionsId} className={styles.srOnly}>Use up and down arrows to move by day, left and right arrows by week. Home and End move to the start and end of a week; Control or Command plus Home and End move to the start and end of the year. Tap a day to see its contribution count.</p>
      <div className="graph-scroll" ref={scroller}>
        <div className="graph-chart">
          <div className="graph-months" style={cols} aria-hidden>
            {shown.map(month => <span key={month.key} style={{ gridColumn: `${month.col} / span ${month.span}` }}>{month.label}</span>)}
          </div>
          <div className="graph-grid" style={cols} role="group" aria-label="Daily contribution calendar"
               aria-describedby={instructionsId} onPointerLeave={() => setHoveredIndex(null)}>
            {Array.from({ length: lead }, (_, index) => <i key={`pad${index}`} className="graph-cell" data-pad aria-hidden />)}
            {days.map((day, index) => (
              <button key={day.date} ref={element => { cells.current[index] = element }}
                      type="button" className={`graph-cell ${styles.cell}`} data-level={day.level}
                      data-selected={detailIndex === index || undefined} aria-label={description(day)}
                      tabIndex={activeIndex === index ? 0 : -1}
                      onPointerEnter={event => { if (event.pointerType !== 'touch') setHoveredIndex(index) }}
                      onFocus={() => { setHoveredIndex(null); selectDay(index) }} onClick={() => selectDay(index)}
                      onKeyDown={event => moveDay(event, index)} />
            ))}
          </div>
        </div>
      </div>
      <p className="graph-hint">← scroll back for earlier months</p>
      <p className={styles.detail} role="status" aria-live="polite" aria-atomic="true">{description(days[detailIndex])}</p>
      <div className="graph-foot">
        <span className="graph-range">{pretty(days[0].date)} — {pretty(days[days.length - 1].date)}</span>
        <span className="graph-key" aria-hidden>
          less
          {[0, 1, 2, 3, 4].map(level => <i key={level} className="graph-cell" data-level={level} />)}
          more
        </span>
      </div>
    </section>
  )
}
