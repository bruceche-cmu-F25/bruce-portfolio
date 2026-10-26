import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/siteConfig'

export const dynamic = 'force-static'

/** The notebook is the whole site; /robin and /wedding are left out on purpose. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${SITE.url}/`, lastModified: new Date(), changeFrequency: 'monthly', priority: 1 }]
}
