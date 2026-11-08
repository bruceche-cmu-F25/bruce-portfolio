import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/siteConfig'

export const dynamic = 'force-static'

/** Everything may be crawled. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE.url}/sitemap.xml`,
  }
}
