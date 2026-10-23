import { Metadata } from 'next'
import { PartnerFormClient } from '@/components/partner/partner-form-client'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: {
    absolute: 'انضم كشريك — توثيق المكتبات ودور النشر وبائعي الكتب | WaraqConnect',
  },
  description:
    'هل تمتلك مكتبة ورقية، دار نشر، أو متجراً إلكترونياً للكتب في مصر؟ سجّل الآن كشريك معتمد في منصة ورق كونكت (WaraqConnect). انضم مجاناً 100% مع شهر تجربة كامل، وعمولة مبيعات 10% فقط، وتوجيه فوري لطلبات القراء عبر واتساب المكتبة مع باقات توفير كتب مميزة.',
  keywords: [
    'تسجيل مكتبة في مصر',
    'شركاء ورق كونكت',
    'بيع كتب في مصر',
    'مكتبات القاهرة',
    'مكتبات الإسكندرية',
    'معرض القاهرة الدولي للكتاب',
    'توثيق متجر كتب',
    'دار نشر مصرية',
    'تسويق كتب ورقية',
    'توصيل كتب مصر',
    'عروض كتب وباقات',
    'WaraqConnect partners',
    'bookstore onboarding Egypt',
  ],
  alternates: {
    canonical: '/partner-form',
  },
  openGraph: {
    title: 'انضم كشريك — توثيق المكتبات ودور النشر وبائعي الكتب في مصر | WaraqConnect',
    description:
      'سجّل مكتبتك في شبكة ورق كونكت مجاناً واعرض عروض الحزم والفعاليات لآلاف القراء في كافة المحافظات مع توجيه الطلبات فوراً لواتساب مكتبتك والشهر الأول مجاناً 100%.',
    url: '/partner-form',
    siteName: 'WaraqConnect — ورق كونكت',
    locale: 'ar_EG',
    type: 'website',
    images: [
      {
        url: '/images/partner-share-card.jpg',
        width: 1200,
        height: 630,
        alt: 'برنامج شركاء ورق كونكت للمكتبات ودور النشر — WaraqConnect Partner Program',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'انضم كشريك — توثيق المكتبات ودور النشر وبائعي الكتب في مصر | WaraqConnect',
    description:
      'سجّل مكتبتك في شبكة ورق كونكت مجاناً واعرض عروض الحزم والفعاليات لآلاف القراء في كافة المحافظات مع توجيه الطلبات فوراً لواتساب مكتبتك والشهر الأول مجاناً 100%.',
    images: ['/images/partner-share-card.jpg'],
  },
}


interface PartnerFormPageProps {
  searchParams?: Promise<{ unauthorized?: string }>
}

export default async function PartnerFormPage({ searchParams }: PartnerFormPageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined
  const isUnauthorized = resolvedParams?.unauthorized === 'true'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userProfile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, full_name_ar, email')
      .eq('id', user.id)
      .single()
    userProfile = data
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'انضم كشريك — توثيق المكتبات ودور النشر | WaraqConnect',
    description:
      'بوابة تسجيل وتوثيق المكتبات ودور النشر للانضمام كشركاء معتمدين في منصة ورق كونكت.',
    url: 'https://waraqconnect.com/partner-form',
    publisher: {
      '@type': 'Organization',
      name: 'WaraqConnect',
      url: 'https://waraqconnect.com',
      logo: 'https://waraqconnect.com/images/logo.png',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PartnerFormClient
        user={user ? { id: user.id, email: user.email, profile: userProfile } : null}
        isUnauthorized={isUnauthorized}
      />
    </>
  )
}
