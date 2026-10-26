/** Die-cut stickers stuck on project pages — click one to go to the project.
 *  The backing is machine-cut (smooth); the picture on it is drawn by hand. */

import rough from 'roughjs'
import type { ReactNode } from 'react'
import type { Sticker as StickerSpec } from '@/lib/notebook'
import { INK, settle } from './Ink'

const gen = rough.generator()

type Shape = ReturnType<typeof gen.circle>

function Drawn({ shape }: { shape: Shape }) {
  return (
    <>
      {gen.toPaths(shape).map((p, i) => (
        <path key={i} d={settle(p.d)} stroke={p.stroke} strokeWidth={p.strokeWidth} fill={p.fill ?? 'none'}
              strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </>
  )
}

const solid = (fill: string, seed: number, stroke = INK.ink) =>
  ({ seed, fill, fillStyle: 'solid', stroke, strokeWidth: 1.6, roughness: 0.9 })

/** A robin: brown back, orange breast, on a pale sky. */
function Robin() {
  return (
    <>
      <rect x="8" y="8" width="84" height="84" rx="14" fill="#e6f0f6" />
      <Drawn shape={gen.polygon([[30, 52], [10, 40], [14, 58]], solid('#6b4e32', 3))} />
      <Drawn shape={gen.ellipse(50, 54, 50, 42, solid('#7a5a3a', 4))} />
      <Drawn shape={gen.ellipse(44, 61, 28, 25, solid('#e0662d', 5))} />
      <Drawn shape={gen.circle(66, 38, 24, solid('#7a5a3a', 6))} />
      <Drawn shape={gen.polygon([[77, 37], [88, 40], [77, 44]], solid('#f2b134', 7))} />
      <circle cx="69" cy="35.5" r="2.2" fill={INK.ink} />
      <Drawn shape={gen.line(46, 74, 43, 84, { seed: 8, stroke: INK.ink, strokeWidth: 1.6, roughness: 0.6 })} />
      <Drawn shape={gen.line(55, 74, 57, 84, { seed: 9, stroke: INK.ink, strokeWidth: 1.6, roughness: 0.6 })} />
    </>
  )
}

/** A crescent moon and three stars, on the night sky NightyNight's landing page has. */
function Moon() {
  const star = (x: number, y: number, r: number) =>
    `M${x} ${y - r}L${x + r * 0.3} ${y - r * 0.3}L${x + r} ${y}L${x + r * 0.3} ${y + r * 0.3}L${x} ${y + r}` +
    `L${x - r * 0.3} ${y + r * 0.3}L${x - r} ${y}L${x - r * 0.3} ${y - r * 0.3}Z`
  return (
    <>
      <rect x="8" y="8" width="84" height="84" rx="14" fill="#1f2a4a" />
      <Drawn shape={gen.circle(48, 50, 48, solid('#f7c83a', 11, '#f7c83a'))} />
      <Drawn shape={gen.circle(60, 42, 42, { seed: 12, fill: '#1f2a4a', fillStyle: 'solid', stroke: 'none', roughness: 0.7 })} />
      <path d={star(24, 28, 5)} fill="#fbf8f0" />
      <path d={star(78, 72, 4)} fill="#f7c83a" />
      <path d={star(72, 24, 3)} fill="#fbf8f0" />
    </>
  )
}

/** A parking sign. */
function Parking() {
  return (
    <>
      <rect x="8" y="8" width="84" height="84" rx="14" fill={INK.blue} />
      <Drawn shape={gen.rectangle(16, 16, 68, 68, { seed: 21, stroke: '#fbf8f0', strokeWidth: 2.2, roughness: 1 })} />
      <text x="50" y="54" fontSize="54" textAnchor="middle" dominantBaseline="central" fill="#fbf8f0">P</text>
    </>
  )
}

const ART: Record<StickerSpec['kind'], () => ReactNode> = { robin: Robin, moon: Moon, parking: Parking }

export function Sticker({ spec, href, title }: { spec: StickerSpec; href: string; title: string }) {
  const Art = ART[spec.kind]
  return (
    <a className={`nb-sticker nb-sticker-${spec.kind}`} href={href} target="_blank" rel="noopener" aria-label={title}>
      <svg viewBox="0 0 100 120" aria-hidden="true">
        <rect x="1" y="1" width="98" height="118" rx="19" fill="#fff" />
        <Art />
        <text x="50" y="106" fontSize="14" textAnchor="middle" dominantBaseline="central" fill={INK.ink}>{spec.label}</text>
      </svg>
    </a>
  )
}

/** A clapperboard. */
function Film() {
  return (
    <>
      <Drawn shape={gen.rectangle(12, 46, 76, 42, solid('#2b2f36', 41))} />
      <Drawn shape={gen.polygon([[11, 42], [85, 24], [88, 35], [14, 53]], solid('#2b2f36', 42))} />
      {[[24, 40], [42, 35.5], [60, 31]].map(([x, y], i) => (
        <Drawn key={i} shape={gen.polygon([[x, y + 1], [x + 8, y - 1], [x + 3, y + 9], [x - 5, y + 11]],
          { seed: 43 + i, fill: '#fbf8f0', fillStyle: 'solid', stroke: 'none', roughness: 0.6 })} />
      ))}
      <Drawn shape={gen.line(22, 62, 78, 62, { seed: 47, stroke: '#fbf8f0', strokeWidth: 1.6, roughness: 0.8 })} />
      <Drawn shape={gen.line(22, 74, 62, 74, { seed: 48, stroke: '#fbf8f0', strokeWidth: 1.6, roughness: 0.8 })} />
    </>
  )
}

/** A game controller. */
function Game() {
  const body = 'M26 34h48c11 0 17 8 19 19l4 19c2 11-9 17-17 10l-11-10H31l-11 10c-8 7-19 1-17-10l4-19c2-11 8-19 19-19z'
  return (
    <>
      <Drawn shape={gen.path(body, solid('#c8372c', 51))} />
      <Drawn shape={gen.rectangle(23, 48, 6, 18, { seed: 52, fill: '#fbf8f0', fillStyle: 'solid', stroke: 'none', roughness: 0.5 })} />
      <Drawn shape={gen.rectangle(17, 54, 18, 6, { seed: 53, fill: '#fbf8f0', fillStyle: 'solid', stroke: 'none', roughness: 0.5 })} />
      <Drawn shape={gen.circle(70, 50, 8, solid('#f7c83a', 54, '#f7c83a'))} />
      <Drawn shape={gen.circle(79, 58, 8, solid('#2457c5', 55, '#2457c5'))} />
      <Drawn shape={gen.circle(61, 58, 8, solid('#3b8a5a', 56, '#3b8a5a'))} />
      <Drawn shape={gen.circle(70, 66, 8, solid('#fbf8f0', 57, '#fbf8f0'))} />
    </>
  )
}

/** 🎬 and 🎮, drawn in the notebook's own pen — a label you can also pick up and move. */
export function Doodle({ kind, label }: { kind: 'film' | 'game'; label: string }) {
  const Art = kind === 'film' ? Film : Game
  return (
    <span className={`nb-doodle nb-doodle-${kind}`} role="img" aria-label={label}>
      <svg viewBox="0 0 100 100" aria-hidden="true"><Art /></svg>
    </span>
  )
}

/* ── Stickers for the front cover only — none of them appear inside ── */

/** The machine-cut white border of a sticker trimmed to its own outline:
 *  the silhouette, drawn fat in white under the picture. */
function Cut({ width = 10, children }: { width?: number; children: ReactNode }) {
  return <g fill="#fff" stroke="#fff" strokeWidth={width} strokeLinejoin="round">{children}</g>
}

/** A black hole, Interstellar-style, on a round sticker: a dark shadow inside a
 *  bright photon ring, the accretion disk crossing in front of it and its lensed
 *  image arching over the top. Drawn back to front. */
function BlackHole() {
  const dots = [[24, 24], [78, 22], [22, 76], [80, 74], [60, 12], [11, 46]]
  const glow = (seed: number, stroke: string, strokeWidth: number) => ({ seed, stroke, strokeWidth, roughness: 0.5 })
  return (
    <>
      <circle cx="50" cy="50" r="49" fill="#fff" />
      <circle cx="50" cy="50" r="44" fill="#0b0e1a" />
      {dots.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.2" fill="#fbf8f0" />)}
      {/* the far side of the disk, behind the hole */}
      <Drawn shape={gen.ellipse(50, 56, 82, 12, glow(81, '#e0861c', 5))} />
      {/* the disk's image bent up and over the top by the hole's gravity */}
      <Drawn shape={gen.arc(50, 54, 60, 56, Math.PI * 1.04, Math.PI * 1.96, false, glow(82, '#e0861c', 8))} />
      <Drawn shape={gen.arc(50, 54, 60, 56, Math.PI * 1.04, Math.PI * 1.96, false, glow(83, '#ffd27a', 3.4))} />
      {/* a hairline photon ring, then the shadow it surrounds */}
      <circle cx="50" cy="54" r="17.5" fill="none" stroke="#fff3d6" strokeWidth="1" />
      <circle cx="50" cy="54" r="16.5" fill="#000" />
      {/* the near side of the disk, in front of the hole */}
      <Drawn shape={gen.arc(50, 56, 82, 12, 0, Math.PI, false, glow(85, '#e0861c', 5))} />
      <Drawn shape={gen.arc(50, 56, 82, 12, 0, Math.PI, false, glow(86, '#ffe7a8', 2.2))} />
    </>
  )
}

/** A terminal window with a prompt waiting. */
function Terminal() {
  return (
    <>
      <rect x="1" y="7" width="98" height="86" rx="15" fill="#fff" />
      <rect x="7" y="13" width="86" height="74" rx="9" fill="#1f2329" />
      <circle cx="18" cy="24" r="3" fill="#ec6a5e" /><circle cx="28" cy="24" r="3" fill="#f4bf4f" /><circle cx="38" cy="24" r="3" fill="#61c554" />
      <Drawn shape={gen.linearPath([[22, 44], [36, 56], [22, 68]], { seed: 83, stroke: '#4ade80', strokeWidth: 4, roughness: 0.6 })} />
      <Drawn shape={gen.line(44, 70, 66, 70, { seed: 84, stroke: '#4ade80', strokeWidth: 4, roughness: 0.6 })} />
    </>
  )
}

/** A little rocket on its way up and to the right, cut to its outline. */
const ROCKET_BODY = 'M50 12C62 24 62 52 58 76H42C38 52 38 24 50 12Z'
const FINS = [[[44, 72], [36, 84], [44, 80]], [[56, 72], [64, 84], [56, 80]]] as [number, number][][]
const FLAME: [number, number][] = [[44, 78], [50, 94], [56, 78]]
const points = (pts: [number, number][]) => pts.map(p => p.join(',')).join(' ')

function Rocket() {
  return (
    <g transform="rotate(40 50 50)">
      <Cut>
        <path d={ROCKET_BODY} />
        {[...FINS, FLAME].map((pts, i) => <polygon key={i} points={points(pts)} />)}
      </Cut>
      <Drawn shape={gen.polygon(FINS[0], solid('#c8372c', 85))} />
      <Drawn shape={gen.polygon(FINS[1], solid('#c8372c', 86))} />
      <Drawn shape={gen.polygon(FLAME, { seed: 87, fill: '#f7c83a', fillStyle: 'solid', stroke: '#e0861c', strokeWidth: 1.4, roughness: 0.9 })} />
      <Drawn shape={gen.path(ROCKET_BODY, solid('#fbf8f0', 88))} />
      <Drawn shape={gen.circle(50, 42, 12, solid('#2457c5', 89))} />
    </g>
  )
}

/** The bat-signal: a black bat in a yellow oval, die-cut to the oval.
 *  Each wing's trailing edge is three scalloped curves, not straight teeth. */
const BAT =
  'M50 41L52.5 33L55.5 40.5Q60 38.5 66 37Q80 33 93 40Q86 44 85.5 52Q80 47 76 56Q71 51 66 60Q60 56 56 61Q52 61 50 67' +
  'Q48 61 44 61Q40 56 34 60Q29 51 24 56Q20 47 14.5 52Q14 44 7 40Q20 33 34 37Q40 38.5 44.5 40.5L47.5 33Z'

function Bat() {
  return (
    <>
      <ellipse cx="50" cy="50" rx="49" ry="33" fill="#fff" />
      <Drawn shape={gen.ellipse(50, 50, 88, 56, solid('#f7c83a', 94))} />
      <Drawn shape={gen.path(BAT, { seed: 95, fill: '#1b1d22', fillStyle: 'solid', stroke: '#1b1d22', strokeWidth: 0.8, roughness: 0.25 })} />
    </>
  )
}

/** A small neural network on a hexagon, the shape of a dev-conference sticker:
 *  three layers, every node wired to the next layer. */
const hexagon = (r: number): [number, number][] =>
  [-90, -30, 30, 90, 150, 210].map(a => [50 + r * Math.cos(a * Math.PI / 180), 50 + r * Math.sin(a * Math.PI / 180)].map(v => Math.round(v * 100) / 100) as [number, number])

function NeuralNet() {
  const layers = [[30, 50, 70], [24, 41, 59, 76], [38, 62]]
  const xs = [26, 50, 74]
  const tones = ['#2457c5', '#f7c83a', '#c8372c']
  const lines: JSX.Element[] = []
  layers.slice(0, -1).forEach((col, l) => col.forEach((y1, i) => layers[l + 1].forEach((y2, j) => lines.push(
    <Drawn key={`${l}-${i}-${j}`} shape={gen.line(xs[l], y1, xs[l + 1], y2, { seed: 100 + l * 20 + i * 4 + j, stroke: '#9aa3b2', strokeWidth: 1.1, roughness: 0.6 })} />,
  ))))
  return (
    <>
      <Cut width={6}><polygon points={points(hexagon(46))} /></Cut>
      <Drawn shape={gen.polygon(hexagon(42), { seed: 99, fill: '#eef2f8', fillStyle: 'solid', stroke: 'none', roughness: 0.4 })} />
      {lines}
      {layers.map((col, l) => col.map((y, i) => (
        <Drawn key={`n${l}-${i}`} shape={gen.circle(xs[l], y, 12, solid(tones[l], 130 + l * 5 + i))} />
      )))}
    </>
  )
}

/** Pi, the agent harness Robin is built on: its pixel π in three blocks, cut to
 *  the outline of the letter. Its own shapes and colours, from pi.dev's logo —
 *  printed, not drawn, since a wobble would break the pixels apart. */
const PI = [
  { d: 'M20.66 20.66H64.67V50H50V35.33H20.66Z', fill: '#f09082' },
  { d: 'M20.66 35.33H35.33V50H50V64.67H35.33V79.34H20.66Z', fill: '#4d9abf' },
  { d: 'M64.67 50H79.34V79.34H64.67Z', fill: '#f1be58' },
]

function Pi() {
  return (
    <>
      <Cut width={14}>{PI.map(b => <path key={b.fill} d={b.d} />)}</Cut>
      {PI.map(b => <path key={b.fill} d={b.d} fill={b.fill} />)}
    </>
  )
}

/** A friendly robot head, cut to its outline. */
function Robot() {
  return (
    <g transform="translate(0 8)">
      <Cut>
        <circle cx="50" cy="14" r="4" /><rect x="48" y="14" width="4" height="12" />
        <rect x="16" y="42" width="8" height="18" /><rect x="76" y="42" width="8" height="18" />
        <rect x="24" y="26" width="52" height="48" />
      </Cut>
      <Drawn shape={gen.line(50, 26, 50, 16, { seed: 141, stroke: INK.ink, strokeWidth: 2, roughness: 0.5 })} />
      <Drawn shape={gen.circle(50, 14, 8, solid('#c8372c', 142))} />
      <Drawn shape={gen.rectangle(16, 42, 8, 18, solid('#9aa3b2', 143))} />
      <Drawn shape={gen.rectangle(76, 42, 8, 18, solid('#9aa3b2', 144))} />
      <Drawn shape={gen.rectangle(24, 26, 52, 48, solid('#dfe6ee', 145))} />
      <Drawn shape={gen.circle(38, 44, 11, solid('#22c3d6', 146))} />
      <Drawn shape={gen.circle(62, 44, 11, solid('#22c3d6', 147))} />
      <Drawn shape={gen.rectangle(37, 58, 26, 7, solid('#fbf8f0', 148))} />
      <Drawn shape={gen.line(43.5, 58, 43.5, 65, { seed: 149, stroke: INK.ink, strokeWidth: 1.2, roughness: 0.4 })} />
      <Drawn shape={gen.line(50, 58, 50, 65, { seed: 150, stroke: INK.ink, strokeWidth: 1.2, roughness: 0.4 })} />
      <Drawn shape={gen.line(56.5, 58, 56.5, 65, { seed: 151, stroke: INK.ink, strokeWidth: 1.2, roughness: 0.4 })} />
    </g>
  )
}

/* The tools' own marks, from simple-icons (CC0), printed rather than drawn —
   on a 24-unit grid, so each is scaled up onto the 100-unit sticker. */

/** Python's two snakes, blue and yellow, cut to their outline. */
const PYTHON = ['M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09z',
  'M21.04 6.11l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.1.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01zm-6.47 14.25l-.23.33-.08.41.08.41.23.33.33.23.41.08.41-.08.33-.23.23-.33.08-.41-.08-.41-.23-.33-.33-.23-.41-.08-.41.08z']

function Python() {
  return (
    <g transform="translate(14 14) scale(3)">
      <Cut width={3.4}>{PYTHON.map((d, i) => <path key={i} d={d} />)}</Cut>
      <path d={PYTHON[0]} fill="#3776ab" fillRule="evenodd" />
      <path d={PYTHON[1]} fill="#ffd43b" fillRule="evenodd" />
    </g>
  )
}

/** Docker's whale, carrying its containers, cut to its outline. */
const DOCKER = 'M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 00.186-.186V3.574a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m0 2.716h2.118a.187.187 0 00.186-.186V6.29a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.887c0 .102.082.185.185.186m-2.93 0h2.12a.186.186 0 00.184-.186V6.29a.185.185 0 00-.185-.185H8.1a.185.185 0 00-.185.185v1.887c0 .102.083.185.185.186m-2.964 0h2.119a.186.186 0 00.185-.186V6.29a.185.185 0 00-.185-.185H5.136a.186.186 0 00-.186.185v1.887c0 .102.084.185.186.186m5.893 2.715h2.118a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 00.185-.185V9.006a.185.185 0 00-.184-.186h-2.12a.186.186 0 00-.186.186v1.887c0 .102.084.185.186.185m-2.92 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.082.185.185.185M23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.42H.751a.751.751 0 00-.75.748 11.376 11.376 0 00.692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983.003 1.963-.086 2.93-.266a12.248 12.248 0 003.823-1.389c.98-.567 1.86-1.288 2.61-2.136 1.252-1.418 1.998-2.997 2.553-4.4h.221c1.372 0 2.215-.549 2.68-1.009.309-.293.55-.65.707-1.046l.098-.288Z'

function Docker() {
  return (
    <g transform="translate(8 9) scale(3.5)">
      <Cut width={3}><path d={DOCKER} /></Cut>
      <path d={DOCKER} fill="#2496ed" />
    </g>
  )
}

/** React's atom, on a round dark sticker. */
const REACT = 'M14.23 12.004a2.236 2.236 0 0 1-2.235 2.236 2.236 2.236 0 0 1-2.236-2.236 2.236 2.236 0 0 1 2.235-2.236 2.236 2.236 0 0 1 2.236 2.236zm2.648-10.69c-1.346 0-3.107.96-4.888 2.622-1.78-1.653-3.542-2.602-4.887-2.602-.41 0-.783.093-1.106.278-1.375.793-1.683 3.264-.973 6.365C1.98 8.917 0 10.42 0 12.004c0 1.59 1.99 3.097 5.043 4.03-.704 3.113-.39 5.588.988 6.38.32.187.69.275 1.102.275 1.345 0 3.107-.96 4.888-2.624 1.78 1.654 3.542 2.603 4.887 2.603.41 0 .783-.09 1.106-.275 1.374-.792 1.683-3.263.973-6.365C22.02 15.096 24 13.59 24 12.004c0-1.59-1.99-3.097-5.043-4.032.704-3.11.39-5.587-.988-6.38-.318-.184-.688-.277-1.092-.278zm-.005 1.09v.006c.225 0 .406.044.558.127.666.382.955 1.835.73 3.704-.054.46-.142.945-.25 1.44-.96-.236-2.006-.417-3.107-.534-.66-.905-1.345-1.727-2.035-2.447 1.592-1.48 3.087-2.292 4.105-2.295zm-9.77.02c1.012 0 2.514.808 4.11 2.28-.686.72-1.37 1.537-2.02 2.442-1.107.117-2.154.298-3.113.538-.112-.49-.195-.964-.254-1.42-.23-1.868.054-3.32.714-3.707.19-.09.4-.127.563-.132zm4.882 3.05c.455.468.91.992 1.36 1.564-.44-.02-.89-.034-1.345-.034-.46 0-.915.01-1.36.034.44-.572.895-1.096 1.345-1.565zM12 8.1c.74 0 1.477.034 2.202.093.406.582.802 1.203 1.183 1.86.372.64.71 1.29 1.018 1.946-.308.655-.646 1.31-1.013 1.95-.38.66-.773 1.288-1.18 1.87-.728.063-1.466.098-2.21.098-.74 0-1.477-.035-2.202-.093-.406-.582-.802-1.204-1.183-1.86-.372-.64-.71-1.29-1.018-1.946.303-.657.646-1.313 1.013-1.954.38-.66.773-1.286 1.18-1.868.728-.064 1.466-.098 2.21-.098zm-3.635.254c-.24.377-.48.763-.704 1.16-.225.39-.435.782-.635 1.174-.265-.656-.49-1.31-.676-1.947.64-.15 1.315-.283 2.015-.386zm7.26 0c.695.103 1.365.23 2.006.387-.18.632-.405 1.282-.66 1.933-.2-.39-.41-.783-.64-1.174-.225-.392-.465-.774-.705-1.146zm3.063.675c.484.15.944.317 1.375.498 1.732.74 2.852 1.708 2.852 2.476-.005.768-1.125 1.74-2.857 2.475-.42.18-.88.342-1.355.493-.28-.958-.646-1.956-1.1-2.98.45-1.017.81-2.01 1.085-2.964zm-13.395.004c.278.96.645 1.957 1.1 2.98-.45 1.017-.812 2.01-1.086 2.964-.484-.15-.944-.318-1.37-.5-1.732-.737-2.852-1.706-2.852-2.474 0-.768 1.12-1.742 2.852-2.476.42-.18.88-.342 1.356-.494zm11.678 4.28c.265.657.49 1.312.676 1.948-.64.157-1.316.29-2.016.39.24-.375.48-.762.705-1.158.225-.39.435-.788.636-1.18zm-9.945.02c.2.392.41.783.64 1.175.23.39.465.772.705 1.143-.695-.102-1.365-.23-2.006-.386.18-.63.406-1.282.66-1.933zM17.92 16.32c.112.493.2.968.254 1.423.23 1.868-.054 3.32-.714 3.708-.147.09-.338.128-.563.128-1.012 0-2.514-.807-4.11-2.28.686-.72 1.37-1.536 2.02-2.44 1.107-.118 2.154-.3 3.113-.54zm-11.83.01c.96.234 2.006.415 3.107.532.66.905 1.345 1.727 2.035 2.446-1.595 1.483-3.092 2.295-4.11 2.295-.22-.005-.406-.05-.553-.132-.666-.38-.955-1.834-.73-3.703.054-.46.142-.944.25-1.438zm4.56.64c.44.02.89.034 1.345.034.46 0 .915-.01 1.36-.034-.44.572-.895 1.095-1.345 1.565-.455-.47-.91-.993-1.36-1.565z'

function ReactAtom() {
  return (
    <>
      <circle cx="50" cy="50" r="49" fill="#fff" />
      <circle cx="50" cy="50" r="44" fill="#20232a" />
      <path d={REACT} fill="#61dafb" transform="translate(16 16) scale(2.84)" />
    </>
  )
}

/** FastAPI's bolt in its teal disc — the bolt is a hole in the disc, so the white shows through. */
const FASTAPI = 'M12 .0387C5.3729.0384.0003 5.3931 0 11.9988c-.001 6.6066 5.372 11.9628 12 11.9625 6.628.0003 12.001-5.3559 12-11.9625-.0003-6.6057-5.3729-11.9604-12-11.96m-.829 5.4153h7.55l-7.5805 5.3284h5.1828L5.279 18.5436q2.9466-6.5444 5.892-13.0896'

function FastAPI() {
  return (
    <>
      <circle cx="50" cy="50" r="49" fill="#fff" />
      <path d={FASTAPI} fill="#009688" transform="translate(6.5 6.5) scale(3.625)" />
    </>
  )
}

const COVER_ART = {
  blackhole: BlackHole, terminal: Terminal, rocket: Rocket, bat: Bat, neural: NeuralNet, pi: Pi, robot: Robot,
  python: Python, docker: Docker, react: ReactAtom, fastapi: FastAPI,
}
export type CoverArt = keyof typeof COVER_ART

/** A sticker with nowhere to go — stuck on the front cover for the look of it.
 *  Each one is die-cut to its own outline: round, oval, hexagon, or the shape of
 *  the thing itself. */
export function Decal({ kind, label }: { kind: CoverArt; label: string }) {
  const Art = COVER_ART[kind]
  return (
    <span className={`nb-decal nb-decal-${kind}`} role="img" aria-label={label}>
      <svg viewBox="0 0 100 100" aria-hidden="true"><Art /></svg>
    </span>
  )
}
