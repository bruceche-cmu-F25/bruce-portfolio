import dynamic from 'next/dynamic'

const SpaceIntro     = dynamic(() => import('@/components/SpaceIntro'),     { ssr: false })
const Cursor         = dynamic(() => import('@/components/Cursor'),          { ssr: false })
const LenisInit      = dynamic(() => import('@/components/LenisInit'),      { ssr: false })
const VSCodeLayout   = dynamic(() => import('@/components/VSCodeLayout'),   { ssr: false })
const Hero           = dynamic(() => import('@/components/Hero'),            { ssr: false })
const About          = dynamic(() => import('@/components/About'),           { ssr: false })
const Experience     = dynamic(() => import('@/components/Experience'),      { ssr: false })
const Work           = dynamic(() => import('@/components/Work'),            { ssr: false })
const Stack          = dynamic(() => import('@/components/Stack'),           { ssr: false })
const Life           = dynamic(() => import('@/components/Life'),            { ssr: false })
const Contact        = dynamic(() => import('@/components/Contact'),         { ssr: false })

export default function Page() {
  return (
    <>
      <SpaceIntro />
      <Cursor />
      <LenisInit />
      <VSCodeLayout />
      <div className="scroll-progress" aria-hidden="true" />
      <main className="vsc-content-area">
        <Hero />
        <About />
        <Experience />
        <Work />
        <Stack />
        <Life />
        <Contact />
      </main>
    </>
  )
}
