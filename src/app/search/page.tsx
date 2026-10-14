import { Metadata } from 'next'
import { Suspense } from 'react'
import { UniversalBookSearch } from '@/components/search/universal-book-search'
import { MainLayout } from '@/components/layout/main-layout'
import { Search, Sparkles, BookCheck, Bell, PlusCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'محرك بحث الكتب والـ ISBN — هل كتابك متوفر في مصر؟ | WARAQ | ورق',
  description:
    'ابحث عن أي كتاب بالاسم أو المؤلف أو رقم الـ ISBN، وتأكد فوراً هل هو متوفر للبيع أو المبادلة على منصة وَرَق، أو اطلبه ليصلك إشعار فور توفره.',
}

interface SearchPageProps {
  searchParams: Promise<{
    q?: string
  }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const initialQuery = params.q || ''

  return (
    <MainLayout>
      {/* Dynamic Ambient Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-b from-primary/15 via-background to-background border-b border-border/40 py-12 md:py-16">
        {/* Ambient Glow Orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
        <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none translate-y-1/4" />
        <div className="absolute bottom-0 left-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2" />

        <div className="page-container relative max-w-4xl text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs md:text-sm font-black border border-primary/25 shadow-xs">
            <Sparkles className="h-4 w-4 animate-spin text-amber-500" style={{ animationDuration: '4s' }} />
            <span>محرك بحث الكتب والـ ISBN الذكي في مصر 🇪🇬</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-foreground tracking-tight leading-tight">
            هل كتابك <span className="gradient-text-gold">متوفر على وَرَق؟</span>
          </h1>

          <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto leading-relaxed font-medium">
            ابحث في الكتالوج العالمي الشامل وقاعدة بياناتنا للكتب. اعرف فوراً هل توجد نسخ متاحة للتبادل، الشراء، أو الاستعارة، أو اطلبه ليصلك إشعار فور توفره!
          </p>

          {/* Quick stats pills */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5 text-xs font-bold text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card/80 backdrop-blur-md border border-border/60 shadow-2xs">
              <span className="radar-dot text-emerald-500" />
              <span>فحص فوري للتوفر حول العالم</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card/80 backdrop-blur-md border border-border/60 shadow-2xs">
              <span>📚</span>
              <span>يدعم الروايات العربية والـ ISBN العالمي</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card/80 backdrop-blur-md border border-border/60 shadow-2xs">
              <span>🔄</span>
              <span>تبادل مباشر بدون وسطاء</span>
            </span>
          </div>
        </div>
      </div>

      <div className="page-container py-8 max-w-4xl">
        <Suspense fallback={<div className="h-40 flex items-center justify-center text-muted-foreground font-bold">جاري تحميل محرك البحث الذكي...</div>}>
          <UniversalBookSearch initialQuery={initialQuery} />
        </Suspense>

        {/* Feature Explanations - Catchy Glass Cards */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-5 border-t border-border/60 pt-10">
          <div className="p-6 rounded-3xl bg-card/90 backdrop-blur-md border border-emerald-500/30 hover:border-emerald-500/60 shadow-xs hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 space-y-3 group">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <BookCheck className="h-6 w-6" />
            </div>
            <h3 className="font-black text-base text-foreground flex items-center gap-2">
              <span>متوفر على المنصة؟</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 font-bold">فوري</span>
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              ستظهر لك النسخ المتاحة فوراً مع الأسعار، خيارات المبادلة، ومناطق البائعين والقراء حول العالم لتطلبها بضغطة زر.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-card/90 backdrop-blur-md border border-amber-500/30 hover:border-amber-500/60 shadow-xs hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300 space-y-3 group">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <PlusCircle className="h-6 w-6" />
            </div>
            <h3 className="font-black text-base text-foreground flex items-center gap-2">
              <span>مش متوفر في مصر؟</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 font-bold">فرصة</span>
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              إذا كنت تملك هذا الكتاب، اضغط على &quot;أضف الكتاب&quot; وسيتم ملء جميع بياناته تلقائياً لتعرضه للبيع أو المبادلة في ثوانٍ.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-card/90 backdrop-blur-md border border-indigo-500/30 hover:border-indigo-500/60 shadow-xs hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 space-y-3 group">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <Bell className="h-6 w-6" />
            </div>
            <h3 className="font-black text-base text-foreground flex items-center gap-2">
              <span>تنبيهات قائمة الرغبات</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 font-bold">ذكي</span>
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              أضف أي كتاب غير متوفر لقائمة رغباتك، وسنرسل لك إشعاراً فور أن يقوم أي قارئ في منطقتك بإضافة نسخة منه.
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
