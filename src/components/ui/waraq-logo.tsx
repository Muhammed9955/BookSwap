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
    iconSize: 20,
    textSize: 'text-xs',
    arabicSize: 'text-xs',
    sloganSize: 'text-[9px]',
    containerClass: 'gap-1.5',
    iconWrapper: 'w-5 h-5',
  },
  sm: {
    iconSize: 26,
    textSize: 'text-xs sm:text-sm',
    arabicSize: 'text-xs sm:text-sm',
    sloganSize: 'text-[10px]',
    containerClass: 'gap-2',
    iconWrapper: 'w-7 h-7',
  },
  md: {
    iconSize: 36,
    textSize: 'text-base sm:text-lg',
    arabicSize: 'text-base sm:text-lg',
    sloganSize: 'text-xs',
    containerClass: 'gap-2.5',
    iconWrapper: 'w-9 h-9',
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
        'inline-flex items-center select-none group transition-transform duration-200 whitespace-nowrap flex-nowrap shrink-0',
        cfg.containerClass,
        className
      )}
    >
      {/* Official WARAQ Leaf-Book Icon with white background */}
      <div
        className={cn(
          'relative flex items-center justify-center rounded-xl overflow-hidden shrink-0 transition-transform group-hover:scale-105 bg-white shadow-2xs border border-black/5 p-0.5',
          cfg.iconWrapper
        )}
      >
        <Image
          src="/images/logo.png"
          alt={BRAND.logo.alt}
          width={cfg.iconSize}
          height={cfg.iconSize}
          priority={priority}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Typography: WaraqConnect | ورق كونكت */}
      {showText && (
        <div className="flex flex-col leading-none whitespace-nowrap shrink-0">
          <div className="flex items-center gap-1.5 font-black tracking-tight whitespace-nowrap flex-nowrap shrink-0">
            <span
              className={cn(
                'tracking-tight font-extrabold text-[#173F32] dark:text-[#52b393] whitespace-nowrap shrink-0',
                cfg.textSize
              )}
            >
              {BRAND.name.en}
            </span>
            <span className="text-muted-foreground/40 font-light text-xs shrink-0 select-none">|</span>
            <span
              className={cn(
                'font-black font-arabic text-[#173F32] dark:text-[#52b393] whitespace-nowrap shrink-0',
                cfg.arabicSize
              )}
            >
              {BRAND.name.ar}
            </span>
          </div>

          {showSlogan && (
            <span
              className={cn(
                'text-muted-foreground font-medium mt-1 leading-tight whitespace-nowrap shrink-0',
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
      <Link href={href} className="inline-flex items-center whitespace-nowrap flex-nowrap shrink-0">
        {content}
      </Link>
    )
  }

  return content
}
