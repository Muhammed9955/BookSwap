'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useLanguage } from '@/i18n/language-context'
import { BRAND } from '@/lib/brand'
import { cn } from '@/lib/utils'

interface WaraqLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  showSlogan?: boolean
  href?: string | null
  className?: string
  priority?: boolean
}

const sizeConfig = {
  xs: {
    iconSize: 24,
    textSize: 'text-base',
    arabicSize: 'text-base',
    sloganSize: 'text-[10px]',
    containerClass: 'gap-1.5',
    iconWrapper: 'w-6 h-6',
  },
  sm: {
    iconSize: 32,
    textSize: 'text-lg',
    arabicSize: 'text-lg',
    sloganSize: 'text-[11px]',
    containerClass: 'gap-2',
    iconWrapper: 'w-8 h-8',
  },
  md: {
    iconSize: 40,
    textSize: 'text-xl',
    arabicSize: 'text-xl',
    sloganSize: 'text-xs',
    containerClass: 'gap-2.5',
    iconWrapper: 'w-10 h-10',
  },
  lg: {
    iconSize: 48,
    textSize: 'text-2xl',
    arabicSize: 'text-2xl',
    sloganSize: 'text-xs',
    containerClass: 'gap-3',
    iconWrapper: 'w-12 h-12',
  },
  xl: {
    iconSize: 64,
    textSize: 'text-3xl',
    arabicSize: 'text-3xl',
    sloganSize: 'text-sm',
    containerClass: 'gap-4',
    iconWrapper: 'w-16 h-16',
  },
}

export function WaraqLogo({
  size = 'md',
  showText = true,
  showSlogan = false,
  href = '/',
  className,
  priority = false,
}: WaraqLogoProps) {
  const { lang, isRTL } = useLanguage()
  const cfg = sizeConfig[size]

  const content = (
    <div
      className={cn(
        'inline-flex items-center select-none group transition-transform duration-200',
        cfg.containerClass,
        className
      )}
    >
      {/* Official WARAQ Leaf-Book Icon with preserved aspect ratio */}
      <div
        className={cn(
          'relative flex items-center justify-center rounded-xl overflow-hidden shrink-0 transition-transform group-hover:scale-105',
          cfg.iconWrapper
        )}
      >
        <Image
          src="/images/logo.png"
          alt={BRAND.logo.alt}
          width={cfg.iconSize}
          height={cfg.iconSize}
          priority={priority}
          className="w-full h-full object-contain filter dark:brightness-125 dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]"
        />
      </div>

      {/* Typography: WARAQ | ورق */}
      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5 font-black tracking-tight">
            <span
              className={cn(
                'tracking-wider font-extrabold text-[#173F32] dark:text-[#52b393]',
                cfg.textSize
              )}
            >
              WARAQ
            </span>
            <span className="text-muted-foreground/40 font-light text-xs">|</span>
            <span
              className={cn(
                'font-black font-arabic text-[#173F32] dark:text-[#52b393]',
                cfg.arabicSize
              )}
            >
              وَرَق
            </span>
          </div>

          {showSlogan && (
            <span
              className={cn(
                'text-muted-foreground font-medium mt-1 leading-tight',
                cfg.sloganSize,
                isRTL ? 'font-arabic' : 'font-sans'
              )}
            >
              {lang === 'ar' ? BRAND.slogan.ar : BRAND.slogan.en}
            </span>
          )}
        </div>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center">
        {content}
      </Link>
    )
  }

  return content
}
