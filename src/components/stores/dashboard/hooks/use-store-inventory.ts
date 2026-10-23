'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import type { StoreInventoryItem, BookCondition } from '@/types/store'
import {
  getStoreInventory,
  addStoreBook,
  deleteStoreBook,
  updateStoreBook,
} from '@/lib/stores/store-service'
import { STORE_CATALOG_BOOKS, getStoreBookCover } from '@/lib/stores/store-catalog-data'
import { compressImageFile } from '@/lib/image-utils'
import { uploadCommunityImage } from '@/lib/storage/upload-helper'
import type { SearchBookResult } from '@/app/api/stores/books-search/route'
import { useInventorySelection } from './use-inventory-selection'
import { useBulkImport } from './use-bulk-import'

export { SAMPLE_BULK_LIST, POPULAR_ARABIC_DB } from '@/lib/stores/popular-arabic-books'

export interface NewBookFormState {
  title: string
  title_ar: string
  author: string
  isbn?: string
  category_name: string
  condition: BookCondition
  price: number
  original_price: number
  has_discount: boolean
  stock_quantity: number
  cover_url?: string
  description?: string
  description_ar?: string
  goodreads_url?: string
  rating?: number
  rating_count?: number
  review_count?: number
  reviews?: string
  publisher?: string
  published_year?: number
  pages_count?: number
  first_published?: string
  genres?: string[]
  author_details?: {
    name?: string
    bio?: string
    image_url?: string
  }
}

interface UseStoreInventoryProps {
  activeStoreId: string
  currentUserId?: string | null
  lang: 'ar' | 'en'
}

export function useStoreInventory({ activeStoreId, currentUserId, lang }: UseStoreInventoryProps) {
  const [inventory, setInventory] = useState<StoreInventoryItem[]>([])
  const [isInventoryLoading, setIsInventoryLoading] = useState(true)

  // Sub-Hook 1: Selection & Batch Operations (Bulk Edit, Batch Delete, Delete All)
  const selection = useInventorySelection({
    activeStoreId,
    inventory,
    setInventory,
    lang,
  })

  // Sub-Hook 2: Bulk Import & Auto-Enrichment via Google Books API
  const bulkImport = useBulkImport({
    activeStoreId,
    setInventory,
    lang,
  })

  // ─────────────────────────────────────────────────────────────
  // Load Store Inventory on Mount & Active Store Change
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true
    async function loadInventory() {
      setIsInventoryLoading(true)
      try {
        const items = await getStoreInventory(activeStoreId)
        if (isMounted) {
          setInventory(items)
        }
      } catch (err) {
        console.error('Failed to load store inventory:', err)
      } finally {
        if (isMounted) setIsInventoryLoading(false)
      }
    }
    loadInventory()
    return () => {
      isMounted = false
    }
  }, [activeStoreId])

  // ─────────────────────────────────────────────────────────────
  // Add / Edit Single Book Modal State
  // ─────────────────────────────────────────────────────────────
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false)
  const [editingBookId, setEditingBookId] = useState<string | null>(null)
  const [isUploadingBookCover, setIsUploadingBookCover] = useState(false)
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('')

  const [newBook, setNewBook] = useState<NewBookFormState>({
    title: '',
    title_ar: '',
    author: '',
    isbn: '',
    category_name: 'روايات وأدب',
    condition: 'NEW' as BookCondition,
    price: 150,
    original_price: 150,
    has_discount: false,
    stock_quantity: 10,
    cover_url: '',
    description: '',
    description_ar: '',
    goodreads_url: '',
    rating: undefined,
    rating_count: undefined,
    review_count: undefined,
    reviews: '',
    publisher: '',
    published_year: undefined,
    pages_count: undefined,
    first_published: undefined,
    genres: [],
    author_details: undefined,
  })

  // Catalog Quick Search Results
  const catalogSearchResults = useMemo(() => {
    const q = catalogSearchQuery.trim().toLowerCase()
    if (!q) return []
    return STORE_CATALOG_BOOKS.filter(book => {
      const matchTitle = book.title.toLowerCase().includes(q)
      const matchTitleAr = book.title_ar && book.title_ar.includes(q)
      const matchAuthor = book.author.toLowerCase().includes(q)
      const matchAuthorAr = book.author_ar && book.author_ar.includes(q)
      return matchTitle || matchTitleAr || matchAuthor || matchAuthorAr
    }).slice(0, 9)
  }, [catalogSearchQuery])

  const handleOpenAddBook = () => {
    setEditingBookId(null)
    setNewBook({
      title: '',
      title_ar: '',
      author: '',
      isbn: '',
      category_name: 'روايات وأدب',
      condition: 'NEW',
      price: 150,
      original_price: 150,
      has_discount: false,
      stock_quantity: 10,
      cover_url: '',
      description: '',
      description_ar: '',
      goodreads_url: '',
      rating: undefined,
      rating_count: undefined,
      review_count: undefined,
      reviews: '',
      publisher: '',
      published_year: undefined,
      pages_count: undefined,
      first_published: undefined,
      genres: [],
      author_details: undefined,
    })
    setIsAddBookModalOpen(true)
  }

  const handleOpenEditBook = (book: StoreInventoryItem) => {
    setEditingBookId(book.id)
    const hasDiscount = Boolean(book.original_price && book.original_price > book.price)
    setNewBook({
      title: book.title,
      title_ar: book.title_ar || book.title,
      author: book.author,
      isbn: book.isbn || '',
      category_name: book.category_name || 'روايات وأدب',
      condition: book.condition,
      price: book.price,
      original_price: book.original_price || book.price,
      has_discount: hasDiscount,
      stock_quantity: book.stock_quantity,
      cover_url: book.cover_url || '',
      description: book.description || '',
      description_ar: book.description_ar || book.description || '',
      goodreads_url: book.goodreads_url || '',
      rating: book.rating,
      rating_count: book.rating_count,
      review_count: book.review_count,
      reviews: book.reviews?.[0]?.text || '',
      publisher: book.publisher || '',
      published_year: book.published_year,
      pages_count: book.pages_count,
      first_published: book.first_published,
      genres: book.genres || [],
      author_details: book.author_details,
    })
    setIsAddBookModalOpen(true)
  }

  const handleSelectCatalogBook = (catBook: (typeof STORE_CATALOG_BOOKS)[number]) => {
    const hasDiscount = Boolean(catBook.original_price && catBook.original_price > catBook.price)
    setNewBook({
      title: catBook.title,
      title_ar: catBook.title_ar || catBook.title,
      author: catBook.author_ar || catBook.author,
      isbn: catBook.isbn || '',
      category_name: catBook.category_name_ar || 'روايات وأدب',
      condition: 'NEW',
      price: catBook.price,
      original_price: catBook.original_price || catBook.price,
      has_discount: hasDiscount,
      stock_quantity: 10,
      cover_url: getStoreBookCover(catBook),
      description: catBook.description || '',
      description_ar: catBook.description_ar || catBook.description || '',
      goodreads_url: (catBook as any).goodreads_url || (catBook.isbn ? `https://www.goodreads.com/search?q=${encodeURIComponent(catBook.isbn.replace(/-/g, ''))}` : ''),
      rating: catBook.rating || 4.5,
      rating_count: (catBook as any).rating_count || 120,
      review_count: undefined,
      reviews: '',
      publisher: (catBook as any).publisher || '',
      published_year: (catBook as any).published_year,
      pages_count: (catBook as any).pages_count,
      first_published: undefined,
      genres: [],
      author_details: undefined,
    })
    setIsAddBookModalOpen(true)
  }

  const handleBookCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingBookCover(true)
    try {
      const compressed = await compressImageFile(file, { maxWidth: 800, maxHeight: 1100, quality: 0.85 })
      const uploadRes = await uploadCommunityImage(compressed.file, 'covers')
      if (uploadRes.url) {
        setNewBook(prev => ({ ...prev, cover_url: uploadRes.url }))
      } else {
        setNewBook(prev => ({ ...prev, cover_url: compressed.dataUrl }))
      }
    } catch (err) {
      console.error('Failed to upload book cover:', err)
      const reader = new FileReader()
      reader.onload = ev => {
        if (ev.target?.result) {
          setNewBook(prev => ({ ...prev, cover_url: ev.target!.result as string }))
        }
      }
      reader.readAsDataURL(file)
    } finally {
      setIsUploadingBookCover(false)
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Online Universal Books Search Integration (OpenLibrary, Google Books, Archive.org, Wikipedia)
  // ─────────────────────────────────────────────────────────────
  const [onlineBookSearchQuery, setOnlineBookSearchQuery] = useState('')
  const [isOnlineSearching, setIsOnlineSearching] = useState(false)
  const [onlineSearchResults, setOnlineSearchResults] = useState<SearchBookResult[]>([])
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleSearchOnlineBooks = async (queryToSearch?: string, immediate = false) => {
    const q = (queryToSearch !== undefined ? queryToSearch : onlineBookSearchQuery).trim()
    if (queryToSearch !== undefined) {
      setOnlineBookSearchQuery(queryToSearch)
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (!q || q.length < 2) {
      setOnlineSearchResults([])
      setIsOnlineSearching(false)
      return
    }

    const executeSearch = async () => {
      setIsOnlineSearching(true)
      try {
        const res = await fetch(`/api/stores/books-search?q=${encodeURIComponent(q)}`)
        if (res.ok) {
          const data = await res.json()
          setOnlineSearchResults(data.books || [])
        } else {
          setOnlineSearchResults([])
        }
      } catch (err) {
        console.error('Online book search error:', err)
        setOnlineSearchResults([])
      } finally {
        setIsOnlineSearching(false)
      }
    }

    if (immediate) {
      executeSearch()
    } else {
      setIsOnlineSearching(true)
      searchTimeoutRef.current = setTimeout(executeSearch, 450)
    }
  }

  const handleSelectOnlineSearchResult = (book: SearchBookResult) => {
    const sampleReview =
      book.reviews?.[0]?.text ||
      (book.rating ? `كتاب متميز نال تقييم ${book.rating} من 5 عبر أكثر من ${book.rating_count || 100} قارئ على منصة Goodreads.` : '')

    setNewBook(prev => ({
      ...prev,
      title: book.title,
      title_ar: book.title_ar || book.title,
      author: book.author_ar || book.author,
      cover_url: book.cover_url,
      description: book.description,
      description_ar: book.description_ar,
      isbn: book.isbn,
      pages_count: book.pages_count,
      published_year: book.published_year,
      publisher: book.publisher,
      rating: book.rating,
      rating_count: book.rating_count,
      goodreads_url: book.goodreads_url,
      author_details: book.author_details,
      price: book.suggested_price || prev.price,
      // Store UI helpers
      original_price: book.suggested_price || prev.original_price || prev.price,
      category_name: book.category_name || prev.category_name,
      first_published: book.first_published || prev.first_published,
      genres: book.genres || prev.genres || [],
      reviews: sampleReview || prev.reviews,
      has_discount: false,
    }))
    setOnlineSearchResults([])
  }

  // ─────────────────────────────────────────────────────────────
  // Add or Edit Book Submission
  // ─────────────────────────────────────────────────────────────
  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanTitle = newBook.title?.trim()
    if (!cleanTitle) {
      alert(lang === 'ar' ? 'يرجى كتابة عنوان الكتاب' : 'Please enter the book title')
      return
    }

    const cleanAuthor = newBook.author?.trim() || (lang === 'ar' ? 'مؤلف معتمد' : 'Author')
    const finalCover = newBook.cover_url?.trim() || getStoreBookCover({ title: cleanTitle, category: newBook.category_name })

    const priceNum = Math.max(0, Number(newBook.price) || 0)
    const origPriceNum = Number(newBook.original_price) || 0
    // STRICT: Only apply discount if has_discount checkbox is active AND original price > current price
    const hasDiscountApplied = Boolean(newBook.has_discount && origPriceNum > priceNum)
    const finalOriginalPrice = hasDiscountApplied ? origPriceNum : undefined
    const parsedRating = newBook.rating && Number(newBook.rating) > 0 ? Number(newBook.rating) : undefined
    const parsedRatingCount = newBook.rating_count && Number(newBook.rating_count) > 0 ? Number(newBook.rating_count) : undefined
    const parsedReviewCount = newBook.review_count && Number(newBook.review_count) > 0 ? Number(newBook.review_count) : undefined
    const parsedPublishedYear = newBook.published_year && Number(newBook.published_year) > 0 ? Number(newBook.published_year) : undefined
    const parsedPagesCount = newBook.pages_count && Number(newBook.pages_count) > 0 ? Number(newBook.pages_count) : undefined
    const reviewsArr = newBook.reviews?.trim()
      ? [{ name: 'مراجعة موثقة للقارئ', text: newBook.reviews.trim(), rating: parsedRating || 5, date: 'مراجعة حديثة', verified: true }]
      : undefined

    if (editingBookId) {
      const updated = await updateStoreBook(activeStoreId, editingBookId, {
        title: cleanTitle,
        title_ar: newBook.title_ar?.trim() || cleanTitle,
        author: cleanAuthor,
        isbn: newBook.isbn?.trim() || undefined,
        category_name: newBook.category_name || 'روايات وأدب',
        condition: newBook.condition || 'NEW',
        price: priceNum,
        original_price: finalOriginalPrice,
        has_discount: hasDiscountApplied,
        stock_quantity: Math.max(1, Number(newBook.stock_quantity) || 1),
        cover_url: finalCover,
        description: newBook.description || undefined,
        description_ar: newBook.description_ar || newBook.description || undefined,
        goodreads_url: newBook.goodreads_url?.trim() || undefined,
        rating: parsedRating,
        rating_count: parsedRatingCount,
        review_count: parsedReviewCount,
        publisher: newBook.publisher?.trim() || undefined,
        published_year: parsedPublishedYear,
        pages_count: parsedPagesCount,
        first_published: newBook.first_published || undefined,
        genres: newBook.genres?.length ? newBook.genres : undefined,
        author_details: newBook.author_details,
        reviews: reviewsArr,
      })

      if (updated) {
        setInventory(prev => prev.map(b => (b.id === editingBookId ? updated : b)))
      }
    } else {
      const created = await addStoreBook({
        store_id: activeStoreId,
        title: cleanTitle,
        title_ar: newBook.title_ar?.trim() || cleanTitle,
        author: cleanAuthor,
        isbn: newBook.isbn?.trim() || undefined,
        category_name: newBook.category_name || 'روايات وأدب',
        condition: newBook.condition || 'NEW',
        price: priceNum,
        original_price: finalOriginalPrice,
        has_discount: hasDiscountApplied,
        stock_quantity: Math.max(1, Number(newBook.stock_quantity) || 1),
        cover_url: finalCover,
        description: newBook.description || undefined,
        description_ar: newBook.description_ar || newBook.description || undefined,
        goodreads_url: newBook.goodreads_url?.trim() || undefined,
        rating: parsedRating,
        rating_count: parsedRatingCount,
        review_count: parsedReviewCount,
        publisher: newBook.publisher?.trim() || undefined,
        published_year: parsedPublishedYear,
        pages_count: parsedPagesCount,
        first_published: newBook.first_published || undefined,
        genres: newBook.genres?.length ? newBook.genres : undefined,
        author_details: newBook.author_details,
        reviews: reviewsArr,
        is_active: true,
      })
      setInventory(prev => [created, ...prev])
    }

    setIsAddBookModalOpen(false)
    setEditingBookId(null)
    setNewBook({
      title: '',
      title_ar: '',
      author: '',
      isbn: '',
      category_name: 'روايات وأدب',
      condition: 'NEW',
      price: 150,
      original_price: 150,
      has_discount: false,
      stock_quantity: 10,
      cover_url: '',
      description: '',
      description_ar: '',
      goodreads_url: '',
      rating: undefined,
      rating_count: undefined,
      review_count: undefined,
      reviews: '',
      publisher: '',
      published_year: undefined,
      pages_count: undefined,
      first_published: undefined,
      genres: [],
      author_details: undefined,
    })
  }

  const handleDeleteBook = async (id: string) => {
    if (!confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا الكتاب من المخزون؟' : 'Are you sure you want to delete this book?')) return
    await deleteStoreBook(activeStoreId, id)
    setInventory(prev => prev.filter(b => b.id !== id))
    selection.setSelectedBookIds(prev => prev.filter(x => x !== id))
  }

  return {
    inventory,
    isInventoryLoading,
    isAddBookModalOpen,
    setIsAddBookModalOpen,
    editingBookId,
    setEditingBookId,
    isUploadingBookCover,
    catalogSearchQuery,
    setCatalogSearchQuery,
    newBook,
    setNewBook,
    catalogSearchResults,
    handleOpenAddBook,
    handleOpenEditBook,
    handleSelectCatalogBook,
    handleBookCoverFileChange,
    handleAddBook,
    handleDeleteBook,
    onlineBookSearchQuery,
    isOnlineSearching,
    onlineSearchResults,
    handleSearchOnlineBooks,
    handleSelectOnlineSearchResult,
    setOnlineBookSearchQuery,
    setOnlineSearchResults,
    // Composed from useBulkImport
    isBulkAddModalOpen: bulkImport.isBulkAddModalOpen,
    setIsBulkAddModalOpen: bulkImport.setIsBulkAddModalOpen,
    bulkBooksText: bulkImport.bulkBooksText,
    setBulkBooksText: bulkImport.setBulkBooksText,
    bulkDefaultPrice: bulkImport.bulkDefaultPrice,
    setBulkDefaultPrice: bulkImport.setBulkDefaultPrice,
    bulkDefaultQty: bulkImport.bulkDefaultQty,
    setBulkDefaultQty: bulkImport.setBulkDefaultQty,
    bulkDefaultCondition: bulkImport.bulkDefaultCondition,
    setBulkDefaultCondition: bulkImport.setBulkDefaultCondition,
    isBulkImporting: bulkImport.isBulkImporting,
    SAMPLE_BULK_LIST: bulkImport.SAMPLE_BULK_LIST,
    parsedBulkBooks: bulkImport.parsedBulkBooks,
    ignoredGibberishCount: bulkImport.ignoredGibberishCount,
    handleExecuteBulkImport: bulkImport.handleExecuteBulkImport,
    isAutoEnriching: bulkImport.isAutoEnriching,
    enrichProgress: bulkImport.enrichProgress,
    handleAutoEnrichBulkBooks: bulkImport.handleAutoEnrichBulkBooks,
    handleUpdateBulkItem: bulkImport.handleUpdateBulkItem,
    // Composed from useInventorySelection
    selectedBookIds: selection.selectedBookIds,
    handleToggleSelectBook: selection.handleToggleSelectBook,
    handleToggleSelectAll: selection.handleToggleSelectAll,
    handleClearSelection: selection.handleClearSelection,
    handleDeleteSelected: selection.handleDeleteSelected,
    handleDeleteAll: selection.handleDeleteAll,
    isBulkEditModalOpen: selection.isBulkEditModalOpen,
    setIsBulkEditModalOpen: selection.setIsBulkEditModalOpen,
    bulkEditForm: selection.bulkEditForm,
    setBulkEditForm: selection.setBulkEditForm,
    handleOpenBulkEdit: selection.handleOpenBulkEdit,
    handleApplyBulkEdit: selection.handleApplyBulkEdit,
  }
}
