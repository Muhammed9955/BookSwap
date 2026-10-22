'use client'

import { useState } from 'react'
import type { StoreEvent, StoreEventType } from '@/types/store'
import { createStoreEvent, deleteStoreEvent } from '@/lib/stores/store-service'
import { compressImageFile } from '@/lib/image-utils'
import { uploadCommunityImage } from '@/lib/storage/upload-helper'

interface UseStoreEventsProps {
  initialEvents: StoreEvent[]
  activeStoreId: string
  currentStoreId: string
  currentStoreAddress?: string
  lang: 'ar' | 'en'
}

export function useStoreEvents({
  initialEvents,
  activeStoreId,
  currentStoreId,
  currentStoreAddress,
  lang,
}: UseStoreEventsProps) {
  const [events, setEvents] = useState<StoreEvent[]>(
    initialEvents.filter(e => e.store_id === currentStoreId)
  )
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false)
  const [isUploadingEventCover, setIsUploadingEventCover] = useState(false)

  const [newEvent, setNewEvent] = useState({
    title: '',
    title_ar: '',
    description: '',
    description_ar: '',
    event_type: 'SIGNING' as StoreEventType,
    starts_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 16),
    location: currentStoreAddress || 'فرع المكتبة الرئيسي',
    is_free: true,
    price: 50,
    host_name: '',
    host_phone: '',
    host_role: 'الكاتب والروائي الضيف',
    max_attendees: 50,
    cover_image_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
  })

  // Handle Cover Image Upload from Device
  const handleEventCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingEventCover(true)
    try {
      const compressed = await compressImageFile(file, { maxWidth: 1200, maxHeight: 800, quality: 0.85 })
      const uploadRes = await uploadCommunityImage(compressed.file, 'covers')
      if (uploadRes.url) {
        setNewEvent(prev => ({ ...prev, cover_image_url: uploadRes.url }))
      } else {
        setNewEvent(prev => ({ ...prev, cover_image_url: compressed.dataUrl }))
      }
    } catch (err) {
      console.error('Failed to upload event cover:', err)
      const reader = new FileReader()
      reader.onload = ev => {
        if (ev.target?.result) {
          setNewEvent(prev => ({ ...prev, cover_image_url: ev.target!.result as string }))
        }
      }
      reader.readAsDataURL(file)
    } finally {
      setIsUploadingEventCover(false)
    }
  }

  // Handle Add Event
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEvent.title_ar && !newEvent.title) return
    const created = await createStoreEvent({
      store_id: activeStoreId,
      title: newEvent.title || newEvent.title_ar,
      title_ar: newEvent.title_ar,
      description: newEvent.description,
      description_ar: newEvent.description_ar,
      event_type: newEvent.event_type || 'SIGNING',
      starts_at: new Date(newEvent.starts_at).toISOString(),
      location: newEvent.location,
      max_attendees: Number(newEvent.max_attendees),
      is_free: newEvent.is_free,
      price: newEvent.is_free ? undefined : Number(newEvent.price),
      host_name: newEvent.host_name || undefined,
      host_phone: newEvent.host_phone || undefined,
      host_role: newEvent.host_role || undefined,
      is_active: true,
      cover_image_url: newEvent.cover_image_url,
    })
    setEvents(prev => [created, ...prev])
    setIsAddEventModalOpen(false)
  }

  // Handle Delete Event
  const handleDeleteEvent = async (id: string) => {
    if (!confirm(lang === 'ar' ? 'هل تريد إلغاء هذه الفعالية؟' : 'Delete this event?')) return
    await deleteStoreEvent(id)
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  return {
    events,
    setEvents,
    isAddEventModalOpen,
    setIsAddEventModalOpen,
    newEvent,
    setNewEvent,
    isUploadingEventCover,
    handleEventCoverFileChange,
    handleAddEvent,
    handleDeleteEvent,
  }
}
