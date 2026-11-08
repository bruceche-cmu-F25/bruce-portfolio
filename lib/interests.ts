import { ALBUMS, type Picture } from './notebook'

type ShelfPicture = Picture & { suggested?: true }
type Shelf = { label: string; pictures: readonly ShelfPicture[] }

function onRadar(title: string, src: string, alt: string): ShelfPicture {
  return { src, alt, caption: title, suggested: true }
}

/** How many covers a shelf shows at once — one row of twelve. A shelf may hold
 *  more: the rest wait out of sight, and "deal again" draws a fresh hand,
 *  favouring the covers that weren’t in the last one (components/home/Answer.tsx). */
export const HAND = 12

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
