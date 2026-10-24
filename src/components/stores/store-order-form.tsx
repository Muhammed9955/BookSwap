'use client'

import React, { useState, useMemo } from 'react'
import { MessageCircle, CheckCircle2, AlertCircle, Phone, User, MapPin, FileText, Truck, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/i18n/language-context'
import { EGYPT_GOVERNORATES } from '@/lib/constants/locations'
import { cn } from '@/lib/utils'

export interface CustomerOrderData {
  customerName: string
  customerPhone: string
  customerCity: string
  customerAddress: string
  customerNotes: string
  shippingFee: number
  itemsTotal: number
  finalTotal: number
}

interface StoreOrderFormProps {
  initialValues?: Partial<CustomerOrderData>
  subtotal?: number
  onSubmit: (data: CustomerOrderData) => void
  onCancel: () => void
  submitLabel?: string
  submitIcon?: React.ReactNode
  submitClassName?: string
}

/**
 * Egyptian Shipping Fee by Governorate
 */
export function calculateShippingFee(city: string, subtotal: number = 0): { fee: number; regionNameAr: string; regionNameEn: string; isFree: boolean } {
  if (subtotal >= 400 && subtotal > 0) {
    return { fee: 0, regionNameAr: 'شحن مجاني للطلبات الكبيرة (+400 ج.م)', regionNameEn: 'Free Shipping (Over 400 EGP)', isFree: true }
  }
  const c = (city || '').toLowerCase()
  if (c.includes('cairo') || c.includes('قاهرة') || c.includes('giza') || c.includes('جيزة') || c.includes('قليوبية') || c.includes('benha')) {
    return { fee: 35, regionNameAr: 'القاهرة الكبرى والجيزة', regionNameEn: 'Greater Cairo & Giza', isFree: false }
  }
  if (c.includes('alex') || c.includes('إسكندرية') || c.includes('mansoura') || c.includes('دقهلية') || c.includes('tanta') || c.includes('غربية') || c.includes('zagazig') || c.includes('شرقية') || c.includes('منوفية') || c.includes('بحيرة') || c.includes('damietta') || c.includes('دمياط') || c.includes('بورسعيد') || c.includes('إسماعيلية') || c.includes('سويس')) {
    return { fee: 45, regionNameAr: 'الإسكندرية والوجه البحري ومدن القناة', regionNameEn: 'Alexandria & Delta', isFree: false }
  }
  return { fee: 55, regionNameAr: 'محافظات الصعيد وسيناء والبحر الأحمر', regionNameEn: 'Upper Egypt & Remote Areas', isFree: false }
}

/**
 * Clean Egyptian Phone Number helper
 */
export function normalizePhone(raw: string): string {
  let cleaned = raw.replace(/[\s\-\(\)]/g, '')
  if (cleaned.startsWith('+20')) {
    cleaned = '0' + cleaned.slice(3)
  } else if (cleaned.startsWith('0020')) {
    cleaned = '0' + cleaned.slice(4)
  } else if (cleaned.startsWith('20') && cleaned.length === 12) {
    cleaned = '0' + cleaned.slice(2)
  }
  return cleaned
}

export function isValidPhoneNumber(phone: string): boolean {
  const normalized = normalizePhone(phone)
  // Egyptian mobile format: 010, 011, 012, 015 followed by 8 digits (exactly 11 digits total)
  return /^(010|011|012|015)[0-9]{8}$/.test(normalized)
}

/**
 * Isolated Order Form component with bulletproof validations:
 * - Full name (must be at least 2 words / 3 chars)
 * - Egyptian mobile / WhatsApp number (starts with 010, 011, 012, 015 - 11 digits)
 * - Governorate (required)
 * - Detailed delivery address (minimum 6 characters)
 * - Real-time error & success indicators
 * - Keeps typing 100% instantaneous (60 FPS) without re-rendering parent page.
 */
export function StoreOrderForm({
  initialValues,
  subtotal = 0,
  onSubmit,
  onCancel,
  submitLabel,
  submitIcon,
  submitClassName,
}: StoreOrderFormProps) {
  const { lang, isRTL } = useLanguage()

  const [formData, setFormData] = useState<CustomerOrderData>({
    customerName: initialValues?.customerName || '',
    customerPhone: initialValues?.customerPhone || '',
    customerCity: initialValues?.customerCity || EGYPT_GOVERNORATES[0] || 'القاهرة',
    customerAddress: initialValues?.customerAddress || '',
    customerNotes: initialValues?.customerNotes || '',
    shippingFee: 0,
    itemsTotal: subtotal,
    finalTotal: subtotal,
  })

  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [attemptedSubmit, setAttemptedSubmit] = useState(false)

  // Real-time Shipping Fee Calculation
  const shippingInfo = useMemo(() => {
    return calculateShippingFee(formData.customerCity, subtotal)
  }, [formData.customerCity, subtotal])

  const shippingFee = shippingInfo.fee
  const finalTotal = (subtotal || 0) + shippingFee

  // Validation Calculations
  const errors = useMemo(() => {
    const errs: Record<string, string> = {}

    // 1. Recipient Name Validation
    const trimmedName = formData.customerName.trim()
    if (!trimmedName) {
      errs.customerName = lang === 'ar' ? 'اسم المستلم مطلوب *' : 'Recipient name is required *'
    } else if (trimmedName.length < 3) {
      errs.customerName = lang === 'ar' ? 'الاسم قصير جداً (3 أحرف على الأقل)' : 'Name is too short (min 3 chars)'
    } else {
      const words = trimmedName.split(/\s+/).filter(Boolean)
      if (words.length < 2) {
        errs.customerName = lang === 'ar'
          ? 'يرجى كتابة الاسم ثنائياً على الأقل (الاسم واسم العائلة)'
          : 'Please enter at least first and last name'
      }
    }

    // 2. Phone / WhatsApp Validation
    const rawPhone = formData.customerPhone.trim()
    if (!rawPhone) {
      errs.customerPhone = lang === 'ar' ? 'رقم الهاتف / الواتساب مطلوب *' : 'Phone / WhatsApp is required *'
    } else if (!isValidPhoneNumber(rawPhone)) {
      errs.customerPhone = lang === 'ar'
        ? 'يرجى إدخال رقم مصري صحيح (11 رقماً يبدأ بـ 010 أو 011 أو 012 أو 015)'
        : 'Please enter a valid 11-digit Egyptian phone (e.g. 01012345678)'
    }

    // 3. Governorate Validation
    if (!formData.customerCity || !formData.customerCity.trim()) {
      errs.customerCity = lang === 'ar' ? 'يرجى اختيار المحافظة *' : 'Please select governorate *'
    }

    // 4. Detailed Address Validation
    const trimmedAddress = formData.customerAddress.trim()
    if (!trimmedAddress) {
      errs.customerAddress = lang === 'ar'
        ? 'العنوان بالتفصيل مطلوب لتجهيز الشحن والتوصيل *'
        : 'Detailed address is required for delivery *'
    } else if (trimmedAddress.length < 6) {
      errs.customerAddress = lang === 'ar'
        ? 'يرجى كتابة العنوان كاملاً (المنطقة، الشارع، رقم العمارة/الشقة)'
        : 'Please specify area, street, and building/apt number'
    }

    return errs
  }, [formData, lang])

  const isValid = Object.keys(errors).length === 0

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setAttemptedSubmit(true)
    setTouched({
      customerName: true,
      customerPhone: true,
      customerCity: true,
      customerAddress: true,
    })

    if (!isValid) {
      return
    }

    onSubmit({
      ...formData,
      customerName: formData.customerName.trim(),
      customerPhone: normalizePhone(formData.customerPhone),
      customerAddress: formData.customerAddress.trim(),
      customerNotes: formData.customerNotes.trim(),
      shippingFee,
      itemsTotal: subtotal || 0,
      finalTotal,
    })
  }

  const showNameError = (touched.customerName || attemptedSubmit) && Boolean(errors.customerName)
  const showNameSuccess = (touched.customerName || attemptedSubmit) && !errors.customerName

  const showPhoneError = (touched.customerPhone || attemptedSubmit) && Boolean(errors.customerPhone)
  const showPhoneSuccess = (touched.customerPhone || attemptedSubmit) && !errors.customerPhone

  const showAddressError = (touched.customerAddress || attemptedSubmit) && Boolean(errors.customerAddress)
  const showAddressSuccess = (touched.customerAddress || attemptedSubmit) && !errors.customerAddress

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
      {/* 1. Recipient Full Name */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-foreground flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-primary" />
            <span>{lang === 'ar' ? 'اسم المستلم (ثنائي أو ثلاثي) *' : 'Recipient Name (Full Name) *'}</span>
          </label>
          {showNameSuccess && (
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>{lang === 'ar' ? 'صحيح' : 'Valid'}</span>
            </span>
          )}
        </div>

        <div className="relative">
          <input
            type="text"
            required
            value={formData.customerName}
            onChange={e => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
            onBlur={() => handleBlur('customerName')}
            placeholder={lang === 'ar' ? 'مثال: أحمد محمد علي' : 'e.g. Ahmed Mohamed Ali'}
            className={cn(
              "w-full rounded-xl border bg-background px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground transition-all focus:outline-none focus:ring-2",
              showNameError
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/20 bg-red-500/5"
                : showNameSuccess
                ? "border-emerald-500/60 focus:border-emerald-500 focus:ring-emerald-500/20"
                : "border-border focus:border-primary focus:ring-primary/20"
            )}
          />
        </div>

        {showNameError && (
          <p className="text-[11px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1 pt-0.5 animate-in fade-in">
            <AlertCircle className="h-3 w-3 shrink-0" />
            <span>{errors.customerName}</span>
          </p>
        )}
      </div>

      {/* 2. Phone / WhatsApp & Governorate Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Phone / WhatsApp */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-foreground flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-emerald-600" />
              <span>{lang === 'ar' ? 'رقم الهاتف / الواتساب *' : 'Phone / WhatsApp *'}</span>
            </label>
            {showPhoneSuccess && (
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>{lang === 'ar' ? 'رقم معتمد' : 'Valid'}</span>
              </span>
            )}
          </div>

          <div className="relative">
            <input
              type="tel"
              inputMode="numeric"
              maxLength={11}
              pattern="[0-9]{11}"
              required
              value={formData.customerPhone}
              onChange={e => {
                let cleaned = e.target.value.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
                cleaned = cleaned.replace(/^(\+20|0020|20)(1[0125]\d*)$/, '0$2')
                const digits = cleaned.replace(/[^0-9]/g, '').slice(0, 11)
                setFormData(prev => ({ ...prev, customerPhone: digits }))
              }}
              onBlur={() => handleBlur('customerPhone')}
              placeholder="01012345678"
              className={cn(
                "w-full rounded-xl border bg-background px-3 py-2.5 text-xs font-mono text-foreground placeholder:text-muted-foreground transition-all focus:outline-none focus:ring-2",
                showPhoneError
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/20 bg-red-500/5"
                  : showPhoneSuccess
                  ? "border-emerald-500/60 focus:border-emerald-500 focus:ring-emerald-500/20"
                  : "border-border focus:border-primary focus:ring-primary/20"
              )}
              dir="ltr"
            />
          </div>

          {showPhoneError ? (
            <p className="text-[11px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1 pt-0.5 animate-in fade-in">
              <AlertCircle className="h-3 w-3 shrink-0" />
              <span>{errors.customerPhone}</span>
            </p>
          ) : (
            <p className="text-[10px] text-muted-foreground font-medium pt-0.5">
              {lang === 'ar' ? 'رقم الواتساب للتواصل وتأكيد الشحن الفوري' : 'WhatsApp number for shipping confirmation'}
            </p>
          )}
        </div>

        {/* Governorate */}
        <div className="space-y-1">
          <label className="text-xs font-black text-foreground flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span>{lang === 'ar' ? 'المحافظة *' : 'Governorate *'}</span>
          </label>
          <select
            value={formData.customerCity}
            onChange={e => setFormData(prev => ({ ...prev, customerCity: e.target.value }))}
            onBlur={() => handleBlur('customerCity')}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            {EGYPT_GOVERNORATES.map((gov: string) => (
              <option key={gov} value={gov}>{gov}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Detailed Address */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-foreground flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-amber-500" />
            <span>{lang === 'ar' ? 'العنوان بالتفصيل (الحي، الشارع، رقم العمارة) *' : 'Detailed Delivery Address *'}</span>
          </label>
          {showAddressSuccess && (
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>{lang === 'ar' ? 'تم' : 'Done'}</span>
            </span>
          )}
        </div>

        <input
          type="text"
          required
          value={formData.customerAddress}
          onChange={e => setFormData(prev => ({ ...prev, customerAddress: e.target.value }))}
          onBlur={() => handleBlur('customerAddress')}
          placeholder={lang === 'ar' ? 'مثال: حي الدقي، شارع مصدق، عمارة 15، شقة 4' : 'e.g. Dokki, Mossadak St, Building 15, Apt 4'}
          className={cn(
            "w-full rounded-xl border bg-background px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground transition-all focus:outline-none focus:ring-2",
            showAddressError
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20 bg-red-500/5"
              : showAddressSuccess
              ? "border-emerald-500/60 focus:border-emerald-500 focus:ring-emerald-500/20"
              : "border-border focus:border-primary focus:ring-primary/20"
          )}
        />

        {showAddressError && (
          <p className="text-[11px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1 pt-0.5 animate-in fade-in">
            <AlertCircle className="h-3 w-3 shrink-0" />
            <span>{errors.customerAddress}</span>
          </p>
        )}
      </div>

      {/* 4. Notes (Optional) */}
      <div className="space-y-1">
        <label className="text-xs font-black text-muted-foreground flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{lang === 'ar' ? 'ملاحظات إضافية للتوصيل (اختياري):' : 'Additional Delivery Notes (Optional):'}</span>
        </label>
        <input
          type="text"
          value={formData.customerNotes}
          onChange={e => setFormData(prev => ({ ...prev, customerNotes: e.target.value }))}
          placeholder={lang === 'ar' ? 'مثال: يرجى التوصيل بعد الساعة 4 عصراً...' : 'e.g. Please deliver after 4 PM...'}
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* 5. Live Shipping Fee & Order Total Breakdown */}
      {subtotal !== undefined && subtotal > 0 && (
        <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/80 space-y-2 text-xs animate-in fade-in">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>{lang === 'ar' ? 'سعر الكتب المطلوبة:' : 'Books Subtotal:'}</span>
            <span className="font-bold text-foreground font-mono">{subtotal} ج.م</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Truck className="h-3.5 w-3.5 text-primary" />
              <span>{lang === 'ar' ? 'مصاريف الشحن والتوصيل:' : 'Shipping Fee:'}</span>
              <span className="text-[10px] text-muted-foreground/80 font-bold">
                ({lang === 'ar' ? shippingInfo.regionNameAr : shippingInfo.regionNameEn})
              </span>
            </span>
            <span className={cn("font-bold font-mono", shippingInfo.isFree ? "text-emerald-600 dark:text-emerald-400" : "text-foreground")}>
              {shippingInfo.isFree ? (lang === 'ar' ? 'مجاني 🔥' : 'FREE 🔥') : `${shippingFee} ج.م`}
            </span>
          </div>

          <div className="pt-2 border-t border-border/70 flex items-center justify-between font-black">
            <span className="text-foreground">{lang === 'ar' ? 'الإجمالي المطلوب للدفع عند الاستلام:' : 'Total Payable on Delivery:'}</span>
            <span className="text-sm font-mono text-primary font-black">{finalTotal} ج.م</span>
          </div>
        </div>
      )}

      {/* 6. Submit / Cancel Buttons */}
      <div className="space-y-2 pt-2 border-t border-border/80">
        <Button
          type="submit"
          className={submitClassName || "w-full rounded-xl font-black text-xs py-3 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25 cursor-pointer"}
        >
          {submitIcon || <MessageCircle className="h-4 w-4" />}
          <span>{submitLabel || (lang === 'ar' ? 'تأكيد وإرسال الطلب عبر واتساب 💬' : 'Confirm & Order via WhatsApp')}</span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="w-full rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted cursor-pointer"
        >
          {lang === 'ar' ? 'إلغاء' : 'Cancel'}
        </Button>
      </div>
    </form>
  )
}
