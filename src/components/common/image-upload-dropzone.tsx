'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import {
  UploadCloud,
  X,
  Loader2,
  Link2,
  Sparkles,
  Image as ImageIcon,
  Check,
  RefreshCw,
  ExternalLink,
} from 'lucide-react'
import { uploadCommunityImage } from '@/lib/storage/upload-helper'
import { cn } from '@/lib/utils'

interface ImageUploadDropzoneProps {
  label: string
  description?: string
  value: string
  onChange: (url: string) => void
  folder: 'covers' | 'logos' | 'hubs' | 'general'
  aspectRatio?: 'banner' | 'square' | 'photo'
  userId?: string | null
  presetOptions?: Array<{ label: string; url: string }>
  lang?: string
  required?: boolean
  className?: string
}

export function ImageUploadDropzone({
  label,
  description,
  value,
  onChange,
  folder,
  aspectRatio = 'banner',
  userId,
  presetOptions = [],
  lang = 'ar',
  required = false,
  className,
}: ImageUploadDropzoneProps) {
  const isRTL = lang === 'ar'
  const fileInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [manualUrl, setManualUrl] = useState('')
  const [imageError, setImageError] = useState(false)

  // Reset image error state when value changes
  useEffect(() => {
    setImageError(false)
  }, [value])

  const handleFileProcess = useCallback(
    async (file: File) => {
      setErrorMessage(null)
      setIsUploading(true)
      try {
        const res = await uploadCommunityImage(file, folder, userId)
        if (res.error) {
          setErrorMessage(res.error)
        } else if (res.url) {
          onChange(res.url)
        }
      } catch {
        setErrorMessage(
          isRTL ? 'تعذر رفع ومعالجة الصورة، يرجى المحاولة ثانية' : 'Failed to upload image'
        )
      } finally {
        setIsUploading(false)
      }
    },
    [folder, userId, onChange, isRTL]
  )

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileProcess(file)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileProcess(file)
    }
    if (e.target) e.target.value = ''
  }

  // Support Ctrl+V paste on container
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile()
          if (file) {
            e.preventDefault()
            handleFileProcess(file)
            return
          }
        }
      }
    },
    [handleFileProcess]
  )

  const handleApplyManualUrl = () => {
    if (manualUrl.trim()) {
      onChange(manualUrl.trim())
      setManualUrl('')
      setShowUrlInput(false)
    }
  }

  const handleClear = () => {
    onChange('')
    setErrorMessage(null)
    setImageError(false)
  }

  // Dimension classes based on aspectRatio
  const previewClass =
    aspectRatio === 'square'
      ? 'w-24 h-24 sm:w-28 sm:h-28 rounded-2xl'
      : aspectRatio === 'photo'
      ? 'w-full h-44 rounded-2xl'
      : 'w-full h-36 sm:h-44 rounded-2xl'

  const isExternalOrData =
    value.startsWith('data:') ||
    value.startsWith('blob:') ||
    (!value.includes('supabase.co') && !value.includes('unsplash.com'))

  return (
    <div
      ref={containerRef}
      onPaste={handlePaste}
      tabIndex={0}
      className={cn('space-y-2 outline-none', className)}
    >
      {/* Label & helper text */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-black text-foreground flex items-center gap-1">
          <span>{label}</span>
          {required && <span className="text-red-500">*</span>}
        </label>
        <button
          type="button"
          onClick={() => setShowUrlInput(prev => !prev)}
          className="text-[11px] font-bold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
        >
          <Link2 className="h-3 w-3" />
          <span>
            {showUrlInput
              ? isRTL
                ? 'إخفاء الرابط'
                : 'Hide URL'
              : isRTL
              ? 'إدخال رابط مباشر'
              : 'Paste URL'}
          </span>
        </button>
      </div>

      {description && <p className="text-[11px] text-muted-foreground">{description}</p>}

      {/* Manual URL input fallback if opened */}
      {showUrlInput && (
        <div className="flex gap-2 p-2.5 rounded-xl border border-border/80 bg-muted/20 animate-in fade-in duration-200">
          <input
            type="url"
            value={manualUrl}
            onChange={e => setManualUrl(e.target.value)}
            placeholder={isRTL ? 'https://example.com/image.jpg' : 'https://example.com/image.jpg'}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="button"
            onClick={handleApplyManualUrl}
            disabled={!manualUrl.trim()}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
          >
            {isRTL ? 'تطبيق' : 'Apply'}
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Display: Image preview OR dropzone */}
      {value ? (
        <div className="relative group border-2 border-border/80 rounded-2xl overflow-hidden bg-muted/30 p-2 space-y-2">
          <div className={cn('relative overflow-hidden bg-muted/60 mx-auto shadow-inner', previewClass)}>
            {!imageError ? (
              <Image
                src={value}
                alt={label}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 500px"
                unoptimized={isExternalOrData}
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center gap-1 text-muted-foreground p-2 text-center text-xs">
                <ImageIcon className="h-6 w-6 text-muted-foreground/60" />
                <span className="text-[10px]">
                  {isRTL ? 'تعذر تحميل معاينة الصورة' : 'Preview unavailable'}
                </span>
              </div>
            )}

            {/* Hover desktop overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white text-zinc-900 font-black text-[11px] shadow-sm flex items-center gap-1 cursor-pointer transition active:scale-95"
              >
                <UploadCloud className="h-3.5 w-3.5 text-primary" />
                <span>{isRTL ? 'استبدال' : 'Change'}</span>
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-1.5 rounded-xl bg-red-600/90 hover:bg-red-600 text-white font-black text-[11px] shadow-sm flex items-center gap-1 cursor-pointer transition active:scale-95"
              >
                <X className="h-3.5 w-3.5" />
                <span>{isRTL ? 'حذف' : 'Remove'}</span>
              </button>
            </div>
          </div>

          {/* Accessible buttons & status below preview */}
          <div className="flex items-center justify-between px-1 text-[11px] text-muted-foreground pt-1 border-t border-border/40">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
              <Check className="h-3.5 w-3.5 shrink-0" />
              <span>{isRTL ? 'تم تعيين الصورة بنجاح' : 'Image ready'}</span>
            </span>

            <div className="flex items-center gap-2 font-bold">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="text-primary hover:underline cursor-pointer flex items-center gap-0.5"
              >
                <RefreshCw className="h-3 w-3" />
                <span>{isRTL ? 'تغيير' : 'Change'}</span>
              </button>
              <span className="text-muted-foreground/40">•</span>
              <button
                type="button"
                onClick={handleClear}
                className="text-red-500 hover:underline cursor-pointer"
              >
                {isRTL ? 'إزالة' : 'Clear'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={e => {
            e.preventDefault()
            setIsDragOver(true)
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-2xl p-4 sm:p-5 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2.5',
            isDragOver
              ? 'border-primary bg-primary/10 scale-[0.99] shadow-sm'
              : 'border-border/80 hover:border-primary/60 hover:bg-muted/30 bg-muted/10',
            isUploading && 'pointer-events-none opacity-75'
          )}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <Loader2 className="h-7 w-7 text-primary animate-spin" />
              <span className="text-xs font-bold text-foreground">
                {isRTL ? 'جاري رفع ومعالجة وضغط الصورة...' : 'Uploading and optimizing image...'}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {isRTL ? 'يتم حفظ الصورة تلقائياً' : 'Saving photo to storage...'}
              </span>
            </div>
          ) : (
            <>
              <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
                {aspectRatio === 'square' ? (
                  <ImageIcon className="h-5 w-5" />
                ) : (
                  <UploadCloud className="h-5 w-5" />
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black text-foreground">
                  {isRTL
                    ? 'اضغط لاختيار صورة من جهازك، أو اسحبها هنا'
                    : 'Click to upload or drag & drop'}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {isRTL
                    ? 'PNG, JPG, WEBP — يدعم اللصق المباشر (Ctrl+V)'
                    : 'PNG, JPG, WEBP — Supports direct paste (Ctrl+V)'}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Error message */}
      {errorMessage && (
        <p className="text-[11px] font-bold text-red-500 flex items-center gap-1 pt-1">
          <X className="h-3 w-3 shrink-0" />
          <span>{errorMessage}</span>
        </p>
      )}

      {/* Presets quick-picker if provided */}
      {presetOptions.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-amber-500" />
            <span>
              {isRTL ? 'أو اختر من النماذج الجاهزة:' : 'Or pick from curated templates:'}
            </span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {presetOptions.map((preset, idx) => {
              const isSelected = value === preset.url
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onChange(preset.url)}
                  className={cn(
                    'px-2.5 py-1 rounded-xl border text-[11px] font-bold transition cursor-pointer flex items-center gap-1',
                    isSelected
                      ? 'border-primary bg-primary/15 text-primary shadow-xs'
                      : 'border-border bg-card hover:border-primary/50 text-foreground hover:text-primary'
                  )}
                >
                  {isSelected && <Check className="h-3 w-3 text-primary" />}
                  <span>{preset.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

