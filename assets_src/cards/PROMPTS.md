# Card art: prompts

The notebook's page numbers are playing cards, A to K. A♠, 2♥, 3♦ and 9♠ stay
hand-drawn. These are the other nine.

## How to hand them over

- One image per card, saved in this folder under the name in its heading,
  e.g. `4-clubs.png`. PNG, JPG and WebP all work.
- Portrait. 5:7 is ideal; 2:3 or 4:5 is fine too. Anything else gets
  centre-cropped to 5:7.
- At least about 1000 px tall.
- Keep the top-left and bottom-right corners quiet. The site prints the rank and
  suit there on a small paper tab, so anything important in those corners gets
  covered.
- Don't add borders, numbers or letters. The site draws the card edge, the
  rank, and the shiny finish on top.

When they're all in, tell Claude "wire in the cards". That runs
`bash scripts/card-art.sh` and switches each card over to its image.

Every prompt ends with the same line so the set stays consistent. If your tool
has a separate negative-prompt field, put "text, letters, numbers, watermark,
logo, border, frame" there.

---

## 4-clubs: The Matrix

> A vertical playing-card illustration in the style of The Matrix (1999): endless cascading columns of glowing green digital rain made of katakana glyphs on pure black. In the middle, a lone figure in a long black leather coat and dark sunglasses, seen from behind, looks up into the code. Four large club (♣) symbols take shape inside the falling rain, brighter than the code around them. In the lower foreground, an open hand offers one red pill and one blue pill, the only warm colours in the image. Moody, high contrast, cinematic, phosphor-green glow, 35mm film grain. Full bleed, 5:7 portrait, no border, no text, no letters, no numbers, no logo, no watermark.

## 5-spades: Interstellar

> A vertical playing-card illustration inspired by the film Interstellar (2014): the supermassive black hole Gargantua, its glowing accretion disk bent by gravity into a halo that arches over and under the black shadow, in warm gold, amber and white light. In front of it, a small ring-shaped spacecraft of twelve modules (the Endurance) drifts in silhouette. Among the faint stars, five tiny white spade (♠) shapes glint like distant stars. Deep black space, quiet awe, photoreal cinematic lighting in the style of the film's visual effects. Full bleed, 5:7 portrait, no border, no text, no letters, no numbers, no logo, no watermark.

## 6-hearts: geometry (a car park)

> A vertical playing-card illustration in strict, regular geometry: a perfectly symmetric top-down view of a small car park, drawn like a precise Swiss-style poster. Crisp white bay lines on deep charcoal asphalt form an exact grid, with a dashed yellow centre line and two arrows. Six glossy red heart (♥) shapes are parked in the bays in place of cars. One empty bay is highlighted in glowing yellow with a blue location pin dropped in it. Flat vector shapes, golden-ratio spacing, clean shadows, mathematical calm. Full bleed, 5:7 portrait, no border, no text, no letters, no numbers, no logo, no watermark.

## 7-diamonds: Chinese ink painting

> A vertical playing-card illustration as a traditional Chinese ink-wash painting (国画, shuimo) on warm, fibrous xuan rice paper: layered misty mountains fading into fog, a pale full moon in a night sky wash of soft grey ink, and a gnarled plum-blossom branch reaching in from the left. The blossoms are small vermilion diamond (♦) shapes. A small red seal stamp sits at one edge. Elegant, sparse, confident brushwork with wide empty space, the hush of a calm night before sleep. Full bleed, 5:7 portrait, no border, no calligraphy, no text, no letters, no numbers, no logo, no watermark.

## 8-clubs: abstract

> A vertical playing-card illustration as an abstract painting in the spirit of Wassily Kandinsky's Composition VIII (1923): concentric circles, thin and thick black lines crossing at angles, a small checkerboard patch, triangles, semicircles and a wavy line, all in rhythmic balance. Eight club (♣) shapes of different sizes are woven into the composition, in bold red, cobalt blue, yellow, green and black, on a warm cream ground. Visible oil-paint texture, musical and dynamic. Full bleed, 5:7 portrait, no border, no text, no letters, no numbers, no signature, no watermark.

## 10-hearts: a plush little dragon

> A vertical playing-card illustration: a soft-focus photograph of an adorable plush toy baby dragon in the style of a premium boutique plush (Jellycat-like). It is chubby and round, with ultra-soft fuzzy pastel sage-green fur, a cream belly, tiny pink felt wings, little cream horns, black bead eyes and rosy cheeks, and it sits hugging a plush red heart. Nine more small soft hearts float around it, ten hearts in all. Gentle studio lighting on a pale pastel-pink seamless background, shallow depth of field, cosy and sweet. Full bleed, 5:7 portrait, no border, no brand tag, no text, no letters, no numbers, no logo, no watermark.

## J-diamonds: mecha

> A vertical playing-card illustration in the style of classic 1979–80s Mobile Suit Gundam anime key art: the head and shoulders of a heroic giant robot in white, cobalt-blue and red armour, a golden V-shaped antenna crest on its forehead with a red diamond (♦) gem at its centre, and glowing green eyes. It stands in a dim mechanical hangar with steel gantries and yellow-and-black hazard stripes, lit by dramatic rim light from below. Crisp cel shading, hand-painted anime background, a heroic low angle. Full bleed, 5:7 portrait, no border, no text, no letters, no numbers, no logo, no watermark.

## Q-clubs: a famous painting

> A vertical playing-card illustration as a faithful pastiche of René Magritte's The Son of Man (1964): a man in a dark grey overcoat, white collar, red tie and black bowler hat stands in front of a low stone sea wall, with a grey-green sea and a soft cloudy blue sky behind him. His face is hidden by a floating green club (♣) shape where Magritte's apple was, with one small leaf on top. Smooth, flat, precise oil-paint surface and calm surreal light, exactly in Magritte's manner. Full bleed, 5:7 portrait, no border, no signature, no text, no letters, no numbers, no watermark.

## K-spades: the Joker

> A vertical playing-card illustration of a joker jester, in the bold chunky style of the indie card game Balatro: a two-pointed jester hat, one point red and one blue, each tipped with a golden bell; a white face with black diamond eye makeup, rosy cheeks and a wide mischievous grin; a red-and-blue ruffled collar; one hand raising a black spade (♠) shaped sceptre. Thick dark outlines, vibrant saturated colours, a slight pixel-art crunch, a cream background with soft diagonal stripes. Full bleed, 5:7 portrait, no border, no text, no letters, no numbers, no logo, no watermark.
