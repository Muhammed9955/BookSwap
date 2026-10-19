import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://waraqconnect.vercel.app'

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/explore',
          '/books',
          '/books/*',
          '/challenges',
          '/communities',
          '/communities/*',
          '/stores',
          '/stores/*',
          '/events',
          '/offers',
          '/download',
          '/about',
          '/search',
        ],
        disallow: [
          '/stores/dashboard',
          '/admin',
          '/admin/*',
          '/messages',
          '/messages/*',
          '/notifications',
          '/transactions',
          '/api/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
