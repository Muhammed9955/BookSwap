import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bookswap.eg'

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/explore', '/books', '/books/*', '/communities', '/communities/*', '/stores', '/stores/*', '/about', '/search'],
        disallow: ['/admin', '/admin/*', '/messages', '/messages/*', '/notifications', '/transactions', '/api/*'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
