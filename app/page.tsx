import dynamic from 'next/dynamic'

const PixelLoader  = dynamic(() => import('@/components/PixelLoader'),  { ssr: false })
const Cursor       = dynamic(() => import('@/components/Cursor'),        { ssr: false })
const Lenis        = dynamic(() => import('@/components/LenisInit'),    { ssr: false })
const Nav          = dynamic(() => import('@/components/Nav'),           { ssr: false })
const Hero         = dynamic(() => import('@/components/Hero'),          { ssr: false })
const About        = dynamic(() => import('@/components/About'),         { ssr: false })
const Experience   = dynamic(() => import('@/components/Experience'),    { ssr: false })
const Work         = dynamic(() => import('@/components/Work'),          { ssr: false })
const Stack        = dynamic(() => import('@/components/Stack'),         { ssr: false })
const Life         = dynamic(() => import('@/components/Life'),          { ssr: false })
const Contact      = dynamic(() => import('@/components/Contact'),       { ssr: false })

export default function Page() {
  return (
    <>
      <PixelLoader />
      <Cursor />
      <Lenis />
      <div className="scroll-progress" aria-hidden="true" />
      <Nav />
      <main>
        <Hero />
        <About />
        <Experience />
        <Work />
        <Stack />
        <Life />
        <Contact />
      </main>
      <footer className="footer">
        <div className="container footer-inner">
          <p>© 2026 Bruce Cheng</p>
          <div className="footer-links">
            <a href="https://github.com/Bruce0921" target="_blank" rel="noopener">GitHub</a>
            <a href="https://linkedin.com/in/chi-cheng-779b4a259/" target="_blank" rel="noopener">LinkedIn</a>
            <a href="/Chi Cheng-Resume-2026-May.pdf" download>Resume</a>
          </div>
        </div>
      </footer>
    </>
  )
}
