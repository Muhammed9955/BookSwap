import React from 'react'

export default function Loading() {
  return (
    <div className="min-h-[70vh] w-full flex flex-col items-center justify-center p-4">
      {/* Top indeterminate progress line (YouTube/GitHub style) */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-primary/20 overflow-hidden">
        <div className="h-full w-full bg-primary animate-[pulse_1s_ease-in-out_infinite] origin-left" />
      </div>

      {/* Modern pulsing brand loader */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative flex items-center justify-center">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 animate-pulse flex items-center justify-center shadow-lg shadow-primary/5">
            <span className="text-xl select-none">🌱</span>
          </div>
          <div className="absolute inset-0 rounded-2xl border-2 border-primary border-t-transparent animate-spin" />
        </div>
        <p className="text-xs font-bold text-muted-foreground animate-pulse">
          جاري التحميل...
        </p>
      </div>
    </div>
  )
}
