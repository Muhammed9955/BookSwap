/**
 * WaraqConnect Brand Constants & Configuration
 * Brand Identity: WaraqConnect | ورق كونكت
 * Slogan: A World Between Every Page. | عالم جديد بين كل صفحة والتانية.
 */

export const BRAND = {
  name: {
    en: 'WaraqConnect',
    ar: 'ورق كونكت',
  },
  slogan: {
    en: 'A World Between Every Page.',
    ar: 'عالم جديد بين كل صفحة والتانية.',
  },
  description: {
    en: 'WaraqConnect — The modern marketplace for book exchanges, secondhand treasures, reader clubs, and local bookstore discovery.',
    ar: 'منصة وتطبيق WaraqConnect (ورق كونكت) — عالمك لتبادل وشراء واستعارة الكتب المستعملة، ونوادي القراءة في مدينتك. عالم جديد بين كل صفحة والتانية.',
  },
  colors: {
    primary: '#173F32', // Deep forest green
    primaryLight: '#235948',
    primaryDark: '#0f2a22',
    accent: '#2A7258',
    warmIvory: '#F8F7F2',
    charcoal: '#1A1F1D',
    mutedSage: '#5A6E65',
  },
  logo: {
    src: '/images/logo.png',
    iconSrc: '/icons/logo.png',
    alt: 'WaraqConnect | ورق كونكت',
  },
  contact: {
    email: 'muhamed.dev.95@gmail.com',
    whatsapp: '201556252658',
  },
  domains: {
    production: 'https://waraqconnect.vercel.app',
    recommended: 'waraqconnect.vercel.app',
  },
} as const
