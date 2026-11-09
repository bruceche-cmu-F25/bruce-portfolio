import { ALBUMS, type Picture } from './notebook'

type ShelfPicture = Picture & { suggested?: true }
type Shelf = { label: string; pictures: readonly ShelfPicture[] }

function onRadar(title: string, src: string, alt: string): ShelfPicture {
  return { src, alt, caption: title, suggested: true }
}

export const SHELVES: readonly Shelf[] = [
  {
    label: 'films',
    pictures: [
      ...ALBUMS.posters,
      onRadar('Dune (2021)', '/posters/dune.webp', 'Dune (2021) theatrical poster'),
      onRadar('Dune: Part Two', '/posters/dune-part-two.webp', 'Dune: Part Two (2024) theatrical poster'),
      onRadar('Arrival', '/posters/arrival.webp', 'Arrival (2016) theatrical poster'),
      onRadar('The Prestige', '/posters/the-prestige.webp', 'The Prestige (2006) theatrical poster'),
      onRadar('The Matrix', '/posters/the-matrix.webp', 'The Matrix (1999) theatrical poster'),
    ],
  },
  {
    label: 'games',
    pictures: [
      ...ALBUMS.games.map(picture => picture.src === '/games/balatro.webp'
        ? { ...picture, src: '/games/balatro-cover.webp', alt: 'Balatro official portrait cover art' }
        : picture),
      onRadar('Sekiro: Shadows Die Twice', '/games/sekiro-cover.webp', 'Sekiro: Shadows Die Twice official cover art'),
      onRadar('NieR:Automata', '/games/nier-automata-cover.webp', 'NieR:Automata official cover art'),
      onRadar('Outer Wilds', '/games/outer-wilds-cover.webp', 'Outer Wilds official cover art'),
      onRadar('Death Stranding Director’s Cut', '/games/death-stranding-directors-cut-cover.webp', 'Death Stranding Director’s Cut official cover art'),
      onRadar('Disco Elysium', '/games/disco-elysium-cover.webp', 'Disco Elysium: The Final Cut official cover art'),
    ],
  },
  {
    label: 'books',
    pictures: [
      ...ALBUMS.books,
      onRadar('The Three-Body Problem', '/books/three-body-problem.webp', 'The Three-Body Problem by Cixin Liu, English edition cover'),
      onRadar('Dune', '/books/dune.webp', 'Dune by Frank Herbert, book cover'),
      onRadar('The Martian', '/books/the-martian.webp', 'The Martian by Andy Weir, book cover'),
      onRadar('Exhalation', '/books/exhalation.webp', 'Exhalation by Ted Chiang, book cover'),
      onRadar('The Pragmatic Programmer', '/books/pragmatic-programmer.webp', 'The Pragmatic Programmer by David Thomas and Andrew Hunt, 20th anniversary edition cover'),
      onRadar('A Philosophy of Software Design', '/books/philosophy-of-software-design.webp', 'A Philosophy of Software Design by John Ousterhout, second edition cover'),
      onRadar('Designing Machine Learning Systems', '/books/designing-machine-learning-systems.webp', 'Designing Machine Learning Systems by Chip Huyen, book cover'),
      onRadar('Deep Work', '/books/deep-work.webp', 'Deep Work by Cal Newport, book cover'),
      onRadar('Thinking in Systems', '/books/thinking-in-systems.webp', 'Thinking in Systems by Donella Meadows, book cover'),
    ],
  },
]

/** Every cover in one row, the shelves dealt in turn — a film, a game, a
 *  book, and round again — so no kind bunches up. */
export const COVERS: readonly ShelfPicture[] = (() => {
  const out: ShelfPicture[] = []
  const longest = Math.max(...SHELVES.map(s => s.pictures.length))
  for (let i = 0; i < longest; i++) for (const s of SHELVES) if (s.pictures[i]) out.push(s.pictures[i])
  return out
})()

/** 16Personalities, the latest result. Each trait is the side that won and by
 *  how much; the four together spell the type. Each letter also carries the
 *  strength it shows up as at work, with a line on what that looks like. */
export const MBTI = {
  type: 'ENFJ',
  name: 'the Protagonist',
  traits: [
    { name: 'Extraverted', opposite: 'Introverted', won: 'E', lost: 'I', value: 57,
      strength: 'Agency', line: 'I reach out, ask, and get things moving.' },
    { name: 'Intuitive', opposite: 'Observant', won: 'N', lost: 'S', value: 68,
      strength: 'Creative', line: 'I see the version that doesn’t exist yet.' },
    { name: 'Feeling', opposite: 'Thinking', won: 'F', lost: 'T', value: 61,
      strength: 'Product sense', line: 'I start from what the user feels.' },
    { name: 'Judging', opposite: 'Prospecting', won: 'J', lost: 'P', value: 51,
      strength: 'Ownership', line: 'Responsible end to end — I follow through.' },
  ],
} as const

/** Two pieces I drew, shown under a dither that the pointer wipes away
 *  (components/home/DitherVeil.tsx). */
export const ART = [
  { src: '/art/gwen.webp', alt: 'Gwen Stacy as Spider-Woman in her white hood, painted over orange and teal brushstrokes — drawn by Bruce', caption: 'Gwen · Spider-Woman', contrast: 1.7, brightness: -0.1 },
  { src: '/art/sci-fi.webp', alt: 'Two figures on a lunar surface, with Earth filling the sky — drawn by Bruce', caption: 'Lucy & David', contrast: 1.3, brightness: 0.08 },
] as const
