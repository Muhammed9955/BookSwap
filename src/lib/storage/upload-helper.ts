import { createClient } from '@/lib/supabase/client'
import { compressImageFile } from '@/lib/image-utils'

export interface UploadImageResult {
  url: string
  error?: string
  isFallback?: boolean
}

/**
 * Compresses and resizes an image file on a canvas before upload/fallback.
 * Reduces bandwidth by 80-95%, accelerates uploads, and keeps base64 fallbacks compact.
 */
export async function optimizeImageFile(
  file: File,
  maxWidth = 1400,
  maxHeight = 900,
  quality = 0.82
): Promise<File> {
  if (typeof window === 'undefined' || file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return file
  }

  try {
    const res = await compressImageFile(file, { maxWidth, maxHeight, quality, format: 'image/webp' })
    return res.file
  } catch (err) {
    console.warn('optimizeImageFile error, returning original file:', err)
    return file
  }
}

/**
 * Uploads an image file to Supabase Storage with graceful fallback.
 * Uses the 'community-images' bucket configured in migration 005.
 * If storage upload fails (bucket not yet initialized, RLS restriction, or offline dev),
 * falls back to 'book-images' bucket, and if that also fails, to a client-side Data URL
 * so the user experience is never blocked.
 */
export async function uploadCommunityImage(
  file: File,
  folder: 'covers' | 'logos' | 'hubs' | 'general' = 'general',
  userId?: string | null
): Promise<UploadImageResult> {
  // Validate file
  if (!file.type.startsWith('image/')) {
    return { url: '', error: 'الملف المحدد ليس صورة صالحة (Invalid image file)' }
  }

  // 10MB pre-compression limit
  const maxBytes = 10 * 1024 * 1024
  if (file.size > maxBytes) {
    return { url: '', error: 'حجم الصورة يتجاوز الحد الأقصى (10 ميجابايت)' }
  }

  // Optimize image dimensions according to folder type
  let processedFile = file
  try {
    if (folder === 'logos') {
      processedFile = await optimizeImageFile(file, 600, 600, 0.9)
    } else if (folder === 'covers') {
      processedFile = await optimizeImageFile(file, 1600, 900, 0.85)
    } else {
      processedFile = await optimizeImageFile(file, 1200, 800, 0.85)
    }
  } catch (optErr) {
    console.warn('Image optimization skipped, using original file:', optErr)
  }

  try {
    const supabase = createClient()
    let effectiveUserId = userId
    if (!effectiveUserId) {
      try {
        const { data: authData } = await supabase.auth.getUser()
        effectiveUserId = authData?.user?.id || null
      } catch {}
    }

    const cleanUserId = effectiveUserId || 'community-uploads'
    const ext = processedFile.name.split('.').pop()?.toLowerCase() || 'webp'
    const safeName = processedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase()
    const filePath = `${cleanUserId}/${folder}/${Date.now()}-${safeName}.${ext}`

    // 1. Try 'community-images' bucket
    const { error: uploadError } = await supabase.storage
      .from('community-images')
      .upload(filePath, processedFile, {
        cacheControl: '3600',
        upsert: true,
      })

    if (!uploadError) {
      const { data } = supabase.storage
        .from('community-images')
        .getPublicUrl(filePath)

      if (data?.publicUrl) {
        return { url: data.publicUrl }
      }
    } else {
      console.warn('community-images bucket returned error:', uploadError.message)
    }

    // 2. Try 'book-images' backup bucket (guaranteed to exist in standard schema)
    const backupPath = `${cleanUserId}/communities/${folder}/${Date.now()}-${safeName}.${ext}`
    const { error: backupError } = await supabase.storage
      .from('book-images')
      .upload(backupPath, processedFile, {
        cacheControl: '3600',
        upsert: true,
      })

    if (!backupError) {
      const { data } = supabase.storage
        .from('book-images')
        .getPublicUrl(backupPath)

      if (data?.publicUrl) {
        return { url: data.publicUrl }
      }
    } else {
      console.warn('book-images fallback upload returned error:', backupError.message)
    }
  } catch (err) {
    console.warn('Supabase storage unavailable, creating offline data URL fallback:', err)
  }

  // 3. Fallback: Read as base64 Data URL so the image works immediately in UI & state
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve({
        url: reader.result as string,
        isFallback: true,
      })
    }
    reader.onerror = () => {
      resolve({ url: '', error: 'فشل في قراءة ملف الصورة محلياً' })
    }
    reader.readAsDataURL(processedFile)
  })
}

