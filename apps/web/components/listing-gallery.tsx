"use client"

import { useState } from "react"

export default function ListingGallery({ images }: { images: string[] }) {
  const [active, setActive] = useState(0)
  const hasImages = images.length > 0

  return (
    <div
      className="rounded-xl overflow-hidden mb-4"
      style={{
        background: "#fff",
        border: "1px solid var(--color-border)"
      }}
    >
      {/* Main image */}
      <div
        className="w-full flex items-center justify-center"
        style={{ height: 320, background: "#E6FAF0" }}
      >
        {hasImages ? (
          <img
            src={images[active]}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <span style={{ fontSize: 72, opacity: 0.4 }}>📷</span>
        )}
      </div>

      {/* Thumbnails */}
      {hasImages && images.length > 1 && (
        <div className="flex gap-2 p-3 overflow-x-auto">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className="shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all"
              style={{
                border: i === active
                  ? "2px solid #C2622A"
                  : "1px solid var(--color-border)",
                opacity: i === active ? 1 : 0.6
              }}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}