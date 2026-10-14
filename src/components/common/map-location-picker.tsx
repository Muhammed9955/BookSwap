'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import {
  MapPin,
  Shield,
  Search,
  Navigation,
  Loader2,
  X,
  Maximize2,
  Layers,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface MapCoordinates {
  lat: number
  lng: number
  address?: string
}

interface MapLocationPickerProps {
  // Community Location
  latitude?: number | null
  longitude?: number | null
  onLocationSelect: (coords: MapCoordinates) => void

  // Safe Hub Location
  hubLatitude?: number | null
  hubLongitude?: number | null
  onHubLocationSelect?: (coords: MapCoordinates) => void

  // Mode: community vs hub
  activeMode?: 'community' | 'hub'
  onModeChange?: (mode: 'community' | 'hub') => void

  // Centering hint from selected City/Area
  centerHint?: { lat: number; lng: number; zoom?: number } | null

  // UI config
  height?: string
  lang?: string
  showHubOption?: boolean
  className?: string
}

export function MapLocationPicker({
  latitude,
  longitude,
  onLocationSelect,
  hubLatitude,
  hubLongitude,
  onHubLocationSelect,
  activeMode = 'community',
  onModeChange,
  centerHint,
  height = '340px',
  lang = 'ar',
  showHubOption = true,
  className,
}: MapLocationPickerProps) {
  const isRTL = lang === 'ar'
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const communityMarkerRef = useRef<any>(null)
  const hubMarkerRef = useRef<any>(null)
  const leafletModuleRef = useRef<any>(null)

  const [mode, setMode] = useState<'community' | 'hub'>(activeMode)
  const [isMapReady, setIsMapReady] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Array<{ display_name: string; lat: string; lon: string }>>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [reverseGeocoding, setReverseGeocoding] = useState(false)

  // Sync mode with parent if prop changes
  useEffect(() => {
    if (activeMode && activeMode !== mode) {
      setMode(activeMode)
    }
  }, [activeMode])

  const handleModeSwitch = (newMode: 'community' | 'hub') => {
    setMode(newMode)
    onModeChange?.(newMode)
  }

  // Helper to reverse geocode lat/lng
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      setReverseGeocoding(true)
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': isRTL ? 'ar,en' : 'en,ar' } }
      )
      const data = await res.json()
      if (data && data.display_name) {
        // extract concise address (road/suburb/city)
        const addr = data.address || {}
        const parts = [
          addr.amenity || addr.shop || addr.building || '',
          addr.road || addr.pedestrian || '',
          addr.suburb || addr.neighbourhood || addr.city_district || '',
          addr.city || addr.town || addr.county || '',
        ].filter(Boolean)
        return parts.length > 0 ? parts.join('، ') : data.display_name
      }
    } catch (err) {
      console.warn('Reverse geocode failed:', err)
    } finally {
      setReverseGeocoding(false)
    }
    return ''
  }

  // Initialize Leaflet Map (client side only)
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return

    let isMounted = true

    const initMap = async () => {
      const L = await import('leaflet')
      leafletModuleRef.current = L

      if (!isMounted || !mapContainerRef.current) return

      // Default center: Egypt (Cairo)
      const initialLat = latitude || hubLatitude || centerHint?.lat || 30.0444
      const initialLng = longitude || hubLongitude || centerHint?.lng || 31.2357
      const initialZoom = centerHint?.zoom || (latitude || hubLatitude ? 15 : 12)

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
      }

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: initialZoom,
        zoomControl: false,
      })

      // Add zoom control top right or left
      L.control.zoom({ position: isRTL ? 'topleft' : 'topright' }).addTo(map)

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      // Custom marker icon factory
      const createCustomIcon = (type: 'community' | 'hub') => {
        const isComm = type === 'community'
        const color = isComm ? '#4f46e5' : '#059669'
        const label = isComm
          ? (isRTL ? 'موقع المجتمع' : 'Community')
          : (isRTL ? 'نقطة اللقاء' : 'Safe Hub')

        const html = `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
            <div style="background: ${color}; color: white; padding: 3px 8px; border-radius: 9999px; font-size: 10px; font-weight: 800; white-space: nowrap; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2); border: 2px solid white; display: flex; align-items: center; gap: 4px;">
              <span>${isComm ? '📍' : '🛡️'}</span>
              <span>${label}</span>
            </div>
            <div style="width: 14px; height: 14px; background: ${color}; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3); margin-top: -2px;"></div>
            <div style="width: 2px; height: 6px; background: ${color};"></div>
          </div>
        `
        return L.divIcon({
          html,
          className: 'custom-leaflet-marker',
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        })
      }

      // Add community marker if coords exist
      if (latitude && longitude) {
        communityMarkerRef.current = L.marker([latitude, longitude], {
          icon: createCustomIcon('community'),
          draggable: true,
        }).addTo(map)

        communityMarkerRef.current.on('dragend', async (e: any) => {
          const { lat, lng } = e.target.getLatLng()
          const address = await reverseGeocode(lat, lng)
          onLocationSelect({ lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)), address })
        })
      }

      // Add hub marker if coords exist
      if (hubLatitude && hubLongitude) {
        hubMarkerRef.current = L.marker([hubLatitude, hubLongitude], {
          icon: createCustomIcon('hub'),
          draggable: true,
        }).addTo(map)

        hubMarkerRef.current.on('dragend', async (e: any) => {
          const { lat, lng } = e.target.getLatLng()
          const address = await reverseGeocode(lat, lng)
          onHubLocationSelect?.({ lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)), address })
        })
      }

      // Handle map clicks
      map.on('click', async (e: any) => {
        const { lat, lng } = e.latlng
        const formattedLat = Number(lat.toFixed(6))
        const formattedLng = Number(lng.toFixed(6))
        const address = await reverseGeocode(formattedLat, formattedLng)

        if (mode === 'hub' && onHubLocationSelect) {
          if (hubMarkerRef.current) {
            hubMarkerRef.current.setLatLng([lat, lng])
          } else {
            hubMarkerRef.current = L.marker([lat, lng], {
              icon: createCustomIcon('hub'),
              draggable: true,
            }).addTo(map)
          }
          onHubLocationSelect({ lat: formattedLat, lng: formattedLng, address })
        } else {
          if (communityMarkerRef.current) {
            communityMarkerRef.current.setLatLng([lat, lng])
          } else {
            communityMarkerRef.current = L.marker([lat, lng], {
              icon: createCustomIcon('community'),
              draggable: true,
            }).addTo(map)
          }
          onLocationSelect({ lat: formattedLat, lng: formattedLng, address })
        }
      })

      mapInstanceRef.current = map
      setIsMapReady(true)

      // Fix render sizing bug in Leaflet
      setTimeout(() => {
        map.invalidateSize()
      }, 200)
    }

    initMap()

    return () => {
      isMounted = false
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [mode])

  // Center update when centerHint changes (e.g. user selected City or Area)
  useEffect(() => {
    if (!mapInstanceRef.current || !centerHint) return
    mapInstanceRef.current.flyTo(
      [centerHint.lat, centerHint.lng],
      centerHint.zoom || 14,
      { animate: true, duration: 1 }
    )
  }, [centerHint?.lat, centerHint?.lng])

  // Update community marker if external lat/lng changes
  useEffect(() => {
    if (!mapInstanceRef.current || !latitude || !longitude || !leafletModuleRef.current) return
    if (communityMarkerRef.current) {
      communityMarkerRef.current.setLatLng([latitude, longitude])
    }
  }, [latitude, longitude])

  // Update hub marker if external hub coords change
  useEffect(() => {
    if (!mapInstanceRef.current || !hubLatitude || !hubLongitude || !leafletModuleRef.current) return
    if (hubMarkerRef.current) {
      hubMarkerRef.current.setLatLng([hubLatitude, hubLongitude])
    }
  }, [hubLatitude, hubLongitude])

  // Current Geolocation trigger
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert(isRTL ? 'المتصفح لا يدعم تحديد الموقع الجغرافي' : 'Geolocation not supported')
      return
    }
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setIsLocating(false)
        const lat = Number(pos.coords.latitude.toFixed(6))
        const lng = Number(pos.coords.longitude.toFixed(6))

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 16, { animate: true })
        }

        const address = await reverseGeocode(lat, lng)
        if (mode === 'hub' && onHubLocationSelect) {
          onHubLocationSelect({ lat, lng, address })
        } else {
          onLocationSelect({ lat, lng, address })
        }
      },
      (err) => {
        setIsLocating(false)
        console.warn('Geolocation error:', err)
        alert(isRTL ? 'تعذر جلب موقعك الحالي، يرجى تفعيل إذن الموقع' : 'Could not retrieve your location')
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  // Address search via Nominatim OpenStreetMap
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setIsSearching(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery.trim()
        )}&limit=5&countrycodes=eg`,
        { headers: { 'Accept-Language': isRTL ? 'ar,en' : 'en,ar' } }
      )
      const data = await res.json()
      setSearchResults(data || [])
    } catch (err) {
      console.warn('Search failed:', err)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectSearchResult = async (item: { display_name: string; lat: string; lon: string }) => {
    const lat = Number(parseFloat(item.lat).toFixed(6))
    const lng = Number(parseFloat(item.lon).toFixed(6))

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 16, { animate: true })
    }

    if (mode === 'hub' && onHubLocationSelect) {
      onHubLocationSelect({ lat, lng, address: item.display_name })
    } else {
      onLocationSelect({ lat, lng, address: item.display_name })
    }

    setSearchResults([])
    setSearchQuery('')
  }

  return (
    <div className={cn('relative rounded-3xl border-2 border-border/80 overflow-hidden bg-card flex flex-col', className)}>
      {/* Top Controls Bar */}
      <div className="p-3 bg-muted/40 border-b border-border/60 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        {/* Mode Switcher */}
        {showHubOption && onHubLocationSelect ? (
          <div className="inline-flex rounded-xl bg-background border border-border p-1 gap-1 self-start">
            <button
              type="button"
              onClick={() => handleModeSwitch('community')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[11px] font-black transition flex items-center gap-1.5 cursor-pointer',
                mode === 'community'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <MapPin className="h-3 w-3" />
              <span>{isRTL ? 'موقع المجتمع' : 'Community Pin'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleModeSwitch('hub')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[11px] font-black transition flex items-center gap-1.5 cursor-pointer',
                mode === 'hub'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Shield className="h-3 w-3" />
              <span>{isRTL ? 'نقطة اللقاء الآمنة' : 'Safe Hub Pin'}</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs font-black text-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            <span>{isRTL ? 'تحديد الموقع على الخريطة' : 'Select Location on Map'}</span>
          </div>
        )}

        {/* GPS location button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCurrentLocation}
            disabled={isLocating}
            className="px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-muted text-[11px] font-bold text-foreground flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            {isLocating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            ) : (
              <Navigation className="h-3.5 w-3.5 text-primary" />
            )}
            <span>{isRTL ? 'موقعي الحالي' : 'My Location'}</span>
          </button>
        </div>
      </div>

      {/* Search Input on Map */}
      <div className="relative px-3 py-2 bg-background border-b border-border/40">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={
                isRTL
                  ? 'ابحث عن شارع، كافيه، حي، أو معلم في مصر...'
                  : 'Search street, cafe, landmark...'
              }
              className="w-full rounded-xl border border-border bg-muted/30 px-8 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Search className="absolute top-1/2 -translate-y-1/2 left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setSearchResults([])
                }}
                className="absolute top-1/2 -translate-y-1/2 right-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 disabled:opacity-50 cursor-pointer flex items-center gap-1"
          >
            {isSearching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <span>{isRTL ? 'بحث' : 'Search'}</span>}
          </button>
        </form>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute left-3 right-3 top-full z-40 mt-1 max-h-48 overflow-y-auto rounded-2xl border border-border bg-card p-1.5 shadow-xl">
            {searchResults.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSearchResult(item)}
                className="w-full text-right p-2 rounded-xl text-[11px] text-foreground hover:bg-muted/80 flex items-start gap-2 transition cursor-pointer"
              >
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <span className="line-clamp-2">{item.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map Canvas */}
      <div className="relative w-full" style={{ height }}>
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Floating helper badge */}
        <div className="absolute bottom-3 left-3 right-3 z-20 pointer-events-none flex flex-wrap items-center justify-between gap-2">
          <div className="bg-background/90 backdrop-blur-md border border-border px-3 py-1.5 rounded-xl shadow-lg text-[10px] sm:text-[11px] font-bold text-foreground flex items-center gap-1.5">
            <span className={cn('h-2 w-2 rounded-full', mode === 'hub' ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-600 animate-pulse')} />
            <span>
              {mode === 'hub'
                ? (isRTL ? 'اضغط على الخريطة لتحديد نقطة اللقاء الآمنة 🛡️' : 'Click map to place Safe Hub pin 🛡️')
                : (isRTL ? 'اضغط على الخريطة لتحديد موقع المجتمع 📍' : 'Click map to place Community pin 📍')}
            </span>
          </div>

          {reverseGeocoding && (
            <div className="bg-background/90 backdrop-blur-md border border-border px-2.5 py-1 rounded-xl shadow-lg text-[10px] font-bold text-primary flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>{isRTL ? 'جلب العنوان...' : 'Getting address...'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Coordinates status display */}
      <div className="p-2.5 bg-muted/20 border-t border-border/60 text-[11px] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {latitude && longitude ? (
            <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold">
              <MapPin className="h-3.5 w-3.5" />
              <span>{isRTL ? 'المجتمع:' : 'Community:'} {latitude.toFixed(4)}, {longitude.toFixed(4)}</span>
            </span>
          ) : (
            <span className="text-muted-foreground text-[10px]">
              {isRTL ? 'لم يتم تحديد موقع المجتمع بعد' : 'No community coords'}
            </span>
          )}

          {hubLatitude && hubLongitude ? (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
              <Shield className="h-3.5 w-3.5" />
              <span>{isRTL ? 'نقطة اللقاء:' : 'Safe Hub:'} {hubLatitude.toFixed(4)}, {hubLongitude.toFixed(4)}</span>
            </span>
          ) : (
            <span className="text-muted-foreground text-[10px]">
              {isRTL ? 'لم تحدد نقطة اللقاء' : 'No hub coords'}
            </span>
          )}
        </div>

        <span className="text-[10px] text-muted-foreground">
          {isRTL ? 'يمكنك سحب العلامة على الخريطة لتعديل موقعها' : 'Drag marker to refine position'}
        </span>
      </div>
    </div>
  )
}
