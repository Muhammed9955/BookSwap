import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://waraqconnect.vercel.app'

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/explore`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/challenges`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/stores`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/events`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/offers`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/communities`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/download`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ]

  try {
    const supabase = await createClient()

    // Dynamic community routes
    const { data: communities } = await supabase
      .from('communities')
      .select('slug, updated_at')
      .eq('is_active', true)
      .limit(100)

    const communityRoutes: MetadataRoute.Sitemap = (communities || []).map(c => ({
      url: `${baseUrl}/communities/${c.slug}`,
      lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

    // Dynamic bookstore routes from database
    const { data: dbStores } = await supabase
      .from('bookstores')
      .select('slug, updated_at')
      .eq('is_active', true)
      .limit(100)

    const dbStoreRoutes: MetadataRoute.Sitemap = (dbStores || []).map(s => ({
      url: `${baseUrl}/stores/${s.slug}`,
      lastModified: s.updated_at ? new Date(s.updated_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }))

    // Dynamic book listing routes
    const { data: listings } = await supabase
      .from('book_listings')
      .select('id, updated_at')
      .eq('status', 'ACTIVE')
      .limit(200)

    const listingRoutes: MetadataRoute.Sitemap = (listings || []).map(l => ({
      url: `${baseUrl}/books/${l.id}`,
      lastModified: l.updated_at ? new Date(l.updated_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    }))

    return [...staticRoutes, ...dbStoreRoutes, ...communityRoutes, ...listingRoutes]
  } catch {
    return [...staticRoutes]
  }
}
