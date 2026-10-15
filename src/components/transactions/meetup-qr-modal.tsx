'use client'

import React, { useState, useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import jsQR from 'jsqr'
import {
  QrCode,
  Camera,
  Copy,
  Check,
  X,
  Sparkles,
  MapPin,
  Clock,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Upload,
  ArrowRightLeft,
  BookOpen,
  ShoppingBag,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/i18n/language-context'
import {
  generateMeetupVerificationCode,
  verifyMeetupHandover,
  MeetupQrPayload,
} from '@/lib/transactions/lifecycle'

interface MeetupQrModalProps {
  isOpen: boolean
  onClose: () => void
  transactionId?: string
  swapId?: string
  bookTitle: string
  meetupLocation?: string
  meetupTime?: string
  transactionType: 'BUY' | 'SWAP' | 'BORROW'
  isBorrowReturn?: boolean
  currentUserId: string
  otherPartyId: string
  otherPartyName?: string
  listingId?: string
  swapListingId?: string
  onVerifiedSuccess: (newStatus: string) => void
}

export function MeetupQrModal({
  isOpen,
  onClose,
  transactionId,
  swapId,
  bookTitle,
  meetupLocation,
  meetupTime,
  transactionType,
  isBorrowReturn = false,
  currentUserId,
  otherPartyId,
  otherPartyName,
  listingId,
  swapListingId,
  onVerifiedSuccess,
}: MeetupQrModalProps) {
  const { lang, isRTL } = useLanguage()
  const [activeTab, setActiveTab] = useState<'SHOW_QR' | 'SCAN_QR'>('SHOW_QR')
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [copiedCode, setCopiedCode] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)
  const [verificationSuccess, setVerificationSuccess] = useState<string | null>(null)

  // Camera Scanner State
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)

  const targetId = transactionId || swapId || ''
  const verificationPin = generateMeetupVerificationCode(targetId)

  // Generate QR code data URL
  useEffect(() => {
    if (!isOpen || !targetId) return

    const payload: MeetupQrPayload = {
      v: 1,
      type: isBorrowReturn ? 'BORROW_RETURN' : transactionType,
      id: targetId,
      code: verificationPin,
      title: bookTitle,
    }

    QRCode.toDataURL(JSON.stringify(payload), {
      width: 320,
      margin: 2,
      color: {
        dark: '#1e293b',
        light: '#ffffff',
      },
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Error generating QR:', err))
  }, [isOpen, targetId, transactionType, isBorrowReturn, verificationPin, bookTitle])

  // Stop camera when modal closes or tab changes
  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsCameraActive(false)
  }

  useEffect(() => {
    if (!isOpen || activeTab !== 'SCAN_QR') {
      stopCamera()
    }
    return () => stopCamera()
  }, [isOpen, activeTab])

  // Start Camera Scanning
  const startCamera = async () => {
    stopCamera()
    setCameraError(null)
    setVerificationError(null)
    try {
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        })
      } catch {
        // Fallback for laptops/webcams or browsers without environment camera
        stream = await navigator.mediaDevices.getUserMedia({ video: true })
      }

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.setAttribute('playsinline', 'true')
        videoRef.current.muted = true
        await videoRef.current.play()
        setIsCameraActive(true)
        scanFrame()
      }
    } catch (err: unknown) {
      console.warn('Camera access error:', err)
      setCameraError(
        lang === 'ar'
          ? 'تعذر الوصول إلى الكاميرا. يرجى إعطاء الإذن بالمتصفح أو إدخال الرمز المكون من 6 أرقام يدوياً.'
          : 'Could not access camera. Please allow camera permissions or enter the 6-digit code manually.'
      )
    }
  }

  // Scan Video Frame continuously with jsQR
  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current || !streamRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { willReadFrequently: true })

    if (video.readyState >= 2 && video.videoWidth > 0 && ctx) {
      // Downsample high-res video frames to 640px max dimension for smooth 60fps scanning
      const maxDim = 640
      let w = video.videoWidth
      let h = video.videoHeight
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w)
          w = maxDim
        } else {
          w = Math.round((w * maxDim) / h)
          h = maxDim
        }
      }

      canvas.width = w
      canvas.height = h
      ctx.drawImage(video, 0, 0, w, h)
      const imageData = ctx.getImageData(0, 0, w, h)
      const code = jsQR(imageData.data, w, h, {
        inversionAttempts: 'attemptBoth',
      })

      if (code && code.data) {
        handleConfirmVerification(code.data)
        stopCamera()
        return
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanFrame)
  }

  // Handle Photo/Screenshot Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = event => {
      const img = new Image()
      img.onload = () => {
        // Downscale large smartphone photos/screenshots to max 1000px so jsQR processes in milliseconds
        const maxDim = 1000
        let w = img.width
        let h = img.height
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w)
            w = maxDim
          } else {
            w = Math.round((w * maxDim) / h)
            h = maxDim
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h)
          const imageData = ctx.getImageData(0, 0, w, h)
          const code = jsQR(imageData.data, w, h, { inversionAttempts: 'attemptBoth' })
          if (code && code.data) {
            handleConfirmVerification(code.data)
          } else {
            setVerificationError(
              lang === 'ar'
                ? 'لم يتم العثور على رمز QR واضح في الصورة. يرجى إدخال الرمز يدوياً.'
                : 'No QR code found in image. Please enter code manually.'
            )
          }
        }
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  // Execute verification
  const handleConfirmVerification = async (codeOrPayload: string) => {
    setIsVerifying(true)
    setVerificationError(null)

    try {
      const res = await verifyMeetupHandover({
        transactionId,
        swapId,
        inputCodeOrPayload: codeOrPayload,
        actorId: currentUserId,
        otherPartyId,
        listingId,
        swapListingId,
        bookTitle,
        isBorrow: transactionType === 'BORROW',
        isBorrowReturn,
        isSwap: transactionType === 'SWAP',
      })

      if (res.success) {
        setVerificationSuccess(res.message)
        setTimeout(() => {
          onVerifiedSuccess(res.newStatus)
          onClose()
        }, 2200)
      } else {
        setVerificationError(res.message)
      }
    } catch (err: unknown) {
      console.error(err)
      setVerificationError(
        lang === 'ar'
          ? 'حدث خطأ أثناء تأكيد المعاملة. يرجى المحاولة مرة أخرى.'
          : 'Failed to verify meetup. Please try again.'
      )
    } finally {
      setIsVerifying(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(verificationPin)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2500)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl bg-card border-2 border-border shadow-2xl overflow-hidden flex flex-col text-foreground">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-foreground">
                {isBorrowReturn
                  ? lang === 'ar'
                    ? 'تأكيد إرجاع الكتاب المستعار 📖'
                    : 'Confirm Borrow Return'
                  : lang === 'ar'
                  ? 'رمز تأكيد المقابلة والاستلام 🤝'
                  : 'Meetup & Handover Verification'}
              </h3>
              <p className="text-xs text-muted-foreground truncate max-w-[240px]">
                {bookTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-3 bg-muted/10 border-b border-border/60">
          <div className="grid grid-cols-2 gap-2 bg-muted/60 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setActiveTab('SHOW_QR')
                stopCamera()
              }}
              className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'SHOW_QR'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <QrCode className="h-3.5 w-3.5 text-primary" />
              <span>{lang === 'ar' ? 'إظهار رمز QR لي' : 'Show My QR'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('SCAN_QR')}
              className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'SCAN_QR'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Camera className="h-3.5 w-3.5 text-primary" />
              <span>{lang === 'ar' ? 'مسح رمز الطرف الآخر' : 'Scan & Verify'}</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          {verificationSuccess ? (
            <div className="py-8 text-center space-y-3 animate-in zoom-in-95">
              <div className="h-16 w-16 mx-auto rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Check className="h-8 w-8 stroke-[3]" />
              </div>
              <h4 className="text-base font-black text-foreground">
                {lang === 'ar' ? 'تم تأكيد المعاملة بنجاح!' : 'Handover Confirmed!'}
              </h4>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                {verificationSuccess}
              </p>
            </div>
          ) : activeTab === 'SHOW_QR' ? (
            /* TAB 1: SHOW QR PASS */
            <div className="space-y-4 text-center">
              <div className="bg-white p-4 rounded-3xl inline-block shadow-md border-2 border-slate-100 dark:border-slate-800">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Meetup QR Code"
                    className="h-48 w-48 sm:h-52 sm:w-52 mx-auto rounded-xl object-contain"
                  />
                ) : (
                  <div className="h-48 w-48 flex items-center justify-center text-xs text-muted-foreground">
                    <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}
              </div>

              {/* 6-digit PIN Box */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-muted-foreground">
                  {lang === 'ar'
                    ? 'أو شارك رمز التأكيد اليدوي المكون من 6 أرقام:'
                    : 'Or share the 6-character backup PIN:'}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <div className="font-mono text-xl sm:text-2xl font-black tracking-widest px-4 py-2 rounded-2xl bg-muted/60 border border-border text-foreground">
                    {verificationPin}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopy}
                    className="rounded-xl font-bold text-xs gap-1 py-4.5 cursor-pointer"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-600">
                          {lang === 'ar' ? 'تم النسخ' : 'Copied'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>{lang === 'ar' ? 'نسخ' : 'Copy'}</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Meetup Details Notice */}
              <div className="p-3 rounded-2xl bg-primary/5 border border-primary/20 text-start space-y-1 text-xs">
                <div className="flex items-center gap-1.5 text-primary font-bold">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span>
                    {lang === 'ar'
                      ? 'تعليمات اللقاء الآمن'
                      : 'Safe Meetup Verification'}
                  </span>
                </div>
                <p className="text-muted-foreground text-[11px]">
                  {lang === 'ar'
                    ? 'أظهر هذا الرمز للشخص الآخر عند اللقاء. بمجرد مسحه بالكاميرا أو إدخال الرمز، ستكتمل المعاملة وتتحدث حالة الكتاب فورياً.'
                    : 'Present this QR pass to the other party when you meet. Once scanned, the transaction completes automatically.'}
                </p>
                {meetupLocation && (
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-foreground pt-1">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{meetupLocation}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* TAB 2: SCAN QR CODE */
            <div className="space-y-4">
              {/* Camera Scanner Viewfinder */}
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex flex-col items-center justify-center border-2 border-border/80">
                <video
                  ref={videoRef}
                  className={`w-full h-full object-cover ${
                    isCameraActive ? 'block' : 'hidden'
                  }`}
                />
                <canvas ref={canvasRef} className="hidden" />

                {isCameraActive ? (
                  /* Animated scanning overlay */
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                    <div className="w-48 h-48 border-2 border-primary/80 rounded-2xl relative">
                      <div className="absolute inset-x-0 h-0.5 bg-primary shadow-[0_0_12px_#3b82f6] animate-pulse top-1/2" />
                      <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-primary" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-primary" />
                      <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-primary" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-primary" />
                    </div>
                    <span className="text-[10px] font-black text-white bg-black/60 px-2.5 py-1 rounded-full mt-3">
                      {lang === 'ar' ? 'وجّه الكاميرا نحو رمز QR' : 'Point camera at QR code'}
                    </span>
                  </div>
                ) : (
                  <div className="text-center p-4 space-y-2.5">
                    <Camera className="h-10 w-10 text-muted-foreground/60 mx-auto" />
                    <p className="text-xs text-muted-foreground max-w-xs">
                      {cameraError ||
                        (lang === 'ar'
                          ? 'افتح الكاميرا لمسح الرمز مباشرة من شاشة الطرف الآخر'
                          : 'Open camera to scan QR from the other user screen')}
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        onClick={startCamera}
                        className="rounded-xl font-black text-xs gap-1.5 shadow-md shadow-primary/20 cursor-pointer"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        <span>{lang === 'ar' ? 'تشغيل الكاميرا 📷' : 'Open Camera'}</span>
                      </Button>
                      <label className="cursor-pointer inline-flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-xl border border-border bg-card hover:bg-muted text-foreground">
                        <Upload className="h-3.5 w-3.5" />
                        <span>{lang === 'ar' ? 'صورة' : 'Upload'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {isCameraActive && (
                <div className="flex justify-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={stopCamera}
                    className="text-xs font-bold rounded-xl py-3"
                  >
                    {lang === 'ar' ? 'إيقاف الكاميرا' : 'Stop Camera'}
                  </Button>
                </div>
              )}

              {/* Manual PIN Input Fallback */}
              <div className="pt-2 border-t border-border/60 space-y-2">
                <label className="text-xs font-black text-foreground block">
                  {lang === 'ar'
                    ? 'أو أدخل رمز التأكيد يدوياً:'
                    : 'Or enter verification PIN manually:'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="BS-XXXXXX"
                    value={manualCode}
                    onChange={e => setManualCode(e.target.value.toUpperCase())}
                    className="flex-1 font-mono uppercase tracking-widest text-center rounded-2xl border border-border bg-background px-3.5 py-2.5 text-sm font-black text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button
                    disabled={manualCode.trim().length < 4 || isVerifying}
                    loading={isVerifying}
                    onClick={() => handleConfirmVerification(manualCode.trim())}
                    className="rounded-2xl font-black text-xs px-5 py-5 cursor-pointer"
                  >
                    <Check className="h-4 w-4 me-1" />
                    <span>{lang === 'ar' ? 'تأكيد' : 'Confirm'}</span>
                  </Button>
                </div>
              </div>

              {verificationError && (
                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{verificationError}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between">
          <Badge variant="outline" className="text-[10px] font-bold">
            {transactionType === 'BUY'
              ? lang === 'ar' ? 'شراء نقدي 🛒' : 'Buy'
              : transactionType === 'SWAP'
              ? lang === 'ar' ? 'مبادلة كتب 🔄' : 'Swap'
              : isBorrowReturn
              ? lang === 'ar' ? 'إرجاع استعارة 📖' : 'Borrow Return'
              : lang === 'ar' ? 'تسليم استعارة ⏱️' : 'Borrow Handover'}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs font-bold rounded-xl"
          >
            {lang === 'ar' ? 'إغلاق' : 'Close'}
          </Button>
        </div>
      </div>
    </div>
  )
}
