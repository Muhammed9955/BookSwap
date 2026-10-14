'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, Trash2, BookOpen, Bell } from 'lucide-react'
import { WishlistItem, Book } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/i18n/language-context'
import { createClient } from '@/lib/supabase/client'

interface WishlistClientProps {
  userId: string
  wishlistItems: (WishlistItem & { book?: Book & { category?: { name_ar: string; name_en: string; icon?: string } } })[]
  matchingListings: Record<string, boolean>
}

export function WishlistClient({ userId, wishlistItems: initial, matchingListings }: WishlistClientProps) {
  const { lang } = useLanguage()
  const supabase = createClient()
  const [items, setItems] = useState(initial)

  const removeItem = async (id: string) => {
    await supabase.from('wishlist_items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  return (
    <div className="page-container py-6 max-w-3xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold">
            {lang === 'ar' ? '❤️ قائمة الأمنيات' : '❤️ Wishlist'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {lang === 'ar' ? `${items.length} كتاب` : `${items.length} books`}
          </p>
        </div>
        <Link href="/explore">
          <Button variant="outline" size="sm">
            {lang === 'ar' ? 'استكشف كتب' : 'Explore Books'}
          </Button>
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <Heart className="h-12 w-12 text-muted-foreground mb-3" />
          <h3 className="font-bold text-lg mb-1">
            {lang === 'ar' ? 'قائمة أمنياتك فاضية' : 'Your wishlist is empty'}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {lang === 'ar'
              ? 'أضف الكتب اللي نفسك تقرأها وهبلغك أول ما تظهر'
              : "Add books you want to read and we'll notify you when they appear"
            }
          </p>
          <Link href="/explore">
            <Button>{lang === 'ar' ? 'اكتشف الكتب' : 'Discover Books'}</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const book = item.book
            const hasMatch = book?.id ? matchingListings[book.id] : false

            return (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:border-primary/30 transition-colors"
              >
                {/* Cover */}
                <div className="h-16 w-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {book?.cover_image_url ? (
                    <Image src={book.cover_image_url} alt={book.title} width={48} height={64} className="object-cover h-full w-full" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xl bg-gradient-to-br from-primary/10 to-purple-500/10">📚</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm line-clamp-1">
                        {lang === 'ar' && book?.title_ar ? book.title_ar : book?.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {lang === 'ar' && book?.author_ar ? book.author_ar : book?.author}
                      </p>
                    </div>

                    {hasMatch && (
                      <Badge variant="success" className="flex-shrink-0 text-[10px]">
                        <Bell className="h-2.5 w-2.5 me-1" />
                        {lang === 'ar' ? 'متاح الآن!' : 'Available!'}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-1.5">
                    {item.max_price && (
                      <span className="text-xs text-muted-foreground">
                        {lang === 'ar' ? 'حتى' : 'Up to'} {item.max_price.toLocaleString()} {lang === 'ar' ? 'ج.م' : 'EGP'}
                      </span>
                    )}
                    {item.prefer_swap && (
                      <span className="text-xs text-primary">🔄 {lang === 'ar' ? 'مبادلة مفضلة' : 'Prefer swap'}</span>
                    )}
                    {book?.category && (
                      <span className="text-xs text-muted-foreground">
                        {book.category.icon} {lang === 'ar' ? book.category.name_ar : book.category.name_en}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {hasMatch && (
                    <Link href={`/explore?q=${encodeURIComponent(book?.title ?? '')}`}>
                      <Button size="sm">
                        {lang === 'ar' ? 'شوف' : 'View'}
                      </Button>
                    </Link>
                  )}
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="text-red-400 hover:text-red-600"
                    onClick={() => removeItem(item.id)}
                    aria-label="Remove from wishlist"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
