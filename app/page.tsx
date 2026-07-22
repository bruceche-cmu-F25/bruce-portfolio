'use client'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import fifthDimension from '@/5thdimension.jpg'
import { LoaderProvider } from '@/lib/LoaderContext'

const SpaceLoader = dynamic(() => import('@/components/SpaceLoader'), { ssr: false })
const SpaceHero   = dynamic(() => import('@/components/SpaceHero'),   { ssr: false })
const TopBar      = dynamic(() => import('@/components/TopBar'),      { ssr: false })
const PageEffects = dynamic(() => import('@/components/PageEffects'), { ssr: false })
const Cursor      = dynamic(() => import('@/components/Cursor'),      { ssr: false })
const LenisInit   = dynamic(() => import('@/components/LenisInit'),   { ssr: false })
const About       = dynamic(() => import('@/components/About'),       { ssr: false })
const Experience  = dynamic(() => import('@/components/Experience'),  { ssr: false })
const Work        = dynamic(() => import('@/components/Work'),        { ssr: false })
const Stack       = dynamic(() => import('@/components/Stack'),       { ssr: false })
const Life        = dynamic(() => import('@/components/Life'),        { ssr: false })
const Contact     = dynamic(() => import('@/components/Contact'),     { ssr: false })

export default function Page() {
  return (
    <LoaderProvider>
      <SpaceLoader />
      <Cursor />
      <LenisInit />
      <PageEffects />
      <TopBar />
      <div className="starfield" aria-hidden="true">
        <i className="sf1" /><i className="sf2" /><i className="sf3" />
      </div>
      <div className="scroll-progress" aria-hidden="true" />
      <SpaceHero />
      <div className="portfolio-entry-image">
        <Image
          src={fifthDimension}
          alt="A layered multidimensional archive stretching into the distance"
          fill
          sizes="100vw"
          className="portfolio-entry-image-media"
        />
        <div className="portfolio-entry-image-shade" aria-hidden="true" />
        <About />
      </div>
      <main className="site-main">
        <Experience />
        <Work />
        <Stack />
        <Life />
        <Contact />
      </main>
    </LoaderProvider>
  )
}
