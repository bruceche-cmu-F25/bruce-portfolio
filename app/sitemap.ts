import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/siteConfig'

export const dynamic = 'force-static'

/** The homepage, and the notebook it replaced; /robin and /wedding are left out on purpose. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: `${SITE.url}/`, lastModified: now, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE.url}/notebook/`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
  ]
}
