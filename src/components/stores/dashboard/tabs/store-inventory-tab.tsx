'use client'

import React from 'react'
import Image from 'next/image'
import {
  BookOpen,
  PlusCircle,
  ListPlus,
  Sparkles,
  Search,
  Edit,
  Trash2,
  CheckSquare,
  Square,
  AlertTriangle,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getStoreBookCover, STORE_CATALOG_BOOKS } from '@/lib/stores/store-catalog-data'
import { useStoreInventory } from '../hooks/use-store-inventory'
import { AddBookModal } from '../components/add-book-modal'
import { BulkAddBooksModal } from '../components/bulk-add-books-modal'
import { BulkEditModal } from '../components/bulk-edit-modal'

interface StoreInventoryTabProps {
  activeStoreId: string
  currentUserId?: string | null
  lang: 'ar' | 'en'
}

function TableRowCover({ src, title }: { src?: string; title: string }) {
  const [error, setError] = React.useState(false)
  if (!src || error) {
    return (
      <Image
        src="/images/book-placeholder.svg"
        alt={title}
        fill
        className="object-cover p-1"
      />
    )
  }
  return (
    <Image
      src={src}
      alt={title}
      fill
      unoptimized
      className="object-cover"
      onError={() => setError(true)}
    />
  )
}

export function StoreInventoryTab({
  activeStoreId,
  currentUserId,
  lang,
}: StoreInventoryTabProps) {
  const {
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
    isBulkAddModalOpen,
    setIsBulkAddModalOpen,
    bulkBooksText,
    setBulkBooksText,
    bulkDefaultPrice,
    setBulkDefaultPrice,
    bulkDefaultQty,
    setBulkDefaultQty,
    bulkDefaultCondition,
    setBulkDefaultCondition,
    isBulkImporting,
    SAMPLE_BULK_LIST,
    parsedBulkBooks,
    ignoredGibberishCount,
    handleExecuteBulkImport,
    isAutoEnriching,
    enrichProgress,
    handleAutoEnrichBulkBooks,
    handleUpdateBulkItem,
    selectedBookIds,
    handleToggleSelectBook,
    handleToggleSelectAll,
    handleClearSelection,
    handleDeleteSelected,
    handleDeleteAll,
    isBulkEditModalOpen,
    setIsBulkEditModalOpen,
    bulkEditForm,
    setBulkEditForm,
    handleOpenBulkEdit,
    handleApplyBulkEdit,
  } = useStoreInventory({
    activeStoreId,
    currentUserId,
    lang,
  })

  const isAllSelected = inventory.length > 0 && selectedBookIds.length === inventory.length

  return (
    <div className="space-y-6 animate-in fade-in duration-200 relative pb-16">
      {/* Header and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-foreground flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span>{lang === 'ar' ? 'كتالوج ومخزون كتب المكتبة' : 'Store Catalog & Inventory'}</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {lang === 'ar'
              ? 'أضف الكتب المتوفرة في فرعك، مع تحديد الأسعار والخصومات والكميات المتاحة، أو قم بالتعديل والحذف الجماعي.'
              : 'Manage store books, bulk edit prices/stock, or delete individual and selected books.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* {inventory.length > 0 && (
            <Button
              onClick={handleDeleteAll}
              variant="outline"
              className="rounded-2xl font-bold text-xs gap-1.5 border-red-500/30 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer shadow-xs"
              title={lang === 'ar' ? 'حذف كافة كتب المخزون' : 'Delete All Inventory'}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{lang === 'ar' ? 'حذف كافة الكتب' : 'Delete All'}</span>
            </Button>
          )} */}

          <Button
            onClick={() => setIsBulkAddModalOpen(true)}
            variant="outline"
            className="rounded-2xl font-black text-xs gap-2 border-primary/30 text-primary hover:bg-primary/10 cursor-pointer shadow-xs"
          >
            <ListPlus className="h-4 w-4" />
            <span>{lang === 'ar' ? 'استيراد قائمة كتب مجمعة (Bulk List) ⚡' : 'Bulk Books Import ⚡'}</span>
          </Button>

          <Button
            onClick={handleOpenAddBook}
            className="rounded-2xl font-black text-xs gap-2 shadow-md shadow-primary/25 cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>{lang === 'ar' ? 'إضافة كتاب جديد للمكتبة' : 'Add New Book'}</span>
          </Button>
        </div>
      </div>

      {/* Floating Batch Action Bar when rows are selected */}
      {selectedBookIds.length > 0 && (
        <div className="sticky top-20 z-30 p-3.5 rounded-2xl bg-card border-2 border-primary/40 shadow-xl flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <Badge className="bg-primary text-primary-foreground font-black px-3 py-1 rounded-xl text-xs">
              {lang === 'ar'
                ? `تم تحديد ${selectedBookIds.length} من أصل ${inventory.length} كتاب`
                : `${selectedBookIds.length} of ${inventory.length} books selected`}
            </Badge>
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-bold"
            >
              <X className="h-3.5 w-3.5" />
              <span>{lang === 'ar' ? 'إلغاء التحديد' : 'Deselect All'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleOpenBulkEdit}
              className="rounded-xl font-bold text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs"
            >
              <Edit className="h-3.5 w-3.5" />
              <span>{lang === 'ar' ? `تعديل المحدد (${selectedBookIds.length})` : `Edit Selected (${selectedBookIds.length})`}</span>
            </Button>

            <Button
              size="sm"
              variant="destructive"
              onClick={handleDeleteSelected}
              className="rounded-xl font-bold text-xs gap-1.5 cursor-pointer shadow-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{lang === 'ar' ? `حذف المحدد (${selectedBookIds.length})` : `Delete Selected (${selectedBookIds.length})`}</span>
            </Button>
          </div>
        </div>
      )}

      {/* 1-Click Catalog Quick Search Banner */}
      <div className="rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-card to-background p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>{lang === 'ar' ? 'إضافة سريعة من الكتالوج العام بضغطة زر' : '1-Click Quick Add from Platform Catalog'}</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              {lang === 'ar'
                ? 'ابحث باسم الرواية أو الكاتب، وأضف تفاصيل الكتاب وصورته فوراً إلى مخزون فرعك دون كتابة يدوية.'
                : 'Search popular books to populate cover, author, ISBN and prices in one click.'}
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={catalogSearchQuery}
              onChange={e => setCatalogSearchQuery(e.target.value)}
              placeholder={lang === 'ar' ? 'ابحث: الفيل الأزرق، نجيب محفوظ...' : 'Search books, authors...'}
              className="w-full bg-card border border-border rounded-xl ps-9 pe-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary shadow-xs"
            />
            {catalogSearchQuery && (
              <button
                type="button"
                onClick={() => setCatalogSearchQuery('')}
                className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Catalog Search Results Grid */}
        {catalogSearchQuery.trim() !== '' && (
          <div className="pt-2 border-t border-border/60">
            <div className="text-[11px] font-bold text-muted-foreground mb-2">
              {lang === 'ar' ? `نتائج البحث (${catalogSearchResults.length} كتاب):` : `Search Results (${catalogSearchResults.length} books):`}
            </div>
            {catalogSearchResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {catalogSearchResults.map((book: (typeof STORE_CATALOG_BOOKS)[number]) => (
                  <div
                    key={book.id}
                    className="flex items-center gap-3 p-2.5 rounded-2xl bg-card border border-border/80 hover:border-primary/50 transition-all shadow-xs group"
                  >
                    <div className="relative h-14 w-10 rounded-lg overflow-hidden bg-muted shrink-0 border border-border/60">
                      <Image src={getStoreBookCover(book)} alt="" fill className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-foreground line-clamp-1">
                        {lang === 'ar' && book.title_ar ? book.title_ar : book.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {lang === 'ar' && book.author_ar ? book.author_ar : book.author}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-black text-primary">{book.price} ج.م</span>
                        {book.original_price && (
                          <span className="text-[10px] text-muted-foreground line-through">
                            {book.original_price} ج.م
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      type="button"
                      onClick={() => handleSelectCatalogBook(book)}
                      className="rounded-xl text-[11px] font-black h-8 px-2.5 shrink-0 gap-1 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20 cursor-pointer"
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      <span>{lang === 'ar' ? 'أضف' : 'Add'}</span>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-muted-foreground">
                {lang === 'ar' ? 'لم يتم العثور على كتب مطابقة في الكتالوج العام. يمكنك استخدام زر "إضافة كتاب جديد" لإدخاله يدوياً.' : 'No matching books found. Use "Add New Book" to enter manually.'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Inventory Table */}
      <div className="rounded-3xl border-2 border-border/80 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground font-black">
                <th className="p-4 text-center w-12">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={() => handleToggleSelectAll()}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
                    title={isAllSelected ? (lang === 'ar' ? 'إلغاء تحديد الكل' : 'Deselect All') : (lang === 'ar' ? 'تحديد كافة الكتب' : 'Select All')}
                  />
                </th>
                <th className="p-4 text-start">{lang === 'ar' ? 'الكتاب' : 'Book'}</th>
                <th className="p-4 text-start">{lang === 'ar' ? 'المؤلف والتصنيف' : 'Author & Category'}</th>
                <th className="p-4 text-center">{lang === 'ar' ? 'الحالة' : 'Condition'}</th>
                <th className="p-4 text-center">{lang === 'ar' ? 'السعر' : 'Price'}</th>
                <th className="p-4 text-center">{lang === 'ar' ? 'المخزون' : 'Stock'}</th>
                <th className="p-4 text-end">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {inventory.map(item => {
                const isSelected = selectedBookIds.includes(item.id)
                return (
                  <tr
                    key={item.id}
                    className={cn(
                      'transition-colors',
                      isSelected ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/20'
                    )}
                  >
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectBook(item.id)}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-9 rounded-lg overflow-hidden bg-muted shrink-0 border border-border">
                          <TableRowCover src={item.cover_url} title={item.title} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-foreground text-xs line-clamp-1">
                            {lang === 'ar' && item.title_ar ? item.title_ar : item.title}
                          </p>
                          {item.isbn && (
                            <span className="text-[10px] text-muted-foreground font-mono block">
                              ISBN: {item.isbn}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-foreground text-xs">{item.author}</p>
                      <span className="text-[10px] text-muted-foreground">{item.category_name}</span>
                    </td>
                    <td className="p-4 text-center">
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {item.condition}
                      </Badge>
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-black text-foreground text-xs block">
                        {item.price} ج.م
                      </span>
                      {item.original_price && item.original_price > item.price && (
                        <span className="text-[10px] text-muted-foreground line-through block">
                          {item.original_price} ج.م
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-black',
                        item.stock_quantity > 5 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                      )}>
                        {item.stock_quantity} {lang === 'ar' ? 'نسخ' : 'copies'}
                      </span>
                    </td>
                    <td className="p-4 text-end">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenEditBook(item)}
                          className="h-8 w-8 p-0 rounded-xl text-primary hover:text-primary hover:bg-primary/10 cursor-pointer"
                          title={lang === 'ar' ? 'تعديل بيانات الكتاب' : 'Edit Book'}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteBook(item.id)}
                          className="h-8 w-8 p-0 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                          title={lang === 'ar' ? 'حذف من المخزون' : 'Delete Book'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {inventory.length === 0 && !isInventoryLoading && (
          <div className="p-12 text-center text-muted-foreground text-xs">
            {lang === 'ar' ? 'لا توجد كتب مضافة بعد في مخزون هذه المكتبة.' : 'No books in this bookstore catalog yet.'}
          </div>
        )}
      </div>

      {/* Modal: Add or Edit Book */}
      <AddBookModal
        isOpen={isAddBookModalOpen}
        onClose={() => {
          setIsAddBookModalOpen(false)
          setEditingBookId(null)
        }}
        editingBookId={editingBookId}
        newBook={newBook}
        setNewBook={setNewBook}
        onlineBookSearchQuery={onlineBookSearchQuery}
        isOnlineSearching={isOnlineSearching}
        onlineSearchResults={onlineSearchResults}
        onSearchOnlineBooks={handleSearchOnlineBooks}
        onSelectOnlineSearchResult={handleSelectOnlineSearchResult}
        onClearOnlineSearch={() => {
          setOnlineBookSearchQuery('')
          setOnlineSearchResults([])
        }}
        isUploadingBookCover={isUploadingBookCover}
        onBookCoverFileChange={handleBookCoverFileChange}
        onSubmit={handleAddBook}
        lang={lang}
      />

      {/* Modal: Bulk Book Import with Auto-Enrichment */}
      <BulkAddBooksModal
        isOpen={isBulkAddModalOpen}
        onClose={() => setIsBulkAddModalOpen(false)}
        bulkBooksText={bulkBooksText}
        setBulkBooksText={setBulkBooksText}
        bulkDefaultPrice={bulkDefaultPrice}
        setBulkDefaultPrice={setBulkDefaultPrice}
        bulkDefaultQty={bulkDefaultQty}
        setBulkDefaultQty={setBulkDefaultQty}
        bulkDefaultCondition={bulkDefaultCondition}
        setBulkDefaultCondition={setBulkDefaultCondition}
        isBulkImporting={isBulkImporting}
        sampleBulkList={SAMPLE_BULK_LIST}
        parsedBulkBooks={parsedBulkBooks}
        onExecuteImport={handleExecuteBulkImport}
        isAutoEnriching={isAutoEnriching}
        enrichProgress={enrichProgress}
        onAutoEnrich={handleAutoEnrichBulkBooks}
        onUpdateItem={handleUpdateBulkItem}
        ignoredGibberishCount={ignoredGibberishCount}
        lang={lang}
      />

      {/* Modal: Bulk Edit Selected Books */}
      <BulkEditModal
        isOpen={isBulkEditModalOpen}
        onClose={() => setIsBulkEditModalOpen(false)}
        selectedCount={selectedBookIds.length}
        bulkEditForm={bulkEditForm}
        setBulkEditForm={setBulkEditForm}
        onSubmit={handleApplyBulkEdit}
        lang={lang}
      />
    </div>
  )
}

