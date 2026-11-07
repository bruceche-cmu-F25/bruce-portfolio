import { ART_HEIGHT, ART_WIDTH, createScene, type PixelPainter } from './pixel/primitives'
import { drawWorkspace, drawStory } from './pixel/WorkspaceScenes'
import { drawParking, drawResearch } from './pixel/DiscoveryScenes'
import { drawFinance, drawAdoption } from './pixel/IdentityScenes'
import styles from './Iso.module.css'

const scenes: Record<string, (painter: PixelPainter) => void> = {
  robin: drawWorkspace,
  moon: drawStory,
  deck: drawParking,
  papers: drawResearch,
  teller: drawFinance,
  chain: drawAdoption,
}

export default function IsoArt({ art, className }: { art: string; className?: string }) {
  const painter = createScene()
  ;(scenes[art] ?? drawWorkspace)(painter)

  return <svg className={[styles.art, className].filter(Boolean).join(' ')}
              viewBox={`0 0 ${ART_WIDTH} ${ART_HEIGHT}`} shapeRendering="crispEdges" aria-hidden>
    {painter.paths().map(({ tone, path }) => <path key={tone} className={styles[tone]} d={path} />)}
  </svg>
}
