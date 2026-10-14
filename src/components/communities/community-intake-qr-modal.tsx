'use client'

import React, { useState, useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import jsQR from 'jsqr'
import Image from 'next/image'
import {
  QrCode,
  Camera,
  Copy,
  Check,
  X,
  Sparkles,
  MapPin,
  AlertCircle,
  RefreshCw,
  Upload,
  BookOpen,
  ShieldCheck,
  CheckCircle2,
  FlipHorizontal,
  ChevronRight,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/i18n/language-context'
import {
  verifyCommunityBookIntakeQr,
  generateCommunityIntakePin,
} from '@/lib/communities/community-service'
import type { CommunityShelfBook } from '@/types'

export interface CommunityIntakeQrModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'VOUCHER' | 'SCAN_AND_VERIFY'
  communityId: string
  communityName: string
  communityHubName?: string
  currentUserId?: string
  // For VOUCHER mode:
  book?: {
    id?: string
    listing_id?: string
    title: string
    author?: string
    cover_image_url?: string
    price?: number | null
    listing_type?: string
    owner_name?: string
    note?: string
  }
  intakePin?: string
  // For SCAN_AND_VERIFY mode:
  pendingBooks?: any[]
  onVerifiedSuccess?: (approvedBook: CommunityShelfBook) => void
}

export function CommunityIntakeQrModal({
  isOpen,
  onClose,
  mode,
  communityId,
  communityName,
  communityHubName,
  currentUserId,
  book,
  intakePin: initialPin,
  pendingBooks = [],
  onVerifiedSuccess,
}: CommunityIntakeQrModalProps) {
  const { lang, isRTL } = useLanguage()

  // Tab State for Scanner
  const [activeTab, setActiveTab] = useState<'CAMERA' | 'MANUAL' | 'UPLOAD' | 'LIST'>('CAMERA')
  const [manualCode, setManualCode] = useState('')
  const [copiedCode, setCopiedCode] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successResult, setSuccessResult] = useState<{
    bookTitle: string
    bookAuthor?: string
    bookCover?: string
    submitterName?: string
  } | null>(null)

  // Camera Scanner State
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')

  // Voucher QR State
  const [voucherQrUrl, setVoucherQrUrl] = useState<string>('')
  const calculatedPin =
    initialPin ||
    (book?.id ? generateCommunityIntakePin(book.id) : null) ||
    (book?.listing_id ? generateCommunityIntakePin(book.listing_id) : 'COMM-8821')

  // Generate Voucher QR
  useEffect(() => {
    if (!isOpen || mode !== 'VOUCHER' || !book) return

    const payload = {
      v: 1,
      type: 'COMMUNITY_INTAKE',
      communityId,
      communityBookId: book.id,
      listingId: book.listing_id,
      code: calculatedPin,
      title: book.title,
    }

    QRCode.toDataURL(JSON.stringify(payload), {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then(url => setVoucherQrUrl(url))
      .catch(err => console.error('Error generating QR:', err))
  }, [isOpen, mode, communityId, book, calculatedPin])

  // Audio & Haptic Feedback on Verification Success
  const triggerSuccessFeedback = () => {
    try {
      if (typeof window !== 'undefined' && 'AudioContext' in window) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
        const ctx = new AudioCtx()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12) // A5
        gain.gain.setValueAtTime(0.2, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + 0.35)
      }
    } catch {
      // Audio not supported or blocked
    }

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([80, 40, 80])
      } catch {
        // Haptics not allowed
      }
    }
  }

  // Camera Management
  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setIsCameraActive(false)
  }

  const startCamera = async () => {
    stopCamera()
    setCameraError(null)
    setErrorMessage(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
      })
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.setAttribute('playsinline', 'true')
        await videoRef.current.play()
        setIsCameraActive(true)
        scanVideoFrame()
      }
    } catch (err) {
      console.warn('Camera access failed:', err)
      setCameraError(
        lang === 'ar'
          ? 'تعذر تشغيل الكاميرا. يرجى السماح للمتصفح بالوصول أو إدخال كود التحقق يدوياً.'
          : 'Could not access camera. Please allow permissions or enter the code manually.'
      )
    }
  }

  const scanVideoFrame = () => {
    if (!videoRef.current || !canvasRef.current || !streamRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { willReadFrequently: true })

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      })

      if (qrCode && qrCode.data) {
        handleExecuteVerification(qrCode.data)
        stopCamera()
        return
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanVideoFrame)
  }

  useEffect(() => {
    if (isOpen && mode === 'SCAN_AND_VERIFY' && activeTab === 'CAMERA' && !successResult) {
      startCamera()
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [isOpen, mode, activeTab, facingMode, successResult])

  // Handle Photo/Screenshot Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setErrorMessage(null)
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0)
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const qr = jsQR(imgData.data, imgData.width, imgData.height)
          if (qr && qr.data) {
            handleExecuteVerification(qr.data)
          } else {
            setErrorMessage(
              lang === 'ar'
                ? 'لم يتم العثور على رمز QR واضح في الصورة. يرجى تجربة صورة أوضح أو إدخال الكود يدوياً.'
                : 'No clear QR code detected in the image. Please try a clearer screenshot or enter the code.'
            )
          }
        }
      }
      img.src = ev.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  // Execute verification
  const handleExecuteVerification = async (codeOrPayload: string) => {
    if (!currentUserId) return
    setIsVerifying(true)
    setErrorMessage(null)

    try {
      const result = await verifyCommunityBookIntakeQr({
        communityId,
        adminId: currentUserId,
        inputCodeOrPayload: codeOrPayload,
      })

      if (result.success && result.book) {
        triggerSuccessFeedback()
        setSuccessResult({
          bookTitle: result.book.title,
          bookAuthor: result.book.author,
          bookCover: result.book.cover_image_url,
          submitterName: result.book.owner_name,
        })
        if (onVerifiedSuccess) {
          onVerifiedSuccess(result.book)
        }
      } else {
        setErrorMessage(lang === 'ar' ? result.messageAr : result.messageEn)
      }
    } catch (err: any) {
      setErrorMessage(
        err?.message || (lang === 'ar' ? 'حدث خطأ أثناء التحقق' : 'Verification failed')
      )
    } finally {
      setIsVerifying(false)
    }
  }

  const handleCopyCode = () => {
    if (calculatedPin) {
      navigator.clipboard.writeText(calculatedPin)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2500)
    }
  }

  const handleResetScanner = () => {
    setSuccessResult(null)
    setErrorMessage(null)
    setManualCode('')
    setActiveTab('CAMERA')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl bg-card border-2 border-border shadow-2xl overflow-hidden text-foreground">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border bg-muted/30 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-foreground">
                {mode === 'VOUCHER'
                  ? lang === 'ar'
                    ? 'إيصال تسليم كتاب لرف المجتمع'
                    : 'Community Book Drop-off Voucher'
                  : lang === 'ar'
                    ? 'اعتماد واستلام كتاب عبر رمز QR'
                    : 'Accept Book via QR Intake'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {communityHubName || communityName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-center">
          {/* ============================================================== */}
          {/* MODE 1: VOUCHER (FOR MEMBER SUBMISSION) */}
          {/* ============================================================== */}
          {mode === 'VOUCHER' && book && (
            <div className="space-y-5">
              {/* Book Summary Card */}
              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-muted/40 border border-border/70 text-start">
                <div className="relative h-16 w-12 rounded-xl overflow-hidden bg-muted border border-border/80 shrink-0">
                  {book.cover_image_url ? (
                    <Image src={book.cover_image_url} alt="" fill className="object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs">📖</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-foreground truncate">{book.title}</h4>
                    {book.listing_type && (
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {book.listing_type}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{book.author}</p>
                  <p className="text-[11px] text-emerald-600 font-bold mt-0.5">
                    {lang === 'ar' ? 'الحالة: بانتظار التسليم الفعلي بالفرع' : 'Status: Awaiting physical drop-off'}
                  </p>
                </div>
              </div>

              {/* QR Code Canvas Card */}
              <div className="p-5 rounded-3xl bg-white border-2 border-emerald-500/30 shadow-lg inline-block mx-auto">
                {voucherQrUrl ? (
                  <div className="relative">
                    <img
                      src={voucherQrUrl}
                      alt="Community Intake QR"
                      className="w-56 h-56 mx-auto rounded-xl"
                    />
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="p-2 rounded-xl bg-white/95 shadow-md border border-emerald-500/40">
                        <BookOpen className="h-6 w-6 text-emerald-600" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center text-xs text-muted-foreground">
                    <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
                  </div>
                )}
              </div>

              {/* Manual Verification Code */}
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-muted-foreground">
                  {lang === 'ar' ? 'كود التحقق اليدوي البديل للإيداع:' : 'Manual Intake PIN Code:'}
                </p>
                <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-muted/60 border border-border">
                  <span className="font-mono text-2xl font-black tracking-widest text-emerald-600">
                    {calculatedPin}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="p-1.5 rounded-xl hover:bg-background text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                    title={lang === 'ar' ? 'نسخ الكود' : 'Copy code'}
                  >
                    {copiedCode ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Instructions Box */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-start space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-black text-emerald-700 dark:text-emerald-400">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span>{lang === 'ar' ? 'خطوات اعتماد كتابك على الرف:' : 'How to activate your book:'}</span>
                </div>
                <ul className="text-muted-foreground text-[11px] space-y-1.5 list-disc list-inside leading-relaxed">
                  <li>
                    {lang === 'ar'
                      ? `توجه إلى نقطة لقاء المجتمع "${communityHubName || 'الفرع المحدد'}".`
                      : `Visit the community hub "${communityHubName || 'Designated branch'}".`}
                  </li>
                  <li>
                    {lang === 'ar'
                      ? 'سلّم النسخة الورقية للمسؤول في النقطة.'
                      : 'Hand the physical book to the community custodian/admin.'}
                  </li>
                  <li>
                    {lang === 'ar'
                      ? 'أظهر له هذا الرمز أو كود التحقق ليمسحه بالكاميرا فوراً.'
                      : 'Present this QR code or PIN code for instant scanning.'}
                  </li>
                  <li>
                    {lang === 'ar'
                      ? 'سيظهر كتابك مباشرة على رف المجتمع ليتمكن باقي الأعضاء من طلبه!'
                      : 'Your book goes live immediately on the community bookshelf!'}
                  </li>
                </ul>
              </div>

              <Button
                onClick={onClose}
                className="w-full rounded-2xl font-black text-xs py-5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-md shadow-emerald-600/20"
              >
                {lang === 'ar' ? 'حسناً، فهمت (إغلاق)' : 'Got it (Close)'}
              </Button>
            </div>
          )}

          {/* ============================================================== */}
          {/* MODE 2: SCAN AND VERIFY (FOR ADMIN ACCEPTANCE) */}
          {/* ============================================================== */}
          {mode === 'SCAN_AND_VERIFY' && (
            <div className="space-y-4">
              {/* Success Result Screen */}
              {successResult ? (
                <div className="space-y-5 py-4 animate-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-600 animate-bounce">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-lg font-black text-foreground">
                      {lang === 'ar' ? 'تم اعتماد واستلام الكتاب بنجاح! 📚🎉' : 'Book Approved & Received! 📚🎉'}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {lang === 'ar'
                        ? 'تم إضافة الكتاب رسمياً إلى رف المجتمع وأصبح متاحاً للأعضاء الآن.'
                        : 'Book is now officially listed on the community shelf for members.'}
                    </p>
                  </div>

                  {/* Book Card */}
                  <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-start max-w-sm mx-auto">
                    <div className="relative h-16 w-12 rounded-xl overflow-hidden bg-muted border border-border/80 shrink-0">
                      {successResult.bookCover ? (
                        <Image src={successResult.bookCover} alt="" fill className="object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-xs">📖</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-black text-foreground truncate">
                        {successResult.bookTitle}
                      </h4>
                      {successResult.bookAuthor && (
                        <p className="text-xs text-muted-foreground truncate">{successResult.bookAuthor}</p>
                      )}
                      {successResult.submitterName && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {lang === 'ar' ? 'مقدم من:' : 'From:'}{' '}
                          <span className="font-bold text-foreground">{successResult.submitterName}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={handleResetScanner}
                      className="flex-1 rounded-2xl font-bold text-xs py-5 cursor-pointer"
                    >
                      <Camera className="h-4 w-4 me-1.5" />
                      <span>{lang === 'ar' ? 'مسح كتاب آخر' : 'Scan Another Book'}</span>
                    </Button>
                    <Button
                      onClick={onClose}
                      className="flex-1 rounded-2xl font-black text-xs py-5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-md shadow-emerald-600/20"
                    >
                      {lang === 'ar' ? 'عرض الرف' : 'View Shelf'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Tabs */}
                  <div className="flex items-center rounded-2xl bg-muted/60 p-1 border border-border/60">
                    <button
                      onClick={() => {
                        setActiveTab('CAMERA')
                        setErrorMessage(null)
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        activeTab === 'CAMERA'
                          ? 'bg-card text-emerald-600 shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Camera className="h-3.5 w-3.5" />
                      <span>{lang === 'ar' ? 'الكاميرا' : 'Camera'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('MANUAL')
                        setErrorMessage(null)
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        activeTab === 'MANUAL'
                          ? 'bg-card text-emerald-600 shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <span className="font-mono">#</span>
                      <span>{lang === 'ar' ? 'كود التحقق' : 'Enter PIN'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('UPLOAD')
                        setErrorMessage(null)
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        activeTab === 'UPLOAD'
                          ? 'bg-card text-emerald-600 shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>{lang === 'ar' ? 'رفع صورة' : 'Upload'}</span>
                    </button>
                    {pendingBooks.length > 0 && (
                      <button
                        onClick={() => {
                          setActiveTab('LIST')
                          setErrorMessage(null)
                        }}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          activeTab === 'LIST'
                            ? 'bg-card text-emerald-600 shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>({pendingBooks.length})</span>
                      </button>
                    )}
                  </div>

                  {/* Error Notification */}
                  {errorMessage && (
                    <div className="flex items-center gap-2 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 text-start text-xs">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <p className="leading-snug">{errorMessage}</p>
                    </div>
                  )}

                  {/* Tab 1: Live Camera Scanner */}
                  {activeTab === 'CAMERA' && (
                    <div className="space-y-3">
                      <div className="relative w-full aspect-square max-w-[300px] mx-auto rounded-3xl overflow-hidden bg-black border-2 border-emerald-500/40 shadow-inner flex items-center justify-center">
                        <video
                          ref={videoRef}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                        />
                        <canvas ref={canvasRef} className="hidden" />

                        {/* Viewfinder Overlay */}
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                          <div className="w-52 h-52 border-2 border-dashed border-emerald-400 rounded-2xl relative animate-pulse">
                            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-500" />
                            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-500" />
                            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-500" />
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-500" />
                            {/* Scanning Beam */}
                            <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent top-1/2 -translate-y-1/2 shadow-sm shadow-emerald-400 animate-bounce" />
                          </div>
                        </div>

                        {/* Camera Flip Button */}
                        <button
                          type="button"
                          onClick={() =>
                            setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'))
                          }
                          className="absolute bottom-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm cursor-pointer"
                          title={lang === 'ar' ? 'تبديل الكاميرا' : 'Switch camera'}
                        >
                          <FlipHorizontal className="h-4 w-4" />
                        </button>
                      </div>

                      {cameraError ? (
                        <p className="text-xs text-red-500 leading-snug">{cameraError}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {lang === 'ar'
                            ? 'وجّه الكاميرا نحو رمز QR على هاتف القارئ للاعتماد الفوري'
                            : 'Point camera at the reader’s QR code to verify instantly'}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Tab 2: Manual Code Input */}
                  {activeTab === 'MANUAL' && (
                    <div className="space-y-4 py-2">
                      <p className="text-xs text-muted-foreground">
                        {lang === 'ar'
                          ? 'أدخل رمز التحقق المكون من 6 أرقام وحروف الظاهر على شاشة القارئ (مثال: COMM-XXXX)'
                          : 'Enter the 6-character verification code shown on the reader’s screen (e.g. COMM-XXXX)'}
                      </p>

                      <div className="max-w-xs mx-auto">
                        <input
                          type="text"
                          value={manualCode}
                          onChange={e => setManualCode(e.target.value.toUpperCase())}
                          placeholder="COMM-8821"
                          maxLength={12}
                          className="w-full text-center text-xl font-mono font-black tracking-widest uppercase rounded-2xl border-2 border-emerald-500/50 bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <Button
                        disabled={!manualCode.trim() || isVerifying}
                        loading={isVerifying}
                        onClick={() => handleExecuteVerification(manualCode)}
                        className="w-full max-w-xs mx-auto rounded-2xl font-black text-xs py-5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-md shadow-emerald-600/20"
                      >
                        <Check className="h-4 w-4 me-1.5" />
                        <span>{lang === 'ar' ? 'تحقق واعتماد الكتاب للرف' : 'Verify & Approve'}</span>
                      </Button>
                    </div>
                  )}

                  {/* Tab 3: Upload Image */}
                  {activeTab === 'UPLOAD' && (
                    <div className="space-y-4 py-3">
                      <p className="text-xs text-muted-foreground">
                        {lang === 'ar'
                          ? 'إذا أرسل لك القارئ لقطة شاشة لرمز الـ QR، يمكنك رفعها هنا لقراءتها:'
                          : 'Upload a screenshot of the reader’s intake QR code to verify:'}
                      </p>

                      <label className="flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-dashed border-emerald-500/40 bg-muted/20 hover:bg-muted/40 cursor-pointer transition-all">
                        <Upload className="h-8 w-8 text-emerald-600 mb-2" />
                        <span className="text-xs font-black text-foreground">
                          {lang === 'ar' ? 'اختر صورة الـ QR من جهازك' : 'Choose QR image'}
                        </span>
                        <span className="text-[10px] text-muted-foreground mt-1">PNG, JPG, WebP</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}

                  {/* Tab 4: Direct Select from Pending Books */}
                  {activeTab === 'LIST' && (
                    <div className="space-y-2 text-start max-h-64 overflow-y-auto">
                      <p className="text-xs text-muted-foreground mb-2 text-center">
                        {lang === 'ar'
                          ? 'أو اختر كتاباً معلقاً لاعتماده واستلامه مباشرة:'
                          : 'Or select a pending book to verify and approve directly:'}
                      </p>
                      {pendingBooks.map(item => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-muted/40 border border-border/70 hover:border-emerald-500/40 transition-all"
                        >
                          <div className="min-w-0 flex-1">
                            <h5 className="text-xs font-black text-foreground truncate">{item.title}</h5>
                            <p className="text-[11px] text-muted-foreground truncate">{item.author}</p>
                            <span className="font-mono text-[10px] text-emerald-600 font-bold">
                              {generateCommunityIntakePin(item.id)}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            disabled={isVerifying}
                            loading={isVerifying}
                            onClick={() => handleExecuteVerification(item.id)}
                            className="text-[11px] font-black rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5 me-1" />
                            <span>{lang === 'ar' ? 'اعتماد' : 'Approve'}</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
