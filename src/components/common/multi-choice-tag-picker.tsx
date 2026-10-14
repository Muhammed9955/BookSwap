'use client'

import React, { useState } from 'react'
import { Tag, Check, Plus, X, Search, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TagOption {
  id: string
  labelAr: string
  labelEn: string
  emoji: string
  category?: 'genre' | 'activity' | 'audience'
}

export const PRESET_COMMUNITY_TAGS: TagOption[] = [
  // Genres & Topics
  { id: 'fiction-novels',       labelAr: 'روايات وأدب عالمي',      labelEn: 'Fiction & Literature', emoji: '📚', category: 'genre' },
  { id: 'self-development',     labelAr: 'تطوير الذات والإنتاجية',  labelEn: 'Self Development',     emoji: '💡', category: 'genre' },
  { id: 'psychology-mind',      labelAr: 'علم النفس والوعي',        labelEn: 'Psychology & Mind',    emoji: '🧠', category: 'genre' },
  { id: 'business-startups',    labelAr: 'ريادة أعمال وإدارة',     labelEn: 'Business & Startups',  emoji: '💼', category: 'genre' },
  { id: 'tech-science',         labelAr: 'علوم وتكنولوجيا',        labelEn: 'Science & Tech',       emoji: '🔬', category: 'genre' },
  { id: 'history-civilization', labelAr: 'تاريخ وحضارات',          labelEn: 'History & Culture',    emoji: '🏛️', category: 'genre' },
  { id: 'philosophy-thought',   labelAr: 'فلسفة وفكر نقدي',         labelEn: 'Philosophy',           emoji: '📖', category: 'genre' },
  { id: 'academic-research',    labelAr: 'كتب أكاديمية وجامعية',   labelEn: 'Academic & Research',  emoji: '🎓', category: 'genre' },
  { id: 'poetry-literature',    labelAr: 'شعر ونصوص أدبية',        labelEn: 'Poetry & Essays',      emoji: '🖋️', category: 'genre' },
  { id: 'arts-cinema',          labelAr: 'فنون وتصميم وسينما',     labelEn: 'Arts & Design',        emoji: '🎨', category: 'genre' },
  { id: 'spirituality-religion',labelAr: 'فكر إسلامي وروحانيات',    labelEn: 'Spirituality',         emoji: '🕊️', category: 'genre' },
  { id: 'languages-translation',labelAr: 'لغات وترجمة',            labelEn: 'Languages',            emoji: '🌐', category: 'genre' },
  { id: 'mystery-thriller',     labelAr: 'غموض وروايات بوليسية',   labelEn: 'Mystery & Thriller',   emoji: '🔍', category: 'genre' },
  { id: 'sci-fi-fantasy',       labelAr: 'خيال علمي وفانتازيا',    labelEn: 'Sci-Fi & Fantasy',     emoji: '🚀', category: 'genre' },
  { id: 'health-wellness',      labelAr: 'صحة ونمط حياة',          labelEn: 'Health & Wellness',    emoji: '🌿', category: 'genre' },
  { id: 'children-young-adult', labelAr: 'أطفال وناشئة',           labelEn: 'Children & YA',        emoji: '🧸', category: 'genre' },

  // Club Activities & Community Styles
  { id: 'weekly-cafe-meetups',  labelAr: 'لقاءات مقاهي أسبوعية',    labelEn: 'Weekly Cafe Meetups',  emoji: '☕', category: 'activity' },
  { id: 'free-book-swap',       labelAr: 'تبادل كتب مجاني',        labelEn: 'Free Book Swap',       emoji: '♻️', category: 'activity' },
  { id: 'reading-challenge',    labelAr: 'تحدي القراءة السنوي',    labelEn: 'Reading Challenge',    emoji: '🏆', category: 'activity' },
  { id: 'women-book-club',      labelAr: 'صالون قراءة نسائي',      labelEn: 'Women Book Club',      emoji: '👩‍🦰', category: 'audience' },
  { id: 'student-friendly',     labelAr: 'مناسب للطلاب والشباب',   labelEn: 'Student Friendly',     emoji: '🎒', category: 'audience' },
]

interface MultiChoiceTagPickerProps {
  selectedTags: string[]
  onChange: (tags: string[]) => void
  lang?: string
  maxTags?: number
}

export function MultiChoiceTagPicker({
  selectedTags,
  onChange,
  lang = 'ar',
  maxTags = 10,
}: MultiChoiceTagPickerProps) {
  const isRTL = lang === 'ar'
  const [filterSearch, setFilterSearch] = useState('')
  const [customTagInput, setCustomTagInput] = useState('')

  // Toggle selection
  const handleToggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onChange(selectedTags.filter(t => t !== tagId))
    } else {
      if (selectedTags.length >= maxTags) {
        alert(isRTL ? `الحد الأقصى للوسوم هو ${maxTags}` : `Maximum ${maxTags} tags allowed`)
        return
      }
      onChange([...selectedTags, tagId])
    }
  }

  // Add custom tag
  const handleAddCustomTag = () => {
    const clean = customTagInput.trim().toLowerCase().replace(/\s+/g, '-')
    if (!clean) return
    if (selectedTags.includes(clean)) {
      setCustomTagInput('')
      return
    }
    if (selectedTags.length >= maxTags) {
      alert(isRTL ? `الحد الأقصى للوسوم هو ${maxTags}` : `Maximum ${maxTags} tags allowed`)
      return
    }
    onChange([...selectedTags, clean])
    setCustomTagInput('')
  }

  // Remove tag
  const handleRemoveTag = (tagToRemove: string) => {
    onChange(selectedTags.filter(t => t !== tagToRemove))
  }

  // Filtered preset list
  const filteredPresets = PRESET_COMMUNITY_TAGS.filter(item => {
    if (!filterSearch.trim()) return true
    const q = filterSearch.toLowerCase()
    return (
      item.labelAr.toLowerCase().includes(q) ||
      item.labelEn.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q)
    )
  })

  // Lookup helper for selected tags display
  const getTagDisplay = (tagVal: string) => {
    const found = PRESET_COMMUNITY_TAGS.find(p => p.id === tagVal)
    if (found) {
      return {
        label: isRTL ? found.labelAr : found.labelEn,
        emoji: found.emoji,
      }
    }
    return {
      label: tagVal,
      emoji: '🏷️',
    }
  }

  return (
    <div className="space-y-3.5 rounded-2xl border border-border/80 bg-card p-3 sm:p-4 shadow-2xs">
      {/* Top Header with Selected Counter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-primary" />
          <span className="text-xs font-black text-foreground">
            {isRTL ? 'الوسوم وتصنيفات الاهتمامات (خيارات متعددة)' : 'Tags & Topics (Multiple Choice)'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            {selectedTags.length} / {maxTags} {isRTL ? 'محدد' : 'selected'}
          </span>
          {selectedTags.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-[10px] text-muted-foreground hover:text-red-500 transition cursor-pointer"
            >
              {isRTL ? 'مسح الكل' : 'Clear'}
            </button>
          )}
        </div>
      </div>

      {/* Selected tags badges preview */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-muted/30 border border-border/50">
          {selectedTags.map(tagVal => {
            const display = getTagDisplay(tagVal)
            return (
              <span
                key={tagVal}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-xs animate-in zoom-in-95 duration-150"
              >
                <span>{display.emoji}</span>
                <span>{display.label}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tagVal)}
                  className="rounded-full hover:bg-black/20 p-0.5 ml-0.5 transition cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )
          })}
        </div>
      )}

      {/* Search filter for choices */}
      <div className="relative">
        <input
          type="text"
          value={filterSearch}
          onChange={e => setFilterSearch(e.target.value)}
          placeholder={isRTL ? 'تصفية التصنيفات أو البحث...' : 'Filter topics or search...'}
          className="w-full rounded-xl border border-border bg-background px-8 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <Search className="absolute top-1/2 -translate-y-1/2 left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        {filterSearch && (
          <button
            type="button"
            onClick={() => setFilterSearch('')}
            className="absolute top-1/2 -translate-y-1/2 right-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Multiple Choice Grid of Badges */}
      <div className="max-h-56 overflow-y-auto pr-1">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {filteredPresets.map(preset => {
            const isSelected = selectedTags.includes(preset.id)
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleToggleTag(preset.id)}
                className={cn(
                  'flex items-center justify-between gap-1.5 p-2 rounded-xl border text-xs font-bold transition-all text-right cursor-pointer select-none',
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary/40'
                    : 'border-border bg-background hover:bg-muted/50 text-foreground hover:border-border/80'
                )}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-base shrink-0">{preset.emoji}</span>
                  <span className="truncate text-[11px] font-black">
                    {isRTL ? preset.labelAr : preset.labelEn}
                  </span>
                </div>
                <div
                  className={cn(
                    'h-4 w-4 rounded-md flex items-center justify-center shrink-0 border transition',
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border bg-card'
                  )}
                >
                  {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Add Custom Tag Bar */}
      <div className="pt-2 border-t border-border/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={customTagInput}
            onChange={e => setCustomTagInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddCustomTag()
              }
            }}
            placeholder={
              isRTL
                ? 'إضافة وسم مخصص آخر (مثلاً: نادي-المعادي، قراء-الطب)...'
                : 'Add custom tag (e.g. med-students)...'
            }
            className="flex-1 rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="button"
            onClick={handleAddCustomTag}
            disabled={!customTagInput.trim()}
            className="px-3.5 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold border border-border flex items-center gap-1 disabled:opacity-50 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{isRTL ? 'إضافة' : 'Add'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
