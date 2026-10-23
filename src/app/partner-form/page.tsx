import { Metadata } from 'next'
import { PartnerFormClient } from '@/components/partner/partner-form-client'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'انضم كشريك — توثيق المكتبات ودور النشر وبائعي الكتب | WaraqConnect (ورق كونكت)',
  description:
    'هل تمتلك مكتبة ورقية، دار نشر، أو متجراً إلكترونياً للكتب؟ سجّل الآن كشريك معتمد في منصة ورق كونكت (WaraqConnect). انضم مجاناً 100% مع شهر تجربة كامل يبدأ مع أول طلب حقيقي، وعمولة مبيعات 10% فقط، وتوجيه فوري لطلبات القراء عبر واتساب المكتبة.',
  keywords: [
    'تسجيل مكتبة',
    'شركاء ورق كونكت',
    'بيع كتب في مصر',
    'مكتبات القاهرة',
    'مكتبات الإسكندرية',
    'معرض الكتاب',
    'توثيق متجر كتب',
    'دار نشر مصرية',
    'تسويق كتب ورقية',
    'توصيل كتب مصر',
    'عروض كتب وباقات',
    'WaraqConnect partners',
    'bookstore onboarding Egypt',
  ],
  alternates: {
    canonical: 'https://waraqconnect.com/partner-form',
  },
  openGraph: {
    title: 'انضم كشريك — توثيق المكتبات ودور النشر وبائعي الكتب | WaraqConnect',
    description:
      'سجّل مكتبتك في شبكة ورق كونكت واستقبل طلبات القراء مباشرة عبر الواتساب مع باقات التوفير والشهر الأول مجاناً 100%.',
    url: 'https://waraqconnect.com/partner-form',
    siteName: 'WaraqConnect — ورق كونكت',
    locale: 'ar_EG',
    type: 'website',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1507842229451-7f01be7ac102?auto=format&fit=crop&w=1200&q=80',
        width: 1200,
        height: 630,
        alt: 'WaraqConnect Bookstore Partner Program',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'انضم كشريك — توثيق المكتبات وبائعي الكتب | WaraqConnect',
    description:
      'سجّل مكتبتك في شبكة ورق كونكت واستقبل طلبات القراء مباشرة عبر الواتساب مع باقات التوفير والشهر الأول مجاناً 100%.',
    images: ['https://images.unsplash.com/photo-1507842229451-7f01be7ac102?auto=format&fit=crop&w=1200&q=80'],
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
        user={user ? { id: user.id, profile: userProfile } : null}
        isUnauthorized={isUnauthorized}
      />
    </>
  )
}
