import type { Metadata, Viewport } from 'next'
import './globals.css'
import 'leaflet/dist/leaflet.css'
import { LanguageProvider } from '@/i18n/language-context'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from '@/lib/auth/auth-context'
import { GoogleAnalyticsScripts } from '@/components/analytics/google-tags'
import { PwaRegister } from '@/components/pwa/pwa-register'

export const metadata: Metadata = {
  title: {
    default: 'WaraqConnect — ورق كونكت | عالم جديد بين كل صفحة والتانية',
    template: '%s | WaraqConnect — ورق كونكت',
  },
  description:
    'عالم جديد بين كل صفحة والتانية. منصة وتطبيق WaraqConnect (ورق كونكت) لتبادل وشراء واستعارة الكتب المستعملة، وتحديات القراءة، ودليل المكتبات المستقلة في مدينتك بدون أي عمولات.',
  keywords: [
    'WaraqConnect',
    'ورق كونكت',
    'Waraq Connect',
    'تطبيق ورق كونكت',
    'waraqconnect',
    'WARAQ',
    'ورق',
    'تبادل كتب',
    'بيع كتب مستعملة',
    'نوادي قراءة',
    'تحديات القراءة',
    'مكتبات مستقلة',
    'استعارة كتب',
    'مصر',
    'العالم العربي',
  ],
  authors: [{ name: 'WaraqConnect Team' }],
  creator: 'WaraqConnect',
  publisher: 'WaraqConnect',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://waraqconnect.vercel.app'),
  openGraph: {
    type: 'website',
    locale: 'ar_EG',
    alternateLocale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://waraqconnect.vercel.app',
    siteName: 'WaraqConnect | ورق كونكت',
    title: 'WaraqConnect — ورق كونكت | عالم جديد بين كل صفحة والتانية',
    description:
      'عالم جديد بين كل صفحة والتانية. بادِل واشترِ واستعر الكتب وشارك في تحديات القراءة مع مجتمع القراء في مدينتك.',
    images: [
      {
        url: '/images/logo.png',
        width: 1024,
        height: 1024,
        alt: 'WaraqConnect | ورق كونكت Logo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'WaraqConnect — ورق كونكت | عالم جديد بين كل صفحة والتانية',
    description: 'عالم جديد بين كل صفحة والتانية. منصة وتطبيق WaraqConnect لتبادل واستعارة وشراء الكتب وتحديات القراءة.',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.png', type: 'image/png' },
      { url: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    other: [
      {
        rel: 'apple-touch-icon-precomposed',
        url: '/icons/icon-192x192.png',
      },
    ],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'WaraqConnect',
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || 'zqxFnd1Oz6_9D1cjZQ4KPgVu2NT7LMnpyH82wO10YWo',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#173F32' },
    { media: '(prefers-color-scheme: dark)', color: '#0D1512' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

// Master schema for Brand Entity Disambiguation (separating from Arab Paper Mfg and Waraq AI)
const organizationSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://waraqconnect.vercel.app/#organization',
      name: 'WaraqConnect',
      alternateName: ['ورق كونكت', 'Waraq Connect', 'WARAQ'],
      url: 'https://waraqconnect.vercel.app',
      logo: {
        '@type': 'ImageObject',
        url: 'https://waraqconnect.vercel.app/images/logo.png',
        caption: 'WaraqConnect Logo',
      },
      description:
        'WaraqConnect (ورق كونكت) is the community reading platform and marketplace for book swaps, secondhand books, reading challenges, and independent bookstores across Egypt and the Arab world.',
      sameAs: [
        'https://wa.me/201556252658',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'muhamed.dev.95@gmail.com',
        availableLanguage: ['Arabic', 'English'],
      },
    },
    {
      '@type': 'WebSite',
      '@id': 'https://waraqconnect.vercel.app/#website',
      url: 'https://waraqconnect.vercel.app',
      name: 'WaraqConnect',
      alternateName: 'ورق كونكت',
      publisher: {
        '@id': 'https://waraqconnect.vercel.app/#organization',
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://waraqconnect.vercel.app/search?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700;800&display=swap"
        />
        <meta
          name="google-site-verification"
          content="zqxFnd1Oz6_9D1cjZQ4KPgVu2NT7LMnpyH82wO10YWo"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <GoogleAnalyticsScripts />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider defaultLang="ar">
            <AuthProvider>
              {children}
              <PwaRegister />
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
