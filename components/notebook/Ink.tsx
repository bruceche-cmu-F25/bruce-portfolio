/** Pen marks for the notebook: hand-drawn glyphs, rough.js diagrams.
 *
 *  Everything here renders to static SVG paths during render — rough.js's
 *  generator is deterministic for a given seed, so the server HTML, the client
 *  hydration and page-flip's cloned pages all draw the same wobble. */

import rough from 'roughjs'
import { Fragment, type ReactNode } from 'react'
import type { Tone, Traits } from '@/lib/notebook'

const gen = rough.generator()

export const INK: Record<Tone, string> = {
  ink: '#23262d',
  blue: '#2457c5',
  red: '#c8372c',
  pencil: '#62666e',
}

/** The yellow highlighter. */
export const MARKER = '#f7c83a'

/* ── Glyphs Virgil doesn't have ───────────────────────────────────── */

const GLYPHS: Record<string, string> = {
  '→': 'M2 9.2C7 8.6 13 9.4 19.4 8.7M14.2 4.4L19.6 8.7L14.4 13.3',
  '↗': 'M4 15C8 11 12 7.4 16 3.6M8.6 3.2L16.2 3.4L16 10.8',
  '↓': 'M10 2.4C9.6 7 10.4 11 9.8 16.4M5.4 11.8L9.8 16.6L14.4 11.6',
  '↑': 'M10 16.6C10.4 12 9.6 8 10.2 2.6M5.6 7.2L10.2 2.4L14.6 7.4',
}

export function Glyph({ ch }: { ch: string }) {
  return (
    <svg className="nb-glyph" viewBox="0 0 22 19" aria-label={ch} role="img">
      <path d={GLYPHS[ch]} />
    </svg>
  )
}

const EMOJI = /\p{Extended_Pictographic}️?\s*/gu

/** Text as written in the notebook: emoji dropped, arrows drawn by hand. */
export function ink(text: string): ReactNode {
  const parts = text.replace(EMOJI, '').split(/([→↗↓↑])/)
  if (parts.length === 1) return parts[0]
  return parts.map((part, i) => (GLYPHS[part] ? <Glyph key={i} ch={part} /> : part))
}

/** A figure: $0.002, 6×, 35%, 30+, 45s, 14d, 2nd — a number with what it counts. */
const FIGURE = /(\$\d[\d.,]*\d|\d[\d.,]*(?:×|%|\+|st|nd|rd|th|s|d)(?!\w))/g

/** Text as written, with its figures gone over bigger and in red — the numbers are the point. */
export function stress(text: string): ReactNode {
  return text.split(FIGURE).map((part, i) => i % 2
    ? <span key={i} className="nb-fig">{part}</span>
    : <Fragment key={i}>{ink(part)}</Fragment>)
}

/* ── Diagrams ─────────────────────────────────────────────────────── */

export interface DNode {
  id: string; x: number; y: number; w: number; h: number; label: string
  tone?: Tone
  /** crossed out — something that was replaced, or deliberately left off */
  strike?: boolean
  /** a dashed boundary drawn around other nodes, labelled in its corner */
  frame?: boolean
  /** gone over with the yellow highlighter — the part that matters */
  hl?: boolean
}
export interface DEdge { from: string; to: string; label?: string; tone?: Tone; dashed?: boolean; both?: boolean }
export interface DLine { x1: number; y1: number; x2: number; y2: number; tone?: Tone; dashed?: boolean }
export interface DNote { x: number; y: number; text: string; tone?: Tone; anchor?: 'start' | 'middle' | 'end' }
export interface DiagramSpec { w: number; h: number; nodes: DNode[]; edges: DEdge[]; lines?: DLine[]; notes?: DNote[] }

type Drawn = { d: string; stroke: string; strokeWidth: number; fill?: string; dashed?: boolean }

/** Node's and the browser's Math.sin differ in the last digit, which is enough
 *  to fail hydration; two decimals is finer than any screen can show. */
export const settle = (d: string) => d.replace(/-?\d+\.\d+/g, n => String(Math.round(+n * 100) / 100))

export function draw(shape: ReturnType<typeof gen.line>, dashed = false): Drawn[] {
  return gen.toPaths(shape).map(p => ({ d: settle(p.d), stroke: p.stroke, strokeWidth: p.strokeWidth, fill: p.fill, dashed }))
}

const center = (n: DNode) => ({ x: n.x + n.w / 2, y: n.y + n.h / 2 })

/** Where the line from a box's centre towards (dx, dy) leaves the box, plus a gap. */
function exitPoint(n: DNode, dx: number, dy: number, gap = 5) {
  const c = center(n)
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len, uy = dy / len
  const t = Math.min(ux ? (n.w / 2) / Math.abs(ux) : Infinity, uy ? (n.h / 2) / Math.abs(uy) : Infinity)
  return { x: c.x + ux * (t + gap), y: c.y + uy * (t + gap) }
}

function arrowHead(tip: { x: number; y: number }, from: { x: number; y: number }, opts: object) {
  const a = Math.atan2(tip.y - from.y, tip.x - from.x)
  const len = 9
  return [-0.45, 0.45].flatMap(spread => draw(gen.line(
    tip.x - len * Math.cos(a + spread), tip.y - len * Math.sin(a + spread), tip.x, tip.y, opts)))
}

function Label({ x, y, text, size = 13, tone = 'ink', anchor = 'middle' }: {
  x: number; y: number; text: string; size?: number; tone?: Tone; anchor?: 'start' | 'middle' | 'end'
}) {
  const lines = text.split('\n')
  const lh = size * 1.22
  const top = y - ((lines.length - 1) * lh) / 2
  return (
    <text x={x} y={top} fontSize={size} fill={INK[tone]} textAnchor={anchor} dominantBaseline="central">
      {lines.map((line, i) => <tspan key={i} x={x} y={top + i * lh}>{line}</tspan>)}
    </text>
  )
}

export function Diagram({ spec, seed, title }: { spec: DiagramSpec; seed: number; title: string }) {
  const byId = Object.fromEntries(spec.nodes.map(n => [n.id, n]))
  const marks: Drawn[] = []
  let s = seed
  const opts = (tone: Tone = 'ink', extra = {}) =>
    ({ seed: ++s, stroke: INK[tone], strokeWidth: 1.35, roughness: 1.05, bowing: 0.9, ...extra })

  for (const n of spec.nodes) {
    const fill = n.hl ? { fill: MARKER, fillStyle: 'hachure', hachureGap: 4.5, fillWeight: 2.2, hachureAngle: -38 } : {}
    marks.push(...draw(gen.rectangle(n.x, n.y, n.w, n.h, opts(n.frame ? 'pencil' : n.tone, n.frame ? { roughness: 0.7 } : fill)), n.frame))
    if (n.strike) {
      marks.push(...draw(gen.line(n.x - 4, n.y + n.h + 3, n.x + n.w + 4, n.y - 3, opts('red', { strokeWidth: 1.6 }))))
    }
  }
  for (const l of spec.lines ?? []) {
    marks.push(...draw(gen.line(l.x1, l.y1, l.x2, l.y2, opts(l.tone, { roughness: 0.6 })), l.dashed))
  }
  for (const e of spec.edges) {
    const a = byId[e.from], b = byId[e.to]
    const ca = center(a), cb = center(b)
    const p1 = exitPoint(a, cb.x - ca.x, cb.y - ca.y)
    const p2 = exitPoint(b, ca.x - cb.x, ca.y - cb.y)
    const o = opts(e.tone, { roughness: 0.8 })
    marks.push(...draw(gen.line(p1.x, p1.y, p2.x, p2.y, o), e.dashed))
    marks.push(...arrowHead(p2, p1, opts(e.tone, { roughness: 0.5 })))
    if (e.both) marks.push(...arrowHead(p1, p2, opts(e.tone, { roughness: 0.5 })))
  }

  return (
    <svg className="nb-diagram" viewBox={`0 0 ${spec.w} ${spec.h}`} role="img" aria-label={title}>
      {marks.map((m, i) => (
        <path key={i} d={m.d} stroke={m.stroke} strokeWidth={m.strokeWidth} fill={m.fill ?? 'none'}
              strokeDasharray={m.dashed ? '6 5' : undefined} strokeLinecap="round" />
      ))}
      {spec.nodes.map(n => n.frame
        ? <Label key={n.id} x={n.x + 10} y={n.y + n.h - 12} text={n.label} size={12} tone="pencil" anchor="start" />
        : <Label key={n.id} x={n.x + n.w / 2} y={n.y + n.h / 2} text={n.label} tone={n.tone} />)}
      {spec.edges.filter(e => e.label).map(e => {
        // centred on the drawn stretch of the line, nudged off it on its upper side
        const a = byId[e.from], b = byId[e.to]
        const ca = center(a), cb = center(b)
        const p1 = exitPoint(a, cb.x - ca.x, cb.y - ca.y), p2 = exitPoint(b, ca.x - cb.x, ca.y - cb.y)
        const len = Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1
        let nx = -(p2.y - p1.y) / len, ny = (p2.x - p1.x) / len
        if (ny > 0) { nx = -nx; ny = -ny }
        const anchor = nx > 0.4 ? 'start' : nx < -0.4 ? 'end' : 'middle'
        return <Label key={`${e.from}-${e.to}`} x={(p1.x + p2.x) / 2 + nx * 9} y={(p1.y + p2.y) / 2 + ny * 11}
                      text={e.label!} size={12} tone={e.tone ?? 'pencil'} anchor={anchor} />
      })}
      {spec.notes?.map(n => <Label key={n.text} x={n.x} y={n.y} text={n.text} size={12} tone={n.tone} anchor={n.anchor} />)}
    </svg>
  )
}

/* ── Small marks ──────────────────────────────────────────────────── */

/** A rough loop drawn around whatever it wraps — a red pen circling a number. */
export function Circled({ children, seed = 3 }: { children: ReactNode; seed?: number }) {
  const loop = draw(gen.ellipse(50, 50, 96, 84, { seed, stroke: INK.red, strokeWidth: 1.5, roughness: 1.4 }))
  return (
    <span className="nb-circled">
      {children}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {loop.map((m, i) => <path key={i} d={m.d} stroke={m.stroke} strokeWidth={m.strokeWidth} fill="none" vectorEffect="non-scaling-stroke" />)}
      </svg>
    </span>
  )
}

/** A number worth remembering, written big in red and ringed, with what it counts under it. */
export function Stat({ big, small, seed = 7 }: { big: string; small: string; seed?: number }) {
  return (
    <p className="nb-stat">
      <span className="nb-stat-big"><Circled seed={seed}>{big}</Circled></span>
      <span className="nb-stat-small">{small}</span>
    </p>
  )
}

/** A prize rosette: a gold disc on two ribbon tails, the place written in it. */
export function Rosette({ place, seed = 40 }: { place: string; seed?: number }) {
  const o = (fill: string, i: number) => ({ seed: seed + i, fill, fillStyle: 'solid', stroke: INK.ink, strokeWidth: 1.4, roughness: 0.9 })
  const marks = [
    ...draw(gen.polygon([[30, 52], [18, 96], [30, 88], [38, 99], [46, 58]], o(INK.blue, 1))),
    ...draw(gen.polygon([[70, 52], [82, 96], [70, 88], [62, 99], [54, 58]], o(INK.red, 2))),
    // the pleated edge: a ring of little scallops round the disc
    ...draw(gen.path(Array.from({ length: 16 }, (_, i) => {
      const a = (i / 16) * Math.PI * 2, b = ((i + 0.5) / 16) * Math.PI * 2, c = ((i + 1) / 16) * Math.PI * 2
      const p = (t: number, r: number) => `${(50 + r * Math.cos(t)).toFixed(2)} ${(42 + r * Math.sin(t)).toFixed(2)}`
      return `${i ? 'L' : 'M'}${p(a, 33)}Q${p(b, 40)} ${p(c, 33)}`
    }).join('') + 'Z', o('#fbf8f0', 3))),
    ...draw(gen.circle(50, 42, 54, o(MARKER, 4))),
  ]
  return (
    <svg className="nb-rosette" viewBox="0 0 100 100" role="img" aria-label={`${place} place`}>
      {marks.map((m, i) => <path key={i} d={m.d} stroke={m.stroke} strokeWidth={m.strokeWidth} fill={m.fill ?? 'none'} strokeLinejoin="round" />)}
      <text x="50" y="44" fontSize="21" textAnchor="middle" dominantBaseline="central" fill={INK.ink}>{place}</text>
    </svg>
  )
}

/** A paper plane, folded from a page and sent off in a loop. */
export function PaperPlane() {
  const o = (i: number, extra = {}) => ({ seed: 60 + i, stroke: INK.ink, strokeWidth: 1.4, roughness: 0.8, ...extra })
  const marks = [
    ...draw(gen.curve([[8, 92], [40, 70], [70, 86], [62, 104], [44, 92], [70, 58], [112, 44]], o(0, { stroke: INK.pencil, strokeWidth: 1.2 })), true),
    ...draw(gen.polygon([[118, 40], [176, 16], [140, 58]], o(1, { fill: '#fbf8f0', fillStyle: 'solid' }))),
    ...draw(gen.polygon([[118, 40], [176, 16], [132, 46], [136, 66]], o(2, { fill: '#e6f0f6', fillStyle: 'solid' }))),
    ...draw(gen.line(132, 46, 176, 16, o(3))),
  ]
  return (
    <svg className="nb-plane" viewBox="0 0 184 112" role="img" aria-label="A paper plane">
      {marks.map((m, i) => (
        <path key={i} d={m.d} stroke={m.stroke} strokeWidth={m.strokeWidth} fill={m.fill ?? 'none'}
              strokeDasharray={m.dashed ? '5 5' : undefined} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  )
}

/** A personality result as hand-ruled bars, each filled with highlighter to its percentage. */
export function TraitBars({ traits }: { traits: Traits }) {
  const W = 300, step = 42, bar = 10
  const marks: Drawn[] = []
  traits.rows.forEach((r, i) => {
    const y = i * step + 22
    marks.push(...draw(gen.rectangle(1, y, (W - 2) * r.pct / 100, bar,
      { seed: 320 + i, fill: MARKER, fillStyle: 'hachure', hachureGap: 2.6, fillWeight: 1.8, stroke: 'none', roughness: 1 })))
    marks.push(...draw(gen.rectangle(1, y, W - 2, bar, { seed: 300 + i, stroke: INK.ink, strokeWidth: 1.1, roughness: 0.9 })))
  })
  return (
    <svg className="nb-traits" viewBox={`0 0 ${W} ${traits.rows.length * step + 4}`} role="img"
         aria-label={traits.rows.map(r => `${r.pct}% ${r.trait}`).join(', ')}>
      {marks.map((m, i) => (
        <path key={i} d={m.d} stroke={m.stroke} strokeWidth={m.strokeWidth} fill={m.fill ?? 'none'} strokeLinecap="round" />
      ))}
      {traits.rows.map((r, i) => (
        <g key={r.trait}>
          <text x="1" y={i * step + 13} fontSize="14" fill={INK.ink}>{r.pct}% {r.trait}</text>
          <text x={W - 1} y={i * step + 13} fontSize="12" fill={INK.pencil} textAnchor="end">vs {r.vs}</text>
        </g>
      ))}
    </svg>
  )
}
