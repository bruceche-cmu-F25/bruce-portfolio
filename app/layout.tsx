import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bruce Cheng · Portfolio',
  description: 'Bruce Cheng — Software Engineer, AI Builder, MS @ CMU Silicon Valley. Portfolio of AI systems, agentic workflows, and full-stack projects.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;0,900;1,400&family=JetBrains+Mono:wght@400;500;700&family=Unbounded:wght@700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
