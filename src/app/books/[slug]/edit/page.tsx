import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShieldAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { EditBookForm } from '@/components/books/edit-book-form'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

interface EditBookPageProps {
  params: Promise<{ slug: string }>
}

function extractListingId(slug: string): string {
  const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
  const match = slug.match(uuidRegex)
  if (match) return match[0]
  const parts = slug.split('-')
  return parts[parts.length - 1]
}

export async function generateMetadata({ params }: EditBookPageProps): Promise<Metadata> {
  const { slug } = await params
  const listingId = extractListingId(slug)
  const supabase = await createClient()

  const { data: listing } = await supabase
    .from('book_listings')
    .select('book:books(title)')
    .eq('id', listingId)
    .maybeSingle()

  const title = (listing?.book as any)?.title || 'تعديل الكتاب'
  return {
    title: `تعديل: ${title} — BookSwap`,
  }
}

export default async function EditBookPage({ params }: EditBookPageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const listingId = extractListingId(slug)

  if (!user) {
    redirect(`/login?redirectTo=/books/${encodeURIComponent(slug)}/edit`)
  }

  // Fetch listing data
  let { data: listing } = await supabase
    .from('book_listings')
    .select(`
      *,
      book:books(*, category:categories(*)),
      images:book_images(id, url, is_primary, sort_order),
      city:cities(*),
      area:areas(*)
    `)
    .eq('id', listingId)
    .maybeSingle()

  // Fallback by book_id if slug matches book_id
  if (!listing) {
    const { data: byBookId } = await supabase
      .from('book_listings')
      .select(`
        *,
        book:books(*, category:categories(*)),
        images:book_images(id, url, is_primary, sort_order),
        city:cities(*),
        area:areas(*)
      `)
      .eq('book_id', listingId)
      .limit(1)
      .maybeSingle()

    listing = byBookId
  }

  if (!listing) {
    notFound()
  }

  // Security check: Owner, Admin, or Moderator can edit
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const isOwner = listing.seller_id === user.id
  const hasPrivileges = isOwner || profile?.role === 'ADMIN' || profile?.role === 'MODERATOR'

  if (!hasPrivileges) {
    return (
      <MainLayout user={{ id: user.id }}>
        <div className="page-container py-16 max-w-lg text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-destructive/15 text-destructive flex items-center justify-center">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-bold">غير مصرح لك بتعديل هذا الكتاب</h1>
          <p className="text-sm text-muted-foreground">
            فقط المستخدم صاحب الكتاب أو إدارة المنصة يملكون صلاحية تعديل بيانات هذا الكتاب.
          </p>
          <div className="pt-2">
            <Link href={`/books/${listing.id}`}>
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                العودة لصفحة الكتاب
              </Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Fetch active categories and cities for dropdowns
  const [{ data: categories }, { data: cities }] = await Promise.all([
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('cities').select('*, areas(*)').eq('is_active', true).order('sort_order'),
  ])

  return (
    <MainLayout user={{ id: user.id }}>
      <div className="page-container py-8 max-w-2xl">
        <EditBookForm
          listing={listing}
          userId={user.id}
          categories={categories ?? []}
          cities={cities ?? []}
        />
      </div>
    </MainLayout>
  )
}
