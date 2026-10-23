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
          '/partner-form',
          '/events',
          '/offers',
          '/download',
          '/about',
          '/search',
          '/favicon.ico',
          '/favicon.png',
          '/icon.png',
          '/apple-icon.png',
          '/icons/*',
          '/images/*',
          '/manifest.json',
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
      {
        userAgent: 'Googlebot-Image',
        allow: [
          '/favicon.ico',
          '/favicon.png',
          '/icon.png',
          '/apple-icon.png',
          '/icons/*',
          '/images/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
