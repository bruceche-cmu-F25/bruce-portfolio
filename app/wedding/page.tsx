import { Noto_Serif_SC } from 'next/font/google'
import Gallery from './Gallery'

const serifSC = Noto_Serif_SC({
  weight: ['400', '600'],
  subsets: ['latin'],
  preload: false,
  display: 'swap',
  variable: '--font-serif-sc',
})

export const metadata = {
  title: '程驰 & 欧阳安怡',
  description: 'A collection of photos from our wedding celebration',
}

export default function WeddingPage() {
  return (
    <div className={serifSC.variable}>
      <Gallery />
    </div>
  )
}
