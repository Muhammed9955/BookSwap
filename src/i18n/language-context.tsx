'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { AppLanguage } from '@/types'

interface LanguageContextType {
  lang: AppLanguage
  setLang: (lang: AppLanguage) => void
  dir: 'rtl' | 'ltr'
  isRTL: boolean
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'ar',
  setLang: () => {},
  dir: 'rtl',
  isRTL: true,
})

export function LanguageProvider({ children, defaultLang = 'ar' }: { children: ReactNode; defaultLang?: AppLanguage }) {
  const [lang, setLangState] = useState<AppLanguage>(defaultLang)

  const setLang = (newLang: AppLanguage) => {
    setLangState(newLang)
    localStorage.setItem('bookswap-lang', newLang)
    document.documentElement.lang = newLang
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr'
  }

  useEffect(() => {
    const saved = localStorage.getItem('bookswap-lang') as AppLanguage | null
    if (saved) {
      setLangState(saved)
      document.documentElement.lang = saved
      document.documentElement.dir = saved === 'ar' ? 'rtl' : 'ltr'
    } else {
      document.documentElement.lang = 'ar'
      document.documentElement.dir = 'rtl'
    }
  }, [])

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang,
        dir: lang === 'ar' ? 'rtl' : 'ltr',
        isRTL: lang === 'ar',
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
