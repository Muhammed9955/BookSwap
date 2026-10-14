'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useDropzone } from 'react-dropzone'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Search, Upload, X, BookOpen, Loader2, Check, 
  Sparkles, Camera, ShieldCheck, AlertCircle, RefreshCw, Wand2,
  Trash2, ArrowRight, Eye, ChevronDown, AlertTriangle
} from 'lucide-react'
import { deleteBookListing } from '@/lib/books/listing-actions'
import { createClient } from '@/lib/supabase/client'
import { Category, BookListing } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/i18n/language-context'
import { cn } from '@/lib/utils'
import { compressImageForAi } from '@/lib/image-utils'

const editBookSchema = z.object({
  title: z.string().min(1, 'عنوان الكتاب مطلوب'),
  author: z.string().min(1, 'اسم المؤلف مطلوب'),
  isbn: z.string().optional().nullable(),
  publisher: z.string().optional().nullable(),
  edition: z.string().optional().nullable(),
  language: z.enum(['ARABIC', 'ENGLISH', 'FRENCH', 'GERMAN', 'OTHER']).default('ARABIC').optional(),
  category_id: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  condition: z.enum(['NEW', 'LIKE_NEW', 'VERY_GOOD', 'GOOD', 'ACCEPTABLE']).default('GOOD'),
  listing_type: z.enum(['SELL', 'SWAP', 'SELL_OR_SWAP', 'GIVEAWAY']).default('SELL'),
  price: z.coerce.number().min(0).optional().nullable(),
  is_negotiable: z.boolean().default(false),
  status: z.enum(['ACTIVE', 'RESERVED', 'SOLD', 'HIDDEN', 'DELETED']).default('ACTIVE'),
  city_id: z.string().optional().nullable(),
  area_id: z.string().optional().nullable(),
})

type EditBookData = z.infer<typeof editBookSchema>

interface ExistingImage {
  id: string
  url: string
  is_primary?: boolean
  sort_order?: number
}

interface EditBookFormProps {
  listing: BookListing
  userId: string
  categories: Category[]
  cities: Array<{ id: string; name_ar: string; name_en: string; slug: string; areas: Array<{ id: string; name_ar: string; name_en: string; slug: string }> }>
}

const CONDITIONS = [
  { value: 'NEW', labelAr: 'جديد', labelEn: 'New', desc: 'مش متفتح خالص' },
  { value: 'LIKE_NEW', labelAr: 'شبه جديد', labelEn: 'Like New', desc: 'اتقرأ مرة أو اتنين' },
  { value: 'VERY_GOOD', labelAr: 'ممتاز', labelEn: 'Very Good', desc: 'حالة كويسة جداً' },
  { value: 'GOOD', labelAr: 'جيد', labelEn: 'Good', desc: 'فيه بعض الاستخدام' },
  { value: 'ACCEPTABLE', labelAr: 'مقبول', labelEn: 'Acceptable', desc: 'اتستخدم كتير بس مقروء' },
]

const LISTING_TYPES = [
  { value: 'SELL', labelAr: 'بيع 💰', labelEn: 'Sell 💰', descAr: 'حدد سعر وبيع', descEn: 'Set a price and sell' },
  { value: 'SWAP', labelAr: 'مبادلة 🔄', labelEn: 'Swap 🔄', descAr: 'بادله بكتاب تاني', descEn: 'Exchange for another book' },
  { value: 'SELL_OR_SWAP', labelAr: 'بيع أو مبادلة', labelEn: 'Sale or Swap', descAr: 'الاتنين مقبولين', descEn: 'Either works' },
  { value: 'GIVEAWAY', labelAr: 'مجاني 🎁', labelEn: 'Giveaway 🎁', descAr: 'هبه مجانية', descEn: 'Give it away free' },
]

const LANGUAGES = [
  { value: 'ARABIC', labelAr: 'عربي', labelEn: 'Arabic' },
  { value: 'ENGLISH', labelAr: 'إنجليزي', labelEn: 'English' },
  { value: 'FRENCH', labelAr: 'فرنساوي', labelEn: 'French' },
  { value: 'GERMAN', labelAr: 'ألماني', labelEn: 'German' },
  { value: 'OTHER', labelAr: 'غيره', labelEn: 'Other' },
]

export function EditBookForm({ listing, userId, categories, cities }: EditBookFormProps) {
  const { lang } = useLanguage()
  const router = useRouter()
  const supabase = createClient()

  const book = listing.book

  // Extract clean description (strip previous auto-appended lending text for clean editing)
  const initialRawDesc = (listing.description || book?.description || '')
    .replace(/\n*⏳\s*(?:متاح للاستعارة المؤقتة|Available for Peer-to-Peer Lending)[\s\S]*$/, '')
    .trim()

  // Parse existing lending details
  const existingDesc = listing.description || ''
  const depositMatch = existingDesc.match(/(?:التأمين المسترد بالكامل|Refundable Deposit):\s*(\d+)/i)
  const feeMatch = existingDesc.match(/(?:رسم الاستعارة الأسبوعي|Weekly Fee):\s*(\d+)/i)

  const initialDeposit = depositMatch ? Number(depositMatch[1]) : (listing.price ? Math.round(listing.price) : 60)
  const initialFee = feeMatch ? Number(feeMatch[1]) : (listing.price && listing.price >= 300 ? Math.round(listing.price * 0.10) : 15)

  // State
  const [existingImages, setExistingImages] = useState<ExistingImage[]>(listing.images || [])
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([])
  const [newImages, setNewImages] = useState<Array<{ file: File; preview: string }>>([])
  
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const [selectedCityId, setSelectedCityId] = useState<string>(listing.city_id || '')
  const [selectedAreaId, setSelectedAreaId] = useState<string>(listing.area_id || '')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(book?.category_id || '')

  // Dropdown popover open states
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false)
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false)
  const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState(false)

  const catRef = useRef<HTMLDivElement>(null)
  const cityRef = useRef<HTMLDivElement>(null)
  const areaRef = useRef<HTMLDivElement>(null)

  // Dynamic lending state
  const [availableForLending, setAvailableForLending] = useState<boolean>(
    existingDesc.includes('متاح للاستعارة') || existingDesc.includes('Available for Peer-to-Peer Lending') || true
  )
  const [customDeposit, setCustomDeposit] = useState<number>(initialDeposit)
  const [customFeeWeekly, setCustomFeeWeekly] = useState<number>(initialFee)
  const [showLendingModal, setShowLendingModal] = useState(false)
  const [aiScanLoading, setAiScanLoading] = useState(false)
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleDeleteListing = async () => {
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await deleteBookListing(listing.id)
      setShowDeleteModal(false)
      router.push('/profile?tab=books')
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (lang === 'ar' ? 'فشل حذف الكتاب، يرجى المحاولة لاحقاً' : 'Failed to delete listing')
      setDeleteError(msg)
    } finally {
      setIsDeleting(false)
    }
  }

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (catRef.current && !catRef.current.contains(event.target as Node)) {
        setIsCatDropdownOpen(false)
      }
      if (cityRef.current && !cityRef.current.contains(event.target as Node)) {
        setIsCityDropdownOpen(false)
      }
      if (areaRef.current && !areaRef.current.contains(event.target as Node)) {
        setIsAreaDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<EditBookData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(editBookSchema) as any,
    defaultValues: {
      title: book?.title || '',
      author: book?.author || '',
      isbn: book?.isbn || '',
      publisher: book?.publisher || '',
      edition: book?.edition || 'الأولى',
      language: (book?.language as any) || 'ARABIC',
      category_id: book?.category_id || '',
      description: initialRawDesc,
      condition: listing.condition || 'GOOD',
      listing_type: listing.listing_type || 'SELL',
      price: listing.price || 0,
      is_negotiable: listing.is_negotiable || false,
      status: (listing.status as any) || 'ACTIVE',
      city_id: listing.city_id || '',
      area_id: listing.area_id || '',
    },
  })

  const selectedCity = cities.find(c => c.id === selectedCityId)
  const areas = selectedCity?.areas ?? []
  const selectedCityObj = selectedCity
  const selectedAreaObj = areas.find(a => a.id === selectedAreaId)
  const selectedCategoryObj = categories.find(c => c.id === (selectedCategoryId || watch('category_id')))

  const listingType = watch('listing_type')
  const condition = watch('condition')
  const language = watch('language')
  const bookPrice = watch('price') || 0
  const isExpensiveBook = bookPrice >= 300
  const currentStatus = watch('status')

  // Auto-recalculate lending terms if price changes and user hasn't explicitly customized
  useEffect(() => {
    if (bookPrice > 0) {
      if (bookPrice >= 300) {
        setCustomDeposit(Math.round(bookPrice))
        const fee = bookPrice > 500 ? Math.round(bookPrice * 0.08) : Math.round(bookPrice * 0.10)
        setCustomFeeWeekly(Math.max(25, fee))
      } else {
        setCustomDeposit(Math.round(bookPrice))
        setCustomFeeWeekly(Math.max(15, Math.round(bookPrice * 0.12)))
      }
    }
  }, [bookPrice])

  // Dropzone for new images
  const totalImageCount = existingImages.length + newImages.length

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const remainingSlots = 5 - (existingImages.length + newImages.length)
    if (remainingSlots <= 0) return

    const filesToAdd = acceptedFiles.slice(0, remainingSlots)
    const newPreviews = filesToAdd.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }))

    setNewImages(prev => [...prev, ...newPreviews])
  }, [existingImages.length, newImages.length])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 5,
    disabled: totalImageCount >= 5,
  })

  const removeExistingImage = (id: string) => {
    setExistingImages(prev => prev.filter(img => img.id !== id))
    setDeletedImageIds(prev => [...prev, id])
  }

  const removeNewImage = (index: number) => {
    setNewImages(prev => {
      const target = prev[index]
      if (target) URL.revokeObjectURL(target.preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  // Handle re-scan with AI
  const triggerAiRescan = async (file: File) => {
    setAiScanLoading(true)
    setAiSuccessMessage(null)
    try {
      const { base64Data, mimeType } = await compressImageForAi(file, 1200, 0.82)
      const customKey = localStorage.getItem('bookswap_gemini_api_key') || process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (customKey) headers['x-gemini-key'] = customKey

      const res = await fetch('/api/books/scan-cover', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType,
        }),
      })

        const data = await res.json()
        if (data.success && data.data) {
          const b = data.data
          if (b.title) setValue('title', b.title, { shouldValidate: true })
          if (b.author) setValue('author', b.author, { shouldValidate: true })
          if (b.publisher) setValue('publisher', b.publisher)
          if (b.edition) setValue('edition', b.edition)
          if (b.isbn) setValue('isbn', b.isbn)
          if (b.description && !watch('description')) setValue('description', b.description)
          if (b.category_name) {
            const matchedCat = categories.find(c => 
              c.name_ar?.toLowerCase().includes(b.category_name.toLowerCase()) ||
              c.name_en?.toLowerCase().includes(b.category_name.toLowerCase()) ||
              c.slug?.toLowerCase().includes(b.category_name.toLowerCase())
            )
            if (matchedCat) {
              setSelectedCategoryId(matchedCat.id)
              setValue('category_id', matchedCat.id)
            }
          }
          setAiSuccessMessage(lang === 'ar' ? 'تم تحديث بيانات الكتاب بالذكاء الاصطناعي بنجاح!' : 'Metadata refreshed via AI!')
        }
    } catch {
      // ignore
    } finally {
      setAiScanLoading(false)
    }
  }

  const onInvalid = (fieldErrors: any) => {
    console.error('Validation errors on edit book form:', fieldErrors)
    const errValues = Object.values(fieldErrors) as Array<{ message?: string }>
    const firstMsg = errValues.find(e => e?.message)?.message || (lang === 'ar' ? 'يرجى مراجعة الحقول المطلوبة والتأكد من صحتها' : 'Please verify all required fields')
    setError(firstMsg)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Submit Handler
  const onSubmit = async (data: EditBookData) => {
    setUploading(true)
    setError(null)

    try {
      let bookId = book?.id || listing.book_id
      const finalCategoryId = selectedCategoryId || data.category_id || null
      const finalCityId = selectedCityId || data.city_id || null
      const finalAreaId = selectedAreaId || data.area_id || null

      // 1. Update book metadata
      if (bookId) {
        const { error: bookUpdateErr } = await supabase
          .from('books')
          .update({
            title: data.title,
            author: data.author,
            isbn: data.isbn || null,
            publisher: data.publisher || null,
            edition: data.edition || null,
            language: data.language || 'ARABIC',
            category_id: finalCategoryId,
            description: data.description || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', bookId)

        if (bookUpdateErr) {
          console.warn('Direct book update failed (RLS check), finding or inserting book record:', bookUpdateErr)
          // Find or create matching book
          const { data: existingBook } = await supabase
            .from('books')
            .select('id')
            .ilike('title', data.title)
            .ilike('author', data.author)
            .maybeSingle()

          if (existingBook) {
            bookId = existingBook.id
          } else {
            const { data: newBook, error: newBookErr } = await supabase
              .from('books')
              .insert({
                title: data.title,
                author: data.author,
                isbn: data.isbn || null,
                publisher: data.publisher || null,
                edition: data.edition || null,
                language: data.language || 'ARABIC',
                category_id: finalCategoryId,
                description: data.description || null,
                created_by: userId,
              })
              .select('id')
              .single()

            if (!newBookErr && newBook) {
              bookId = newBook.id
            }
          }
        }
      }

      // 2. Format description with dynamic lending terms
      let finalDescription = data.description || ''
      if (availableForLending && data.listing_type !== 'GIVEAWAY') {
        const lendingHeader = lang === 'ar'
          ? `\n\n⏳ متاح للاستعارة المؤقتة:\n• التأمين المسترد بالكامل: ${customDeposit} ج.م\n• رسم الاستعارة الأسبوعي: ${customFeeWeekly} ج.م/أسبوع${isExpensiveBook ? '\n• 💎 مرجع قيّم: التأمين يغطي 100% من قيمة الكتاب لحماية المالك.' : ''}`
          : `\n\n⏳ Available for Peer-to-Peer Lending:\n• Refundable Deposit: ${customDeposit} EGP\n• Weekly Fee: ${customFeeWeekly} EGP/week${isExpensiveBook ? '\n• 💎 High-Value Book: Full deposit protects owner from loss.' : ''}`

        if (!finalDescription.includes('متاح للاستعارة') && !finalDescription.includes('Available for Peer-to-Peer Lending')) {
          finalDescription = finalDescription ? `${finalDescription}${lendingHeader}` : lendingHeader.trim()
        }
      }

      // 3. Update listing
      const { error: listingErr } = await supabase
        .from('book_listings')
        .update({
          book_id: bookId,
          listing_type: data.listing_type,
          condition: data.condition,
          price: data.listing_type === 'GIVEAWAY' ? 0 : (data.price !== undefined && data.price !== null ? data.price : null),
          is_negotiable: data.is_negotiable,
          status: data.status,
          city_id: finalCityId,
          area_id: finalAreaId,
          description: finalDescription || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', listing.id)

      if (listingErr) throw new Error(listingErr.message || (lang === 'ar' ? 'فشل في تحديث بيانات الكتاب' : 'Failed to update listing'))

      // 4. Handle deleted images
      if (deletedImageIds.length > 0) {
        await supabase
          .from('book_images')
          .delete()
          .in('id', deletedImageIds)
      }

      const remainingExisting = existingImages.filter(img => !deletedImageIds.includes(img.id))

      // 5. Upload any newly added images
      if (newImages.length > 0) {
        const currentSort = remainingExisting.length
        for (let i = 0; i < newImages.length; i++) {
          const img = newImages[i]
          const ext = img.file.name.split('.').pop()
          const path = `${userId}/${listing.id}/${currentSort + i}-${Date.now()}.${ext}`

          const { error: uploadErr } = await supabase.storage
            .from('book-images')
            .upload(path, img.file, { cacheControl: '3600' })

          if (!uploadErr) {
            const { data: { publicUrl } } = supabase.storage
              .from('book-images')
              .getPublicUrl(path)

            await supabase.from('book_images').insert({
              listing_id: listing.id,
              url: publicUrl,
              storage_path: path,
              is_primary: remainingExisting.length === 0 && i === 0,
              sort_order: currentSort + i,
            })
          }
        }
      } else if (remainingExisting.length > 0) {
        await supabase
          .from('book_images')
          .update({ is_primary: true })
          .eq('id', remainingExisting[0].id)
      }

      setSuccess(true)
      setTimeout(() => {
        router.push(`/books/${listing.id}`)
        router.refresh()
      }, 1000)

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : (lang === 'ar' ? 'حصل خطأ. حاول تاني.' : 'Something went wrong.'))
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border/60">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            {lang === 'ar' ? 'تعديل بيانات الكتاب' : 'Edit Book Listing'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === 'ar'
              ? 'حدّث معلومات الكتاب، السعر، شروط الاستعارة، أو حالة العرض'
              : 'Update book details, price, lending policy, or listing status'}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/books/${listing.id}`)}
          className="flex items-center gap-1.5"
        >
          <ArrowRight className="h-4 w-4" />
          {lang === 'ar' ? 'معاينة الإعلان' : 'View Listing'}
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {aiSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm flex items-center gap-2">
          <Sparkles className="h-5 w-5 shrink-0" />
          <span>{aiSuccessMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-8">
        
        {/* Listing Status Controls */}
        <div className="p-4 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold">
                {lang === 'ar' ? 'حالة الإعلان' : 'Listing Status'}
              </Label>
              <p className="text-xs text-muted-foreground">
                {lang === 'ar' 
                  ? 'يمكنك إيقاف ظهور الكتاب مؤقتاً أو تفعيله للظهور للباحثين' 
                  : 'Toggle visibility of your book to searchers'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setValue('status', 'ACTIVE')}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border',
                  currentStatus === 'ACTIVE'
                    ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30 shadow-sm'
                    : 'bg-muted/40 text-muted-foreground border-transparent hover:bg-muted'
                )}
              >
                ● {lang === 'ar' ? 'نشط (متاح للجميع)' : 'Active (Available)'}
              </button>

              <button
                type="button"
                onClick={() => setValue('status', 'RESERVED')}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border',
                  currentStatus === 'RESERVED'
                    ? 'bg-amber-500/15 text-amber-500 border-amber-500/30 shadow-sm'
                    : 'bg-muted/40 text-muted-foreground border-transparent hover:bg-muted'
                )}
              >
                ⏳ {lang === 'ar' ? 'محجوز مؤقتاً' : 'Reserved'}
              </button>

              <button
                type="button"
                onClick={() => setValue('status', 'HIDDEN')}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border',
                  currentStatus === 'HIDDEN'
                    ? 'bg-orange-500/15 text-orange-500 border-orange-500/30 shadow-sm'
                    : 'bg-muted/40 text-muted-foreground border-transparent hover:bg-muted'
                )}
              >
                ⏸ {lang === 'ar' ? 'متوقف مؤقتاً (مخفي)' : 'Paused (Hidden)'}
              </button>

              <button
                type="button"
                onClick={() => setValue('status', 'SOLD')}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border',
                  currentStatus === 'SOLD'
                    ? 'bg-purple-500/15 text-purple-500 border-purple-500/30 shadow-sm'
                    : 'bg-muted/40 text-muted-foreground border-transparent hover:bg-muted'
                )}
              >
                ✓ {lang === 'ar' ? 'تم البيع' : 'Sold'}
              </button>
            </div>
          </div>
        </div>

        {/* Photos Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">
              {lang === 'ar' ? 'صور الكتاب' : 'Book Photos'} ({totalImageCount}/5)
            </Label>
            <span className="text-xs text-muted-foreground">
              {lang === 'ar' ? 'يمكنك حذف صور وإضافة صور بديلة' : 'Add or remove photos'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {/* Existing Images */}
            {existingImages.map((img, i) => (
              <div key={img.id} className="relative aspect-[3/4] rounded-xl overflow-hidden border border-border group bg-muted/20">
                <Image src={img.url} alt={`Book image ${i}`} fill className="object-cover" />
                {i === 0 && (
                  <Badge className="absolute top-1.5 right-1.5 text-[10px] px-1.5 py-0 bg-primary/90 text-white">
                    {lang === 'ar' ? 'الرئيسية' : 'Cover'}
                  </Badge>
                )}
                <button
                  type="button"
                  onClick={() => removeExistingImage(img.id)}
                  className="absolute top-1.5 left-1.5 p-1 rounded-full bg-black/70 text-white hover:bg-destructive transition-colors opacity-90 group-hover:opacity-100"
                  title={lang === 'ar' ? 'حذف الصورة' : 'Delete photo'}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            {/* New Images */}
            {newImages.map((img, i) => (
              <div key={i} className="relative aspect-[3/4] rounded-xl overflow-hidden border border-primary/40 group bg-muted/20">
                <Image src={img.preview} alt={`New upload ${i}`} fill className="object-cover" />
                <Badge className="absolute top-1.5 right-1.5 text-[10px] px-1.5 py-0 bg-emerald-600 text-white">
                  {lang === 'ar' ? 'جديدة' : 'New'}
                </Badge>
                <div className="absolute bottom-1.5 left-1.5 right-1.5 flex gap-1">
                  <button
                    type="button"
                    onClick={() => triggerAiRescan(img.file)}
                    disabled={aiScanLoading}
                    className="flex-1 py-1 px-1 rounded-md bg-primary/90 text-white hover:bg-primary text-[10px] font-medium flex items-center justify-center gap-1 shadow-sm"
                    title={lang === 'ar' ? 'فحص الغلاف بالذكاء الاصطناعي' : 'Re-scan with AI'}
                  >
                    {aiScanLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                    <span>{lang === 'ar' ? 'مسح بالذكاء' : 'AI Scan'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeNewImage(i)}
                    className="p-1 rounded-md bg-black/70 text-white hover:bg-destructive transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {/* Dropzone trigger if under 5 */}
            {totalImageCount < 5 && (
              <div
                {...getRootProps()}
                className={cn(
                  'aspect-[3/4] rounded-xl border-2 border-dashed border-border/80 hover:border-primary/60 flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-all bg-card/40 hover:bg-card/70',
                  isDragActive && 'border-primary bg-primary/5'
                )}
              >
                <input {...getInputProps()} />
                <Camera className="h-6 w-6 text-muted-foreground mb-1.5" />
                <span className="text-xs font-medium text-foreground">
                  {lang === 'ar' ? 'إضافة صورة' : 'Add Photo'}
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  {lang === 'ar' ? 'PNG, JPG حتى 5MB' : 'Max 5MB'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Section: Book Details */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 border-b border-border/40 pb-2">
            <BookOpen className="h-5 w-5 text-primary" />
            {lang === 'ar' ? 'بيانات الكتاب' : 'Book Details'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">{lang === 'ar' ? 'عنوان الكتاب' : 'Book Title'} *</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder={lang === 'ar' ? 'مثال: في قلبي أنثى عبرية' : 'e.g. Sapiens'}
              />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="author">{lang === 'ar' ? 'المؤلف' : 'Author'} *</Label>
              <Input
                id="author"
                {...register('author')}
                placeholder={lang === 'ar' ? 'اسم الكاتب' : 'Author Name'}
              />
              {errors.author && <p className="text-xs text-destructive">{errors.author.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="publisher">{lang === 'ar' ? 'دار النشر' : 'Publisher'}</Label>
              <Input
                id="publisher"
                {...register('publisher')}
                placeholder={lang === 'ar' ? 'مثال: عصير الكتب / الشروق' : 'Publisher name'}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="isbn">ISBN</Label>
              <Input
                id="isbn"
                {...register('isbn')}
                placeholder="978-..."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edition">{lang === 'ar' ? 'رقم الطبعة' : 'Edition'}</Label>
              <Input
                id="edition"
                {...register('edition')}
                placeholder={lang === 'ar' ? 'الأولى / الثانية...' : '1st, 2nd...'}
              />
            </div>

            {/* Custom Popover Dropdown for Category */}
            <div className="space-y-1.5" ref={catRef}>
              <Label>{lang === 'ar' ? 'التصنيف' : 'Category'}</Label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsCatDropdownOpen(prev => !prev)}
                  className="w-full h-10 px-3.5 rounded-lg border border-input bg-card text-foreground flex items-center justify-between text-sm shadow-sm hover:border-primary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <span className="truncate">
                    {selectedCategoryObj
                      ? (lang === 'ar' ? selectedCategoryObj.name_ar : selectedCategoryObj.name_en)
                      : (lang === 'ar' ? 'اختر تصنيف الكتاب...' : 'Select category...')}
                  </span>
                  <ChevronDown className={cn('h-4 w-4 opacity-50 transition-transform duration-200', isCatDropdownOpen && 'rotate-180')} />
                </button>

                {isCatDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-xl border border-border bg-card shadow-xl p-1 text-foreground divide-y divide-border/30">
                    {categories.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedCategoryId(c.id)
                          setValue('category_id', c.id)
                          setIsCatDropdownOpen(false)
                        }}
                        className={cn(
                          'w-full text-right px-3 py-2 text-sm rounded-lg flex items-center justify-between hover:bg-primary/10 hover:text-primary transition-colors',
                          selectedCategoryId === c.id && 'bg-primary/15 text-primary font-medium'
                        )}
                      >
                        <span>{lang === 'ar' ? c.name_ar : c.name_en}</span>
                        {selectedCategoryId === c.id && <Check className="h-4 w-4" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Language Selection */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label>{lang === 'ar' ? 'لغة الكتاب' : 'Language'}</Label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map(l => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => setValue('language', l.value as any)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer',
                      (watch('language') || 'ARABIC') === l.value
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs ring-1 ring-primary/20'
                        : 'border-border/60 bg-card text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {lang === 'ar' ? l.labelAr : l.labelEn}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">{lang === 'ar' ? 'نبذة عن الكتاب' : 'Description'}</Label>
            <Textarea
              id="description"
              {...register('description')}
              rows={4}
              placeholder={lang === 'ar' ? 'اكتب نبذة شيقة أو معلومات إضافية عن حالة نسختك...' : 'Summary or specific copy notes...'}
            />
          </div>
        </div>

        {/* Section: Listing Details & Pricing */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 border-b border-border/40 pb-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {lang === 'ar' ? 'نوع العرض والسعر' : 'Listing Type & Pricing'}
          </h2>

          {/* Listing Type Selectors */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {LISTING_TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setValue('listing_type', t.value as any)}
                className={cn(
                  'p-3 rounded-xl border text-center transition-all',
                  listingType === t.value
                    ? 'border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20'
                    : 'border-border/60 bg-card hover:border-primary/40'
                )}
              >
                <div className="font-semibold text-sm">{lang === 'ar' ? t.labelAr : t.labelEn}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{lang === 'ar' ? t.descAr : t.descEn}</div>
              </button>
            ))}
          </div>

          {/* Condition Selectors */}
          <div className="space-y-1.5">
            <Label>{lang === 'ar' ? 'حالة النسخة' : 'Book Condition'}</Label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {CONDITIONS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setValue('condition', c.value as any)}
                  className={cn(
                    'p-2.5 rounded-lg border text-center transition-all',
                    condition === c.value
                      ? 'border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary/20'
                      : 'border-border/60 bg-card text-muted-foreground hover:text-foreground'
                  )}
                >
                  <div className="text-xs font-medium">{lang === 'ar' ? c.labelAr : c.labelEn}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{c.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Price & Negotiable */}
          {listingType !== 'GIVEAWAY' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="price">{lang === 'ar' ? 'السعر (ج.م)' : 'Price (EGP)'} *</Label>
                  {isExpensiveBook && (
                    <Badge variant="outline" className="text-[11px] bg-amber-500/10 text-amber-500 border-amber-500/30">
                      💎 {lang === 'ar' ? 'كتاب قيّم / مرجع' : 'High-Value Book'}
                    </Badge>
                  )}
                </div>
                <Input
                  id="price"
                  type="number"
                  {...register('price')}
                  placeholder="120"
                />
              </div>

              <div className="pt-5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    {...register('is_negotiable')}
                    className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                  />
                  <span className="text-sm">
                    {lang === 'ar' ? 'السعر قابل للتفاوض البسيط' : 'Price is negotiable'}
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Peer-to-Peer Lending Section */}
          {listingType !== 'GIVEAWAY' && (
            <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="text-sm font-semibold">
                      {lang === 'ar' ? 'تفعيل نظام الاستعارة التبادلي' : 'Peer-to-Peer Lending'}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {lang === 'ar' ? 'يتيح للآخرين استعارة الكتاب مع تأمين مسترد بالكامل' : 'Allow others to borrow with full refundable deposit'}
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={availableForLending}
                  onChange={e => setAvailableForLending(e.target.checked)}
                  className="h-5 w-5 rounded border-primary text-primary focus:ring-primary cursor-pointer"
                />
              </div>

              {availableForLending && (
                <div className="pt-2 grid grid-cols-2 gap-3 border-t border-primary/10">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      {lang === 'ar' ? 'التأمين المسترد (100% مسترد)' : 'Refundable Deposit'}
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={customDeposit}
                        onChange={e => setCustomDeposit(Number(e.target.value))}
                        className="h-9 text-sm pr-7"
                      />
                      <span className="absolute left-2.5 top-2 text-xs text-muted-foreground">ج.م</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      {lang === 'ar' ? 'رسم الاستعارة الأسبوعي' : 'Weekly Borrow Fee'}
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={customFeeWeekly}
                        onChange={e => setCustomFeeWeekly(Number(e.target.value))}
                        className="h-9 text-sm pr-7"
                      />
                      <span className="absolute left-2.5 top-2 text-xs text-muted-foreground">ج.م</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section: Location */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 border-b border-border/40 pb-2">
            <span className="text-primary">📍</span>
            {lang === 'ar' ? 'مكان تواجد الكتاب' : 'Book Location'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Custom Popover Dropdown for City */}
            <div className="space-y-1.5" ref={cityRef}>
              <Label>{lang === 'ar' ? 'المحافظة' : 'City'}</Label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsCityDropdownOpen(prev => !prev)}
                  className="w-full h-10 px-3.5 rounded-lg border border-input bg-card text-foreground flex items-center justify-between text-sm shadow-sm hover:border-primary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <span className="truncate">
                    {selectedCityObj
                      ? (lang === 'ar' ? selectedCityObj.name_ar : selectedCityObj.name_en)
                      : (lang === 'ar' ? 'اختر المحافظة...' : 'Select city...')}
                  </span>
                  <ChevronDown className={cn('h-4 w-4 opacity-50 transition-transform duration-200', isCityDropdownOpen && 'rotate-180')} />
                </button>

                {isCityDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-xl border border-border bg-card shadow-xl p-1 text-foreground divide-y divide-border/30">
                    {cities.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedCityId(c.id)
                          setValue('city_id', c.id)
                          setSelectedAreaId('')
                          setValue('area_id', '')
                          setIsCityDropdownOpen(false)
                        }}
                        className={cn(
                          'w-full text-right px-3 py-2 text-sm rounded-lg flex items-center justify-between hover:bg-primary/10 hover:text-primary transition-colors',
                          selectedCityId === c.id && 'bg-primary/15 text-primary font-medium'
                        )}
                      >
                        <span>{lang === 'ar' ? c.name_ar : c.name_en}</span>
                        {selectedCityId === c.id && <Check className="h-4 w-4" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Custom Popover Dropdown for Area */}
            <div className="space-y-1.5" ref={areaRef}>
              <Label>{lang === 'ar' ? 'المنطقة' : 'Area'}</Label>
              <div className="relative">
                <button
                  type="button"
                  disabled={!selectedCityId || areas.length === 0}
                  onClick={() => setIsAreaDropdownOpen(prev => !prev)}
                  className={cn(
                    'w-full h-10 px-3.5 rounded-lg border border-input bg-card text-foreground flex items-center justify-between text-sm shadow-sm hover:border-primary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20',
                    (!selectedCityId || areas.length === 0) && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <span className="truncate">
                    {selectedAreaObj
                      ? (lang === 'ar' ? selectedAreaObj.name_ar : selectedAreaObj.name_en)
                      : (lang === 'ar' ? 'اختر المنطقة...' : 'Select area...')}
                  </span>
                  <ChevronDown className={cn('h-4 w-4 opacity-50 transition-transform duration-200', isAreaDropdownOpen && 'rotate-180')} />
                </button>

                {isAreaDropdownOpen && areas.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-xl border border-border bg-card shadow-xl p-1 text-foreground divide-y divide-border/30">
                    {areas.map(a => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          setSelectedAreaId(a.id)
                          setValue('area_id', a.id)
                          setIsAreaDropdownOpen(false)
                        }}
                        className={cn(
                          'w-full text-right px-3 py-2 text-sm rounded-lg flex items-center justify-between hover:bg-primary/10 hover:text-primary transition-colors',
                          selectedAreaId === a.id && 'bg-primary/15 text-primary font-medium'
                        )}
                      >
                        <span>{lang === 'ar' ? a.name_ar : a.name_en}</span>
                        {selectedAreaId === a.id && <Check className="h-4 w-4" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex gap-3">
          <Button
            type="submit"
            disabled={uploading}
            className="flex-1 h-12 text-base font-semibold shadow-lg shadow-primary/20"
          >
            {uploading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                {lang === 'ar' ? 'جاري حفظ التعديلات...' : 'Saving changes...'}
              </span>
            ) : success ? (
              <span className="flex items-center gap-2 text-white">
                <Check className="h-5 w-5" />
                {lang === 'ar' ? 'تم الحفظ بنجاح!' : 'Saved Successfully!'}
              </span>
            ) : (
              <span>{lang === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}</span>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/books/${listing.id}`)}
            className="h-12 px-6"
          >
            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
        </div>

        {/* Danger Zone: Delete Listing */}
        <div className="mt-8 pt-6 border-t border-red-500/20">
          <div className="p-4 sm:p-5 rounded-2xl bg-red-500/5 border border-red-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-black text-red-600 flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                {lang === 'ar' ? 'منطقة الخطر: حذف الإعلان' : 'Danger Zone: Remove Listing'}
              </h4>
              <p className="text-xs text-muted-foreground">
                {lang === 'ar'
                  ? 'سيتم إزالة هذا الكتاب نهائياً من قائمتك ورفوفك ولن يظهر في نتائج البحث.'
                  : 'Permanently remove this book from your listings and shelf. It will no longer appear in search.'}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteModal(true)}
              className="border-red-500/40 text-red-600 hover:bg-red-500 hover:text-white font-bold text-xs h-10 px-4 rounded-xl flex-shrink-0 cursor-pointer transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {lang === 'ar' ? 'حذف الكتاب من قائمتي' : 'Remove Book from List'}
            </Button>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border border-border w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center flex-shrink-0">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-foreground">
                  {lang === 'ar' ? 'حذف الكتاب من قائمتك' : 'Remove Book from Your List'}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {lang === 'ar' ? 'هل أنت متأكد من رغبتك في حذف هذا الكتاب نهائياً؟' : 'Are you sure you want to permanently remove this listing?'}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-muted/60 border border-border/60 flex items-center gap-3">
              {(book?.cover_image_url || existingImages[0]?.url) && (
                <div className="relative w-12 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <Image
                    src={existingImages[0]?.url || book?.cover_image_url || ''}
                    alt={book?.title ?? ''}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-black line-clamp-1 text-foreground">
                  {lang === 'ar' && book?.title_ar ? book.title_ar : book?.title}
                </h4>
                <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                  {lang === 'ar' && book?.author_ar ? book.author_ar : book?.author}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>
                {lang === 'ar'
                  ? 'تنبيه: لن يظهر الكتاب للآخرين في المتجر أو البحث، وسيتم إلغاء أي طلبات جديدة عليه.'
                  : 'Warning: This book will disappear from search and explore, and readers will no longer be able to send requests for it.'}
              </span>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isDeleting}
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteError(null)
                }}
                className="flex-1 rounded-xl py-5 font-bold text-xs cursor-pointer"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteListing}
                className="flex-1 rounded-xl py-5 font-black text-xs bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20 cursor-pointer"
              >
                {isDeleting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {lang === 'ar' ? 'جاري الحذف...' : 'Removing...'}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    {lang === 'ar' ? 'نعم، احذف الكتاب' : 'Yes, Remove Book'}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
