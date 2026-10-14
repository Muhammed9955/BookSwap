'use client'

import React, { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import {
  Users,
  MapPin,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Search,
  Sparkles,
  Coffee,
  Plus,
  X,
  Globe,
  Mail,
  Phone,
  Lock,
  Tag,
  Image as ImageIcon,
  BookMarked,
  Building,
  MessageCircle,
  ExternalLink,
  Navigation,
  Check,
  ChevronDown,
  Layers,
} from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/i18n/language-context'
import { cn } from '@/lib/utils'
import { toggleCommunityMembership, createCommunity } from '@/lib/communities/community-service'
import type { Community, CommunityOrgType, City, Area } from '@/types'
import { ImageUploadDropzone } from '@/components/common/image-upload-dropzone'
import { MultiChoiceTagPicker } from '@/components/common/multi-choice-tag-picker'

// Dynamic Map Picker (SSR-safe for Leaflet)
const MapLocationPicker = dynamic(
  () => import('@/components/common/map-location-picker').then(mod => mod.MapLocationPicker),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full rounded-2xl border-2 border-dashed border-border bg-muted/20 flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
        <MapPin className="h-6 w-6 animate-bounce text-primary" />
        <span>جاري تحميل الخريطة التفاعلية... (Loading interactive map)</span>
      </div>
    ),
  }
)

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

// All available org types with their display data
const ORG_TYPES: { value: CommunityOrgType; labelAr: string; labelEn: string; emoji: string; color: string }[] = [
  { value: 'NEIGHBORHOOD', labelAr: 'حي أو منطقة سكنية', labelEn: 'Neighborhood',   emoji: '🌳', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  { value: 'UNIVERSITY',   labelAr: 'جامعة أو كلية',     labelEn: 'University',      emoji: '🎓', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  { value: 'CLUB',         labelAr: 'صالون ونادي قراءة', labelEn: 'Book Club',       emoji: '📚', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  { value: 'COMPANY',      labelAr: 'مجتمع تقني ومؤسسي', labelEn: 'Tech & Work',     emoji: '💼', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  { value: 'SCHOOL',       labelAr: 'مدرسة وتعليم',      labelEn: 'School',          emoji: '🏫', color: 'bg-sky-500/10 text-sky-600 border-sky-500/20' },
  { value: 'MOSQUE',       labelAr: 'مسجد ومركز ديني',   labelEn: 'Mosque',          emoji: '🕌', color: 'bg-teal-500/10 text-teal-600 border-teal-500/20' },
  { value: 'CHURCH',       labelAr: 'كنيسة ومركز مجتمعي',labelEn: 'Church',          emoji: '⛪', color: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
  { value: 'OTHER',        labelAr: 'مجتمع آخر',          labelEn: 'Other',           emoji: '🤝', color: 'bg-primary/10 text-primary border-primary/20' },
]

function getOrgData(type?: CommunityOrgType) {
  return ORG_TYPES.find(o => o.value === type) ?? ORG_TYPES[2]
}

// Comprehensive Egyptian Governorates, Cities & Areas with accurate GPS coordinates
// Comprehensive Egyptian Governorates, Cities & Areas with accurate GPS coordinates
export const DEFAULT_EGYPT_CITIES = [
  {
    id: 'cairo',
    name_ar: 'القاهرة',
    name_en: 'Cairo',
    slug: 'cairo',
    latitude: 30.0444,
    longitude: 31.2357,
    areas: [
      { id: 'cairo-maadi', name_ar: 'المعادي', name_en: 'Maadi', slug: 'maadi', latitude: 29.9602, longitude: 31.2569 },
      { id: 'cairo-degla', name_ar: 'دجلة', name_en: 'Degla', slug: 'degla', latitude: 29.9722, longitude: 31.2801 },
      { id: 'cairo-newmaadi', name_ar: 'المعادي الجديدة', name_en: 'New Maadi', slug: 'new-maadi', latitude: 29.9790, longitude: 31.2880 },
      { id: 'cairo-zahraa-maadi', name_ar: 'زهراء المعادي', name_en: 'Zahraa El Maadi', slug: 'zahraa-maadi', latitude: 29.9690, longitude: 31.3050 },
      { id: 'cairo-zamalek', name_ar: 'الزمالك', name_en: 'Zamalek', slug: 'zamalek', latitude: 30.0609, longitude: 31.2197 },
      { id: 'cairo-downtown', name_ar: 'وسط البلد', name_en: 'Downtown', slug: 'downtown', latitude: 30.0488, longitude: 31.2405 },
      { id: 'cairo-tahrir', name_ar: 'ميدان التحرير', name_en: 'Tahrir Square', slug: 'tahrir', latitude: 30.0444, longitude: 31.2357 },
      { id: 'cairo-gardencity', name_ar: 'جاردن سيتي', name_en: 'Garden City', slug: 'garden-city', latitude: 30.0360, longitude: 31.2300 },
      { id: 'cairo-manial', name_ar: 'المنيل', name_en: 'El Manial', slug: 'manial', latitude: 30.0211, longitude: 31.2294 },
      { id: 'cairo-oldcairo', name_ar: 'مصر القديمة', name_en: 'Old Cairo', slug: 'old-cairo', latitude: 30.0070, longitude: 31.2300 },
      { id: 'cairo-heliopolis', name_ar: 'مصر الجديدة', name_en: 'Heliopolis', slug: 'heliopolis', latitude: 30.0898, longitude: 31.3285 },
      { id: 'cairo-korba', name_ar: 'الكوربة', name_en: 'El Korba', slug: 'korba', latitude: 30.0881, longitude: 31.3265 },
      { id: 'cairo-roxy', name_ar: 'روكسي', name_en: 'Roxy', slug: 'roxy', latitude: 30.0930, longitude: 31.3190 },
      { id: 'cairo-sheraton', name_ar: 'شيراتون المطار', name_en: 'Sheraton Heliopolis', slug: 'sheraton', latitude: 30.1080, longitude: 31.3780 },
      { id: 'cairo-nasrcity-abbas', name_ar: 'مدينة نصر - عباس العقاد', name_en: 'Nasr City - Abbas El Akkad', slug: 'nasr-city-abbas', latitude: 30.0601, longitude: 31.3415 },
      { id: 'cairo-nasrcity-makram', name_ar: 'مدينة نصر - مكرم عبيد', name_en: 'Nasr City - Makram Ebeid', slug: 'nasr-city-makram', latitude: 30.0680, longitude: 31.3480 },
      { id: 'cairo-nasrcity-7th', name_ar: 'مدينة نصر - الحي السابع', name_en: 'Nasr City - 7th District', slug: 'nasr-city-7th', latitude: 30.0520, longitude: 31.3320 },
      { id: 'cairo-newcairo-90th', name_ar: 'التجمع الخامس - شارع التسعين', name_en: 'New Cairo - 90th St', slug: 'newcairo-90th', latitude: 30.0131, longitude: 31.4913 },
      { id: 'cairo-newcairo-narges', name_ar: 'التجمع الخامس - حي النرجس', name_en: '5th Settlement - El Narges', slug: 'newcairo-narges', latitude: 30.0180, longitude: 31.4720 },
      { id: 'cairo-newcairo-auc', name_ar: 'التجمع الخامس - الجامعة الأمريكية (AUC)', name_en: 'AUC Area - 5th Settlement', slug: 'newcairo-auc', latitude: 30.0200, longitude: 31.5000 },
      { id: 'cairo-1st-settlement', name_ar: 'التجمع الأول', name_en: '1st Settlement', slug: '1st-settlement', latitude: 30.0631, longitude: 31.4682 },
      { id: 'cairo-3rd-settlement', name_ar: 'التجمع الثالث', name_en: '3rd Settlement', slug: '3rd-settlement', latitude: 29.9892, longitude: 31.4421 },
      { id: 'cairo-rehab', name_ar: 'الرحاب', name_en: 'Al Rehab City', slug: 'rehab', latitude: 30.0638, longitude: 31.5033 },
      { id: 'cairo-madinaty', name_ar: 'مدينتي', name_en: 'Madinaty', slug: 'madinaty', latitude: 30.1082, longitude: 31.6247 },
      { id: 'cairo-shorouk', name_ar: 'الشروق', name_en: 'El Shorouk City', slug: 'shorouk', latitude: 30.1245, longitude: 31.6215 },
      { id: 'cairo-badr', name_ar: 'مدينة بدر', name_en: 'Badr City', slug: 'badr', latitude: 30.1389, longitude: 31.7412 },
      { id: 'cairo-newcapital', name_ar: 'العاصمة الإدارية', name_en: 'New Administrative Capital', slug: 'new-capital', latitude: 30.0167, longitude: 31.7333 },
      { id: 'cairo-mokattam', name_ar: 'المقطم', name_en: 'Mokattam', slug: 'mokattam', latitude: 30.0156, longitude: 31.3065 },
      { id: 'cairo-centralplateau', name_ar: 'الهضبة الوسطى', name_en: 'Central Plateau', slug: 'central-plateau', latitude: 30.0020, longitude: 31.3150 },
      { id: 'cairo-shubra', name_ar: 'شبرا', name_en: 'Shubra', slug: 'shubra', latitude: 30.0768, longitude: 31.2447 },
      { id: 'cairo-rodelfarag', name_ar: 'روض الفرج', name_en: 'Rod El Farag', slug: 'rod-el-farag', latitude: 30.0810, longitude: 31.2390 },
      { id: 'cairo-abbassia', name_ar: 'العباسية', name_en: 'Abbassia', slug: 'abbassia', latitude: 30.0694, longitude: 31.2831 },
      { id: 'cairo-waily', name_ar: 'الوايلي', name_en: 'El Waily', slug: 'waily', latitude: 30.0760, longitude: 31.2890 },
      { id: 'cairo-hadayek-kobba', name_ar: 'حدائق القبة', name_en: 'Hadayek El Kobba', slug: 'hadayek-kobba', latitude: 30.0910, longitude: 31.2980 },
      { id: 'cairo-daher', name_ar: 'الظاهر وباب الشعرية', name_en: 'Daher & Bab El Sharia', slug: 'daher', latitude: 30.0570, longitude: 31.2610 },
      { id: 'cairo-helwan', name_ar: 'حلوان', name_en: 'Helwan', slug: 'helwan', latitude: 29.8497, longitude: 31.3342 },
      { id: 'cairo-maasara', name_ar: 'المعصرة', name_en: 'El Maasara', slug: 'maasara', latitude: 29.8980, longitude: 31.3050 },
      { id: 'cairo-ainshams', name_ar: 'عين شمس', name_en: 'Ain Shams', slug: 'ain-shams', latitude: 30.1312, longitude: 31.3241 },
      { id: 'cairo-matareya', name_ar: 'المطرية', name_en: 'El Matareya', slug: 'matareya', latitude: 30.1210, longitude: 31.3110 },
      { id: 'cairo-gesrelsuez', name_ar: 'جسر السويس', name_en: 'Gesr El Suez', slug: 'gesr-el-suez', latitude: 30.1190, longitude: 31.3410 },
      { id: 'cairo-zaytoun', name_ar: 'الزيتون', name_en: 'El Zaytoun', slug: 'zaytoun', latitude: 30.1031, longitude: 31.3125 },
      { id: 'cairo-kobba', name_ar: 'حمامات القبة', name_en: 'Hamamat El Kobba', slug: 'kobba', latitude: 30.0980, longitude: 31.3020 },
    ],
  },
  {
    id: 'giza',
    name_ar: 'الجيزة',
    name_en: 'Giza',
    slug: 'giza',
    latitude: 30.0131,
    longitude: 31.2089,
    areas: [
      { id: 'giza-dokki', name_ar: 'الدقي', name_en: 'Dokki', slug: 'dokki', latitude: 30.0385, longitude: 31.2125 },
      { id: 'giza-messaha', name_ar: 'ميدان المساحة', name_en: 'Messaha Square', slug: 'messaha', latitude: 30.0370, longitude: 31.2140 },
      { id: 'giza-mossadak', name_ar: 'شارع مصدق ونادي الصيد', name_en: 'Mossadak & Shooting Club', slug: 'mossadak', latitude: 30.0430, longitude: 31.2050 },
      { id: 'giza-mohandessin-gameat', name_ar: 'المهندسين - شارع جامعة الدول', name_en: 'Mohandessin - Gameat Dowal', slug: 'mohandessin-gameat', latitude: 30.0571, longitude: 31.2014 },
      { id: 'giza-mohandessin-lebanon', name_ar: 'المهندسين - ميدان لبنان', name_en: 'Mohandessin - Lebanon Sq', slug: 'mohandessin-lebanon', latitude: 30.0640, longitude: 31.1960 },
      { id: 'giza-agouza', name_ar: 'العجوزة', name_en: 'Agouza', slug: 'agouza', latitude: 30.0583, longitude: 31.2132 },
      { id: 'giza-bein-sarayat', name_ar: 'بين السرايات وجامعة القاهرة', name_en: 'Bein El Sarayat & Cairo Univ', slug: 'bein-sarayat', latitude: 30.0260, longitude: 31.2080 },
      { id: 'giza-imbaba', name_ar: 'إمبابة وكورنيش الوراق', name_en: 'Imbaba & Warraq', slug: 'imbaba', latitude: 30.0750, longitude: 31.2110 },
      { id: 'giza-sheikhzayed', name_ar: 'الشيخ زايد', name_en: 'Sheikh Zayed', slug: 'sheikh-zayed', latitude: 30.0504, longitude: 30.9833 },
      { id: 'giza-beverlyhills', name_ar: 'بيفرلي هيلز وسوديك', name_en: 'Beverly Hills & SODIC', slug: 'beverly-hills', latitude: 30.0712, longitude: 30.9520 },
      { id: 'giza-khamael', name_ar: 'الخمائل', name_en: 'El Khamael', slug: 'khamael', latitude: 30.0310, longitude: 30.9920 },
      { id: 'giza-6october-hosary', name_ar: '6 أكتوبر - ميدان الحصري', name_en: '6th of October - El Hosary', slug: '6th-october-hosary', latitude: 29.9725, longitude: 30.9410 },
      { id: 'giza-6october-districts', name_ar: '6 أكتوبر - الأحياء السكنية', name_en: '6th of October - Residential Districts', slug: '6th-october-districts', latitude: 29.9737, longitude: 30.9529 },
      { id: 'giza-octobergardens', name_ar: 'حدائق أكتوبر', name_en: 'October Gardens', slug: 'october-gardens', latitude: 29.9320, longitude: 31.0210 },
      { id: 'giza-haram', name_ar: 'شارع الهرم', name_en: 'Al Haram St', slug: 'haram', latitude: 29.9974, longitude: 31.1518 },
      { id: 'giza-square', name_ar: 'ميدان الجيزة', name_en: 'Giza Square', slug: 'giza-square', latitude: 30.0090, longitude: 31.2090 },
      { id: 'giza-faisal', name_ar: 'شارع فيصل', name_en: 'Faisal St', slug: 'faisal', latitude: 30.0150, longitude: 31.1780 },
      { id: 'giza-ahramgardens', name_ar: 'حدائق الأهرام', name_en: 'Hadayek Al Ahram', slug: 'ahram-gardens', latitude: 29.9812, longitude: 31.1120 },
      { id: 'giza-omraneya', name_ar: 'العمرانية', name_en: 'Omraneya', slug: 'omraneya', latitude: 29.9980, longitude: 31.2010 },
      { id: 'giza-smartvillage', name_ar: 'القرية الذكية', name_en: 'Smart Village', slug: 'smart-village', latitude: 30.0735, longitude: 31.0182 },
    ],
  },
  {
    id: 'alexandria',
    name_ar: 'الإسكندرية',
    name_en: 'Alexandria',
    slug: 'alexandria',
    latitude: 31.2001,
    longitude: 29.9187,
    areas: [
      { id: 'alex-moharam-bek', name_ar: 'محرم بيه', name_en: 'Moharam Bek', slug: 'moharam-bek', latitude: 31.1925, longitude: 29.9140 },
      { id: 'alex-ibrahimiya', name_ar: 'الإبراهيمية', name_en: 'El Ibrahimiya', slug: 'ibrahimiya', latitude: 31.2115, longitude: 29.9320 },
      { id: 'alex-sporting', name_ar: 'سبورتنج', name_en: 'Sporting', slug: 'sporting', latitude: 31.2160, longitude: 29.9380 },
      { id: 'alex-cleopatra', name_ar: 'كليوباترا', name_en: 'Cleopatra', slug: 'cleopatra', latitude: 31.2225, longitude: 29.9430 },
      { id: 'alex-sidi-gaber', name_ar: 'سيدي جابر', name_en: 'Sidi Gaber', slug: 'sidi-gaber', latitude: 31.2190, longitude: 29.9470 },
      { id: 'alex-smouha', name_ar: 'سموحة', name_en: 'Smouha', slug: 'smouha', latitude: 31.2060, longitude: 29.9580 },
      { id: 'alex-greenplaza', name_ar: 'جرين بلازا', name_en: 'Green Plaza', slug: 'green-plaza', latitude: 31.2090, longitude: 29.9650 },
      { id: 'alex-roushdy', name_ar: 'رشدي', name_en: 'Roushdy', slug: 'roushdy', latitude: 31.2300, longitude: 29.9570 },
      { id: 'alex-stanley', name_ar: 'ستانلي', name_en: 'Stanley', slug: 'stanley', latitude: 31.2380, longitude: 29.9670 },
      { id: 'alex-gleem', name_ar: 'جليم', name_en: 'Gleem', slug: 'gleem', latitude: 31.2355, longitude: 29.9610 },
      { id: 'alex-kafr-abdu', name_ar: 'كفر عبده', name_en: 'Kafr Abdu', slug: 'kafr-abdu', latitude: 31.2220, longitude: 29.9600 },
      { id: 'alex-fleming', name_ar: 'فلمنج', name_en: 'Fleming', slug: 'fleming', latitude: 31.2330, longitude: 29.9670 },
      { id: 'alex-sabapasha', name_ar: 'سابا باشا', name_en: 'Saba Pasha', slug: 'saba-pasha', latitude: 31.2410, longitude: 29.9710 },
      { id: 'alex-zizinia', name_ar: 'زيزينيا', name_en: 'Zizinia', slug: 'zizinia', latitude: 31.2430, longitude: 29.9730 },
      { id: 'alex-sanstefano', name_ar: 'سان ستيفانو', name_en: 'San Stefano', slug: 'san-stefano', latitude: 31.2460, longitude: 29.9750 },
      { id: 'alex-laurent', name_ar: 'لوران', name_en: 'Laurent', slug: 'laurent', latitude: 31.2480, longitude: 29.9770 },
      { id: 'alex-tharwat', name_ar: 'ثروت', name_en: 'Tharwat', slug: 'tharwat', latitude: 31.2420, longitude: 29.9720 },
      { id: 'alex-victoria', name_ar: 'فيكتوريا', name_en: 'Victoria', slug: 'victoria', latitude: 31.2485, longitude: 29.9830 },
      { id: 'alex-mahattet-raml', name_ar: 'محطة الرمل', name_en: 'Mahattet El Raml', slug: 'mahattet-el-raml', latitude: 31.2010, longitude: 29.9080 },
      { id: 'alex-mansheya', name_ar: 'المنشية', name_en: 'El Mansheya', slug: 'mansheya', latitude: 31.1985, longitude: 29.8970 },
      { id: 'alex-kom-el-dekka', name_ar: 'كوم الدكة', name_en: 'Kom El Dekka', slug: 'kom-el-dekka', latitude: 31.1960, longitude: 29.9070 },
      { id: 'alex-azarita', name_ar: 'الأزاريطة', name_en: 'Azarita', slug: 'azarita', latitude: 31.2040, longitude: 29.9120 },
      { id: 'alex-shatby', name_ar: 'الشاطبي ومكتبة الإسكندرية', name_en: 'Shatby & Library', slug: 'shatby', latitude: 31.2089, longitude: 29.9092 },
      { id: 'alex-bahari', name_ar: 'بحري والأنفوشي', name_en: 'Bahari & Anfoushi', slug: 'bahari', latitude: 31.2120, longitude: 29.8820 },
      { id: 'alex-karmouz', name_ar: 'كرموز', name_en: 'Karmouz', slug: 'karmouz', latitude: 31.1820, longitude: 29.8980 },
      { id: 'alex-miami', name_ar: 'ميامي', name_en: 'Miami', slug: 'miami', latitude: 31.2520, longitude: 29.9790 },
      { id: 'alex-sidi-bishr', name_ar: 'سيدي بشر', name_en: 'Sidi Bishr', slug: 'sidi-bishr', latitude: 31.2560, longitude: 29.9880 },
      { id: 'alex-khaled-ibn-walid', name_ar: 'شارع خالد بن الوليد', name_en: 'Khaled Ibn El Walid', slug: 'khaled-ibn-walid', latitude: 31.2580, longitude: 29.9820 },
      { id: 'alex-seyouf', name_ar: 'السيوف', name_en: 'El Seyouf', slug: 'seyouf', latitude: 31.2390, longitude: 29.9920 },
      { id: 'alex-awayed', name_ar: 'العوايد', name_en: 'El Awayed', slug: 'awayed', latitude: 31.2180, longitude: 29.9980 },
      { id: 'alex-mandara', name_ar: 'المندرة', name_en: 'Mandara', slug: 'mandara', latitude: 31.2820, longitude: 30.0090 },
      { id: 'alex-asafra', name_ar: 'العصافرة', name_en: 'Asafra', slug: 'asafra', latitude: 31.2750, longitude: 30.0020 },
      { id: 'alex-maamoura', name_ar: 'المعمورة', name_en: 'Maamoura', slug: 'maamoura', latitude: 31.2890, longitude: 30.0260 },
      { id: 'alex-montaza', name_ar: 'المنتزه', name_en: 'Montaza', slug: 'montaza', latitude: 31.2840, longitude: 30.0180 },
      { id: 'alex-abuqir', name_ar: 'أبو قير', name_en: 'Abu Qir', slug: 'abu-qir', latitude: 31.3170, longitude: 30.0620 },
      { id: 'alex-agami', name_ar: 'العجمي', name_en: 'Agami', slug: 'agami', latitude: 31.1210, longitude: 29.7890 },
      { id: 'alex-bitash', name_ar: 'البيطاش', name_en: 'Bitash', slug: 'bitash', latitude: 31.1350, longitude: 29.8020 },
      { id: 'alex-hanoville', name_ar: 'الهانوفيل', name_en: 'Hanoville', slug: 'hanoville', latitude: 31.1180, longitude: 29.7780 },
      { id: 'alex-borg-el-arab', name_ar: 'برج العرب', name_en: 'Borg El Arab', slug: 'borg-el-arab', latitude: 30.9160, longitude: 29.5480 },
    ],
  },
  {
    id: 'mansoura',
    name_ar: 'المنصورة',
    name_en: 'Mansoura',
    slug: 'mansoura',
    latitude: 31.0409,
    longitude: 31.3785,
    areas: [
      { id: 'mansoura-university', name_ar: 'حي الجامعة', name_en: 'University District', slug: 'university', latitude: 31.0425, longitude: 31.3570 },
      { id: 'mansoura-mashaya-lower', name_ar: 'المشاية السفلية', name_en: 'Lower Mashaya', slug: 'lower-mashaya', latitude: 31.0440, longitude: 31.3620 },
      { id: 'mansoura-mashaya-upper', name_ar: 'المشاية العلوية', name_en: 'Upper Mashaya', slug: 'upper-mashaya', latitude: 31.0460, longitude: 31.3650 },
      { id: 'mansoura-toriel-old', name_ar: 'توريل القديمة', name_en: 'Old Toriel', slug: 'old-toriel', latitude: 31.0489, longitude: 31.3912 },
      { id: 'mansoura-toriel-new', name_ar: 'توريل الجديدة', name_en: 'New Toriel', slug: 'new-toriel', latitude: 31.0510, longitude: 31.3950 },
      { id: 'mansoura-geish', name_ar: 'شارع الجيش', name_en: 'El Geish St', slug: 'geish', latitude: 31.0375, longitude: 31.3820 },
      { id: 'mansoura-mokhtalat', name_ar: 'المختلط', name_en: 'El Mokhtalat', slug: 'mokhtalat', latitude: 31.0390, longitude: 31.3850 },
      { id: 'mansoura-gomhoureya', name_ar: 'شارع الجمهورية', name_en: 'Gomhoureya St', slug: 'gomhoureya', latitude: 31.0390, longitude: 31.3780 },
      { id: 'mansoura-nozha', name_ar: 'حي النزهة', name_en: 'El Nozha', slug: 'nozha', latitude: 31.0310, longitude: 31.3620 },
      { id: 'mansoura-talkha', name_ar: 'طلخا', name_en: 'Talkha', slug: 'talkha', latitude: 31.0520, longitude: 31.3790 },
    ],
  },
  {
    id: 'tanta',
    name_ar: 'طنطا',
    name_en: 'Tanta',
    slug: 'tanta',
    latitude: 30.7865,
    longitude: 31.0004,
    areas: [
      { id: 'tanta-geish', name_ar: 'شارع الجيش', name_en: 'El Geish St', slug: 'tanta-geish', latitude: 30.7890, longitude: 31.0010 },
      { id: 'tanta-station', name_ar: 'ميدان المحطة', name_en: 'Station Square', slug: 'tanta-station', latitude: 30.7840, longitude: 31.0020 },
      { id: 'tanta-stad', name_ar: 'منطقة الاستاد', name_en: 'El Estad District', slug: 'tanta-stad', latitude: 30.8010, longitude: 30.9950 },
      { id: 'tanta-nahas', name_ar: 'شارع النحاس', name_en: 'El Nahas St', slug: 'nahas', latitude: 30.7930, longitude: 30.9980 },
      { id: 'tanta-saeed', name_ar: 'شارع سعيد', name_en: 'Saeed St', slug: 'saeed', latitude: 30.7950, longitude: 31.0040 },
      { id: 'tanta-qohafa', name_ar: 'قحافة', name_en: 'Qohafa', slug: 'qohafa', latitude: 30.8060, longitude: 31.0080 },
      { id: 'tanta-siger', name_ar: 'سيجر', name_en: 'Siger', slug: 'siger', latitude: 30.7780, longitude: 30.9910 },
    ],
  },
  {
    id: 'zagazig',
    name_ar: 'الزقازيق',
    name_en: 'Zagazig',
    slug: 'zagazig',
    latitude: 30.5877,
    longitude: 31.5020,
    areas: [
      { id: 'zagazig-qawmeya', name_ar: 'حي القومية', name_en: 'El Qawmeya', slug: 'qawmeya', latitude: 30.5910, longitude: 31.5030 },
      { id: 'zagazig-villas', name_ar: 'فلل الجامعة', name_en: 'University Villas', slug: 'villas', latitude: 30.5980, longitude: 31.4980 },
      { id: 'zagazig-talba', name_ar: 'شارع طلبة عويضة', name_en: 'Talba Eweida St', slug: 'talba-eweida', latitude: 30.5950, longitude: 31.5070 },
      { id: 'zagazig-mohafaza', name_ar: 'شارع المحافظة', name_en: 'El Mohafaza St', slug: 'mohafaza', latitude: 30.5870, longitude: 31.5020 },
      { id: 'zagazig-10th-ramadan', name_ar: 'العاشر من رمضان', name_en: '10th of Ramadan', slug: '10th-ramadan', latitude: 30.3010, longitude: 31.7430 },
    ],
  },
  {
    id: 'portsaid',
    name_ar: 'بورسعيد',
    name_en: 'Port Said',
    slug: 'portsaid',
    latitude: 31.2653,
    longitude: 32.3019,
    areas: [
      { id: 'portsaid-sharq', name_ar: 'حي الشرق', name_en: 'El Sharq', slug: 'sharq', latitude: 31.2650, longitude: 32.3020 },
      { id: 'portsaid-portfouad', name_ar: 'بورفؤاد', name_en: 'Port Fouad', slug: 'portfouad', latitude: 31.2480, longitude: 32.3210 },
      { id: 'portsaid-tarhelbahr', name_ar: 'طرح البحر', name_en: 'Tarh El Bahr', slug: 'tarh-el-bahr', latitude: 31.2720, longitude: 32.2960 },
      { id: 'portsaid-manakh', name_ar: 'حي المناخ', name_en: 'El Manakh', slug: 'manakh', latitude: 31.2610, longitude: 32.2880 },
      { id: 'portsaid-arab', name_ar: 'حي العرب', name_en: 'El Arab', slug: 'arab', latitude: 31.2580, longitude: 32.2890 },
      { id: 'portsaid-zohour', name_ar: 'حي الزهور', name_en: 'El Zohour', slug: 'zohour', latitude: 31.2510, longitude: 32.2740 },
    ],
  },
  {
    id: 'ismailia',
    name_ar: 'الإسماعيلية',
    name_en: 'Ismailia',
    slug: 'ismailia',
    latitude: 30.5965,
    longitude: 32.2715,
    areas: [
      { id: 'ismailia-nemra6', name_ar: 'نمرة 6', name_en: 'Nemra 6', slug: 'nemra6', latitude: 30.5920, longitude: 32.2740 },
      { id: 'ismailia-afrang', name_ar: 'حي الأفرنج', name_en: 'El Afrang', slug: 'afrang', latitude: 30.6010, longitude: 32.2690 },
      { id: 'ismailia-sheikhzayed', name_ar: 'الشيخ زايد', name_en: 'Sheikh Zayed', slug: 'sheikhzayed', latitude: 30.6180, longitude: 32.2880 },
      { id: 'ismailia-malaha', name_ar: 'كورنيش الملاحة', name_en: 'Malaha Corniche', slug: 'malaha', latitude: 30.5890, longitude: 32.2780 },
    ],
  },
  {
    id: 'suez',
    name_ar: 'السويس',
    name_en: 'Suez',
    slug: 'suez',
    latitude: 29.9668,
    longitude: 32.5498,
    areas: [
      { id: 'suez-porttewfik', name_ar: 'بورتوفيق', name_en: 'Port Tewfik', slug: 'port-tewfik', latitude: 29.9480, longitude: 32.5620 },
      { id: 'suez-corniche', name_ar: 'كورنيش السويس', name_en: 'Corniche', slug: 'corniche', latitude: 29.9620, longitude: 32.5560 },
      { id: 'suez-center', name_ar: 'حي السويس', name_en: 'Suez District', slug: 'suez-center', latitude: 29.9730, longitude: 32.5510 },
      { id: 'suez-arbaeen', name_ar: 'حي الأربعين', name_en: 'El Arbaeen', slug: 'arbaeen', latitude: 29.9810, longitude: 32.5390 },
    ],
  },
  {
    id: 'damietta',
    name_ar: 'دمياط',
    name_en: 'Damietta',
    slug: 'damietta',
    latitude: 31.4175,
    longitude: 31.8144,
    areas: [
      { id: 'damietta-new', name_ar: 'دمياط الجديدة', name_en: 'New Damietta', slug: 'new-damietta', latitude: 31.4380, longitude: 31.6680 },
      { id: 'damietta-raselbar-lesan', name_ar: 'رأس البر - اللسان', name_en: 'Ras El Bar - El Lesan', slug: 'raselbar-lesan', latitude: 31.5120, longitude: 31.8210 },
      { id: 'damietta-raselbar-nile', name_ar: 'رأس البر - شارع النيل', name_en: 'Ras El Bar - Nile St', slug: 'raselbar-nile', latitude: 31.5050, longitude: 31.8180 },
      { id: 'damietta-center', name_ar: 'وسط البلد', name_en: 'City Center', slug: 'damietta-center', latitude: 31.4170, longitude: 31.8140 },
    ],
  },
  {
    id: 'banha',
    name_ar: 'بنها',
    name_en: 'Banha',
    slug: 'banha',
    latitude: 30.4660,
    longitude: 31.1859,
    areas: [
      { id: 'banha-felal', name_ar: 'حي الفلل', name_en: 'El Felal', slug: 'felal', latitude: 30.4680, longitude: 31.1840 },
      { id: 'banha-corniche', name_ar: 'كورنيش النيل', name_en: 'Corniche', slug: 'corniche', latitude: 30.4640, longitude: 31.1820 },
      { id: 'banha-colleges', name_ar: 'كفر السرايا', name_en: 'Kafr El Saraya', slug: 'colleges', latitude: 30.4720, longitude: 31.1910 },
      { id: 'banha-obour', name_ar: 'مدينة العبور', name_en: 'El Obour City', slug: 'obour', latitude: 30.2280, longitude: 31.4720 },
    ],
  },
  {
    id: 'asyut',
    name_ar: 'أسيوط',
    name_en: 'Asyut',
    slug: 'asyut',
    latitude: 27.1809,
    longitude: 31.1837,
    areas: [
      { id: 'asyut-university', name_ar: 'حي الجامعة', name_en: 'University District', slug: 'university', latitude: 27.1890, longitude: 31.1710 },
      { id: 'asyut-nemeis', name_ar: 'شارع النميس', name_en: 'Nemeis St', slug: 'nemeis', latitude: 27.1810, longitude: 31.1890 },
      { id: 'asyut-gomhoureya', name_ar: 'شارع الجمهورية', name_en: 'El Gomhoureya St', slug: 'gomhoureya', latitude: 27.1840, longitude: 31.1850 },
      { id: 'asyut-nasser', name_ar: 'مدينة ناصر', name_en: 'Nasser City', slug: 'nasser-city', latitude: 27.1980, longitude: 31.2020 },
      { id: 'asyut-new', name_ar: 'أسيوط الجديدة', name_en: 'New Asyut', slug: 'new-asyut', latitude: 27.2410, longitude: 31.3320 },
    ],
  },
  {
    id: 'fayoum',
    name_ar: 'الفيوم',
    name_en: 'Fayoum',
    slug: 'fayoum',
    latitude: 29.3084,
    longitude: 30.8428,
    areas: [
      { id: 'fayoum-masala', name_ar: 'المسلة', name_en: 'El Masala', slug: 'masala', latitude: 29.3140, longitude: 30.8410 },
      { id: 'fayoum-lotfallah', name_ar: 'حي لطف الله', name_en: 'Lotfallah', slug: 'lotfallah', latitude: 29.3210, longitude: 30.8350 },
      { id: 'fayoum-dalla', name_ar: 'دلة', name_en: 'Dalla', slug: 'dalla', latitude: 29.3240, longitude: 30.8310 },
      { id: 'fayoum-kiman', name_ar: 'كيمان فارس', name_en: 'Kiman Fares', slug: 'kiman', latitude: 29.3080, longitude: 30.8490 },
    ],
  },
  {
    id: 'benisuef',
    name_ar: 'بني سويف',
    name_en: 'Beni Suef',
    slug: 'benisuef',
    latitude: 29.0661,
    longitude: 31.0994,
    areas: [
      { id: 'benisuef-eastnile', name_ar: 'بني سويف الجديدة', name_en: 'New Beni Suef', slug: 'new-benisuef', latitude: 29.0710, longitude: 31.1210 },
      { id: 'benisuef-sharqnile', name_ar: 'شرق النيل', name_en: 'East of Nile', slug: 'sharq-nile', latitude: 29.0680, longitude: 31.1150 },
      { id: 'benisuef-aref', name_ar: 'شارع عبد السلام عارف', name_en: 'Aref St', slug: 'aref-st', latitude: 29.0620, longitude: 31.0940 },
      { id: 'benisuef-corniche', name_ar: 'كورنيش بني سويف', name_en: 'Corniche', slug: 'corniche', latitude: 29.0740, longitude: 31.0990 },
    ],
  },
  {
    id: 'minya',
    name_ar: 'المنيا',
    name_en: 'Minya',
    slug: 'minya',
    latitude: 28.1099,
    longitude: 30.7503,
    areas: [
      { id: 'minya-corniche', name_ar: 'كورنيش المنيا', name_en: 'Corniche', slug: 'corniche', latitude: 28.1120, longitude: 30.7510 },
      { id: 'minya-tahagussein', name_ar: 'شارع طه حسين', name_en: 'Taha Hussein St', slug: 'taha-hussein', latitude: 28.1150, longitude: 30.7490 },
      { id: 'minya-shalaby', name_ar: 'شلبي', name_en: 'Shalaby', slug: 'shalaby', latitude: 28.1280, longitude: 30.7420 },
      { id: 'minya-new', name_ar: 'المنيا الجديدة', name_en: 'New Minya', slug: 'new-minya', latitude: 28.0920, longitude: 30.8210 },
    ],
  },
  {
    id: 'sohag',
    name_ar: 'سوهاج',
    name_en: 'Sohag',
    slug: 'sohag',
    latitude: 26.5569,
    longitude: 31.6948,
    areas: [
      { id: 'sohag-corniche-east', name_ar: 'كورنيش النيل الشرقي', name_en: 'East Corniche', slug: 'corniche-east', latitude: 26.5590, longitude: 31.6960 },
      { id: 'sohag-corniche-west', name_ar: 'كورنيش النيل الغربي', name_en: 'West Corniche', slug: 'corniche-west', latitude: 26.5540, longitude: 31.6930 },
      { id: 'sohag-city', name_ar: 'سيتي', name_en: 'City Area', slug: 'city-area', latitude: 26.5510, longitude: 31.6920 },
      { id: 'sohag-15st', name_ar: 'شارع 15', name_en: '15th St', slug: '15st', latitude: 26.5480, longitude: 31.6910 },
      { id: 'sohag-new', name_ar: 'سوهاج الجديدة', name_en: 'New Sohag', slug: 'new-sohag', latitude: 26.4680, longitude: 31.6140 },
    ],
  },
  {
    id: 'qena',
    name_ar: 'قنا',
    name_en: 'Qena',
    slug: 'qena',
    latitude: 26.1551,
    longitude: 32.7160,
    areas: [
      { id: 'qena-center', name_ar: 'وسط البلد والمحطة', name_en: 'Downtown & Station', slug: 'center', latitude: 26.1610, longitude: 32.7180 },
      { id: 'qena-corniche', name_ar: 'كورنيش قنا', name_en: 'Corniche', slug: 'corniche', latitude: 26.1580, longitude: 32.7120 },
      { id: 'qena-new', name_ar: 'قنا الجديدة', name_en: 'New Qena', slug: 'new-qena', latitude: 26.1950, longitude: 32.7650 },
    ],
  },
  {
    id: 'luxor',
    name_ar: 'الأقصر',
    name_en: 'Luxor',
    slug: 'luxor',
    latitude: 25.6872,
    longitude: 32.6396,
    areas: [
      { id: 'luxor-corniche', name_ar: 'كورنيش الأقصر', name_en: 'Corniche', slug: 'corniche', latitude: 25.6980, longitude: 32.6390 },
      { id: 'luxor-khaled', name_ar: 'شارع خالد بن الوليد', name_en: 'Khaled Ibn El Walid', slug: 'khaled-st', latitude: 25.6920, longitude: 32.6360 },
      { id: 'luxor-tvst', name_ar: 'شارع التلفزيون', name_en: 'TV St', slug: 'tv-st', latitude: 25.6890, longitude: 32.6340 },
      { id: 'luxor-awameya', name_ar: 'العوامية', name_en: 'Awameya', slug: 'awameya', latitude: 25.6820, longitude: 32.6310 },
    ],
  },
  {
    id: 'aswan',
    name_ar: 'أسوان',
    name_en: 'Aswan',
    slug: 'aswan',
    latitude: 24.0889,
    longitude: 32.8998,
    areas: [
      { id: 'aswan-corniche', name_ar: 'كورنيش أسوان', name_en: 'Corniche', slug: 'corniche', latitude: 24.0890, longitude: 32.8990 },
      { id: 'aswan-atlas', name_ar: 'حي أطلس', name_en: 'Atlas', slug: 'atlas', latitude: 24.0920, longitude: 32.9020 },
      { id: 'aswan-aqad', name_ar: 'حي العقاد', name_en: 'El Aqad', slug: 'aqad', latitude: 24.0720, longitude: 32.8910 },
      { id: 'aswan-sahari', name_ar: 'صحاري والجامعة', name_en: 'Sahari & University', slug: 'sahari', latitude: 23.9850, longitude: 32.8620 },
    ],
  },
  {
    id: 'hurghada',
    name_ar: 'الغردقة',
    name_en: 'Hurghada',
    slug: 'hurghada',
    latitude: 27.2579,
    longitude: 33.8116,
    areas: [
      { id: 'hurghada-mamsha', name_ar: 'الممشى السياحي', name_en: 'El Mamsha', slug: 'mamsha', latitude: 27.1890, longitude: 33.8210 },
      { id: 'hurghada-kawthar', name_ar: 'حي الكوثر', name_en: 'El Kawthar', slug: 'kawthar', latitude: 27.1950, longitude: 33.8180 },
      { id: 'hurghada-dahar', name_ar: 'الدهار ووسط المدينة', name_en: 'El Dahar', slug: 'dahar', latitude: 27.2510, longitude: 33.8120 },
      { id: 'hurghada-sahlhasheesh', name_ar: 'سهل حشيش', name_en: 'Sahl Hasheesh', slug: 'sahl-hasheesh', latitude: 27.0500, longitude: 33.8800 },
      { id: 'hurghada-makadi', name_ar: 'مكادي باي', name_en: 'Makadi Bay', slug: 'makadi-bay', latitude: 26.9800, longitude: 33.9000 },
    ],
  },
  {
    id: 'gouna',
    name_ar: 'الجونة',
    name_en: 'El Gouna',
    slug: 'el-gouna',
    latitude: 27.3940,
    longitude: 33.6780,
    areas: [
      { id: 'gouna-marina', name_ar: 'مارينا الجونة (أبو تيج)', name_en: 'Abu Tig Marina', slug: 'marina', latitude: 27.4010, longitude: 33.6820 },
      { id: 'gouna-downtown', name_ar: 'وسط البلد الجونة', name_en: 'Downtown El Gouna', slug: 'downtown', latitude: 27.3940, longitude: 33.6780 },
      { id: 'gouna-resorts', name_ar: 'منتجعات وفنادق الجونة', name_en: 'El Gouna Resorts', slug: 'resorts', latitude: 27.3880, longitude: 33.6720 },
    ],
  },
  {
    id: 'sharm',
    name_ar: 'شرم الشيخ',
    name_en: 'Sharm El Sheikh',
    slug: 'sharm-el-sheikh',
    latitude: 27.9158,
    longitude: 34.3299,
    areas: [
      { id: 'sharm-naama', name_ar: 'خليج نعمة', name_en: 'Naama Bay', slug: 'naama-bay', latitude: 27.9150, longitude: 34.3290 },
      { id: 'sharm-hadaba', name_ar: 'الهضبة', name_en: 'El Hadaba', slug: 'hadaba', latitude: 27.8680, longitude: 34.3120 },
      { id: 'sharm-sharksbay', name_ar: 'خليج القرش', name_en: 'Sharks Bay', slug: 'sharks-bay', latitude: 27.9620, longitude: 34.3890 },
      { id: 'sharm-nabq', name_ar: 'نبق باي', name_en: 'Nabq Bay', slug: 'nabq-bay', latitude: 28.0210, longitude: 34.4320 },
    ],
  },
  {
    id: 'dahab',
    name_ar: 'دهب',
    name_en: 'Dahab',
    slug: 'dahab',
    latitude: 28.5010,
    longitude: 34.5180,
    areas: [
      { id: 'dahab-masbat', name_ar: 'المسبط', name_en: 'El Masbat', slug: 'masbat', latitude: 28.5010, longitude: 34.5180 },
      { id: 'dahab-lighthouse', name_ar: 'اللايت هاوس', name_en: 'Lighthouse', slug: 'lighthouse', latitude: 28.5070, longitude: 34.5210 },
      { id: 'dahab-masbah', name_ar: 'المسبحة', name_en: 'El Masbah', slug: 'masbah', latitude: 28.4980, longitude: 34.5120 },
      { id: 'dahab-asala', name_ar: 'العسلة', name_en: 'El Asala', slug: 'asala', latitude: 28.5140, longitude: 34.5240 },
    ],
  },
]

// Preset covers for instant selection
const PRESET_COVERS = [
  { label: 'مكتبة كلاسيكية 📚', url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80' },
  { label: 'مقهى قراءة ثقافي ☕', url: 'https://images.unsplash.com/photo-1507842229451-7f01be44c067?auto=format&fit=crop&w=1200&q=80' },
  { label: 'جلسة مناقشة وكتب 🛋️', url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1200&q=80' },
  { label: 'واحة قراءة خضراء 🌿', url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80' },
  { label: 'صالون أدبي عريق 🏛️', url: 'https://images.unsplash.com/photo-1507842229451-7f01be7ac102?auto=format&fit=crop&w=1200&q=80' },
  { label: 'كورنيش وبحر وقراءة 🌊', url: 'https://images.unsplash.com/photo-1526721940322-10fb6e3ae94a?auto=format&fit=crop&w=1200&q=80' },
]

// Preset logos
const PRESET_LOGOS = [
  { label: 'شعار كتاب 📖', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=300&q=80' },
  { label: 'فنجان وفكر ☕', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=300&q=80' },
  { label: 'مصباح المعرفة 💡', url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=300&q=80' },
  { label: 'شجرة المعرفة 🌳', url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=300&q=80' },
  { label: 'فنون وروايات 🎨', url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=300&q=80' },
]

// Section label helper
function SectionLabel({ icon, labelAr, labelEn, lang }: { icon: React.ReactNode; labelAr: string; labelEn: string; lang: string }) {
  return (
    <div className="flex items-center gap-2 pt-2 pb-1 border-b border-border/60">
      <span className="text-primary">{icon}</span>
      <span className="text-xs font-black text-foreground uppercase tracking-wider">
        {lang === 'ar' ? labelAr : labelEn}
      </span>
      <div className="flex-1" />
    </div>
  )
}

// Reusable input wrapper
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-black text-foreground block">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = "w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition"

interface CommunitiesListClientProps {
  initialCommunities: Community[]
  currentUserId?: string | null
  userRole?: string | null
  cities?: Array<{
    id: string
    name_ar: string
    name_en: string
    slug: string
    areas?: Array<{
      id: string
      name_ar: string
      name_en: string
      slug: string
      latitude?: number
      longitude?: number
    }>
  }>
}

export function CommunitiesListClient({
  initialCommunities,
  currentUserId,
  userRole,
  cities = [],
}: CommunitiesListClientProps) {
  const { lang } = useLanguage()
  const isRTL = lang === 'ar'
  const router = useRouter()
  const isPlatformAdmin = Boolean(userRole === 'ADMIN' || userRole === 'MODERATOR')

  const [communities, setCommunities] = useState<Community[]>(initialCommunities)
  const [selectedType, setSelectedType] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Optimistic membership tracking
  const [membershipMap, setMembershipMap] = useState<Record<string, 'NONE' | 'PENDING' | 'APPROVED'>>(() =>
    initialCommunities.reduce((acc, c) => {
      acc[c.id] = c.membership_status === 'PENDING' || c.membership_status === 'APPROVED'
        ? c.membership_status
        : c.is_member
          ? 'APPROVED'
          : 'NONE'
      return acc
    }, {} as Record<string, 'NONE' | 'PENDING' | 'APPROVED'>)
  )

  // Merged cities (props + fallbacks)
  const effectiveCities = useMemo(() => {
    if (cities && cities.length > 0) return cities
    return DEFAULT_EGYPT_CITIES
  }, [cities])

  // ── Modal state ─────────────────────────────────────────────
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Section 1 – Identity
  const [nameAr, setNameAr]               = useState('')
  const [nameEn, setNameEn]               = useState('')
  const [descAr, setDescAr]               = useState('')
  const [descEn, setDescEn]               = useState('')
  const [orgType, setOrgType]             = useState<CommunityOrgType>('CLUB')
  const [coverUrl, setCoverUrl]           = useState('')
  const [logoUrl, setLogoUrl]             = useState('')

  // Section 2 – Location & Safe Hub
  const [selectedCityId, setSelectedCityId]   = useState('')
  const [selectedAreaId, setSelectedAreaId]   = useState('')
  const [locationText, setLocationText]       = useState('')
  const [latitude, setLatitude]               = useState<number | null>(null)
  const [longitude, setLongitude]             = useState<number | null>(null)

  // Safe Meetup Hub details
  const [hubName, setHubName]                 = useState('')
  const [hubAddress, setHubAddress]           = useState('')
  const [hubInstructions, setHubInstructions] = useState('')
  const [hubLat, setHubLat]                   = useState<number | null>(null)
  const [hubLng, setHubLng]                   = useState<number | null>(null)
  const [hubPhotoUrl, setHubPhotoUrl]         = useState('')

  // Map picker controls
  const [showMapPicker, setShowMapPicker]     = useState(false)
  const [activeMapMode, setActiveMapMode]     = useState<'community' | 'hub'>('community')
  const [mapCenterHint, setMapCenterHint]     = useState<{ lat: number; lng: number; zoom?: number } | null>(null)

  // Section 3 – Contact & Social
  const [websiteUrl, setWebsiteUrl]       = useState('')
  const [contactEmail, setContactEmail]   = useState('')
  const [contactPhone, setContactPhone]   = useState('')
  const [instagram, setInstagram]         = useState('')
  const [facebook, setFacebook]           = useState('')
  const [whatsapp, setWhatsapp]           = useState('')
  const [telegram, setTelegram]           = useState('')

  // Section 4 – Governance & Tags (Multiple Choice)
  const [tags, setTags]                   = useState<string[]>(['fiction-novels', 'weekly-cafe-meetups'])
  const [requiresApproval, setRequiresApproval] = useState(false)
  const [rulesAr, setRulesAr]             = useState('')
  const [rulesEn, setRulesEn]             = useState('')

  const [createDistrictSearch, setCreateDistrictSearch] = useState('')

  // Available areas for currently selected city
  const selectedCityObj = useMemo(() => {
    return effectiveCities.find(c => c.id === selectedCityId)
  }, [effectiveCities, selectedCityId])

  const availableAreas = useMemo(() => {
    return selectedCityObj?.areas ?? []
  }, [selectedCityObj])

  const filteredCreateDistricts = useMemo(() => {
    if (!availableAreas) return []
    if (!createDistrictSearch.trim()) return availableAreas
    const q = createDistrictSearch.trim().toLowerCase()
    return availableAreas.filter(a =>
      a.name_ar.toLowerCase().includes(q) ||
      a.name_en.toLowerCase().includes(q)
    )
  }, [availableAreas, createDistrictSearch])

  // Handle City Change
  const handleCityChange = (cityId: string) => {
    setSelectedCityId(cityId)
    setSelectedAreaId('')
    setCreateDistrictSearch('')

    const city = effectiveCities.find(c => c.id === cityId)
    if (city) {
      const cityName = isRTL ? city.name_ar : city.name_en
      setLocationText(cityName)

      // Center map on this city
      const lat = (city as any).latitude || 30.0444
      const lng = (city as any).longitude || 31.2357
      setLatitude(lat)
      setLongitude(lng)
      setMapCenterHint({ lat, lng, zoom: 12 })
      setShowMapPicker(true)
    }
  }

  // Handle Area Change
  const handleAreaChange = (areaId: string) => {
    setSelectedAreaId(areaId)
    const area = availableAreas.find(a => a.id === areaId)
    if (area && selectedCityObj) {
      const cityName = isRTL ? selectedCityObj.name_ar : selectedCityObj.name_en
      const areaName = isRTL ? area.name_ar : area.name_en
      setLocationText(`${areaName}، ${cityName}`)

      if (area.latitude && area.longitude) {
        setLatitude(area.latitude)
        setLongitude(area.longitude)
        setMapCenterHint({ lat: area.latitude, lng: area.longitude, zoom: 15 })
        setShowMapPicker(true)
      }
    }
  }

  // Handle Map Pin Drops
  const handleCommunityLocationFromMap = (coords: { lat: number; lng: number; address?: string }) => {
    setLatitude(coords.lat)
    setLongitude(coords.lng)
    if (coords.address) {
      setLocationText(coords.address)
    }
  }

  const handleHubLocationFromMap = (coords: { lat: number; lng: number; address?: string }) => {
    setHubLat(coords.lat)
    setHubLng(coords.lng)
    if (coords.address && !hubAddress.trim()) {
      setHubAddress(coords.address)
    }
  }

  const resetForm = () => {
    setNameAr(''); setNameEn(''); setDescAr(''); setDescEn('')
    setOrgType('CLUB'); setCoverUrl(''); setLogoUrl('')
    setSelectedCityId(''); setSelectedAreaId(''); setLocationText('')
    setLatitude(null); setLongitude(null); setHubLat(null); setHubLng(null); setHubPhotoUrl('')
    setHubName(''); setHubAddress(''); setHubInstructions('')
    setShowMapPicker(false); setActiveMapMode('community')
    setWebsiteUrl(''); setContactEmail(''); setContactPhone('')
    setInstagram(''); setFacebook(''); setWhatsapp(''); setTelegram('')
    setTags(['fiction-novels', 'weekly-cafe-meetups'])
    setRequiresApproval(false); setRulesAr(''); setRulesEn('')
  }

  // ── Filter ──────────────────────────────────────────────────
  const filteredCommunities = communities.filter(c => {
    if (selectedType !== 'ALL' && c.org_type !== selectedType) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const nameMatch = c.name.toLowerCase().includes(q) || (c.name_ar && c.name_ar.includes(q))
      const hubMatch = (c.hub_name && c.hub_name.toLowerCase().includes(q)) || (c.hub_address && c.hub_address.toLowerCase().includes(q))
      const locMatch = c.location_text && c.location_text.toLowerCase().includes(q)
      const tagMatch = (c.tags || []).some(t => t.includes(q))
      if (!nameMatch && !hubMatch && !locMatch && !tagMatch) return false
    }
    return true
  })

  // ── Join/leave ───────────────────────────────────────────────
  const handleToggleJoin = async (e: React.MouseEvent, communityId: string) => {
    e.preventDefault(); e.stopPropagation()
    if (!currentUserId) {
      router.push('/login?redirectTo=/communities')
      return
    }
    const prev = membershipMap[communityId] ?? 'NONE'
    const optimistic: 'NONE' | 'PENDING' | 'APPROVED' =
      prev === 'NONE'
        ? (communities.find(c => c.id === communityId)?.requires_approval ? 'PENDING' : 'APPROVED')
        : 'NONE'
    setMembershipMap(m => ({ ...m, [communityId]: optimistic }))
    try {
      const result = await toggleCommunityMembership(communityId, currentUserId)
      setMembershipMap(m => ({ ...m, [communityId]: result.status }))
    } catch {
      setMembershipMap(m => ({ ...m, [communityId]: prev }))
    }
  }

  // ── Submit ───────────────────────────────────────────────────
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUserId) { router.push('/login?redirectTo=/communities'); return }
    if (!nameAr.trim() && !nameEn.trim()) return
    setIsSubmitting(true)
    try {
      const created = await createCommunity({
        name:             nameEn.trim() || nameAr.trim(),
        name_ar:          nameAr.trim() || nameEn.trim(),
        description:      descEn.trim() || descAr.trim(),
        description_ar:   descAr.trim() || descEn.trim(),
        org_type:         orgType,
        cover_image_url:  coverUrl.trim() || undefined,
        admin_id:         currentUserId,

        // Location & Hub fields
        ...(selectedCityId && { city_id: selectedCityId }),
        ...(selectedAreaId && { area_id: selectedAreaId }),
        ...(locationText.trim() && { location_text: locationText.trim() }),
        ...(latitude !== null && { latitude }),
        ...(longitude !== null && { longitude }),

        hub_name:         hubName.trim(),
        hub_address:      hubAddress.trim(),
        hub_instructions: hubInstructions.trim(),
        ...(hubLat !== null && { hub_lat: hubLat }),
        ...(hubLng !== null && { hub_lng: hubLng }),
        ...(hubPhotoUrl.trim() && { hub_photo_url: hubPhotoUrl.trim() }),

        // Branding
        ...(logoUrl.trim() && { logo_url: logoUrl.trim() }),

        // Online & Social
        ...(websiteUrl.trim()    && { website_url: websiteUrl.trim() }),
        ...(contactEmail.trim()  && { contact_email: contactEmail.trim() }),
        ...(contactPhone.trim()  && { contact_phone: contactPhone.trim() }),
        ...(tags.length          && { tags }),
        ...(rulesAr.trim()       && { rules_ar: rulesAr.trim() }),
        ...(rulesEn.trim()       && { rules_en: rulesEn.trim() }),
        ...(requiresApproval     && { requires_approval: true }),
        ...((instagram || facebook || whatsapp || telegram) && {
          social_links: {
            ...(instagram && { instagram }),
            ...(facebook  && { facebook }),
            ...(whatsapp  && { whatsapp }),
            ...(telegram  && { telegram }),
          },
        }),
      } as Parameters<typeof createCommunity>[0])

      setCommunities(prev => [created, ...prev])
      setShowCreateModal(false)
      resetForm()
      router.push(`/communities/${created.slug}`)
    } catch (err) {
      console.error('Error creating community:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <MainLayout>
      <div className="page-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-10 pb-24">

        {/* ── HERO BANNER ────────────────────────────────────────── */}
        <div className="relative rounded-3xl bg-linear-to-r from-emerald-950 via-teal-900 to-slate-900 border-2 border-emerald-500/30 p-6 sm:p-10 lg:p-12 text-white overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.22),transparent_60%)]" />
          <div className="absolute -bottom-24 -end-24 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-black shadow-xs">
                <ShieldCheck className="h-4 w-4" />
                <span>{lang === 'ar' ? 'مجتمعات موثوقة ونقاط لقاء آمنة معتمدة' : 'Verified Communities & Safe Meetup Hubs'}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                {lang === 'ar' ? (
                  <>نوادي القراءة ومجموعات <span className="text-emerald-400">التبادل الآمن</span> 🌳</>
                ) : (
                  <>Reading Communities & <span className="text-emerald-400">Safe Hubs</span> 🌳</>
                )}
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-xl">
                {lang === 'ar'
                  ? 'انضم إلى مجتمع قراء حيك، جامعتك أو تخصصك. استعر وتبادل الكتب مجاناً والتقِ في مقاهي ومكتبات هادئة ومعتمدة بنقاط تسليم آمنة.'
                  : 'Join local readers in your neighborhood, campus, or tech circle. Swap, borrow, and meet at certified safe cafe and library hubs.'}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => {
                    if (!currentUserId) {
                      router.push('/login?redirectTo=/communities')
                    } else {
                      setShowCreateModal(true)
                    }
                  }}
                  className="rounded-2xl font-black text-xs gap-2 shadow-xl shadow-emerald-950/60 cursor-pointer px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all hover:scale-102 border-0"
                >
                  <Plus className="h-4 w-4 stroke-[3]" />
                  <span>{lang === 'ar' ? 'أنشئ مجتمع قراءة جديد' : 'Create Reading Community'}</span>
                </Button>

                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-bold text-slate-200">
                  <Coffee className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{lang === 'ar' ? 'تسليم يدوي آمن في مقاهي ومكتبات' : 'Safe In-Person Pickups'}</span>
                </div>
              </div>
            </div>

            {/* Quick Hero Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-3 shrink-0 lg:w-64">
              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-white space-y-0.5">
                <div className="text-xl sm:text-2xl font-black text-emerald-400">
                  {communities.length}
                </div>
                <div className="text-[11px] font-bold text-slate-300">
                  {lang === 'ar' ? 'مجتمع قراءة نشط' : 'Active Communities'}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-white space-y-0.5">
                <div className="text-xl sm:text-2xl font-black text-emerald-400">
                  {communities.reduce((acc, c) => acc + (c.books_count || 0), 0)}
                </div>
                <div className="text-[11px] font-bold text-slate-300">
                  {lang === 'ar' ? 'كتاب متاح في الرفوف' : 'Books on Shelves'}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-white space-y-0.5 col-span-2 sm:col-span-1 lg:col-span-1">
                <div className="text-xl sm:text-2xl font-black text-emerald-400">
                  100%
                </div>
                <div className="text-[11px] font-bold text-slate-300">
                  {lang === 'ar' ? 'نقاط لقاء آمنة معتمدة' : 'Safe Verified Hubs'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── FILTER & SEARCH SECTION ───────────────────────────── */}
        <div className="space-y-6">
          {/* Org Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
            {[
              { id: 'ALL',          labelAr: 'كافة المجتمعات',     labelEn: 'All Communities', emoji: '🌐' },
              { id: 'NEIGHBORHOOD', labelAr: 'أحياء ومناطق 🌳',    labelEn: 'Neighborhoods',   emoji: '🌳' },
              { id: 'UNIVERSITY',   labelAr: 'جامعات 🎓',          labelEn: 'Universities',    emoji: '🎓' },
              { id: 'CLUB',         labelAr: 'أندية قراءة 📚',      labelEn: 'Book Clubs',      emoji: '📚' },
              { id: 'COMPANY',      labelAr: 'تقنية وعمل 💼',       labelEn: 'Tech & Work',     emoji: '💼' },
              { id: 'SCHOOL',       labelAr: 'مدارس 🏫',           labelEn: 'Schools',         emoji: '🏫' },
              { id: 'MOSQUE',       labelAr: 'مساجد ومراكز 🕌',    labelEn: 'Mosques',         emoji: '🕌' },
              { id: 'OTHER',        labelAr: 'أخرى 🤝',            labelEn: 'Other',           emoji: '🤝' },
            ].map(tab => {
              const isSelected = selectedType === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedType(tab.id)}
                  className={cn(
                    'px-4 py-2.5 rounded-2xl text-xs font-black shrink-0 transition-all cursor-pointer flex items-center gap-1.5',
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-102'
                      : 'bg-card border-2 border-border/80 text-muted-foreground hover:text-foreground hover:border-primary/40'
                  )}
                >
                  <span>{tab.emoji}</span>
                  <span>{lang === 'ar' ? tab.labelAr : tab.labelEn}</span>
                </button>
              )
            })}
          </div>

          {/* Search Bar & Result Summary Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-lg">
              <Search className={cn('absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground', isRTL ? 'right-3.5' : 'left-3.5')} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={lang === 'ar' ? 'ابحث باسم المجتمع، الحي، نقطة اللقاء، أو الوسم...' : 'Search community, neighborhood, safe hub or tag...'}
                className={cn(
                  'w-full py-3 text-xs font-bold rounded-2xl bg-card border-2 border-border/80 focus:outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all shadow-xs',
                  isRTL ? 'pr-10 pl-9 text-right' : 'pl-10 pr-9 text-left'
                )}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className={cn('absolute top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground cursor-pointer', isRTL ? 'left-3' : 'right-3')}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="text-xs font-bold text-muted-foreground shrink-0 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>
                {lang === 'ar'
                  ? `عرض ${filteredCommunities.length} من أصل ${communities.length} مجتمع`
                  : `Showing ${filteredCommunities.length} of ${communities.length} communities`}
              </span>
            </div>
          </div>
        </div>

        {/* ── COMMUNITIES GRID ───────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredCommunities.map(community => {
            const isMember = membershipMap[community.id] ?? false
            const orgData = getOrgData(community.org_type)
            const commName = lang === 'ar' && community.name_ar ? community.name_ar : community.name
            const commDesc = lang === 'ar' && community.description_ar ? community.description_ar : community.description

            return (
              <div
                key={community.id}
                className="group rounded-3xl border-2 border-border/80 bg-card overflow-hidden shadow-xs hover:shadow-2xl hover:border-emerald-500/40 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Cover Photo & Logo Container */}
                  <div className="relative">
                    <Link
                      href={`/communities/${community.slug}`}
                      className="block relative h-48 sm:h-52 w-full overflow-hidden bg-muted cursor-pointer"
                      title={commName}
                    >
                      {community.cover_image_url ? (
                        <Image
                          src={community.cover_image_url}
                          alt={commName}
                          fill
                          className="object-cover group-hover:scale-106 transition-transform duration-700"
                          unoptimized={community.cover_image_url.startsWith('data:')}
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-tr from-emerald-500/20 to-primary/20 flex items-center justify-center text-4xl">
                          🌳
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                    </Link>

                    {/* Top Chips */}
                    <div className="absolute top-3 start-3 pointer-events-none">
                      <span className={cn('px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider backdrop-blur-md border shadow-xs', orgData.color)}>
                        {orgData.emoji} {lang === 'ar' ? orgData.labelAr : orgData.labelEn}
                      </span>
                    </div>

                    <div className="absolute top-3 end-3 flex items-center gap-1.5 pointer-events-none">
                      {community.requires_approval ? (
                        <span className="px-2 py-1 rounded-xl text-[10px] font-black backdrop-blur-md bg-amber-500/25 border border-amber-400/40 text-amber-200 flex items-center gap-1 shadow-xs">
                          <Lock className="h-3 w-3" />
                          <span>{lang === 'ar' ? 'بموافقة' : 'Approval'}</span>
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-xl text-[10px] font-black backdrop-blur-md bg-emerald-500/25 border border-emerald-400/40 text-emerald-200 flex items-center gap-1 shadow-xs">
                          <ShieldCheck className="h-3 w-3" />
                          <span>{lang === 'ar' ? 'مفتوح' : 'Open'}</span>
                        </span>
                      )}
                    </div>

                    {/* Logo/Avatar floating over cover edge - clickable to enter community */}
                    <Link
                      href={`/communities/${community.slug}`}
                      className="absolute -bottom-5 start-5 h-16 w-16 sm:h-18 sm:w-18 rounded-2xl overflow-hidden border-4 border-card bg-card shadow-xl shrink-0 cursor-pointer z-10 transition-transform group-hover:scale-105 active:scale-95"
                      title={commName}
                    >
                      {(community.logo_url || community.avatar_url) ? (
                        <Image
                          src={(community.logo_url || community.avatar_url)!}
                          alt={commName}
                          fill
                          className="object-cover"
                          unoptimized={(community.logo_url || community.avatar_url)?.startsWith('data:')}
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center font-black text-primary bg-primary/10 text-xl">
                          {community.name.charAt(0)}
                        </div>
                      )}
                    </Link>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 sm:p-6 pt-9 space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`/communities/${community.slug}`}>
                          <h3 className="text-base sm:text-lg font-black text-foreground group-hover:text-primary transition-colors leading-snug cursor-pointer line-clamp-1">
                            {commName}
                          </h3>
                        </Link>
                        {community.location_text && (
                          <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 shrink-0 bg-muted/60 px-2.5 py-1 rounded-xl border border-border/60">
                            <MapPin className="h-3 w-3 text-primary shrink-0" />
                            <span className="max-w-[120px] truncate">{community.location_text}</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {commDesc}
                      </p>
                    </div>

                    {/* Tags */}
                    {(community.tags || []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {(community.tags || []).slice(0, 4).map(t => (
                          <span key={t} className="px-2.5 py-0.5 rounded-full bg-primary/8 text-primary text-[10px] font-bold border border-primary/15">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Safe Pickup Hub Banner inside card */}
                    {community.hub_name && (
                      <div className="rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/25 p-3 sm:p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-black text-emerald-800 dark:text-emerald-300">
                          <div className="flex items-center gap-1.5">
                            <Coffee className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>{lang === 'ar' ? 'نقطة اللقاء الآمنة:' : 'Safe Hub:'}</span>
                          </div>
                          {(community.hub_lat && community.hub_lng) && (
                            <a
                              href={`https://maps.google.com/?q=${community.hub_lat},${community.hub_lng}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                            >
                              <span>{lang === 'ar' ? 'خريطة' : 'Map'}</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                        </div>
                        <p className="font-bold text-foreground text-xs line-clamp-1">{community.hub_name}</p>
                        {community.hub_address && (
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground truncate">
                            <MapPin className="h-3 w-3 text-emerald-600 shrink-0" />
                            <span className="truncate">{community.hub_address}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Stats Counter Row */}
                    <div className="flex items-center justify-between text-xs font-bold text-muted-foreground pt-2 border-t border-border/60">
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-primary" />
                        <span>{community.member_count} {lang === 'ar' ? 'عضو' : 'members'}</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>{community.books_count ?? 0}+ {lang === 'ar' ? 'كتاب متاح' : 'books'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-4 sm:p-5 bg-muted/25 border-t border-border/60 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={e => handleToggleJoin(e, community.id)}
                      className={cn(
                        'px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1',
                        isMember
                          ? 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border border-emerald-500/20'
                          : 'bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20'
                      )}
                    >
                      {isMember ? (lang === 'ar' ? '✓ عضو' : '✓ Joined') : (lang === 'ar' ? '+ انضمام' : '+ Join')}
                    </button>
                    {(isPlatformAdmin || (currentUserId && community.admin_id === currentUserId)) && (
                      <Link
                        href={`/communities/${community.slug}?tab=admin`}
                        className="px-2.5 py-2 rounded-xl text-[11px] font-bold bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition flex items-center gap-1 border border-amber-500/20"
                        title={lang === 'ar' ? 'لوحة تحكم الأدمن (تعديل وحذف)' : 'Admin Management (Edit & Delete)'}
                      >
                        <span>👑</span>
                        <span>{lang === 'ar' ? 'إدارة' : 'Admin'}</span>
                      </Link>
                    )}
                  </div>

                  <Link
                    href={`/communities/${community.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-black text-foreground hover:text-primary transition group-hover:translate-x-0.5"
                  >
                    <span>{lang === 'ar' ? 'استكشف الرف' : 'Explore'}</span>
                    <ArrowRight className={cn('h-3.5 w-3.5', isRTL && 'rotate-180')} />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        {/* Empty State */}
        {filteredCommunities.length === 0 && (
          <div className="text-center py-20 px-6 rounded-3xl border-2 border-dashed border-border/80 bg-muted/10 space-y-4 max-w-lg mx-auto">
            <div className="text-5xl">🌳</div>
            <h3 className="text-lg font-black text-foreground">
              {lang === 'ar' ? 'لم يتم العثور على أي مجتمعات مطابقة' : 'No matching communities found'}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {lang === 'ar'
                ? 'جرب البحث بكلمات أخرى أو اختر تصنيفاً آخر، أو كن أول من ينشئ مجتمع قراءة في هذه المنطقة.'
                : 'Try adjusting your search terms or filters, or be the first to start a community in this area.'}
            </p>
            {searchQuery && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setSearchQuery(''); setSelectedType('ALL') }}
                className="rounded-xl text-xs font-bold cursor-pointer"
              >
                {lang === 'ar' ? 'إعادة ضبط البحث والتصنيفات' : 'Reset Search & Filters'}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
          CREATE COMMUNITY MODAL — Full Profile Form
          ═══════════════════════════════════════════════════════ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-card border-2 border-border shadow-2xl overflow-hidden text-foreground">

            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-border bg-muted/30 shrink-0 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-primary/10 text-primary">👑</span>
                  {lang === 'ar' ? 'إنشاء مجتمع قراءة ونادي تبادل جديد' : 'Create New Reading Community'}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {lang === 'ar' ? 'ستكون أنت الأدمن وتدير الأعضاء والكتب ونقاط اللقاء الآمنة' : 'You will be the Admin managing members, books & safe meetup hubs'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setShowCreateModal(false); resetForm() }}
                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable body */}
            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

              {/* ── SECTION 1: IDENTITY & BRANDING ───────────── */}
              <SectionLabel icon={<Sparkles className="h-3.5 w-3.5" />} labelAr="1. هوية المجتمع والشعار والغلاف" labelEn="1. Identity, Logo & Cover" lang={lang} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label={lang === 'ar' ? 'الاسم بالعربية *' : 'Name (Arabic) *'} required>
                  <input type="text" required value={nameAr} onChange={e => setNameAr(e.target.value)} placeholder={lang === 'ar' ? 'مثال: نادي قراء المعادي' : 'e.g. نادي قراء المعادي'} className={inputCls} />
                </Field>
                <Field label={lang === 'ar' ? 'الاسم بالإنجليزية' : 'Name (English)'}>
                  <input type="text" value={nameEn} onChange={e => setNameEn(e.target.value)} placeholder="e.g. Maadi Bookworms Club" className={inputCls} />
                </Field>
              </div>

              {/* Org Type pills */}
              <Field label={lang === 'ar' ? 'نوع المجتمع والتصنيف التنظيمي *' : 'Organization Type *'} required>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ORG_TYPES.map(o => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setOrgType(o.value)}
                      className={cn(
                        'flex flex-col items-center gap-1 p-2.5 rounded-2xl border-2 text-[10px] font-black transition cursor-pointer',
                        orgType === o.value
                          ? 'border-primary bg-primary/10 text-primary shadow-xs'
                          : 'border-border/60 bg-muted/20 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                      )}
                    >
                      <span className="text-lg">{o.emoji}</span>
                      <span>{lang === 'ar' ? o.labelAr : o.labelEn}</span>
                    </button>
                  ))}
                </div>
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label={lang === 'ar' ? 'نبذة ووصف المجتمع (عربي)' : 'Description (Arabic)'}>
                  <textarea rows={3} value={descAr} onChange={e => setDescAr(e.target.value)} placeholder={lang === 'ar' ? 'صف نوع الكتب وهدف المجتمع وروح اللقاءات...' : 'Describe community goals in Arabic...'} className={cn(inputCls, 'resize-none')} />
                </Field>
                <Field label={lang === 'ar' ? 'نبذة ووصف المجتمع (إنجليزي)' : 'Description (English)'}>
                  <textarea rows={3} value={descEn} onChange={e => setDescEn(e.target.value)} placeholder="Describe what kind of books members swap and loan..." className={cn(inputCls, 'resize-none')} />
                </Field>
              </div>

              {/* Images: Logo & Cover Upload */}
              <div className="space-y-4 pt-1">
                {/* Live Banner & Logo Preview if either is selected */}
                {(coverUrl || logoUrl) && (
                  <div className="relative rounded-2xl border-2 border-border/80 overflow-hidden bg-muted shadow-sm animate-in fade-in duration-200">
                    <div className="relative h-24 sm:h-32 w-full overflow-hidden bg-muted">
                      {coverUrl ? (
                        <Image
                          src={coverUrl}
                          alt="Cover Preview"
                          fill
                          className="object-cover"
                          unoptimized={coverUrl.startsWith('data:')}
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-r from-emerald-600/30 to-primary/30" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                    </div>

                    <div className="absolute bottom-2.5 start-3 flex items-end gap-2.5 z-10">
                      <div className="relative h-12 w-12 sm:h-14 sm:w-14 rounded-2xl overflow-hidden border-2 border-card bg-card shadow-md shrink-0">
                        {logoUrl ? (
                          <Image
                            src={logoUrl}
                            alt="Logo Preview"
                            fill
                            className="object-cover"
                            unoptimized={logoUrl.startsWith('data:')}
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center font-black text-primary bg-primary/10 text-base">
                            {(nameAr || nameEn || 'ك').charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="text-white drop-shadow-md pb-0.5">
                        <div className="text-xs sm:text-sm font-black">
                          {nameAr || nameEn || (lang === 'ar' ? 'مجتمع قراءة جديد' : 'New Community')}
                        </div>
                        <div className="text-[10px] text-white/80">
                          {locationText || (lang === 'ar' ? 'نادي قراءة' : 'Reading Club')}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ImageUploadDropzone
                    label={lang === 'ar' ? 'شعار المجتمع (Logo / Avatar)' : 'Community Logo'}
                    description={lang === 'ar' ? 'ارفع صورة مربعة أو اختر من النماذج الجاهزة' : 'Upload square logo or pick preset'}
                    value={logoUrl}
                    onChange={setLogoUrl}
                    folder="logos"
                    aspectRatio="square"
                    userId={currentUserId}
                    presetOptions={PRESET_LOGOS}
                    lang={lang}
                  />

                  <ImageUploadDropzone
                    label={lang === 'ar' ? 'صورة الغلاف (Cover Banner)' : 'Cover Banner Photo'}
                    description={lang === 'ar' ? 'صورة عريضة تظهر في ترويسة المجتمع' : 'Wide banner photo for header'}
                    value={coverUrl}
                    onChange={setCoverUrl}
                    folder="covers"
                    aspectRatio="banner"
                    userId={currentUserId}
                    presetOptions={PRESET_COVERS}
                    lang={lang}
                  />
                </div>
              </div>

              {/* ── SECTION 2: LOCATION & MAP PICKER ──────────── */}
              <SectionLabel icon={<MapPin className="h-3.5 w-3.5" />} labelAr="2. تحديد المدينة والمنطقة والموقع على الخريطة" labelEn="2. City, Area & Interactive Map" lang={lang} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Step 1: Choose City */}
                <Field label={lang === 'ar' ? '1. اختر المدينة أولاً (City) *' : '1. Choose City First *'}>
                  <div className="relative">
                    <select
                      value={selectedCityId}
                      onChange={e => handleCityChange(e.target.value)}
                      className={cn(inputCls, 'appearance-none cursor-pointer pr-8 font-bold')}
                    >
                      <option value="">{lang === 'ar' ? 'اختر المدينة...' : 'Select City...'}</option>
                      {effectiveCities.map(city => (
                        <option key={city.id} value={city.id}>
                          {isRTL ? city.name_ar : city.name_en}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute top-1/2 -translate-y-1/2 left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </Field>

                {/* Step 2: Choose Area */}
                <Field label={lang === 'ar' ? '2. تحديد الحي أو المنطقة (District) *' : '2. District / Neighborhood *'}>
                  <div className="relative">
                    <select
                      value={selectedAreaId}
                      onChange={e => handleAreaChange(e.target.value)}
                      disabled={!selectedCityId}
                      className={cn(inputCls, 'appearance-none cursor-pointer pr-8 font-bold disabled:opacity-50')}
                    >
                      <option value="">
                        {!selectedCityId
                          ? (isRTL ? 'يرجى اختيار المدينة أولاً...' : 'Select city first...')
                          : (isRTL ? 'اختر المنطقة / الحي...' : 'Select District...')}
                      </option>
                      {availableAreas.map(area => (
                        <option key={area.id} value={area.id}>
                          {isRTL ? area.name_ar : area.name_en}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute top-1/2 -translate-y-1/2 left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </Field>
              </div>

              {/* Separate Districts Chips Grid */}
              {selectedCityId && selectedCityObj && (
                <div className="space-y-2.5 rounded-2xl border-2 border-primary/20 bg-background/80 p-3 sm:p-4 shadow-xs animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-2">
                    <div className="flex items-center gap-1.5 text-xs font-black text-foreground">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span>
                        {isRTL
                          ? `أحياء ومناطق ${selectedCityObj.name_ar} (اختر حياً لتحديده وتكبير الخريطة):`
                          : `Districts in ${selectedCityObj.name_en} (click to select & zoom map):`}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground self-start sm:self-auto">
                      {availableAreas.length} {isRTL ? 'حي منفصل' : 'districts'}
                    </span>
                  </div>

                  {/* Quick filter input if more than 8 districts */}
                  {availableAreas.length > 8 && (
                    <div className="relative">
                      <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-3.5 w-3.5 text-muted-foreground" />
                      <input
                        type="text"
                        value={createDistrictSearch}
                        onChange={e => setCreateDistrictSearch(e.target.value)}
                        placeholder={isRTL ? `بحث في أحياء ${selectedCityObj.name_ar}...` : `Filter districts...`}
                        className="w-full rounded-xl border border-border bg-background ps-9 pe-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      {createDistrictSearch && (
                        <button
                          type="button"
                          onClick={() => setCreateDistrictSearch('')}
                          className="absolute top-1/2 -translate-y-1/2 end-2.5 text-xs text-muted-foreground hover:text-foreground"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  )}

                  {/* Clickable separate district chips */}
                  <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto pr-1 py-1">
                    {filteredCreateDistricts.map(area => {
                      const isSelected = selectedAreaId === area.id
                      return (
                        <button
                          key={area.id}
                          type="button"
                          onClick={() => handleAreaChange(area.id)}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5",
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary shadow-xs ring-2 ring-primary/30 font-black scale-102"
                              : "bg-muted/40 hover:bg-muted text-foreground border-border/70 hover:border-primary/50"
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                          <span>{isRTL ? area.name_ar : area.name_en}</span>
                        </button>
                      )
                    })}
                    {filteredCreateDistricts.length === 0 && (
                      <span className="text-xs text-muted-foreground py-2">
                        {isRTL ? 'لا توجد نتائج مطابقة للبحث' : 'No matching districts found'}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Location Text description */}
              <Field label={lang === 'ar' ? 'العنوان / الموقع الظاهر للأعضاء' : 'Location Label'}>
                <div className="relative">
                  <MapPin className={cn('absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground', isRTL ? 'right-3' : 'left-3')} />
                  <input
                    type="text"
                    value={locationText}
                    onChange={e => setLocationText(e.target.value)}
                    placeholder={lang === 'ar' ? 'مثال: المعادي دجلة، القاهرة' : 'e.g. Degla, Maadi, Cairo'}
                    className={cn(inputCls, isRTL ? 'pr-8' : 'pl-8')}
                  />
                </div>
              </Field>

              {/* Step 3: Interactive Map Toggle & Picker */}
              <div className="space-y-3 rounded-2xl border border-border/80 bg-muted/20 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-black text-foreground flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-primary" />
                      <span>{lang === 'ar' ? 'الخريطة التفاعلية: تحديد دقيق لموقع المجتمع ونقطة اللقاء' : 'Interactive Map: Pinpoint Location & Safe Hub'}</span>
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {lang === 'ar'
                        ? 'انقر على الخريطة لوضع علامة موقع المجتمع وعلامة نقطة اللقاء الآمنة'
                        : 'Click anywhere on the map to set coordinates for community and safe hub'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowMapPicker(prev => !prev)}
                    className="px-3.5 py-1.5 rounded-xl border border-border bg-background hover:bg-muted text-xs font-black text-primary flex items-center gap-1.5 shadow-xs cursor-pointer self-start"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{showMapPicker ? (isRTL ? 'إخفاء الخريطة' : 'Hide Map') : (isRTL ? 'فتح الخريطة التفاعلية' : 'Open Map')}</span>
                  </button>
                </div>

                {showMapPicker && (
                  <div className="pt-2 animate-in fade-in duration-200">
                    <MapLocationPicker
                      latitude={latitude}
                      longitude={longitude}
                      onLocationSelect={handleCommunityLocationFromMap}
                      hubLatitude={hubLat}
                      hubLongitude={hubLng}
                      onHubLocationSelect={handleHubLocationFromMap}
                      activeMode={activeMapMode}
                      onModeChange={setActiveMapMode}
                      centerHint={mapCenterHint}
                      height="320px"
                      lang={lang}
                    />
                  </div>
                )}
              </div>

              {/* ── DESIGNATED SAFE PICKUP HUB ───────────────── */}
              <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-emerald-800 dark:text-emerald-300">
                    <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                    <span>{lang === 'ar' ? 'نقطة اللقاء الآمنة المعتمدة لتسليم واستلام الكتب ☕🛡️' : 'Designated Safe Meetup & Pickup Hub ☕🛡️'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMapPicker(true)
                      setActiveMapMode('hub')
                    }}
                    className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white text-[11px] font-black hover:bg-emerald-700 transition flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <MapPin className="h-3 w-3" />
                    <span>{isRTL ? 'تحديد على الخريطة' : 'Pick on Map'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label={lang === 'ar' ? 'اسم نقطة اللقاء (كافيه / مكتبة عامة / بهو)' : 'Hub Name'}>
                    <input
                      type="text"
                      value={hubName}
                      onChange={e => setHubName(e.target.value)}
                      placeholder={lang === 'ar' ? 'مثال: سيلانترو دجلة المعادي أو مكتبة ديوان' : 'e.g. Costa Cafe Degla or Diwan Bookstore'}
                      className={inputCls}
                    />
                  </Field>
                  <Field label={lang === 'ar' ? 'العنوان التفصيلي لنقطة اللقاء' : 'Hub Address'}>
                    <input
                      type="text"
                      value={hubAddress}
                      onChange={e => setHubAddress(e.target.value)}
                      placeholder={lang === 'ar' ? 'مثال: شارع 218، ميدان فيكتوريا، المعادي' : 'e.g. 218 Degla Street, Victoria Square'}
                      className={inputCls}
                    />
                  </Field>
                </div>

                <Field label={lang === 'ar' ? 'تعليمات وإرشادات المقابلة في المكان' : 'Pickup Instructions'}>
                  <textarea
                    rows={2}
                    value={hubInstructions}
                    onChange={e => setHubInstructions(e.target.value)}
                    placeholder={lang === 'ar' ? 'مثال: الطاولة بجوار رف الكتب، الدور الثاني، يُرجى التأكد من حالة الكتاب قبل المغادرة...' : 'e.g. Quiet corner table by the bookshelf, second floor...'}
                    className={cn(inputCls, 'resize-none')}
                  />
                </Field>

                {/* Hub Photo Upload */}
                <ImageUploadDropzone
                  label={lang === 'ar' ? 'صورة نقطة اللقاء أو واجهة المكان (اختياري)' : 'Hub Photo (Optional)'}
                  description={lang === 'ar' ? 'صورة تساعد الأعضاء في التعرف على المكان بسهولة' : 'Helps members recognize the meetup spot'}
                  value={hubPhotoUrl}
                  onChange={setHubPhotoUrl}
                  folder="hubs"
                  aspectRatio="photo"
                  userId={currentUserId}
                  lang={lang}
                />
              </div>

              {/* ── SECTION 3: CONTACT & SOCIAL ──────────────── */}
              <SectionLabel icon={<Globe className="h-3.5 w-3.5" />} labelAr="3. التواصل ووسائل التواصل الاجتماعي" labelEn="3. Contact & Social Channels" lang={lang} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label={lang === 'ar' ? 'الموقع الإلكتروني' : 'Website URL'}>
                  <div className="relative">
                    <Globe className={cn('absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground', isRTL ? 'right-3' : 'left-3')} />
                    <input type="url" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://..." className={cn(inputCls, isRTL ? 'pr-8' : 'pl-8')} />
                  </div>
                </Field>
                <Field label={lang === 'ar' ? 'البريد الإلكتروني للتواصل' : 'Contact Email'}>
                  <div className="relative">
                    <Mail className={cn('absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground', isRTL ? 'right-3' : 'left-3')} />
                    <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="club@bookswap.eg" className={cn(inputCls, isRTL ? 'pr-8' : 'pl-8')} />
                  </div>
                </Field>
                <Field label={lang === 'ar' ? 'رقم الهاتف / واتساب' : 'Contact Phone / WhatsApp'}>
                  <div className="relative">
                    <Phone className={cn('absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground', isRTL ? 'right-3' : 'left-3')} />
                    <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="+20 1X XXXX XXXX" className={cn(inputCls, isRTL ? 'pr-8' : 'pl-8')} />
                  </div>
                </Field>
                <Field label="Instagram">
                  <div className="relative">
                    <InstagramIcon className={cn('absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground', isRTL ? 'right-3' : 'left-3')} />
                    <input type="text" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@handle" className={cn(inputCls, isRTL ? 'pr-8' : 'pl-8')} />
                  </div>
                </Field>
                <Field label="Facebook Group / Page">
                  <div className="relative">
                    <Building className={cn('absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground', isRTL ? 'right-3' : 'left-3')} />
                    <input type="text" value={facebook} onChange={e => setFacebook(e.target.value)} placeholder="facebook.com/groups/..." className={cn(inputCls, isRTL ? 'pr-8' : 'pl-8')} />
                  </div>
                </Field>
                <Field label="WhatsApp Group / Telegram">
                  <div className="relative">
                    <MessageCircle className={cn('absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground', isRTL ? 'right-3' : 'left-3')} />
                    <input type="text" value={whatsapp || telegram} onChange={e => { setWhatsapp(e.target.value); setTelegram('') }} placeholder="chat.whatsapp.com/... or t.me/..." className={cn(inputCls, isRTL ? 'pr-8' : 'pl-8')} />
                  </div>
                </Field>
              </div>

              {/* ── SECTION 4: GOVERNANCE & MULTI-CHOICE TAGS ── */}
              <SectionLabel icon={<BookMarked className="h-3.5 w-3.5" />} labelAr="4. الوسوم والتصنيفات (خيارات متعددة) والقواعد" labelEn="4. Topics (Multiple Choice) & Rules" lang={lang} />

              {/* Multiple Choice Tags Selector */}
              <MultiChoiceTagPicker
                selectedTags={tags}
                onChange={setTags}
                lang={lang}
                maxTags={12}
              />

              {/* Requires Approval toggle */}
              <div className="flex items-center justify-between rounded-2xl border border-border/80 bg-muted/20 px-4 py-3">
                <div>
                  <p className="text-xs font-black text-foreground flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-amber-500" />
                    {lang === 'ar' ? 'الانضمام يتطلب موافقة الأدمن' : 'Membership Requires Admin Approval'}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{lang === 'ar' ? 'لن يُقبل أي عضو تلقائياً — ستراجع كل طلب لضمان الجدية' : 'No one auto-joins — you review every request'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setRequiresApproval(v => !v)}
                  className={cn(
                    'relative w-12 h-6.5 rounded-full transition-colors cursor-pointer',
                    requiresApproval ? 'bg-primary' : 'bg-muted-foreground/30'
                  )}
                >
                  <span className={cn('absolute top-1 w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-all', requiresApproval ? (isRTL ? 'right-1' : 'left-6.5') : (isRTL ? 'right-6.5' : 'left-1'))} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label={lang === 'ar' ? 'قواعد المجتمع (عربي)' : 'Community Rules (Arabic)'}>
                  <textarea rows={3} value={rulesAr} onChange={e => setRulesAr(e.target.value)} placeholder={lang === 'ar' ? 'مثال: لا للكتب التالفة، الحفاظ على موعد اللقاء، الرد خلال 48 ساعة...' : 'Write rules in Arabic...'} className={cn(inputCls, 'resize-none')} />
                </Field>
                <Field label={lang === 'ar' ? 'قواعد المجتمع (إنجليزي)' : 'Community Rules (English)'}>
                  <textarea rows={3} value={rulesEn} onChange={e => setRulesEn(e.target.value)} placeholder="e.g. Handle books with care, respect meetup schedule..." className={cn(inputCls, 'resize-none')} />
                </Field>
              </div>

              {/* Admin Note */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                <span className="text-base">👑</span>
                <span>
                  {lang === 'ar'
                    ? 'بصفتك منشئ المجتمع، ستُعيّن تلقائياً كأدمن وتستطيع تعديل البيانات وقبول الأعضاء في أي وقت.'
                    : 'As the creator, you will automatically be designated as Admin with full control over members and settings.'}
                </span>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-border/80">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); resetForm() }}
                  className="px-5 py-2.5 rounded-2xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <Button
                  type="submit"
                  loading={isSubmitting}
                  disabled={!nameAr.trim() && !nameEn.trim()}
                  className="rounded-2xl font-black text-xs gap-2 shadow-lg shadow-primary/20 cursor-pointer px-6 py-2.5"
                >
                  {lang === 'ar' ? 'إنشاء وتعييني كأدمن 🚀' : 'Create & Launch 🚀'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  )
}
