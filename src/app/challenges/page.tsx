import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getChallenges } from '@/lib/challenges/challenge-service'
import { ChallengesHubClient } from '@/components/challenges/challenges-hub-client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'تحديات القراءة والماراثونات الأدبية والأوسمة — WARAQ | ورق',
  description:
    'انضم إلى تحديات قراءة كتاب في 48 ساعة، تحدي 4 كتب في الشهر، ماراثون أدب نوبل مع نجيب محفوظ، وتحدي التدوير الذكي. اجمع الأوسمة واشعل شعلة القراءة اليومية.',
  openGraph: {
    title: 'تحديات القراءة والماراثونات الأدبية والأوسمة — WARAQ | ورق',
    description: 'انضم لآلاف القراء في مصر في سبرنتات نهاية الأسبوع وتحديات بناء عادة القراءة المستمرة.',
    type: 'website',
  },
}

export default async function ChallengesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const challenges = await getChallenges()

  // Schema.org JSON-LD structured data for challenges
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'تحديات القراءة وماراثون الكتب — WARAQ',
    description: 'سلسلة تحديات وسبرنتات القراءة الشهرية والأسبوعية لمجتمع القراء في مصر',
    itemListElement: challenges.map((c, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Course',
        name: c.title_ar,
        description: c.description_ar,
        provider: {
          '@type': 'Organization',
          name: 'WARAQ | ورق',
          sameAs: 'https://waraq.app',
        },
      },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ChallengesHubClient initialChallenges={challenges} currentUserId={user?.id ?? null} />
    </>
  )
}
