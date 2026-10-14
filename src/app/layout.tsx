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
    default: 'BookSwap — بدّلها | منصة تبادل الكتب العالمية',
    template: '%s | BookSwap',
  },
  description: 'اشترِ، بِع، بادِل، أو استعر الكتب المستعملة مع القراء حول العالم. كتابك القديم كنز ينتظر قارئه القادم.',
  keywords: ['books', 'كتب', 'مبادلة كتب', 'بيع كتب', 'تبادل كتب عالمي', 'BookSwap', 'بدّلها'],
  authors: [{ name: 'BookSwap Global' }],
  creator: 'BookSwap Global',
  publisher: 'BookSwap Global',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://bookswap.eg'),
  openGraph: {
    type: 'website',
    locale: 'ar_EG',
    alternateLocale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://bookswap.eg',
    siteName: 'BookSwap Global',
    title: 'BookSwap — بدّلها | منصة تبادل الكتب العالمية',
    description: 'اشترِ، بِع، بادِل، أو استعر الكتب مع القراء حول العالم.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'BookSwap Egypt',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BookSwap Egypt',
    description: 'Marketplace للكتب المستعملة في مصر',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'BookSwap',
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
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? {
        verification: {
          google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
        },
      }
    : {}),
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#6366f1' },
    { media: '(prefers-color-scheme: dark)', color: '#1e1b4b' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
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
