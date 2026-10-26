import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/siteConfig'

export const dynamic = 'force-static'

/** Everything may be crawled — /robin keeps itself out of results with its own noindex,
 *  which a crawler can only read if it's allowed in. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE.url}/sitemap.xml`,
  }
}
