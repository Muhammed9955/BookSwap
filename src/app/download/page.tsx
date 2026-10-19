import { Metadata } from 'next'
import { DownloadAppClient } from '@/components/download/download-app-client'

export const metadata: Metadata = {
  title: 'تحميل ومشاركة تطبيق WaraqConnect (ورق كونكت) | تثبيت PWA وبطاقة QR',
  description:
    'ثبّت تطبيق WaraqConnect (ورق كونكت) لتبادل واستعارة الكتب مجاناً على هاتفك بدون متجر تطبيقات. ماسح الباركود بالكاميرا، تنبيهات المبادلة الفورية، بطاقة QR للمشاركة، وتحديات القراءة.',
  openGraph: {
    title: 'تحميل ومشاركة تطبيق WaraqConnect — ورق كونكت',
    description: 'تطبيق ويب متقدم PWA يعمل فوراً على آيفون وأندرويد. امسح رمز الـ QR أو ثبّت بنقرة واحدة.',
    type: 'website',
  },
}

export default function DownloadPage() {
  const defaultDeployUrl =
    process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('localhost')
      ? process.env.NEXT_PUBLIC_APP_URL
      : process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://waraqconnect.vercel.app'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'WaraqConnect — تطبيق ورق كونكت لمجتمع القراء والكتب',
    operatingSystem: 'iOS, Android, Web',
    applicationCategory: 'BooksApplication',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '240',
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EGP',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DownloadAppClient defaultDeployUrl={defaultDeployUrl} />
    </>
  )
}
