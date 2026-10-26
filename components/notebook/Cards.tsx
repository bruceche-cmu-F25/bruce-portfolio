/** The page numbers: a deck of playing cards, ace to king, one tucked into the
 *  corner of each page. Every card is drawn in a style of its own and carries a
 *  finish on its surface, the way Balatro's jokers do — pick one up to look at it.
 *
 *  The art is SVG. Its filters, patterns and gradients live once, in <CardDefs/>,
 *  outside the hidden source tree: page-flip clones every page, so ids written
 *  into the cards themselves would be repeated, and the first of them is in a
 *  display:none subtree that browsers won't paint from. */

import type { ReactNode, SVGProps } from 'react'

type PathProps = Omit<SVGProps<SVGPathElement>, 'x' | 'y'>

type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs'

/** Each suit in a 100-unit box, centred on (50, 50). */
const SUIT: Record<Suit, string> = {
  spades: 'M50 4C62 22 96 40 96 62C96 76 85 84 74 84C64 84 57 79 54 72C55 82 58 90 66 96H34C42 90 45 82 46 72C43 79 36 84 26 84C15 84 4 76 4 62C4 40 38 22 50 4Z',
  hearts: 'M50 92C26 74 4 56 4 32C4 16 16 6 29 6C39 6 46 12 50 20C54 12 61 6 71 6C84 6 96 16 96 32C96 56 74 74 50 92Z',
  diamonds: 'M50 2Q66 28 88 50Q66 72 50 98Q34 72 12 50Q34 28 50 2Z',
  clubs: 'M50 4C61 4 70 13 70 24C70 30 68 35 64 39C67 38 70 37 73 37C85 37 95 47 95 59C95 71 85 80 73 80C64 80 57 76 54 69C55 80 58 89 66 96H34C42 89 45 80 46 69C43 76 36 80 27 80C15 80 5 71 5 59C5 47 15 37 27 37C30 37 33 38 36 39C32 35 30 30 30 24C30 13 39 4 50 4Z',
}
const SYMBOL: Record<Suit, string> = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' }

function Pip({ suit, x, y, size, flip, ...rest }: { suit: Suit; x: number; y: number; size: number; flip?: boolean } & PathProps) {
  return <path d={SUIT[suit]} transform={`translate(${x} ${y}) rotate(${flip ? 180 : 0}) scale(${size / 100}) translate(-50 -50)`} {...rest} />
}

/** Where the pips go for 2 to 10, on a 250 × 350 card; the lower ones stand on their heads. */
const L = 82, R = 168, C = 125
const PIPS: Record<number, [number, number][]> = {
  2: [[C, 95], [C, 255]],
  3: [[C, 88], [C, 175], [C, 262]],
  4: [[L, 95], [R, 95], [L, 255], [R, 255]],
  5: [[L, 95], [R, 95], [C, 175], [L, 255], [R, 255]],
  6: [[L, 90], [R, 90], [L, 175], [R, 175], [L, 260], [R, 260]],
  7: [[L, 90], [R, 90], [C, 132], [L, 175], [R, 175], [L, 260], [R, 260]],
  8: [[L, 85], [R, 85], [C, 130], [L, 175], [R, 175], [C, 220], [L, 265], [R, 265]],
  9: [[L, 82], [R, 82], [L, 142], [R, 142], [C, 175], [L, 208], [R, 208], [L, 268], [R, 268]],
  10: [[L, 78], [R, 78], [C, 112], [L, 140], [R, 140], [L, 210], [R, 210], [C, 238], [L, 272], [R, 272]],
}
const pips = (n: number) => PIPS[n].map(([x, y]) => ({ x, y, flip: y > 175 }))

const SERIF = "Georgia, 'Times New Roman', serif"
const MONO = "'Courier New', ui-monospace, Menlo, monospace"
const GEO = "Futura, 'Avenir Next', 'Century Gothic', 'Helvetica Neue', Arial, sans-serif"
const DIDOT = "Didot, 'Bodoni 72', 'Bodoni MT', Georgia, serif"
const POSTER = "Impact, 'Arial Black', 'Helvetica Neue', sans-serif"

/** The rank and suit in two opposite corners. */
function Corners({ rank, suit, color, font, size = 30, weight = 400, pip = 18, style, pipProps }: {
  rank: string; suit: Suit; color: string; font: string; size?: number; weight?: number; pip?: number
  style?: SVGProps<SVGTextElement>['style']; pipProps?: PathProps
}) {
  const one = (
    <g>
      <text x="25" y={16 + size * 0.82} fontSize={size} fontFamily={font} fontWeight={weight} fill={color} textAnchor="middle" style={style}>{rank}</text>
      <Pip suit={suit} x={25} y={26 + size * 0.82 + pip / 2} size={pip} fill={color} {...pipProps} />
    </g>
  )
  return <>{one}<g transform="rotate(180 125 175)">{one}</g></>
}

/** A seeded random, so the server and the browser draw the same card. */
function seeded(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const r1 = (n: number) => Math.round(n * 10) / 10

/* ── the styles ───────────────────────────────────────────────────── */

/** A♠ — an engraved ace, all fine line on old paper. */
function Engraving() {
  const ink = '#2b2118'
  return (
    <>
      <rect width="250" height="350" fill="#f2e8d2" />
      <rect width="250" height="350" fill="url(#nbc-vignette)" />
      <rect x="11" y="11" width="228" height="328" rx="9" fill="none" stroke={ink} strokeWidth="1.6" />
      <rect x="16" y="16" width="218" height="318" rx="6" fill="none" stroke={ink} strokeWidth="0.6" />
      {[0, 1].map(i => (
        <g key={i} transform={i ? 'rotate(180 125 175)' : undefined} fill="none" stroke={ink} strokeWidth="1" strokeLinecap="round">
          <path d="M95 36C104 24 116 24 125 33C134 24 146 24 155 36" />
          <path d="M104 38C110 32 118 32 125 38C132 32 140 32 146 38" />
          <path d="M125 26L129 32L125 38L121 32Z" fill={ink} />
        </g>
      ))}
      {/* rays behind the spade */}
      <g stroke={ink} strokeWidth="0.5" opacity="0.55">
        {Array.from({ length: 36 }, (_, i) => {
          const a = (i / 36) * Math.PI * 2
          return <line key={i} x1={r1(125 + Math.cos(a) * 30)} y1={r1(182 + Math.sin(a) * 30)} x2={r1(125 + Math.cos(a) * 92)} y2={r1(182 + Math.sin(a) * 92)} />
        })}
      </g>
      <Pip suit="spades" x={125} y={172} size={150} fill="#f2e8d2" />
      <Pip suit="spades" x={125} y={172} size={150} fill="url(#nbc-hatch)" stroke={ink} strokeWidth="2" />
      <Pip suit="spades" x={125} y={170} size={122} fill="none" stroke={ink} strokeWidth="0.8" />
      <circle cx="125" cy="180" r="25" fill="#f2e8d2" stroke={ink} strokeWidth="1.4" />
      <circle cx="125" cy="180" r="21" fill="none" stroke={ink} strokeWidth="0.6" />
      <Pip suit="spades" x={125} y={179} size={26} fill={ink} />
      <path d="M56 262H194L186 273L194 284H56L64 273Z" fill="#f2e8d2" stroke={ink} strokeWidth="1.2" />
      <text x="125" y="277" fontSize="9" fontFamily={SERIF} letterSpacing="2.2" textAnchor="middle" fill={ink}>ACE · OF · SPADES</text>
      <Corners rank="A" suit="spades" color={ink} font={SERIF} />
    </>
  )
}

const ASCII_HEART = [' ,d88b.d88b, ', ' 88888888888 ', ' `Y8888888Y\' ', '   `Y888Y\'   ', '     `Y\'     ']
const ASCII_NOISE = ' .:-=+*#%01{}<>/\\|'

/** 2♥ — ASCII art in a terminal: two hearts typed out of characters. */
function Ascii() {
  const rand = seeded(2)
  const rows = Array.from({ length: 34 }, () => Array.from({ length: 48 }, () => ASCII_NOISE[Math.floor(rand() * ASCII_NOISE.length)]).join(''))
  const pre = { whiteSpace: 'pre' as const }
  const heart = (y: number, flip?: boolean) => (
    <text x="125" fontSize="17" fontFamily={MONO} fontWeight="700" fill="#ff5c6c" textAnchor="middle" xmlSpace="preserve" style={pre}
          transform={flip ? 'rotate(180 125 175)' : undefined}>
      {ASCII_HEART.map((line, i) => <tspan key={i} x="125" y={y + i * 16}>{line}</tspan>)}
    </text>
  )
  return (
    <>
      <rect width="250" height="350" fill="#0c1016" />
      <text fontSize="9" fontFamily={MONO} fill="#1c2833" xmlSpace="preserve" style={pre}>
        {rows.map((row, i) => <tspan key={i} x="2" y={10 + i * 10.3}>{row}</tspan>)}
      </text>
      <rect x="40" y="70" width="170" height="210" fill="#0c1016" opacity="0.75" />
      {heart(92)}
      {heart(92, true)}
      <text x="125" y="179" fontSize="12" fontFamily={MONO} fill="#3fb950" textAnchor="middle" xmlSpace="preserve" style={pre}>&gt; two_of_hearts<tspan fill="#3fb950">█</tspan></text>
      {[0, 1].map(i => (
        <g key={i} transform={i ? 'rotate(180 125 175)' : undefined} fontFamily={MONO} textAnchor="middle">
          <text x="24" y="38" fontSize="28" fontWeight="700" fill="#3fb950">2</text>
          <text x="24" y="56" fontSize="14" fontWeight="700" fill="#ff5c6c">&lt;3</text>
        </g>
      ))}
    </>
  )
}

const KANA = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜ0123456789'
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif"
const ROUND = "'Arial Rounded MT Bold', 'Varela Round', Nunito, 'Helvetica Neue', Arial, sans-serif"
const KAI = "'Kaiti SC', STKaiti, KaiTi, 'Songti SC', serif"

/** 3♦ — dev: an editor dealing three diamonds, and the git graph they were committed in. */
function Code() {
  const kw = '#c792ea', fn = '#82aaff', str = '#c3e88d', num = '#f78c6c', cm = '#676e95', tx = '#d6deeb'
  const lines: [string, string][][] = [
    [[kw, 'const '], [tx, 'suit '], [fn, '= '], [str, "'♦'"]],
    [],
    [[kw, 'function '], [fn, 'deal'], [tx, '(n: '], [kw, 'number'], [tx, ') {']],
    [[kw, '  return '], [tx, 'Array(n).'], [fn, 'fill'], [tx, '(suit)']],
    [[tx, '}']],
    [],
    [[fn, 'deal'], [tx, '('], [num, '3'], [tx, ') '], [cm, '// ♦ ♦ ♦']],
  ]
  return (
    <>
      <rect width="250" height="350" fill="#1e1f29" />
      <rect width="250" height="40" fill="#15161e" />
      <text x="14" y="28" fontSize="20" fontFamily={MONO} fontWeight="700" fill="#ff5c6c">3♦</text>
      <rect x="62" y="12" width="92" height="28" rx="5" fill="#1e1f29" />
      <text x="72" y="31" fontSize="10" fontFamily={MONO} fill={tx}>deal.ts</text>
      {[200, 214, 228].map((x, i) => <circle key={x} cx={x} cy="20" r="4.5" fill={['#ff5f57', '#febc2e', '#28c840'][i]} />)}
      <g fontFamily={MONO} fontSize="10" xmlSpace="preserve" style={{ whiteSpace: 'pre' }}>
        {lines.map((parts, i) => (
          <g key={i}>
            <text x="22" y={64 + i * 16} fill="#4b4f63" textAnchor="end" fontSize="9">{i + 1}</text>
            <text x="32" y={64 + i * 16}>{parts.map(([c, t], j) => <tspan key={j} fill={c}>{t}</tspan>)}</text>
          </g>
        ))}
      </g>
      <rect x="0" y="178" width="250" height="1" fill="#2c2e3c" />
      <text x="14" y="198" fontSize="9" fontFamily={MONO} fill={cm}>$ git log --graph</text>
      <g fill="none" strokeWidth="3" strokeLinecap="round">
        <path d="M44 214V318" stroke="#82aaff" />
        <path d="M44 226C44 246 84 240 84 262V280C84 300 44 296 44 312" stroke="#c792ea" />
      </g>
      {[[44, 222], [84, 268], [44, 314]].map(([x, y]) => <Pip key={y} suit="diamonds" x={x} y={y} size={22} fill="#ff5c6c" stroke="#1e1f29" strokeWidth="5" paintOrder="stroke" />)}
      <g fontFamily={MONO} fontSize="9">
        <text x="62" y="225" fill={tx}>init: a new deck</text>
        <text x="102" y="271" fill={tx}>feat: three of ♦</text>
        <text x="62" y="317" fill={tx}>merge → <tspan fill="#82aaff">main</tspan></text>
      </g>
      <rect x="0" y="336" width="250" height="14" fill="#2457c5" />
      <text x="240" y="346" fontSize="8.5" fontFamily={MONO} fill="#fff" textAnchor="end">3♦  UTF-8  TS</text>
    </>
  )
}

/** One column of digital rain, its head bright and its tail fading. */
function rainColumns(seed: number) {
  const rand = seeded(seed)
  return Array.from({ length: 18 }, (_, i) => {
    const len = 6 + Math.floor(rand() * 15), top = Math.floor(rand() * 24) - 6
    return { x: r1(6 + i * 13.6), top, chars: Array.from({ length: len }, () => KANA[Math.floor(rand() * KANA.length)]) }
  })
}
function Rain({ cols, dim }: { cols: ReturnType<typeof rainColumns>; dim: boolean }) {
  return (
    <g fontFamily={MONO} fontSize="12.5" textAnchor="middle">
      {cols.map(c => c.chars.map((ch, j) => {
        const head = j === c.chars.length - 1
        return (
          <text key={`${c.x}-${j}`} x={c.x} y={(c.top + j) * 14.5 + 12} fill={head ? '#e2ffe9' : dim ? '#00c837' : '#7dffa0'}
                opacity={r1(((j + 1) / c.chars.length) * (dim ? 0.45 : 1))}>{ch}</text>
        )
      }))}
    </g>
  )
}

/** 4♣ — the Matrix: green rain, four clubs where it runs brighter, and a choice of pills. */
function Matrix() {
  const cols = rainColumns(4)
  return (
    <>
      <rect width="250" height="350" fill="#020a03" />
      <Rain cols={cols} dim />
      {pips(4).map(({ x, y, flip }) => <Pip key={`${x}${y}`} suit="clubs" x={x} y={y} size={76} flip={flip} fill="#0b4019" />)}
      <g clipPath="url(#nbc-clubs4)"><Rain cols={cols} dim={false} /></g>
      {pips(4).map(({ x, y, flip }) => <Pip key={`o${x}${y}`} suit="clubs" x={x} y={y} size={76} flip={flip} fill="none" stroke="#39ff6a" strokeWidth="2" filter="url(#nbc-glow)" />)}
      <g transform="rotate(-28 106 175)">
        <rect x="92" y="169" width="28" height="12" rx="6" fill="#d8262e" />
        <rect x="96" y="171" width="10" height="3" rx="1.5" fill="#fff" opacity="0.55" />
      </g>
      <g transform="rotate(28 144 175)">
        <rect x="130" y="169" width="28" height="12" rx="6" fill="#2a63e0" />
        <rect x="134" y="171" width="10" height="3" rx="1.5" fill="#fff" opacity="0.55" />
      </g>
      <g filter="url(#nbc-glow)">
        <Corners rank="4" suit="clubs" color="#39ff6a" font={MONO} weight={700} />
      </g>
    </>
  )
}

/** 5♠ — Interstellar: Gargantua's lensed disk, the Endurance turning below it, five spades for stars. */
function Interstellar() {
  const rand = seeded(5)
  const stars = Array.from({ length: 70 }, () => [r1(rand() * 250), r1(rand() * 350), r1(0.3 + rand() * 0.9), r1(0.25 + rand() * 0.7)])
  const modules = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2
    return { x: r1(125 + Math.cos(a) * 66), y: r1(268 + Math.sin(a) * 15), back: Math.sin(a) < 0 }
  })
  const ring = (back: boolean) => modules.filter(m => m.back === back).map(m => (
    <rect key={`${m.x}${m.y}`} x={m.x - 5} y={m.y - 3.5} width="10" height="7" rx="1.5" fill={back ? '#8f97a3' : '#e7ecf3'} stroke="#3c434d" strokeWidth="0.6" />
  ))
  return (
    <>
      <rect width="250" height="350" fill="#03040a" />
      {stars.map(([x, y, r, o], i) => <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity={o} />)}
      <g filter="url(#nbc-soft)" opacity="0.8">
        <ellipse cx="125" cy="146" rx="108" ry="17" fill="none" stroke="#f3a347" strokeWidth="12" />
        <path d="M61 140A64 58 0 0 1 189 140" fill="none" stroke="#f3a347" strokeWidth="12" />
      </g>
      <ellipse cx="125" cy="146" rx="102" ry="15" fill="none" stroke="#f2a64a" strokeWidth="5" />
      <path d="M61 140A64 58 0 0 1 189 140" fill="none" stroke="#ffcf7a" strokeWidth="7" />
      <path d="M61 140A64 58 0 0 1 189 140" fill="none" stroke="#fff3d6" strokeWidth="2.4" />
      <path d="M81 150A44 38 0 0 0 169 150" fill="none" stroke="#ffcf7a" strokeWidth="2" opacity="0.7" />
      <circle cx="125" cy="142" r="36.5" fill="none" stroke="#fff6e0" strokeWidth="1.2" />
      <circle cx="125" cy="142" r="35" fill="#000" />
      <path d="M23 146A102 15 0 0 0 227 146" fill="none" stroke="#ffd58a" strokeWidth="6" />
      <path d="M23 146A102 15 0 0 0 227 146" fill="none" stroke="#fffaf0" strokeWidth="2" />
      <ellipse cx="125" cy="268" rx="66" ry="15" fill="none" stroke="#6b7480" strokeWidth="2" />
      {ring(true)}
      {[[-1, 0], [1, 0], [0, -1], [0, 1]].map(([dx, dy]) => (
        <line key={`${dx}${dy}`} x1="125" y1="268" x2={125 + dx * 66} y2={268 + dy * 15} stroke="#9aa3ad" strokeWidth="1.2" />
      ))}
      <circle cx="125" cy="268" r="6" fill="#e7ecf3" stroke="#3c434d" strokeWidth="0.8" />
      {ring(false)}
      {[[44, 70], [206, 210], [36, 226], [214, 60], [168, 316]].map(([x, y]) => (
        <Pip key={`${x}${y}`} suit="spades" x={x} y={y} size={11} fill="#fff" opacity="0.9" />
      ))}
      <text x="125" y="312" fontSize="7" fontFamily={SANS} letterSpacing="5" fill="#9aa3b2" textAnchor="middle">ENDURANCE</text>
      <Corners rank="5" suit="spades" color="#eceff4" font={SANS} weight={300} />
    </>
  )
}

/** 6♥ — geometry: a car park drawn to the millimetre, six hearts parked, one bay found and lit. */
function CarPark() {
  const rows = [80, 138, 196, 254, 312]
  const bays = [{ x: 22, cars: [true, true, false, true] }, { x: 148, cars: [false, true, true, true] }]
  return (
    <>
      <rect width="250" height="350" fill="#34373d" />
      <g stroke="#f4f4f0" strokeWidth="2.2">
        {bays.map(b => rows.map(y => <line key={`${b.x}${y}`} x1={b.x} y1={y} x2={b.x + 80} y2={y} />))}
        <line x1="22" y1="80" x2="22" y2="312" /><line x1="228" y1="80" x2="228" y2="312" />
      </g>
      <line x1="125" y1="70" x2="125" y2="326" stroke="#f2c230" strokeWidth="2" strokeDasharray="10 8" />
      <path d="M125 96l-7 10h4v12h6v-12h4z" fill="#f4f4f0" opacity="0.8" />
      <path d="M125 300l-7 -10h4v-12h6v12h4z" fill="#f4f4f0" opacity="0.8" />
      {/* the free bay the app found: highlighted, with a pin */}
      <rect x="23" y="197" width="78" height="56" fill="#f7c83a" fillOpacity="0.35" stroke="#f7c83a" strokeWidth="2" />
      <path d="M62 236c-9-11-13-17-13-23a13 13 0 0 1 26 0c0 6-4 12-13 23z" fill="#2457c5" stroke="#fff" strokeWidth="1.6" />
      <circle cx="62" cy="213" r="4.5" fill="#fff" />
      {bays.flatMap(b => b.cars.map((car, i) => car && (
        <g key={`${b.x}${i}`}>
          <Pip suit="hearts" x={b.x + 42} y={(rows[i] + rows[i + 1]) / 2 + 2} size={40} fill="#e5484d" />
          <Pip suit="hearts" x={b.x + 42} y={(rows[i] + rows[i + 1]) / 2 - 3} size={20} fill="#ff9da0" opacity="0.6" />
        </g>
      )))}
      <rect x="114" y="327" width="22" height="18" rx="3" fill="#2457c5" />
      <text x="125" y="341" fontSize="14" fontFamily={SANS} fontWeight="700" fill="#fff" textAnchor="middle">P</text>
      <Corners rank="6" suit="hearts" color="#f4f4f0" font={SANS} weight={700} pipProps={{ fill: '#e5484d' }} />
    </>
  )
}

/** 7♦ — a Chinese ink painting: mountains in wash under a full moon, a plum branch in blossom. */
function InkPainting() {
  const blossoms = [[38, 112, 13], [60, 92, 15], [80, 68, 13], [100, 52, 12], [70, 46, 11], [90, 102, 12], [116, 48, 10]]
  return (
    <>
      <rect width="250" height="350" fill="#f1e9d6" />
      <rect width="250" height="350" fill="#f1e9d6" filter="url(#nbc-washi)" />
      <rect width="250" height="190" fill="url(#nbc-inksky)" />
      <circle cx="176" cy="82" r="30" fill="#f7f2e6" />
      <g filter="url(#nbc-ink)">
        <path d="M0 214C30 176 50 164 72 180C92 144 120 126 142 156C162 136 190 146 210 170C226 156 240 164 250 174V350H0Z" fill="#2e2e30" opacity="0.2" />
        <path d="M0 254C26 220 46 210 72 226C96 190 116 184 136 210C152 194 172 200 188 218C206 200 230 210 250 226V350H0Z" fill="#2e2e30" opacity="0.42" />
        <path d="M0 302C30 274 60 266 92 284C116 266 142 272 162 292C190 274 222 282 250 296V350H0Z" fill="#232325" opacity="0.72" />
      </g>
      <rect y="292" width="250" height="58" fill="url(#nbc-mist)" />
      <g fill="none" stroke="#2b2522" strokeLinecap="round">
        <path d="M-6 124C28 116 52 100 72 74C82 60 94 52 112 48" strokeWidth="4.5" />
        <path d="M54 98C66 104 80 104 94 98" strokeWidth="2.4" />
        <path d="M74 70C68 60 68 52 72 42" strokeWidth="2" />
      </g>
      {blossoms.map(([x, y, s]) => (
        <g key={`${x}${y}`}>
          <Pip suit="diamonds" x={x} y={y} size={s} fill="#c8373b" />
          <circle cx={x} cy={y} r="1.6" fill="#f6d77a" />
        </g>
      ))}
      <text x="216" y="168" fontSize="26" fontFamily={KAI} fill="#1f1f1f" textAnchor="middle">
        <tspan x="216" dy="0">晚</tspan><tspan x="216" dy="30">安</tspan>
      </text>
      <rect x="205" y="214" width="22" height="22" fill="#b8322a" />
      <text x="216" y="231" fontSize="15" fontFamily={KAI} fill="#f6efe0" textAnchor="middle">七</text>
      <Corners rank="7" suit="diamonds" color="#1f1f1f" font={KAI} pipProps={{ fill: '#c8373b' }} />
    </>
  )
}

/** 8♣ — abstract, after Kandinsky: circles inside circles, lines that cross, eight clubs loose among them. */
function Abstract() {
  const clubs: [number, number, number, string, number][] = [
    [62, 86, 30, '#151515', -12], [206, 58, 20, '#c8372c', 14], [96, 250, 26, '#1f3b73', -6], [192, 210, 24, '#151515', 20],
    [132, 302, 18, '#c8372c', -18], [44, 186, 16, '#1f3b73', 8], [218, 150, 16, '#2f8f6a', -10], [152, 124, 20, '#efe7d6', 0],
  ]
  return (
    <>
      <rect width="250" height="350" fill="#efe7d6" />
      <line x1="16" y1="326" x2="236" y2="34" stroke="#151515" strokeWidth="3" />
      <line x1="26" y1="56" x2="226" y2="304" stroke="#151515" strokeWidth="1.4" />
      <circle cx="152" cy="124" r="60" fill="#1f3b73" />
      <circle cx="152" cy="124" r="44" fill="#e8b33a" />
      <circle cx="152" cy="124" r="29" fill="#c8372c" />
      <polygon points="36,150 100,112 108,180" fill="#2f8f6a" opacity="0.9" />
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={i} x={28 + (i % 4) * 12} y={214 + Math.floor(i / 4) * 12} width="12" height="12" fill={(i + Math.floor(i / 4)) % 2 ? '#151515' : '#efe7d6'} />
      ))}
      <rect x="28" y="214" width="48" height="36" fill="none" stroke="#151515" strokeWidth="1" />
      <path d="M150 300A40 40 0 0 1 230 300Z" fill="#f2c94c" stroke="#151515" strokeWidth="2" />
      <path d="M18 276q15 -16 30 0t30 0t30 0" fill="none" stroke="#c8372c" strokeWidth="2.6" />
      {[[186, 236], [200, 252], [214, 236], [228, 252]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="3" fill="#151515" />)}
      {clubs.map(([x, y, s, c, r]) => (
        <g key={`${x}${y}`} transform={`rotate(${r} ${x} ${y})`}><Pip suit="clubs" x={x} y={y} size={s} fill={c} /></g>
      ))}
      <Corners rank="8" suit="clubs" color="#151515" font={GEO} weight={700} />
    </>
  )
}

/** 10♥ — a plush little dragon, soft and green, holding a heart; nine more float about. */
function PlushDragon() {
  const hearts = [[40, 80, 14], [210, 72, 12], [28, 150, 10], [222, 140, 15], [48, 222, 12], [206, 236, 10], [70, 300, 11], [182, 300, 14], [125, 74, 10]]
  const green = 'url(#nbc-plush)'
  return (
    <>
      <rect width="250" height="350" fill="url(#nbc-pastel)" />
      {hearts.map(([x, y, s]) => <Pip key={`${x}${y}`} suit="hearts" x={x} y={y} size={s} fill="#ff8fab" opacity="0.85" />)}
      <g filter="url(#nbc-fur)">
        <path d="M160 246C198 254 214 228 204 210C198 198 184 202 188 212" fill="none" stroke="#7fb877" strokeWidth="15" strokeLinecap="round" />
        <path d="M84 176C58 156 48 182 62 192C52 198 60 214 78 206Z" fill="#f4a6b8" />
        <path d="M166 176C192 156 202 182 188 192C198 198 190 214 172 206Z" fill="#f4a6b8" />
        <ellipse cx="125" cy="218" rx="52" ry="56" fill={green} />
        <ellipse cx="125" cy="232" rx="32" ry="35" fill="#e6f2d3" />
        <ellipse cx="100" cy="270" rx="17" ry="10" fill="#7fb877" />
        <ellipse cx="150" cy="270" rx="17" ry="10" fill="#7fb877" />
        <path d="M104 112C100 96 104 86 110 82C112 92 114 102 116 108Z" fill="#f6e7c1" />
        <path d="M146 112C150 96 146 86 140 82C138 92 136 102 134 108Z" fill="#f6e7c1" />
        <path d="M84 132C66 120 64 104 72 98C80 108 86 118 92 126Z" fill="#7fb877" />
        <path d="M166 132C184 120 186 104 178 98C170 108 164 118 158 126Z" fill="#7fb877" />
        <ellipse cx="125" cy="144" rx="47" ry="41" fill={green} />
        <ellipse cx="125" cy="161" rx="22" ry="15" fill="#a8d39a" />
      </g>
      {[[112, 104], [125, 100], [138, 104]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="5" fill="#f4a6b8" />)}
      <ellipse cx="108" cy="140" rx="4.6" ry="5.6" fill="#2a2a2a" /><circle cx="109.6" cy="138" r="1.5" fill="#fff" />
      <ellipse cx="142" cy="140" rx="4.6" ry="5.6" fill="#2a2a2a" /><circle cx="143.6" cy="138" r="1.5" fill="#fff" />
      <ellipse cx="96" cy="154" rx="7.5" ry="4.5" fill="#ffb3c1" opacity="0.85" />
      <ellipse cx="154" cy="154" rx="7.5" ry="4.5" fill="#ffb3c1" opacity="0.85" />
      <circle cx="119" cy="158" r="1.6" fill="#5a7d55" /><circle cx="131" cy="158" r="1.6" fill="#5a7d55" />
      <path d="M118 167q7 6 14 0" fill="none" stroke="#4d6b48" strokeWidth="1.8" strokeLinecap="round" />
      <Pip suit="hearts" x={125} y={214} size={38} fill="#e5484d" />
      <ellipse cx="101" cy="214" rx="11" ry="15" fill="#86bd7e" />
      <ellipse cx="149" cy="214" rx="11" ry="15" fill="#86bd7e" />
      <Corners rank="10" suit="hearts" color="#e5487a" font={ROUND} size={24} weight={700} />
    </>
  )
}

/** J♦ — a mecha in its hangar: white helmet, gold V-fin, green eyes, a red diamond on the brow. */
function Mecha() {
  const ink = '#161a22'
  const both = (d: string, fill: string, extra?: PathProps) => (
    <>
      <path d={d} fill={fill} stroke={ink} strokeWidth="2.2" strokeLinejoin="round" {...extra} />
      <path d={d} fill={fill} stroke={ink} strokeWidth="2.2" strokeLinejoin="round" transform="matrix(-1 0 0 1 250 0)" {...extra} />
    </>
  )
  return (
    <>
      <rect width="250" height="350" fill="url(#nbc-hangar)" />
      <g stroke="#2a3446" strokeWidth="1">{[60, 120, 180, 240].map(x => <line key={x} x1={x} y1="0" x2={x} y2="300" />)}</g>
      <rect y="304" width="250" height="46" fill="url(#nbc-hazard)" />
      {both('M8 300L34 246L96 236L104 300Z', '#2d5fb8')}
      {both('M34 246L96 236L92 252L44 262Z', '#eef1f5')}
      <path d="M106 236H144V300H106Z" fill="#5d6675" stroke={ink} strokeWidth="2.2" />
      {both('M125 112L120 104L50 54L58 50L128 96Z', '#f2c230')}
      {both('M125 120L98 106H90L76 124L72 182L90 202H125Z', '#eef1f5')}
      {both('M80 140L74 146L76 176L84 182L86 144Z', '#2d5fb8')}
      {both('M125 138H90L86 166H125Z', '#232833')}
      {both('M92 150L118 145L118 156L96 159Z', '#3ef0a6', { filter: 'url(#nbc-glow)' })}
      {both('M125 168H106L104 188L125 204Z', '#eef1f5')}
      {both('M110 174H118V188H110Z', '#a7afbb')}
      <path d="M116 202H134L130 214H120Z" fill="#d33a2c" stroke={ink} strokeWidth="2" strokeLinejoin="round" />
      <Pip suit="diamonds" x={125} y={112} size={28} fill="#d33a2c" stroke={ink} strokeWidth="2.2" />
      <text x="198" y="294" fontSize="8" fontFamily={MONO} fill="#9fb0c8" textAnchor="middle">TYPE-J</text>
      <Corners rank="J" suit="diamonds" color="#f4f6fa" font={GEO} weight={700} pipProps={{ fill: '#d33a2c' }} />
    </>
  )
}

/** Q♣ — after Magritte's Son of Man: the bowler hat, the sea wall, and a green club where the apple was. */
function SonOfMan() {
  return (
    <>
      <rect width="250" height="350" fill="url(#nbc-sky)" />
      <g filter="url(#nbc-soft)" fill="#fff" opacity="0.85">
        <ellipse cx="62" cy="70" rx="42" ry="13" /><ellipse cx="186" cy="100" rx="50" ry="15" /><ellipse cx="110" cy="40" rx="28" ry="9" />
      </g>
      <rect y="236" width="250" height="52" fill="#5d7488" />
      <line x1="0" y1="236" x2="250" y2="236" stroke="#45596b" strokeWidth="1" />
      <rect y="284" width="250" height="66" fill="#8c8476" />
      <rect y="284" width="250" height="5" fill="#a59d8f" />
      <path d="M40 350C44 290 70 262 100 252L125 270L150 252C180 262 206 290 210 350Z" fill="#2a2d34" />
      <path d="M100 252L125 292L150 252L140 244H110Z" fill="#f2f2ee" />
      <path d="M120 258H130L134 304L125 314L116 304Z" fill="#a8282e" />
      <rect x="113" y="222" width="24" height="28" fill="#d9b48e" />
      <ellipse cx="95" cy="198" rx="5" ry="9" fill="#d9b48e" /><ellipse cx="155" cy="198" rx="5" ry="9" fill="#d9b48e" />
      <ellipse cx="125" cy="196" rx="30" ry="36" fill="#e2c3a0" />
      <path d="M92 166C92 126 158 126 158 166Z" fill="#18191d" />
      <rect x="92" y="157" width="66" height="7" fill="#2c2e33" />
      <ellipse cx="125" cy="167" rx="46" ry="8" fill="#18191d" />
      <Pip suit="clubs" x={125} y={206} size={58} fill="#5aa04a" stroke="#2e5e26" strokeWidth="2.4" />
      <path d="M125 178C127 170 134 166 142 167C138 174 132 178 125 178Z" fill="#7cc35f" stroke="#2e5e26" strokeWidth="1.2" />
      <path d="M108 192C110 186 114 182 120 180" fill="none" stroke="#b9e3a6" strokeWidth="3" strokeLinecap="round" />
      <text x="125" y="336" fontSize="10.5" fontFamily={SERIF} fontStyle="italic" fill="#f2efe6" textAnchor="middle">Ceci n’est pas un trèfle.</text>
      <Corners rank="Q" suit="clubs" color="#f7f4ec" font={SERIF} pipProps={{ fill: '#5aa04a', stroke: '#f7f4ec', strokeWidth: 3, paintOrder: 'stroke' }} />
    </>
  )
}

/** K♠ — the Joker: a jester in red and blue with bells on, grinning, a spade on the cap. */
function Joker() {
  const ink = '#1b1d2b'
  const ruff = Array.from({ length: 16 }, (_, i) => {
    const a0 = (i / 16) * Math.PI * 2, a1 = ((i + 0.5) / 16) * Math.PI * 2, a2 = ((i + 1) / 16) * Math.PI * 2
    const p = (a: number, r: number) => `${r1(125 + Math.cos(a) * r * 1.6)},${r1(234 + Math.sin(a) * r * 0.45)}`
    return { pts: `125,234 ${p(a0, 30)} ${p(a1, 40)} ${p(a2, 30)}`, red: i % 2 === 0 }
  })
  return (
    <>
      <rect width="250" height="350" fill="#2b2f4a" />
      <rect x="12" y="12" width="226" height="326" rx="14" fill="url(#nbc-jester)" stroke={ink} strokeWidth="3" />
      {[[-1, 0, 0], [1, 0, 0]].map(([dx]) => (
        <rect key={dx} x={dx < 0 ? 58 : 132} y="258" width="60" height="72" fill={dx < 0 ? '#2f63c6' : '#d8423a'} stroke={ink} strokeWidth="2.4" />
      ))}
      <Pip suit="diamonds" x={125} y={292} size={44} fill="#f2c230" stroke={ink} strokeWidth="2.4" />
      {ruff.map((r, i) => <polygon key={i} points={r.pts} fill={r.red ? '#d8423a' : '#2f63c6'} stroke={ink} strokeWidth="1.6" strokeLinejoin="round" />)}
      <ellipse cx="125" cy="234" rx="44" ry="11" fill="#fbf6ee" stroke={ink} strokeWidth="2" />
      <path d="M125 134Q88 92 44 84Q70 112 80 150Z" fill="#d8423a" stroke={ink} strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M125 134Q162 92 206 84Q180 112 170 150Z" fill="#2f63c6" stroke={ink} strokeWidth="2.4" strokeLinejoin="round" />
      <circle cx="44" cy="84" r="9" fill="#f2c230" stroke={ink} strokeWidth="2" />
      <circle cx="206" cy="84" r="9" fill="#f2c230" stroke={ink} strokeWidth="2" />
      <ellipse cx="125" cy="186" rx="42" ry="44" fill="#fbf6ee" stroke={ink} strokeWidth="2.4" />
      <path d="M82 152Q125 132 168 152L166 164Q125 146 84 164Z" fill="#f2c230" stroke={ink} strokeWidth="2" strokeLinejoin="round" />
      <Pip suit="spades" x={125} y={146} size={20} fill={ink} />
      <Pip suit="diamonds" x={108} y={180} size={18} fill={ink} />
      <Pip suit="diamonds" x={142} y={180} size={18} fill={ink} />
      <circle cx="108" cy="180" r="2.2" fill="#fff" /><circle cx="142" cy="180" r="2.2" fill="#fff" />
      <circle cx="96" cy="200" r="6.5" fill="#e65a5a" opacity="0.75" /><circle cx="154" cy="200" r="6.5" fill="#e65a5a" opacity="0.75" />
      <circle cx="125" cy="194" r="5" fill="#d8423a" stroke={ink} strokeWidth="1.4" />
      <path d="M100 204Q125 234 150 204Q125 218 100 204Z" fill={ink} />
      <path d="M110 212Q125 220 140 212" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      <Corners rank="K" suit="spades" color={ink} font={POSTER} pipProps={{ fill: ink }} />
    </>
  )
}

/** 9♠ — Bauhaus: primary colours, a circle, a square, a band — and nine spades in a grid. */
function Bauhaus() {
  return (
    <>
      <rect width="250" height="350" fill="#efe6d3" />
      <circle cx="74" cy="104" r="64" fill="#d4402f" />
      <rect x="138" y="36" width="64" height="150" fill="#f2b630" transform="rotate(16 170 111)" />
      <path d="M250 350V226A124 124 0 0 0 126 350Z" fill="#21509e" />
      <rect x="0" y="196" width="250" height="8" fill="#1b1b1b" />
      <rect x="30" y="300" width="70" height="8" fill="#1b1b1b" />
      {[72, 125, 178].flatMap(x => [104, 178, 252].map(y => (
        <Pip key={`${x}${y}`} suit="spades" x={x} y={y} size={40} fill="#1b1b1b" stroke="#efe6d3" strokeWidth="5" paintOrder="stroke" />
      )))}
      <Corners rank="9" suit="spades" color="#1b1b1b" font={GEO} weight={700} />
    </>
  )
}

/* ── the deck ─────────────────────────────────────────────────────── */

/** A finish on the card's surface, after Balatro's editions. */
export type Edition = 'negative' | 'foil' | 'holographic' | 'polychrome' | 'gleam' | 'gold' | 'halo' | 'glitter' | 'prism' | 'flicker' | 'lustre' | 'pearl' | 'shine'

interface Card {
  rank: string; name: string; suit: Suit; style: string; edition: Edition; tilt: number; Art: () => JSX.Element
  /** painted art in place of the drawing — public/cards, made by scripts/card-art.sh from assets_src/cards */
  img?: string
}

/** Page n of the book is DECK[n - 1]. */
export const DECK: Card[] = [
  { rank: 'A', name: 'Ace', suit: 'spades', style: 'classical engraving', edition: 'negative', tilt: 7, Art: Engraving },
  { rank: '2', name: 'Two', suit: 'hearts', style: 'ASCII art', edition: 'foil', tilt: -5, Art: Ascii },
  { rank: '3', name: 'Three', suit: 'diamonds', style: 'code', edition: 'gleam', tilt: 4, Art: Code },
  { rank: '4', name: 'Four', suit: 'clubs', style: 'the Matrix', edition: 'flicker', tilt: -8, Art: Matrix },
  { rank: '5', name: 'Five', suit: 'spades', style: 'Interstellar', edition: 'halo', tilt: 6, Art: Interstellar },
  { rank: '6', name: 'Six', suit: 'hearts', style: 'car-park geometry', edition: 'shine', tilt: -4, Art: CarPark },
  { rank: '7', name: 'Seven', suit: 'diamonds', style: 'Chinese ink painting', edition: 'gold', tilt: 9, Art: InkPainting },
  { rank: '8', name: 'Eight', suit: 'clubs', style: 'abstract, after Kandinsky', edition: 'polychrome', tilt: -7, Art: Abstract },
  { rank: '9', name: 'Nine', suit: 'spades', style: 'Bauhaus', edition: 'prism', tilt: 5, Art: Bauhaus },
  { rank: '10', name: 'Ten', suit: 'hearts', style: 'plush dragon', edition: 'glitter', tilt: -6, Art: PlushDragon },
  { rank: 'J', name: 'Jack', suit: 'diamonds', style: 'mecha', edition: 'lustre', tilt: 8, Art: Mecha },
  { rank: 'Q', name: 'Queen', suit: 'clubs', style: 'after Magritte', edition: 'pearl', tilt: -5, Art: SonOfMan },
  { rank: 'K', name: 'King', suit: 'spades', style: 'the Joker', edition: 'holographic', tilt: 4, Art: Joker },
]

export const cardTitle = (n: number) => { const c = DECK[n - 1]; return `${c.rank}${SYMBOL[c.suit]}` }
export const cardLabel = (n: number) => { const c = DECK[n - 1]; return `${c.name} of ${c.suit}, ${c.style}, ${c.edition}` }

/** The rank and suit on a little paper tab in two corners, for painted art that has neither. */
function IndexTabs({ rank, suit }: { rank: string; suit: Suit }) {
  const w = rank.length > 1 ? 40 : 32
  const tab = <rect x={25 - w / 2} y="9" width={w} height="64" rx="8" fill="#fbf8f0" opacity="0.94" />
  return (
    <>
      {tab}
      <g transform="rotate(180 125 175)">{tab}</g>
      <Corners rank={rank} suit={suit} color={suit === 'hearts' || suit === 'diamonds' ? '#c8372c' : '#1b1d24'} font={SERIF} size={rank.length > 1 ? 24 : 30} />
    </>
  )
}

/** The card itself — drawn, or painted with its rank tabbed on — with its finish over the art. */
export function CardFace({ n }: { n: number }) {
  const { Art, edition, img, rank, suit } = DECK[n - 1]
  return (
    <span className="nb-pcard-face" data-edition={edition}>
      {img
        ? <img className="nb-pcard-art" src={img} alt="" loading="lazy" decoding="async" />
        : <svg className="nb-pcard-art" viewBox="0 0 250 350" aria-hidden="true"><Art /></svg>}
      {img && <svg className="nb-pcard-index" viewBox="0 0 250 350" aria-hidden="true"><IndexTabs rank={rank} suit={suit} /></svg>}
      <span className="nb-pcard-sheen" aria-hidden="true" />
    </span>
  )
}

/** Every filter, pattern, gradient and clip the cards draw with — rendered once. */
export function CardDefs() {
  return (
    <svg className="nb-defs" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="nbc-vignette" cx="50%" cy="48%" r="70%">
          <stop offset="60%" stopColor="#8a6a3a" stopOpacity="0" />
          <stop offset="100%" stopColor="#8a6a3a" stopOpacity="0.32" />
        </radialGradient>
        <pattern id="nbc-hatch" width="3.2" height="3.2" patternUnits="userSpaceOnUse" patternTransform="rotate(38)">
          <line x1="0" y1="0" x2="0" y2="3.2" stroke="#2b2118" strokeWidth="1.1" />
        </pattern>
        <clipPath id="nbc-clubs4">
          {pips(4).map(({ x, y, flip }) => <Pip key={`${x}${y}`} suit="clubs" x={x} y={y} size={76} flip={flip} />)}
        </clipPath>
        <linearGradient id="nbc-inksky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a3a3e" stopOpacity="0.42" /><stop offset="100%" stopColor="#3a3a3e" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="nbc-mist" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#f1e9d6" /><stop offset="100%" stopColor="#f1e9d6" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="nbc-pastel" cx="50%" cy="40%" r="75%">
          <stop offset="0%" stopColor="#fff5f7" /><stop offset="100%" stopColor="#e8f3e4" />
        </radialGradient>
        <radialGradient id="nbc-plush" cx="42%" cy="36%" r="70%">
          <stop offset="0%" stopColor="#a6d79c" /><stop offset="100%" stopColor="#74ab6c" />
        </radialGradient>
        <linearGradient id="nbc-hangar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#24304a" /><stop offset="100%" stopColor="#0d121b" />
        </linearGradient>
        <pattern id="nbc-hazard" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="10" height="20" fill="#f2c230" /><rect x="10" width="10" height="20" fill="#16181d" />
        </pattern>
        <linearGradient id="nbc-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6e8fae" /><stop offset="68%" stopColor="#bccbd4" />
        </linearGradient>
        <pattern id="nbc-jester" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="22" height="22" fill="#f4ead5" /><rect width="11" height="22" fill="#efe1c4" />
        </pattern>
        <filter id="nbc-soft" x="-30%" y="-60%" width="160%" height="220%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <filter id="nbc-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="b1" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b2" />
          <feMerge><feMergeNode in="b2" /><feMergeNode in="b1" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {/* fibres in the paper */}
        <filter id="nbc-washi" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.32" numOctaves="2" seed="6" result="f" />
          <feColorMatrix in="f" type="matrix" values="0 0 0 0 0.55  0 0 0 0 0.45  0 0 0 0 0.3  0.9 0 0 0 -0.42" result="fib" />
          <feComposite in="fib" in2="SourceGraphic" operator="atop" />
        </filter>
        {/* ink in water: soft, wandering edges */}
        <filter id="nbc-ink" x="-5%" y="-10%" width="110%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="3" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="10" xChannelSelector="R" yChannelSelector="G" result="d" />
          <feGaussianBlur in="d" stdDeviation="1.4" />
        </filter>
        {/* plush: every edge gone fuzzy */}
        <filter id="nbc-fur" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="10" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  )
}
