'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { useDropzone } from 'react-dropzone'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Search, Upload, X, BookOpen, Loader2, Check, 
  Sparkles, Camera, ShieldCheck, AlertCircle, RefreshCw, Wand2,
  KeyRound, Settings2, ExternalLink, ChevronDown
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Category } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/i18n/language-context'
import { cn } from '@/lib/utils'
import { compressImageForAi, compressImageForBook } from '@/lib/image-utils'
import { addBookToCommunity } from '@/lib/communities/community-service'

const addBookSchema = z.object({
  title: z.string().min(1, 'عنوان الكتاب مطلوب'),
  author: z.string().min(1, 'اسم المؤلف مطلوب'),
  isbn: z.string().optional(),
  publisher: z.string().optional(),
  edition: z.string().optional(),
  language: z.enum(['ARABIC', 'ENGLISH', 'FRENCH', 'GERMAN', 'OTHER']),
  category_id: z.string().optional(),
  description: z.string().optional(),
  condition: z.enum(['NEW', 'LIKE_NEW', 'VERY_GOOD', 'GOOD', 'ACCEPTABLE']),
  listing_type: z.enum(['SELL', 'SWAP', 'SELL_OR_SWAP', 'GIVEAWAY']),
  price: z.coerce.number().min(0).optional(),
  is_negotiable: z.boolean().default(false),
  city_id: z.string().optional(),
  area_id: z.string().optional(),
})

type AddBookData = z.infer<typeof addBookSchema>

interface AddBookFormProps {
  userId: string
  categories: Category[]
  cities: Array<{ id: string; name_ar: string; name_en: string; slug: string; areas: Array<{ id: string; name_ar: string; name_en: string; slug: string }> }>
  defaultCityId?: string
  defaultAreaId?: string
  communityId?: string
  communitySlug?: string
  communityName?: string
}

interface AiExtractedBook {
  title: string
  author: string
  isbn?: string
  publisher?: string
  edition?: string
  language?: 'ARABIC' | 'ENGLISH' | 'FRENCH' | 'GERMAN' | 'OTHER'
  category_name?: string
  description?: string
  condition_estimate?: 'NEW' | 'LIKE_NEW' | 'VERY_GOOD' | 'GOOD' | 'ACCEPTABLE'
  estimated_price?: number
  suggested_deposit?: number
  suggested_fee_weekly?: number
  is_expensive_book?: boolean
  confidence?: number
  goodreads_rating?: number
  goodreads_ratings_count?: number
  goodreads_url?: string
  source?: string
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

export function AddBookForm({
  userId,
  categories,
  cities,
  defaultCityId,
  defaultAreaId,
  communityId,
  communitySlug,
  communityName,
}: AddBookFormProps) {
  const { lang, isRTL } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [images, setImages] = useState<Array<{ file: File; preview: string }>>([])
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isbnLoading, setIsbnLoading] = useState(false)
  
  // Location states (prefilled from user profile)
  const [selectedCityId, setSelectedCityId] = useState<string>(defaultCityId || '')
  const [selectedAreaId, setSelectedAreaId] = useState<string>(defaultAreaId || '')
  
  // Category state (explicitly controlled for instant visual selection)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')

  // Custom modern dropdown states
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false)
  const [areaDropdownOpen, setAreaDropdownOpen] = useState(false)

  const categoryDropdownRef = useRef<HTMLDivElement>(null)
  const cityDropdownRef = useRef<HTMLDivElement>(null)
  const areaDropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setCategoryDropdownOpen(false)
      }
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target as Node)) {
        setCityDropdownOpen(false)
      }
      if (areaDropdownRef.current && !areaDropdownRef.current.contains(e.target as Node)) {
        setAreaDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  // AI Vision & Auto-fill states
  const [isAiScanning, setIsAiScanning] = useState(false)
  const [aiScanStatus, setAiScanStatus] = useState<string>('')
  const [aiExtractedInfo, setAiExtractedInfo] = useState<AiExtractedBook | null>(null)
  const [savedGeminiKey, setSavedGeminiKey] = useState('')
  const [geminiKeyInput, setGeminiKeyInput] = useState('')
  const [showKeyModal, setShowKeyModal] = useState(false)

  // Dynamic Lending / Borrowing state
  const [availableForLending, setAvailableForLending] = useState(true)
  const [customDeposit, setCustomDeposit] = useState<number>(80)
  const [customFeeWeekly, setCustomFeeWeekly] = useState<number>(15)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const envKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''
      const stored = localStorage.getItem('bookswap_gemini_key') || envKey
      if (stored) {
        setSavedGeminiKey(stored)
        setGeminiKeyInput(stored)
        localStorage.setItem('bookswap_gemini_key', stored)
      }
    }
  }, [])

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<AddBookData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(addBookSchema) as any,
    defaultValues: {
      language: 'ARABIC',
      listing_type: 'SELL',
      condition: 'GOOD', // Default to GOOD condition
      edition: 'الأولى', // Default edition
      is_negotiable: false,
      city_id: defaultCityId || '',
      area_id: defaultAreaId || '',
    },
  })

  const selectedCity = cities.find(c => c.id === selectedCityId)
  const areas = selectedCity?.areas ?? []
  const selectedCityObj = selectedCity
  const selectedAreaObj = areas.find(a => a.id === selectedAreaId)
  const selectedCategoryObj = categories.find(c => c.id === (selectedCategoryId || watch('category_id')))

  // Sync profile location when loaded
  useEffect(() => {
    if (defaultCityId) {
      setSelectedCityId(defaultCityId)
      setValue('city_id', defaultCityId)
    }
    if (defaultAreaId) {
      setSelectedAreaId(defaultAreaId)
      setValue('area_id', defaultAreaId)
    }
  }, [defaultCityId, defaultAreaId, setValue])

  // Watch fields
  const listingType = watch('listing_type')
  const condition = watch('condition')
  const language = watch('language')
  const bookPrice = watch('price') || 0
  const isExpensiveBook = bookPrice >= 300

  // Pre-fill fields if navigated from Universal Search Engine
  useEffect(() => {
    const qTitle = searchParams.get('title')
    const qAuthor = searchParams.get('author')
    const qIsbn = searchParams.get('isbn')
    if (qTitle) setValue('title', qTitle)
    if (qAuthor) setValue('author', qAuthor)
    if (qIsbn) setValue('isbn', qIsbn)
  }, [searchParams, setValue])

  // Adjust default lending deposit & fee whenever price updates
  useEffect(() => {
    if (bookPrice > 0) {
      if (bookPrice >= 300) {
        // High-value book: 100% deposit coverage
        setCustomDeposit(Math.round(bookPrice))
        const fee = bookPrice > 500 ? Math.round(bookPrice * 0.08) : Math.round(bookPrice * 0.10)
        setCustomFeeWeekly(Math.max(25, fee))
      } else {
        // Regular paperback/novel: accessible deposit
        setCustomDeposit(Math.max(40, Math.round(bookPrice)))
        setCustomFeeWeekly(Math.max(15, Math.round(bookPrice * 0.12)))
      }
    }
  }, [bookPrice])

  // Category Auto-Matcher using actual database category slugs
  const findMatchingCategoryId = useCallback((catName?: string, title?: string, desc?: string): string => {
    const textToMatch = `${catName || ''} ${title || ''} ${desc || ''}`.toLowerCase()

    // 1. Direct match on name_ar, name_en, or slug
    const directMatch = categories.find(c => 
      c.name_ar.toLowerCase().includes(textToMatch) ||
      c.name_en.toLowerCase().includes(textToMatch) ||
      textToMatch.includes(c.name_ar.toLowerCase()) ||
      textToMatch.includes(c.name_en.toLowerCase()) ||
      textToMatch.includes(c.slug.toLowerCase())
    )
    if (directMatch) return directMatch.id

    // 2. Exact keyword heuristics matching actual database categories:
    // database slugs: fiction, self-development, business, psychology, programming, history, science, children, academic, language, comics, philosophy, religion, health, other
    if (/روا|قصص|أدب|novel|fiction|story|literature/i.test(textToMatch)) {
      return categories.find(c => c.slug === 'fiction')?.id || ''
    }
    if (/ذات|تنمي|بشر|نجاح|عادات|تطوير|self[- ]?help|habit|growth/i.test(textToMatch)) {
      return categories.find(c => c.slug === 'self-development')?.id || ''
    }
    if (/برمج|حاسوب|تقني|كمبيوتر|ذكاء|tech|code|program|software|web|data|coding/i.test(textToMatch)) {
      return categories.find(c => c.slug === 'programming')?.id || ''
    }
    if (/أعمال|ريادة|مال|اقتصاد|تسويق|إدارة|business|finance|marketing|money|startup/i.test(textToMatch)) {
      return categories.find(c => c.slug === 'business')?.id || ''
    }
    if (/نفس|سلوك|مشاعر|psychology|mind|mental/i.test(textToMatch)) {
      return categories.find(c => c.slug === 'psychology')?.id || ''
    }
    if (/تاريخ|حضار|سياس|history|politics|war|historical/i.test(textToMatch)) {
      return categories.find(c => c.slug === 'history')?.id || ''
    }
    if (/دين|إسلام|قرآن|حديث|فقه|religion|islam|spirit/i.test(textToMatch)) {
      return categories.find(c => c.slug === 'religion')?.id || ''
    }
    if (/طفل|أطفال|ناشئة|children|kids/i.test(textToMatch)) {
      return categories.find(c => c.slug === 'children')?.id || ''
    }
    if (/أكاديم|جامع|طب|هندس|مرجع|textbook|academic|medical|engineering/i.test(textToMatch)) {
      return categories.find(c => c.slug === 'academic')?.id || ''
    }
    if (/علوم|فيزياء|كيمياء|أحياء|science|physics|biology/i.test(textToMatch)) {
      return categories.find(c => c.slug === 'science')?.id || ''
    }
    if (/لغ|ترجم|قاموس|إنجليز|language|english|french|deutsch|german/i.test(textToMatch)) {
      return categories.find(c => c.slug === 'language')?.id || ''
    }
    if (/كوميك|مانجا|رسوم|comic|manga/i.test(textToMatch)) {
      return categories.find(c => c.slug === 'comics')?.id || ''
    }
    if (/فلسف|منطق|philosophy/i.test(textToMatch)) {
      return categories.find(c => c.slug === 'philosophy')?.id || ''
    }
    if (/صح|لياق|رياضة|تغذي|health|fitness/i.test(textToMatch)) {
      return categories.find(c => c.slug === 'health')?.id || ''
    }

    // Default fallback to Fiction or first category
    return categories.find(c => c.slug === 'fiction')?.id || categories[0]?.id || ''
  }, [categories])

  // Trigger AI Book Scan from Image
  const triggerAiCoverScan = useCallback(async (file: File) => {
    setIsAiScanning(true)
    setAiScanStatus(lang === 'ar' ? 'جاري فحص الغلاف بواسطة الذكاء الاصطناعي...' : 'AI scanning book cover & text...')
    setError(null)

    try {
      // Step A: Client-side Barcode Detection (native fast check if supported)
      let detectedBarcode: string | undefined
      if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
        try {
          // @ts-expect-error BarcodeDetector native browser API
          const detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'code_128', 'upc_a'] })
          const bitmap = await createImageBitmap(file)
          const barcodes = await detector.detect(bitmap)
          if (barcodes && barcodes.length > 0) {
            detectedBarcode = barcodes[0].rawValue
          }
        } catch {
          // Silent fallback to server OCR & AI vision
        }
      }

      // Step B: Fast client-side compression (reduces 15MB camera photos to ~180KB in 40ms)
      setAiScanStatus(lang === 'ar' ? 'جاري تحسين وضغط الصورة للذكاء الاصطناعي...' : 'Optimizing image for AI...')
      const { base64Data, mimeType } = await compressImageForAi(file, 1200, 0.82)

      setAiScanStatus(lang === 'ar' ? 'جاري فحص الغلاف واستخراج بيانات الكتاب والتسعير...' : 'Identifying title, author & pricing with AI...')

      // Step C: Call Scan-Cover API
      const keyToSend = savedGeminiKey || geminiKeyInput || (typeof window !== 'undefined' ? localStorage.getItem('bookswap_gemini_key') || '' : '')
      const response = await fetch('/api/books/scan-cover', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-gemini-key': keyToSend,
        },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType,
          filename: file.name,
          isbn: detectedBarcode,
          geminiKey: keyToSend,
        }),
      })

      const resJson = await response.json()

      if (resJson.missingApiKey) {
        setShowKeyModal(true)
        setError(lang === 'ar' ? '⚠️ مطلوب مفتاح Google Gemini API المجاني لقراءة الغلاف بالذكاء الاصطناعي. يرجى إدخاله بالأسفل.' : '⚠️ Google Gemini API key required for cover vision. Please enter below.')
        return
      }

      if (resJson.success && resJson.data) {
        const bookData: AiExtractedBook = resJson.data
        setAiExtractedInfo(bookData)

        // Auto-fill all form fields!
        if (bookData.title) setValue('title', bookData.title, { shouldValidate: true, shouldDirty: true })
        if (bookData.author) setValue('author', bookData.author, { shouldValidate: true, shouldDirty: true })
        if (bookData.isbn) setValue('isbn', bookData.isbn, { shouldValidate: true, shouldDirty: true })
        if (bookData.publisher) setValue('publisher', bookData.publisher, { shouldValidate: true, shouldDirty: true })
        setValue('edition', bookData.edition || 'الأولى', { shouldValidate: true, shouldDirty: true })
        setValue('language', bookData.language || 'ARABIC', { shouldValidate: true, shouldDirty: true })
        if (bookData.description) setValue('description', bookData.description, { shouldValidate: true, shouldDirty: true })
        setValue('condition', 'GOOD', { shouldValidate: true, shouldDirty: true })
        if (bookData.estimated_price) setValue('price', bookData.estimated_price, { shouldValidate: true, shouldDirty: true })

        // Auto-fill category and sync select state
        const matchedCat = findMatchingCategoryId(bookData.category_name, bookData.title, bookData.description)
        if (matchedCat) {
          setSelectedCategoryId(matchedCat)
          setValue('category_id', matchedCat, { shouldValidate: true, shouldDirty: true })
        }

        // Auto-fill lending terms
        if (bookData.suggested_deposit) setCustomDeposit(bookData.suggested_deposit)
        if (bookData.suggested_fee_weekly) setCustomFeeWeekly(bookData.suggested_fee_weekly)
      } else {
        // If could not recognize automatically, don't block the user
        setError(resJson.message || (lang === 'ar' ? 'لم نتمكن من قراءة الغلاف بدقة، يمكنك كتابة البيانات يدوياً.' : 'Could not scan cover. Please fill details manually.'))
      }
    } catch (scanErr) {
      console.error('Scan failed:', scanErr)
      setError(lang === 'ar' ? 'حدث خطأ أثناء فحص الصورة. يمكنك ملء البيانات يدوياً.' : 'Error scanning image. You can enter details manually.')
    } finally {
      setIsAiScanning(false)
      setAiScanStatus('')
    }
  }, [lang, setValue, findMatchingCategoryId])

  // Image dropzone with AI Trigger on first image
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const newImages = acceptedFiles.slice(0, 5 - images.length).map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }))
    
    setImages(prev => {
      const updated = [...prev, ...newImages]
      return updated
    })

    // If this is the primary cover (or first batch), trigger AI Scan!
    if (acceptedFiles[0]) {
      triggerAiCoverScan(acceptedFiles[0])
    }
  }, [images.length, triggerAiCoverScan])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 5,
  })

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    if (index === 0 && images.length === 1) {
      setAiExtractedInfo(null)
    }
  }

  // ISBN manual lookup
  const lookupISBN = async (isbn: string) => {
    if (!isbn || isbn.length < 10) return
    setIsbnLoading(true)
    try {
      const customKey =
        localStorage.getItem('bookswap_gemini_api_key') ||
        process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
        ''
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (customKey) {
        headers['x-gemini-key'] = customKey
      }

      const res = await fetch(`/api/books/scan-cover`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ isbn }),
      })
      const data = await res.json()
      if (data.success && data.data) {
        const b = data.data
        if (b.title) setValue('title', b.title, { shouldValidate: true, shouldDirty: true })
        if (b.author) setValue('author', b.author, { shouldValidate: true, shouldDirty: true })
        if (b.publisher) setValue('publisher', b.publisher, { shouldValidate: true, shouldDirty: true })
        setValue('edition', b.edition || 'الأولى', { shouldValidate: true, shouldDirty: true })
        setValue('language', b.language || 'ARABIC', { shouldValidate: true, shouldDirty: true })
        if (b.description) setValue('description', b.description, { shouldValidate: true, shouldDirty: true })
        setValue('condition', 'GOOD', { shouldValidate: true, shouldDirty: true })
        if (b.estimated_price) setValue('price', b.estimated_price, { shouldValidate: true, shouldDirty: true })
        const cat = findMatchingCategoryId(b.category_name, b.title, b.description)
        if (cat) {
          setSelectedCategoryId(cat)
          setValue('category_id', cat, { shouldValidate: true, shouldDirty: true })
        }
        if (b.suggested_deposit) setCustomDeposit(b.suggested_deposit)
        if (b.suggested_fee_weekly) setCustomFeeWeekly(b.suggested_fee_weekly)
        setAiExtractedInfo(b)
      }
    } catch {
      // Silent fail
    }
    setIsbnLoading(false)
  }

  const onSubmit = async (data: AddBookData) => {
    setUploading(true)
    setError(null)

    try {
      // 1. Find or create book record
      let bookId: string

      const { data: existingBook } = await supabase
        .from('books')
        .select('id')
        .ilike('title', data.title)
        .ilike('author', data.author)
        .single()

      if (existingBook) {
        bookId = existingBook.id
      } else {
        const grUrl = data.isbn
          ? `https://www.goodreads.com/search?q=${encodeURIComponent(data.isbn.replace(/-/g, ''))}`
          : `https://www.goodreads.com/search?q=${encodeURIComponent(`${data.title} ${data.author || ''}`.trim())}`

        const { data: newBook, error: bookErr } = await supabase
          .from('books')
          .insert({
            title: data.title,
            author: data.author,
            isbn: data.isbn || null,
            publisher: data.publisher || null,
            edition: data.edition || null,
            language: data.language,
            category_id: data.category_id || null,
            description: data.description || null,
            created_by: userId,
            rating_average: aiExtractedInfo?.goodreads_rating || null,
            rating_count: aiExtractedInfo?.goodreads_ratings_count || null,
            goodreads_url: aiExtractedInfo?.goodreads_url || grUrl,
          })
          .select('id')
          .single()

        if (bookErr || !newBook) throw new Error(lang === 'ar' ? 'فشل في إضافة الكتاب' : 'Failed to create book record')
        bookId = newBook.id
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

      // 3. Create listing
      const { data: listing, error: listingErr } = await supabase
        .from('book_listings')
        .insert({
          book_id: bookId,
          seller_id: userId,
          listing_type: data.listing_type,
          condition: data.condition,
          price: data.listing_type === 'GIVEAWAY' ? 0 : (data.price || null),
          is_negotiable: data.is_negotiable,
          city_id: data.city_id || null,
          area_id: data.area_id || null,
          description: finalDescription || null,
        })
        .select('id')
        .single()

      if (listingErr || !listing) throw new Error(lang === 'ar' ? 'فشل في إضافة الإعلان' : 'Failed to create listing')

      // 4. Compress and Upload images
      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const img = images[i]
          
          // Client-side compression to WebP (<100KB)
          const { file: compressedFile, dataUrl } = await compressImageForBook(img.file)
          const ext = 'webp'
          const path = `${userId}/${listing.id}/${i}-${Date.now()}.${ext}`

          const { error: uploadErr } = await supabase.storage
            .from('book-images')
            .upload(path, compressedFile, {
              cacheControl: '3600',
              contentType: 'image/webp',
              upsert: true,
            })

          let finalImageUrl = ''
          if (!uploadErr) {
            const { data: { publicUrl } } = supabase.storage
              .from('book-images')
              .getPublicUrl(path)
            finalImageUrl = publicUrl
          } else {
            console.warn('Storage upload error for book image, saving compact compressed fallback to db:', uploadErr)
            finalImageUrl = dataUrl
          }

          if (finalImageUrl) {
            await supabase.from('book_images').insert({
              listing_id: listing.id,
              url: finalImageUrl,
              storage_path: uploadErr ? null : path,
              is_primary: i === 0,
              sort_order: i,
            })

            // Update primary book cover in books table
            if (i === 0) {
              await supabase.from('books').update({ cover_image_url: finalImageUrl }).eq('id', bookId)
            }
          }
        }
      }

      // 5. Auto-link to community if communityId is specified
      let communityRes: { success: boolean; status: 'APPROVED' | 'PENDING'; intakePin?: string } | null = null
      if (communityId) {
        try {
          communityRes = await addBookToCommunity({
            communityId,
            listingId: listing.id,
            addedBy: userId,
          })
        } catch (e) {
          console.warn('[AddBookForm] Error auto-linking to community_books:', e)
        }
      }

      // 6. Update profile stats (best-effort)
      try { await supabase.rpc('increment_profile_listings', { user_id: userId }) } catch { }

      setSuccess(true)
      setTimeout(() => {
        if (communitySlug) {
          if (communityRes?.status === 'PENDING') {
            router.push(`/communities/${communitySlug}?voucher=true&bookId=${listing.id}`)
          } else {
            router.push(`/communities/${communitySlug}?tab=shelf`)
          }
        } else {
          router.push(`/books/${listing.id}`)
        }
      }, 1500)

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : (lang === 'ar' ? 'حصل خطأ. حاول تاني.' : 'Something went wrong.'))
    }

    setUploading(false)
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-4 animate-scale-in">
          <Check className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-black mb-2">
          {lang === 'ar' ? '🎉 تم إضافة الكتاب بنجاح!' : '🎉 Book Added Successfully!'}
        </h2>
        <p className="text-muted-foreground text-sm">
          {communitySlug
            ? (lang === 'ar' ? 'جاري توجيهك لرف المجتمع...' : 'Redirecting to community shelf...')
            : (lang === 'ar' ? 'جاري توجيهك لصفحة الكتاب...' : 'Redirecting to your book page...')}
        </p>
      </div>
    )
  }

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
      {/* Community Banner Callout if launched from a community */}
      {communityName && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-black flex items-center gap-2.5 shadow-xs animate-in fade-in">
          <span className="text-lg">🌳</span>
          <div>
            <p className="font-black text-emerald-900 dark:text-emerald-200">
              {lang === 'ar' ? `إضافة إلى رف مجتمع: ${communityName}` : `Adding to community: ${communityName}`}
            </p>
            <p className="text-[11px] font-medium text-emerald-700/80 dark:text-emerald-400/80">
              {lang === 'ar' ? 'سيتم ربط هذا الكتاب تلقائياً بمجتمعك ليتمكن الأعضاء من استعارته وتبادله فوراً.' : 'This book will be automatically listed on the community shelf.'}
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            {lang === 'ar' ? '📚 أضف كتابك الجديد' : '📚 Add a New Book'}
          </h1>
          <Badge variant="outline" className="text-xs sm:text-sm bg-primary/10 text-primary border-primary/20 gap-1 font-bold py-1 px-2.5">
            <Sparkles className="h-3.5 w-3.5" />
            {lang === 'ar' ? 'مدعوم بالذكاء الاصطناعي' : 'AI Powered'}
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm sm:text-base mt-1.5 leading-relaxed">
          {lang === 'ar' 
            ? 'التقط أو ارفع صورة لغلاف الكتاب وسيقوم الذكاء الاصطناعي بملء كافة البيانات تلقائياً!' 
            : 'Snap or upload a photo of the book cover, and AI will auto-fill title, author, and pricing!'}
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm sm:text-base text-destructive flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 1: AI PHOTO COVER SCANNER (TOP POSITION) */}
      {/* ======================================================== */}
      <div className="rounded-2xl border-2 border-primary/30 bg-gradient-to-b from-primary/[0.04] to-card p-4 sm:p-6 space-y-4 shadow-sm relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-foreground">
                {lang === 'ar' ? 'الخطوة 1: فحص الغلاف بالذكاء الاصطناعي' : 'Step 1: AI Book Cover Scanner'}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {lang === 'ar' ? 'ارفع صورة الغلاف ليتم التعرف على كل التفاصيل فوراً' : 'Upload book cover image to auto-detect details'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowKeyModal(v => !v)}
              className={cn(
                "text-xs sm:text-sm px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-bold transition-all shadow-sm cursor-pointer",
                savedGeminiKey 
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" 
                  : "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
              )}
              title={lang === 'ar' ? 'إعداد مفتاح الذكاء الاصطناعي' : 'Configure AI API Key'}
            >
              <KeyRound className="h-4 w-4" />
              <span>{savedGeminiKey ? (lang === 'ar' ? 'مفتاح AI مفعل ✓' : 'AI Key Active ✓') : (lang === 'ar' ? 'مفتاح AI 🔑' : 'AI Key 🔑')}</span>
            </button>
            {images.length > 0 && (
              <span className="text-xs sm:text-sm font-bold text-muted-foreground">
                {images.length}/5 {lang === 'ar' ? 'صور' : 'photos'}
              </span>
            )}
          </div>
        </div>

        {/* AI Key Configuration Card */}
        {showKeyModal && (
          <div className="p-4 rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-primary/10 via-card to-background space-y-3 animate-fade-in shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" />
                <h4 className="font-black text-sm sm:text-base text-foreground">
                  {lang === 'ar' ? '🔑 إعداد مفتاح الذكاء الاصطناعي (Gemini Vision API)' : '🔑 Configure Gemini Vision API Key'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="text-xs text-muted-foreground hover:text-foreground p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {lang === 'ar' 
                ? 'لقراءة صور أغلفة الكتب والتعرف على العناوين والأسعار تلقائياً بدون باركود، يرجى إدخال مفتاح Google Gemini المجاني. المفتاح مجاني 100% ويستغرق استخراجه دقيقة واحدة من Google AI Studio بدون بطاقة ائتمان.'
                : 'To read book covers and extract titles and pricing automatically, enter your free Google Gemini API Key (100% free with no credit card required).'}
            </p>

            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="password"
                  placeholder="AIzaSy..."
                  value={geminiKeyInput}
                  onChange={e => setGeminiKeyInput(e.target.value.trim())}
                  className="w-full text-base sm:text-sm h-12 font-mono rounded-xl"
                />
                <Button
                  type="button"
                  onClick={() => {
                    if (geminiKeyInput) {
                      localStorage.setItem('bookswap_gemini_key', geminiKeyInput)
                      setSavedGeminiKey(geminiKeyInput)
                      setShowKeyModal(false)
                      setError(null)
                      if (images.length > 0) {
                        triggerAiCoverScan(images[0].file)
                      }
                    }
                  }}
                  className="w-full sm:w-auto h-12 shrink-0 text-sm sm:text-base font-black gap-1.5 rounded-xl cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  {lang === 'ar' ? 'حفظ ومسح الغلاف' : 'Save & Scan'}
                </Button>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 flex-wrap gap-2">
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-bold inline-flex items-center gap-1"
                >
                  <span>{lang === 'ar' ? 'احصل على مفتاح مجاني من Google AI Studio' : 'Get free key from Google AI Studio'}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
                <span className="text-muted-foreground">
                  {lang === 'ar' ? 'أو ضعه في .env.local كـ GEMINI_API_KEY' : 'or add to .env.local as GEMINI_API_KEY'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Existing images preview */}
        {images.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {images.map((img, i) => (
              <div key={i} className="relative group aspect-[3/4] rounded-xl overflow-hidden bg-muted border border-border shadow-sm">
                <Image src={img.preview} alt={`Book image ${i + 1}`} fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 end-1 h-7 w-7 flex items-center justify-center rounded-full bg-black/70 text-white transition-opacity cursor-pointer"
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
                {i === 0 && (
                  <span className="absolute bottom-1.5 start-1.5 text-xs bg-primary text-primary-foreground font-black px-2 py-0.5 rounded-md shadow">
                    {lang === 'ar' ? 'الغلاف' : 'Cover'}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Dropzone Area */}
        {images.length < 5 && (
          <div
            {...getRootProps()}
            className={cn(
              'relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center cursor-pointer transition-all w-full',
              isDragActive ? 'border-primary bg-primary/10 scale-[0.99]' : 'border-primary/40 bg-card/60 hover:border-primary hover:bg-primary/[0.03]',
              isAiScanning && 'pointer-events-none opacity-80'
            )}
          >
            <input {...getInputProps()} />

            {isAiScanning ? (
              <div className="flex flex-col items-center gap-2 py-4">
                <div className="relative">
                  <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                  <Sparkles className="h-5 w-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                <p className="font-bold text-base text-primary animate-pulse mt-1">
                  {aiScanStatus || (lang === 'ar' ? 'الذكاء الاصطناعي يقرأ الغلاف...' : 'AI scanning cover...')}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {lang === 'ar' ? 'جاري التعرف على العنوان، المؤلف، السعر، والتأمين' : 'Extracting title, author, price, and terms'}
                </p>
              </div>
            ) : (
              <>
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Upload className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <p className="font-black text-base sm:text-lg text-foreground">
                    {lang === 'ar' ? 'اضغط لاختيار صورة الغلاف أو اسحبها هنا 📷' : 'Click or drop book cover photo here 📷'}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {lang === 'ar' ? 'يدعم صور الغلاف أو الباركود (JPG, PNG, WebP)' : 'Supports cover photos or barcodes (JPG, PNG, WebP)'}
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-black">
                  <Sparkles className="h-4 w-4" />
                  <span>{lang === 'ar' ? 'مسح فوري بالذكاء الاصطناعي' : 'Instant AI Auto-Fill'}</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* AI Scan Success Banner */}
        {aiExtractedInfo && (
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-start justify-between gap-3 animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="text-xs sm:text-sm space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-black text-emerald-900 dark:text-emerald-300">
                    {lang === 'ar' ? '✨ تم التعرف على الكتاب بنجاح!' : '✨ Book Identified by AI!'}
                  </span>
                  <Badge variant="secondary" className="text-xs py-0 px-2 bg-emerald-500/20 text-emerald-800 dark:text-emerald-200">
                    {aiExtractedInfo.source === 'gemini_vision' ? 'Gemini AI Vision' : (aiExtractedInfo.source || 'AI')}
                  </Badge>
                </div>
                <p className="text-foreground font-semibold">
                  <strong>{aiExtractedInfo.title}</strong> {aiExtractedInfo.author && `— ${aiExtractedInfo.author}`}
                </p>
                <div className="flex items-center gap-2 pt-0.5 text-xs text-emerald-800 dark:text-emerald-300 font-bold flex-wrap">
                  <span>{lang === 'ar' ? `السعر المقترح: ${aiExtractedInfo.estimated_price} ج.م` : `Est. Price: ${aiExtractedInfo.estimated_price} EGP`}</span>
                  <span>•</span>
                  <span>{lang === 'ar' ? `التأمين المقترح: ${aiExtractedInfo.suggested_deposit} ج.م` : `Deposit: ${aiExtractedInfo.suggested_deposit} EGP`}</span>
                  {aiExtractedInfo.goodreads_rating && (
                    <>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300">
                        ⭐ {aiExtractedInfo.goodreads_rating.toFixed(1)} Goodreads
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (images[0]) triggerAiCoverScan(images[0].file)
              }}
              title={lang === 'ar' ? 'إعادة الفحص' : 'Re-scan'}
              className="p-2 rounded-lg hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 transition-colors cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Alternative ISBN Search */}
      <div className="p-3.5 sm:p-4 rounded-xl border bg-muted/30 flex items-center justify-between gap-3">
        <div className="flex-1 w-full">
          <div className="relative">
            <Input
              placeholder={lang === 'ar' ? '🔍 أو ابحث مباشرة برقم ISBN (مثال: 978977...)' : '🔍 Or search directly by ISBN...'}
              className={cn('w-full text-base sm:text-sm h-12 rounded-xl', isRTL ? 'pr-4 pl-14' : 'pl-4 pr-14')}
              onChange={e => {
                const v = e.target.value.trim()
                if (v.length >= 10) lookupISBN(v)
              }}
            />
            <div className={cn('absolute top-1/2 -translate-y-1/2 pointer-events-none', isRTL ? 'left-3.5' : 'right-3.5')}>
              {isbnLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <Search className="h-4 w-4 text-muted-foreground" />}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* STEP 2: BOOK DETAILS (PRE-FILLED OR MANUAL) */}
      {/* ======================================================== */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-black text-base sm:text-lg flex items-center gap-2 text-foreground">
            <span>{lang === 'ar' ? 'الخطوة 2: مراجعة تفاصيل الكتاب' : 'Step 2: Review Book Details'}</span>
          </h3>
          <span className="text-xs sm:text-sm text-muted-foreground font-semibold">
            {lang === 'ar' ? 'تم الملء تلقائياً — يمكنك التعديل' : 'Auto-filled — you can adjust'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="title" className="text-sm sm:text-base font-bold text-foreground">{lang === 'ar' ? 'عنوان الكتاب *' : 'Book Title *'}</Label>
            <Input id="title" className="w-full text-base sm:text-sm h-12 rounded-xl" placeholder={lang === 'ar' ? 'مثال: في قلبي أنثى عبرية' : 'e.g. Atomic Habits'} {...register('title')} />
            {errors.title && <p className="text-xs sm:text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="author" className="text-sm sm:text-base font-bold text-foreground">{lang === 'ar' ? 'المؤلف *' : 'Author *'}</Label>
            <Input id="author" className="w-full text-base sm:text-sm h-12 rounded-xl" placeholder={lang === 'ar' ? 'اسم المؤلف' : 'Author name'} {...register('author')} />
            {errors.author && <p className="text-xs sm:text-sm text-destructive">{errors.author.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="publisher" className="text-sm sm:text-base font-bold text-foreground">{lang === 'ar' ? 'دار النشر' : 'Publisher'}</Label>
            <Input id="publisher" className="w-full text-base sm:text-sm h-12 rounded-xl" placeholder={lang === 'ar' ? 'دار الشروق، عصير الكتب...' : 'Publisher (optional)'} {...register('publisher')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="isbn" className="text-sm sm:text-base font-bold text-foreground">{lang === 'ar' ? 'رقم ISBN' : 'ISBN'}</Label>
            <Input id="isbn" className="w-full text-base sm:text-sm h-12 rounded-xl" placeholder="9780143127741" {...register('isbn')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edition" className="text-sm sm:text-base font-bold text-foreground">{lang === 'ar' ? 'الطبعة' : 'Edition'}</Label>
            <Input id="edition" className="w-full text-base sm:text-sm h-12 rounded-xl" placeholder={lang === 'ar' ? 'مثال: الأولى، طبعة 2024' : 'e.g. 2nd Edition'} {...register('edition')} />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-sm sm:text-base font-bold text-foreground">{lang === 'ar' ? 'اللغة' : 'Language'}</Label>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
              {LANGUAGES.map(l => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => setValue('language', l.value as AddBookData['language'])}
                  className={cn(
                    'w-full sm:w-auto py-2.5 px-4 rounded-xl text-sm sm:text-base font-bold border transition-colors cursor-pointer',
                    language === l.value ? 'bg-primary text-primary-foreground border-primary shadow-xs' : 'bg-card hover:bg-accent'
                  )}
                >
                  {lang === 'ar' ? l.labelAr : l.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Category Dropdown */}
          <div className="sm:col-span-2 space-y-1.5 relative" ref={categoryDropdownRef}>
            <Label htmlFor="category_id_btn" className="text-sm sm:text-base font-bold text-foreground">{lang === 'ar' ? 'التصنيف *' : 'Category *'}</Label>
            <input type="hidden" {...register('category_id')} value={selectedCategoryId || watch('category_id') || ''} />
            <button
              id="category_id_btn"
              type="button"
              onClick={() => setCategoryDropdownOpen(v => !v)}
              className="flex h-12 w-full items-center justify-between rounded-xl border border-input bg-card/90 px-4 py-2.5 text-sm sm:text-base font-bold shadow-sm hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5 truncate">
                {selectedCategoryObj ? (
                  <>
                    <span className="text-lg">{selectedCategoryObj.icon}</span>
                    <span className="text-foreground font-black">
                      {lang === 'ar' ? selectedCategoryObj.name_ar : selectedCategoryObj.name_en}
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground font-medium">
                    {lang === 'ar' ? 'اختار تصنيف الكتاب...' : 'Select category...'}
                  </span>
                )}
              </div>
              <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform duration-200 shrink-0", categoryDropdownOpen && "rotate-180")} />
            </button>

            {/* Custom Popover Options with high contrast dark/light styling */}
            {categoryDropdownOpen && (
              <div className="absolute top-full start-0 z-50 mt-1.5 w-full rounded-2xl border border-border bg-card/98 dark:bg-slate-900/98 p-2 shadow-2xl backdrop-blur-md max-h-64 overflow-y-auto space-y-1">
                {categories.map(cat => {
                  const isSelected = (selectedCategoryId || watch('category_id')) === cat.id
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategoryId(cat.id)
                        setValue('category_id', cat.id, { shouldValidate: true, shouldDirty: true })
                        setCategoryDropdownOpen(false)
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all text-start cursor-pointer",
                        isSelected 
                          ? "bg-primary text-primary-foreground font-black shadow-sm" 
                          : "text-foreground hover:bg-primary/10 hover:text-primary dark:text-slate-100 dark:hover:bg-slate-800"
                      )}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="text-lg">{cat.icon}</span>
                        <span className="truncate">{lang === 'ar' ? cat.name_ar : cat.name_en}</span>
                      </div>
                      {isSelected && <Check className="h-4 w-4 shrink-0 stroke-[3]" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-1.5 pt-1">
          <Label htmlFor="description" className="text-sm sm:text-base font-bold text-foreground">{lang === 'ar' ? 'نبذة عن الكتاب' : 'Book Description'}</Label>
          <Textarea
            id="description"
            placeholder={lang === 'ar' ? 'وصف مختصر أو حالة الكتاب...' : 'Brief summary or notes on book condition...'}
            rows={3}
            className="w-full text-base sm:text-sm rounded-xl p-3.5 min-h-[96px]"
            {...register('description')}
          />
        </div>
      </div>

      {/* ======================================================== */}
      {/* STEP 3: LISTING TYPE & DYNAMIC LENDING PRICING */}
      {/* ======================================================== */}
      <div className="space-y-4 pt-2">
        <h3 className="font-black text-base sm:text-lg text-foreground">{lang === 'ar' ? 'الخطوة 3: نوع الإعلان والتسعير' : 'Step 3: Listing & Pricing'}</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {LISTING_TYPES.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => setValue('listing_type', t.value as AddBookData['listing_type'])}
              className={cn(
                'w-full p-4 rounded-xl border-2 text-start transition-all cursor-pointer',
                listingType === t.value
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <span className="font-black text-base sm:text-lg block text-foreground">{lang === 'ar' ? t.labelAr : t.labelEn}</span>
              <span className="text-xs sm:text-sm text-muted-foreground mt-0.5 block">{lang === 'ar' ? t.descAr : t.descEn}</span>
            </button>
          ))}
        </div>

        {/* Book Price (For Selling or Deposit calculation) */}
        {listingType !== 'GIVEAWAY' && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <Label htmlFor="price" className="text-sm sm:text-base font-bold text-foreground">
                {listingType === 'SWAP' 
                  ? (lang === 'ar' ? 'القيمة التقديرية للكتاب (ج.م)' : 'Estimated Book Value (EGP)')
                  : (lang === 'ar' ? 'سعر البيع (ج.م) *' : 'Selling Price (EGP) *')}
              </Label>
              {bookPrice > 0 && (
                <span className={cn('text-xs sm:text-sm font-black px-2.5 py-0.5 rounded-full', isExpensiveBook ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300' : 'bg-blue-500/10 text-blue-700 dark:text-blue-300')}>
                  {isExpensiveBook 
                    ? (lang === 'ar' ? '💎 كتاب قيّم / نادر' : '💎 High-Value Book') 
                    : (lang === 'ar' ? '📗 كتاب عادي' : '📗 Standard Book')}
                </span>
              )}
            </div>
            <Input
              id="price"
              type="number"
              min="0"
              className="w-full text-base sm:text-sm h-12 rounded-xl font-bold"
              placeholder={lang === 'ar' ? 'مثال: 120' : 'e.g. 120'}
              {...register('price')}
            />
          </div>
        )}

        {/* DYNAMIC LENDING & BORROWING SECTION */}
        {listingType !== 'GIVEAWAY' && (
          <div className="p-4 sm:p-5 rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/[0.04] space-y-4">
            <label className="flex items-start justify-between cursor-pointer select-none gap-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">⏳</span>
                <div>
                  <span className="text-base sm:text-lg font-black text-foreground block">
                    {lang === 'ar' ? 'السماح باستعارة الكتاب بتأمين مسترد؟' : 'Allow peer-to-peer lending with refundable deposit?'}
                  </span>
                  <span className="text-xs sm:text-sm text-muted-foreground block mt-1 leading-relaxed">
                    {lang === 'ar'
                      ? 'أعِر كتابك للقراء بضمان كامل 100% لتأمين قيمته، واكسب رسوم استعارة رمزية دون أن تفقد ملكية الكتاب.'
                      : 'Lend your book with 100% refundable security deposit to protect value while earning weekly lending fees.'}
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={availableForLending}
                onChange={e => setAvailableForLending(e.target.checked)}
                className="h-6 w-6 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer mt-1 shrink-0"
              />
            </label>

            {availableForLending && (
              <div className="pt-3 border-t border-emerald-500/20 space-y-3.5">
                {/* Book Value Tier Explanation */}
                <div className={cn(
                  'p-3.5 rounded-xl border text-xs sm:text-sm space-y-1',
                  isExpensiveBook 
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200' 
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                )}>
                  <div className="flex items-center gap-2 font-black">
                    <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                    <span>
                      {isExpensiveBook
                        ? (lang === 'ar' ? '💎 تسعير استعارة المراجع القيّمة (High-Value Tier):' : '💎 High-Value Book Lending Policy:')
                        : (lang === 'ar' ? '📗 تسعير استعارة الكتب العادية (Standard Tier):' : '📗 Standard Book Lending Policy:')}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed">
                    {isExpensiveBook
                      ? (lang === 'ar'
                          ? `نظراً لأن قيمة الكتاب مرتفعة (${bookPrice} ج.م)، تم تحديد التأمين ليغطي 100% من سعر الكتاب لحمايتك من التلف أو الفقدان، مع رسم استعارة أسبوعي عادل.`
                          : `Because this book is high-value (${bookPrice} EGP), the deposit covers 100% of book value to safeguard your copy, along with a proportional weekly fee.`)
                      : (lang === 'ar'
                          ? `كتاب بسعر ميسر. تم تحديد تأمين مسترد مناسب ورسم رمزي لتشجيع القراء على تداول الكتب واستعارتها.`
                          : `Accessible book price. Reasonable refundable deposit and nominal weekly fee to encourage reading.`)}
                  </p>
                </div>

                {/* Seller Controls for Deposit & Weekly Fee */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div className="space-y-1.5">
                    <Label className="text-sm sm:text-base font-bold text-foreground">
                      {lang === 'ar' ? 'مبلغ التأمين المسترد بالكامل (ج.م):' : 'Refundable Deposit (EGP):'}
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="20"
                        value={customDeposit}
                        onChange={e => setCustomDeposit(Number(e.target.value))}
                        className="w-full text-base sm:text-sm h-12 rounded-xl font-black"
                      />
                      <span className={cn('absolute top-1/2 -translate-y-1/2 text-xs sm:text-sm font-bold text-muted-foreground pointer-events-none', isRTL ? 'left-3' : 'right-3')}>
                        {lang === 'ar' ? 'ج.م' : 'EGP'}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground block">
                      {lang === 'ar' ? 'يُرد للمستعير 100% فور استرجاع الكتاب سليم' : '100% refunded when book is returned safely'}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm sm:text-base font-bold text-foreground">
                      {lang === 'ar' ? 'رسم الاستعارة الأسبوعي للمالك (ج.م):' : 'Weekly Lending Fee for Owner (EGP):'}
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="5"
                        value={customFeeWeekly}
                        onChange={e => setCustomFeeWeekly(Number(e.target.value))}
                        className="w-full text-base sm:text-sm h-12 rounded-xl font-black"
                      />
                      <span className={cn('absolute top-1/2 -translate-y-1/2 text-xs sm:text-sm font-bold text-muted-foreground pointer-events-none', isRTL ? 'left-3' : 'right-3')}>
                        {lang === 'ar' ? 'ج.م/أسبوع' : 'EGP/wk'}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground block">
                      {lang === 'ar' ? 'أرباحك الصافية نظير كل أسبوع إعارة' : 'Your earnings for each week loaned'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* STEP 4: CONDITION & LOCATION */}
      {/* ======================================================== */}
      <div className="space-y-4 pt-2">
        <h3 className="font-black text-base sm:text-lg text-foreground">{lang === 'ar' ? 'الخطوة 4: حالة الكتاب والموقع' : 'Step 4: Condition & Location'}</h3>

        <div className="space-y-2.5">
          {CONDITIONS.map(c => (
            <button
              key={c.value}
              type="button"
              onClick={() => setValue('condition', c.value as AddBookData['condition'])}
              className={cn(
                'w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-start cursor-pointer',
                condition === c.value
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border hover:border-primary/30'
              )}
            >
              <div>
                <span className="font-black text-base sm:text-lg text-foreground block">{lang === 'ar' ? c.labelAr : c.labelEn}</span>
                <span className="text-xs sm:text-sm text-muted-foreground block mt-0.5">{c.desc}</span>
              </div>
              {condition === c.value && <Check className="h-5 w-5 text-primary flex-shrink-0 stroke-[3]" />}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
          {/* Custom City Dropdown */}
          <div className="space-y-1.5 relative" ref={cityDropdownRef}>
            <Label htmlFor="city_id_btn" className="text-sm sm:text-base font-bold text-foreground">{lang === 'ar' ? 'المدينة *' : 'City *'}</Label>
            <input type="hidden" {...register('city_id')} value={selectedCityId} />
            <button
              id="city_id_btn"
              type="button"
              onClick={() => setCityDropdownOpen(v => !v)}
              className="flex h-12 w-full items-center justify-between rounded-xl border border-input bg-card/90 px-4 py-2.5 text-sm sm:text-base font-bold shadow-sm hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring transition-all cursor-pointer"
            >
              <span className={cn("truncate", selectedCityObj ? "text-foreground font-black" : "text-muted-foreground font-medium")}>
                {selectedCityObj ? (lang === 'ar' ? selectedCityObj.name_ar : selectedCityObj.name_en) : (lang === 'ar' ? 'اختار مدينة...' : 'Select city...')}
              </span>
              <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform duration-200 shrink-0", cityDropdownOpen && "rotate-180")} />
            </button>

            {cityDropdownOpen && (
              <div className="absolute bottom-full mb-1.5 start-0 z-50 w-full rounded-2xl border border-border bg-card/98 dark:bg-slate-900/98 p-2 shadow-2xl backdrop-blur-md max-h-60 overflow-y-auto space-y-1">
                {cities.map(city => {
                  const isSelected = selectedCityId === city.id
                  return (
                    <button
                      key={city.id}
                      type="button"
                      onClick={() => {
                        setSelectedCityId(city.id)
                        setValue('city_id', city.id, { shouldValidate: true, shouldDirty: true })
                        setSelectedAreaId('')
                        setValue('area_id', '', { shouldValidate: true, shouldDirty: true })
                        setCityDropdownOpen(false)
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all text-start cursor-pointer",
                        isSelected 
                          ? "bg-primary text-primary-foreground font-black shadow-sm" 
                          : "text-foreground hover:bg-primary/10 hover:text-primary dark:text-slate-100 dark:hover:bg-slate-800"
                      )}
                    >
                      <span className="truncate">{lang === 'ar' ? city.name_ar : city.name_en}</span>
                      {isSelected && <Check className="h-4 w-4 shrink-0 stroke-[3]" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Custom Area Dropdown */}
          <div className="space-y-1.5 relative" ref={areaDropdownRef}>
            <Label htmlFor="area_id_btn" className="text-sm sm:text-base font-bold text-foreground">{lang === 'ar' ? 'المنطقة' : 'Area'}</Label>
            <input type="hidden" {...register('area_id')} value={selectedAreaId} />
            <button
              id="area_id_btn"
              type="button"
              disabled={!selectedCityId || areas.length === 0}
              onClick={() => setAreaDropdownOpen(v => !v)}
              className="flex h-12 w-full items-center justify-between rounded-xl border border-input bg-card/90 px-4 py-2.5 text-sm sm:text-base font-bold shadow-sm hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring transition-all disabled:opacity-50 cursor-pointer"
            >
              <span className={cn("truncate", selectedAreaObj ? "text-foreground font-black" : "text-muted-foreground font-medium")}>
                {selectedAreaObj ? (lang === 'ar' ? selectedAreaObj.name_ar : selectedAreaObj.name_en) : (lang === 'ar' ? 'اختار منطقة...' : 'Select area...')}
              </span>
              <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform duration-200 shrink-0", areaDropdownOpen && "rotate-180")} />
            </button>

            {areaDropdownOpen && areas.length > 0 && (
              <div className="absolute bottom-full mb-1.5 start-0 z-50 w-full rounded-2xl border border-border bg-card/98 dark:bg-slate-900/98 p-2 shadow-2xl backdrop-blur-md max-h-60 overflow-y-auto space-y-1">
                {areas.map((area: { id: string; name_ar: string; name_en: string }) => {
                  const isSelected = selectedAreaId === area.id
                  return (
                    <button
                      key={area.id}
                      type="button"
                      onClick={() => {
                        setSelectedAreaId(area.id)
                        setValue('area_id', area.id, { shouldValidate: true, shouldDirty: true })
                        setAreaDropdownOpen(false)
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all text-start cursor-pointer",
                        isSelected 
                          ? "bg-primary text-primary-foreground font-black shadow-sm" 
                          : "text-foreground hover:bg-primary/10 hover:text-primary dark:text-slate-100 dark:hover:bg-slate-800"
                      )}
                    >
                      <span className="truncate">{lang === 'ar' ? area.name_ar : area.name_en}</span>
                      {isSelected && <Check className="h-4 w-4 shrink-0 stroke-[3]" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        id="add-book-submit-btn"
        type="submit"
        size="lg"
        className="w-full text-base sm:text-xl font-black py-4 sm:py-6 h-14 sm:h-16 rounded-xl sm:rounded-2xl shadow-xl shadow-primary/25 hover:shadow-2xl active:scale-[0.98] transition-all cursor-pointer"
        loading={uploading}
      >
        {uploading
          ? (lang === 'ar' ? 'جارى النشر بالذكاء الاصطناعي...' : 'Publishing with AI...')
          : (lang === 'ar' ? '🚀 نشر الكتاب الآن' : '🚀 Publish Book Now')
        }
      </Button>
    </form>
  )
}
