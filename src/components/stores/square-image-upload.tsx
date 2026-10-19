'use client'

import React, { useState, useRef, useCallback } from 'react'
import {
  UploadCloud,
  ImageIcon,
  Sparkles,
  Check,
  RefreshCw,
  Trash2,
  Loader2,
  Link2,
  AlertCircle,
  FileCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn, COVER_PLACEHOLDER, IMG_NOT_FOUND_PLACEHOLDER } from '@/lib/utils'
import { compressImageFile } from '@/lib/image-utils'
import { uploadCommunityImage } from '@/lib/storage/upload-helper'

export interface CompressionStats {
  origKb: number
  compKb: number
  savedPct: number
}

export interface SquareImageUploadProps {
  label: string
  subLabel?: string
  value?: string
  onChange: (url: string) => void
  onRemove?: () => void
  folder: 'logos' | 'covers'
  userId?: string | null
  targetSize?: { maxWidth: number; maxHeight: number }
  theme?: 'primary' | 'emerald' | 'amber' | 'violet'
  tagText?: string
  resolutionHint?: string
  presets?: string[]
  lang?: 'ar' | 'en'
  required?: boolean
  className?: string
}

export function SquareImageUpload({
  label,
  subLabel,
  value,
  onChange,
  onRemove,
  folder,
  userId,
  targetSize = folder === 'logos' ? { maxWidth: 600, maxHeight: 600 } : { maxWidth: 1200, maxHeight: 1200 },
  theme = folder === 'logos' ? 'primary' : 'emerald',
  tagText,
  resolutionHint = folder === 'logos' ? '1:1 Square (400×400+)' : '1:1 Square (800×800+)',
  presets,
  lang = 'ar',
  required = false,
  className,
}: SquareImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const [stats, setStats] = useState<CompressionStats | null>(null)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [directUrl, setDirectUrl] = useState('')
  const [urlError, setUrlError] = useState('')
  const [hasImgError, setHasImgError] = useState(false)

  React.useEffect(() => {
    setHasImgError(false)
  }, [value])

  // Process and compress image file
  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert(lang === 'ar' ? 'يرجى اختيار ملف صورة صالح (PNG, JPG, WebP)' : 'Please select a valid image file')
      return
    }

    setIsCompressing(true)
    setStats(null)

    try {
      const origSize = file.size
      const compressed = await compressImageFile(file, {
        maxWidth: targetSize.maxWidth,
        maxHeight: targetSize.maxHeight,
        quality: 0.85,
        format: 'image/webp',
      })

      const origKb = Math.round(origSize / 1024)
      const compKb = Math.round(compressed.sizeBytes / 1024)
      const savedPct = Math.max(0, Math.round((1 - compressed.sizeBytes / origSize) * 100))
      setStats({ origKb, compKb, savedPct })

      // Upload with storage fallback
      const uploadRes = await uploadCommunityImage(compressed.file, folder, userId)
      if (uploadRes.url) {
        onChange(uploadRes.url)
      } else if (compressed.dataUrl) {
        onChange(compressed.dataUrl)
      }
    } catch (err) {
      console.error('Image compression error:', err)
      alert(lang === 'ar' ? 'حدث خطأ أثناء ضغط الصورة، يرجى المحاولة مجدداً' : 'Failed to compress image')
    } finally {
      setIsCompressing(false)
    }
  }, [folder, lang, onChange, targetSize.maxHeight, targetSize.maxWidth, userId])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
    // reset input value so re-uploading the same file works
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isDragging) setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault()
    if (!directUrl.trim()) return
    if (!/^https?:\/\//i.test(directUrl.trim())) {
      setUrlError(lang === 'ar' ? 'الرابط يجب أن يبدأ بـ http:// أو https://' : 'URL must start with http:// or https://')
      return
    }
    setUrlError('')
    onChange(directUrl.trim())
    setStats(null)
    setShowUrlInput(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onRemove) {
      onRemove()
    } else {
      onChange('')
    }
    setStats(null)
  }

  // Color theme variations
  const isEmerald = theme === 'emerald'
  const isPrimary = theme === 'primary'

  return (
    <div className={cn("space-y-3 w-full", className)}>
      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Main Square Catchy Card (1:1 Ratio) */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!isCompressing) {
            fileInputRef.current?.click()
          }
        }}
        className={cn(
          "group relative aspect-square w-full rounded-3xl border-2 transition-all duration-300 overflow-hidden cursor-pointer select-none",
          "flex flex-col items-center justify-center p-4 text-center",
          // Dragging state
          isDragging
            ? "border-primary bg-primary/15 ring-4 ring-primary/25 scale-[1.02] shadow-2xl"
            : value
              ? "border-primary/40 bg-card hover:border-primary hover:shadow-xl hover:shadow-primary/10"
              : isEmerald
                ? "border-emerald-500/30 hover:border-emerald-500/80 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-card hover:shadow-xl hover:shadow-emerald-500/10"
                : "border-primary/30 hover:border-primary/80 bg-gradient-to-br from-primary/5 via-indigo-500/5 to-card hover:shadow-xl hover:shadow-primary/10"
        )}
      >
        {/* COMPRESSING STATE */}
        {isCompressing ? (
          <div className="relative z-10 flex flex-col items-center justify-center gap-3 p-4 animate-in fade-in zoom-in-95">
            <div className="relative flex items-center justify-center">
              <div className={cn(
                "h-16 w-16 rounded-full border-4 border-t-transparent animate-spin",
                isEmerald ? "border-emerald-500" : "border-primary"
              )} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className={cn("h-7 w-7 animate-spin", isEmerald ? "text-emerald-500" : "text-primary")} />
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-black text-foreground block">
                {lang === 'ar' ? 'جاري ضغط ومعالجة الصورة...' : 'Compressing image WebP...'}
              </span>
              <span className="text-[10px] text-muted-foreground block">
                {lang === 'ar' ? 'تحسين الأبعاد وتقليل الحجم فائق السرعة' : 'Optimizing dimensions & byte size'}
              </span>
            </div>
            <Badge variant="outline" className="bg-background/80 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] border-emerald-500/30 gap-1 shadow-xs">
              <Sparkles className="h-3 w-3" />
              <span>⚡ WebP Engine</span>
            </Badge>
          </div>
        ) : value ? (
          /* FILLED STATE (Crisp 1:1 Preview) */
          <>
            {/* Background Full Square Image with Placeholder & Error Fallback */}
            <img
              src={hasImgError ? IMG_NOT_FOUND_PLACEHOLDER : (value || (folder === 'covers' ? COVER_PLACEHOLDER : IMG_NOT_FOUND_PLACEHOLDER))}
              alt={label}
              onError={() => setHasImgError(true)}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Cinematic Gradient Vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/50 opacity-80 group-hover:opacity-90 transition-opacity" />

            {/* Top Floating Badges */}
            <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10">
              <Badge className={cn(
                "font-black text-[10px] gap-1 shadow-md backdrop-blur-md border border-white/20 text-white",
                hasImgError ? "bg-rose-600/90" : isEmerald ? "bg-emerald-600/90" : "bg-primary/90"
              )}>
                {hasImgError ? <AlertCircle className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                <span>{hasImgError ? (lang === 'ar' ? 'الصورة غير متوفرة' : 'Image Not Found') : (tagText || label)}</span>
              </Badge>

              {hasImgError ? (
                <Badge variant="outline" className="bg-rose-950/80 text-rose-300 border-rose-400/30 font-mono text-[9px] backdrop-blur-md">
                  Fallback Placeholder
                </Badge>
              ) : stats ? (
                <Badge variant="outline" className="bg-black/75 text-emerald-300 border-emerald-400/30 font-mono text-[9px] font-bold backdrop-blur-md">
                  -{stats.savedPct}% ({stats.compKb} KB)
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-black/60 text-white/90 border-white/20 font-mono text-[9px] backdrop-blur-md">
                  1:1 Square
                </Badge>
              )}
            </div>

            {/* Center Interactive Buttons Overlay */}
            <div className="relative z-10 flex flex-col items-center gap-2 transition-transform duration-300 group-hover:scale-105">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    fileInputRef.current?.click()
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-white/25 hover:bg-white/35 backdrop-blur-md border border-white/40 text-white text-xs font-black shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-emerald-300" />
                  <span>{lang === 'ar' ? 'تغيير الصورة' : 'Change Image'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleClear}
                  title={lang === 'ar' ? 'حذف الصورة' : 'Remove Image'}
                  className="h-8 w-8 rounded-xl bg-rose-500/80 hover:bg-rose-600 backdrop-blur-md border border-rose-300/40 text-white flex items-center justify-center shadow-lg transition-all cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <span className="text-[10px] text-white/90 font-bold drop-shadow-sm">
                {lang === 'ar' ? 'انقر للاستبدال أو اسحب صورة جديدة' : 'Click to replace or drop new file'}
              </span>
            </div>

            {/* Bottom Specs Bar */}
            <div className="absolute bottom-2.5 inset-x-3 flex items-center justify-between text-[9px] text-white/75 font-mono z-10">
              <span>{resolutionHint}</span>
              <span className="font-bold text-emerald-300">⚡ WebP Ready</span>
            </div>
          </>
        ) : (
          /* EMPTY STATE (Eye-Catching, Modern Square) */
          <div className="relative z-10 flex flex-col items-center justify-center gap-2.5 p-3">
            {/* Top Tag */}
            <span className={cn(
              "text-[10px] font-black px-2.5 py-0.5 rounded-full border shadow-2xs mb-1",
              isEmerald
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                : "bg-primary/10 text-primary border-primary/20"
            )}>
              {tagText || (folder === 'logos' ? (lang === 'ar' ? '✨ شعار المتجر (1:1)' : '✨ Store Logo (1:1)') : (lang === 'ar' ? '🎨 غلاف المتجر (1:1)' : '🎨 Store Cover (1:1)'))}
            </span>

            {/* Animated Icon Orb */}
            <div className={cn(
              "relative h-16 w-16 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md",
              "group-hover:scale-110 group-hover:rotate-1",
              isEmerald
                ? "bg-gradient-to-tr from-emerald-500/20 via-teal-500/15 to-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                : "bg-gradient-to-tr from-primary/20 via-indigo-500/15 to-primary/10 text-primary border border-primary/30"
            )}>
              {folder === 'logos' ? (
                <UploadCloud className="h-8 w-8" />
              ) : (
                <ImageIcon className="h-8 w-8" />
              )}
              {/* Pulsing indicator */}
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className={cn(
                  "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                  isEmerald ? "bg-emerald-400" : "bg-primary"
                )} />
                <span className={cn(
                  "relative inline-flex rounded-full h-3 w-3",
                  isEmerald ? "bg-emerald-500" : "bg-primary"
                )} />
              </span>
            </div>

            {/* Labels */}
            <div className="space-y-1">
              <span className="font-black text-xs sm:text-sm text-foreground block">
                {label} {required && <span className="text-rose-500">*</span>}
              </span>
              <p className="text-[11px] text-muted-foreground leading-snug max-w-[220px] mx-auto">
                {subLabel || (lang === 'ar' ? 'اسحب الصورة وأفلتها هنا، أو اضغط للاختيار' : 'Drag & drop image here, or click to browse')}
              </p>
            </div>

            {/* Action pill */}
            <div className="mt-1 flex items-center gap-1.5">
              <span className={cn(
                "text-[10px] font-black px-3 py-1 rounded-xl shadow-xs transition-colors",
                isEmerald
                  ? "bg-emerald-600 text-white group-hover:bg-emerald-700"
                  : "bg-primary text-primary-foreground group-hover:opacity-90"
              )}>
                {lang === 'ar' ? 'رفع وضغط تلقائي WebP' : 'Upload & Auto Compress'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Direct URL Toggle / Input */}
      <div className="pt-1">
        {!showUrlInput ? (
          <button
            type="button"
            onClick={() => setShowUrlInput(true)}
            className="text-[11px] font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Link2 className="h-3 w-3" />
            <span>{lang === 'ar' ? 'أو أدخل رابطاً مباشراً للصورة 🔗' : 'Or paste a direct image URL 🔗'}</span>
          </button>
        ) : (
          <form onSubmit={handleApplyUrl} className="space-y-1.5 animate-in fade-in">
            <div className="flex items-center gap-1.5">
              <input
                type="url"
                value={directUrl}
                onChange={e => {
                  setDirectUrl(e.target.value)
                  setUrlError('')
                }}
                placeholder="https://images.unsplash.com/... (WebP / PNG)"
                className="flex-1 rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono text-[11px]"
                dir="ltr"
              />
              <Button type="submit" size="sm" className="h-8 rounded-xl text-xs font-bold px-3">
                {lang === 'ar' ? 'تطبيق' : 'Apply'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowUrlInput(false)
                  setUrlError('')
                }}
                className="h-8 text-xs font-bold text-muted-foreground rounded-xl"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
            </div>
            {urlError && (
              <span className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                <span>{urlError}</span>
              </span>
            )}
          </form>
        )}
      </div>

      {/* Optional Preset Covers Strip */}
      {presets && presets.length > 0 && (
        <div className="pt-2 border-t border-border/50 space-y-1.5">
          <span className="text-[10px] font-bold text-muted-foreground block">
            {lang === 'ar' ? 'أو اختر من النماذج الجاهزة:' : 'Or choose from presets:'}
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {presets.map((url, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  onChange(url)
                  setStats(null)
                }}
                className={cn(
                  "h-11 w-11 rounded-xl overflow-hidden border-2 shrink-0 cursor-pointer transition-all hover:scale-105 shadow-xs relative",
                  value === url
                    ? "border-primary ring-2 ring-primary/40 scale-105"
                    : "border-border/80 hover:border-primary/50"
                )}
                title={lang === 'ar' ? `نموذج ${i + 1}` : `Preset ${i + 1}`}
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
                {value === url && (
                  <div className="absolute inset-0 bg-primary/40 flex items-center justify-center text-white">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
