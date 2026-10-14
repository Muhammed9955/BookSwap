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
    default: 'WARAQ — ورق | عالم جديد بين كل صفحة والتانية',
    template: '%s | WARAQ — ورق',
  },
  description:
    'عالم جديد بين كل صفحة والتانية. منصة ورق لتبادل وشراء واستعارة الكتب المستعملة ونوادي القراءة في مدينتك. قراءة مستدامة وبدون أي عمولات.',
  keywords: [
    'WARAQ',
    'ورق',
    'كتب',
    'تبادل كتب',
    'بيع كتب مستعملة',
    'نوادي قراءة',
    'استعارة كتب',
    'WARAQ',
    'ورق',
    'مصر',
  ],
  authors: [{ name: 'WARAQ Team' }],
  creator: 'WARAQ',
  publisher: 'WARAQ',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://waraq.app'),
  openGraph: {
    type: 'website',
    locale: 'ar_EG',
    alternateLocale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://waraq.app',
    siteName: 'WARAQ | ورق',
    title: 'WARAQ — ورق | عالم جديد بين كل صفحة والتانية',
    description:
      'عالم جديد بين كل صفحة والتانية. بادِل واشترِ واستعر الكتب مع مجتمع القراء في مدينتك.',
    images: [
      {
        url: '/images/logo.png',
        width: 1024,
        height: 1024,
        alt: 'WARAQ | ورق Logo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'WARAQ — ورق | عالم جديد بين كل صفحة والتانية',
    description: 'عالم جديد بين كل صفحة والتانية. منصة القراء لتبادل واستعارة وشراء الكتب.',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'WARAQ',
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
    { media: '(prefers-color-scheme: light)', color: '#173F32' },
    { media: '(prefers-color-scheme: dark)', color: '#0D1512' },
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
