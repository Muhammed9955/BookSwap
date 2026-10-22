import React from 'react'
import { Edit, X, Save, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BookCondition } from '@/types/store'

interface BulkEditModalProps {
  isOpen: boolean
  onClose: () => void
  selectedCount: number
  bulkEditForm: {
    price: string
    original_price: string
    stock_quantity: string
    condition: BookCondition | ''
    category_name: string
  }
  setBulkEditForm: React.Dispatch<
    React.SetStateAction<{
      price: string
      original_price: string
      stock_quantity: string
      condition: BookCondition | ''
      category_name: string
    }>
  >
  onSubmit: (e: React.FormEvent) => void
  lang: 'ar' | 'en'
}

export function BulkEditModal({
  isOpen,
  onClose,
  selectedCount,
  bulkEditForm,
  setBulkEditForm,
  onSubmit,
  lang,
}: BulkEditModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-card w-full max-w-lg rounded-3xl border-2 border-border shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
              <Edit className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-black text-lg text-foreground">
                {lang === 'ar' ? 'تعديل جماعي للكتب المحددة' : 'Bulk Edit Selected Books'}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lang === 'ar'
                  ? `أنت تقوم بتعديل ${selectedCount} كتاب محدد. اترك الحقول الفارغة دون تغيير.`
                  : `You are editing ${selectedCount} selected books. Leave blank to keep existing values.`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 font-medium">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              {lang === 'ar'
                ? 'الحقول التي ستكتب فيها فقط هي التي سيتم تحديثها للكتب المحددة دفعة واحدة.'
                : 'Only fields you fill in will overwrite the values of selected books.'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-foreground mb-1 block">
                {lang === 'ar' ? 'السعر الجديد (ج.م)' : 'New Price (EGP)'}
              </label>
              <input
                type="number"
                min="0"
                value={bulkEditForm.price}
                onChange={e => setBulkEditForm(prev => ({ ...prev, price: e.target.value }))}
                placeholder={lang === 'ar' ? 'اتركه فارغاً دون تغيير' : 'Leave empty to keep'}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground mb-1 block">
                {lang === 'ar' ? 'السعر الأصلي / قبل الخصم' : 'Original Price (EGP)'}
              </label>
              <input
                type="number"
                min="0"
                value={bulkEditForm.original_price}
                onChange={e => setBulkEditForm(prev => ({ ...prev, original_price: e.target.value }))}
                placeholder={lang === 'ar' ? 'اتركه فارغاً دون تغيير' : 'Leave empty to keep'}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-foreground mb-1 block">
                {lang === 'ar' ? 'كمية المخزون الجديدة' : 'New Stock Quantity'}
              </label>
              <input
                type="number"
                min="0"
                value={bulkEditForm.stock_quantity}
                onChange={e => setBulkEditForm(prev => ({ ...prev, stock_quantity: e.target.value }))}
                placeholder={lang === 'ar' ? 'اتركه فارغاً دون تغيير' : 'Leave empty to keep'}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground mb-1 block">
                {lang === 'ar' ? 'حالة الكتب' : 'Condition'}
              </label>
              <select
                value={bulkEditForm.condition}
                onChange={e => setBulkEditForm(prev => ({ ...prev, condition: e.target.value as BookCondition | '' }))}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
              >
                <option value="">{lang === 'ar' ? '-- بدون تغيير --' : '-- No Change --'}</option>
                <option value="NEW">{lang === 'ar' ? 'جديد (NEW)' : 'New'}</option>
                <option value="LIKE_NEW">{lang === 'ar' ? 'شبه جديد (LIKE NEW)' : 'Like New'}</option>
                <option value="GOOD">{lang === 'ar' ? 'جيد جداً (GOOD)' : 'Good'}</option>
                <option value="FAIR">{lang === 'ar' ? 'مقبول (FAIR)' : 'Fair'}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-foreground mb-1 block">
              {lang === 'ar' ? 'تصنيف الكتب' : 'Category'}
            </label>
            <select
              value={bulkEditForm.category_name}
              onChange={e => setBulkEditForm(prev => ({ ...prev, category_name: e.target.value }))}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
            >
              <option value="">{lang === 'ar' ? '-- بدون تغيير --' : '-- No Change --'}</option>
              <option value="روايات وأدب">روايات وأدب (Literature & Fiction)</option>
              <option value="تنمية وتطوير ذات">تنمية وتطوير ذات (Self-Help)</option>
              <option value="فكر وفلسفة">فكر وفلسفة (Philosophy)</option>
              <option value="تاريخ وسير">تاريخ وسير (History & Biography)</option>
              <option value="علوم وتكنولوجيا">علوم وتكنولوجيا (Science & Tech)</option>
              <option value="أطفال ونشء">أطفال ونشء (Children)</option>
              <option value="إسلاميات ودين">إسلاميات ودين (Religion)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/80">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-2xl text-xs font-bold cursor-pointer"
            >
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              className="rounded-2xl text-xs font-black gap-2 shadow-md shadow-primary/25 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>{lang === 'ar' ? `تطبيق التعديلات (${selectedCount})` : `Apply Changes (${selectedCount})`}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
