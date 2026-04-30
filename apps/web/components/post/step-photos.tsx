"use client"

import { useState, useRef } from "react"
import { X, Loader2, Plus } from "lucide-react"

const MAX_PHOTOS = 5
const API_URL = process.env.NEXT_PUBLIC_API_URL

export default function StepPhotos({
  images,
  onChange,
  onNext,
  onBack
}: {
  images: File[]
  onChange: (files: File[]) => void
  onNext: (uploadedUrls: string[]) => void
  onBack: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const merged = [...images, ...files].slice(0, MAX_PHOTOS)
    onChange(merged)
    e.target.value = ""
  }

  function remove(index: number) {
    onChange(images.filter((_, i) => i !== index))
  }

  async function handleNext() {
    // No photos is fine — skip upload entirely
    if (images.length === 0) {
      onNext([])
      return
    }

    setUploading(true)
    setError(null)

    try {
      const token = localStorage.getItem("access_token")

      // 1. Get presigned URLs from our API
      const presignRes = await fetch(`${API_URL}/uploads/presign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(
          images.map((f) => ({
            filename: f.name,
            content_type: f.type
          }))
        )
      })

      if (!presignRes.ok) throw new Error("فشل في تحضير رفع الصور")

      const presigned: { upload_url: string; public_url: string }[] = await presignRes.json()

      // 2. PUT each file directly to R2
      await Promise.all(
        presigned.map(({ upload_url }, i) =>
          fetch(upload_url, {
            method: "PUT",
            headers: { "Content-Type": images[i].type },
            body: images[i]
          })
        )
      )

      // 3. Pass the public URLs up to the page
      onNext(presigned.map((p) => p.public_url))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "حدث خطأ أثناء رفع الصور")
    } finally {
      setUploading(false)
    }
  }

  const previews = images.map((f) => URL.createObjectURL(f))

  return (
    <div style={{ fontFamily: "var(--font-arabic)" }}>
      <h2
        className="text-base font-semibold mb-1"
        style={{ color: "var(--color-text-primary)" }}
      >
        صور الإعلان
      </h2>
      <p className="text-xs mb-5" style={{ color: "var(--color-text-muted)" }}>
        أضف حتى {MAX_PHOTOS} صور — الصورة الأولى ستكون الغلاف
      </p>

      <div className="grid grid-cols-5 gap-2 mb-6">
        {previews.map((src, i) => (
          <div
            key={i}
            className="relative aspect-square rounded-lg overflow-hidden"
            style={{ border: "1.5px solid #C2622A" }}
          >
            <img src={src} alt="" className="w-full h-full object-cover" />
            {i === 0 && (
              <span
                className="absolute bottom-0 right-0 left-0 text-center text-white py-0.5"
                style={{ background: "rgba(194,98,42,0.8)", fontSize: 9 }}
              >
                غلاف
              </span>
            )}
            <button
              onClick={() => remove(i)}
              className="absolute top-1 left-1 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.5)" }}
            >
              <X size={10} color="#fff" />
            </button>
          </div>
        ))}

        {images.length < MAX_PHOTOS && (
          <button
            onClick={() => inputRef.current?.click()}
            className="aspect-square rounded-lg flex flex-col items-center justify-center gap-1"
            style={{
              border: "1.5px dashed var(--color-border)",
              background: "var(--color-surface)",
              color: "var(--color-text-muted)"
            }}
          >
            <Plus size={18} />
            <span style={{ fontSize: 9 }}>إضافة</span>
          </button>
        )}

        {Array.from({
          length: Math.max(0, MAX_PHOTOS - images.length - 1),
        }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="aspect-square rounded-lg"
            style={{
              border: "1px dashed var(--color-border)",
              background: "var(--color-surface)",
              opacity: 0.4,
            }}
          />
        ))}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />

      <p className="text-xs mb-4 text-center" style={{ color: "var(--color-text-muted)" }}>
        {images.length}/{MAX_PHOTOS} صور مضافة
        {images.length === 0 && " · يمكنك المتابعة بدون صور"}
      </p>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          onClick={onBack}
          disabled={uploading}
          className="flex-1 py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
          style={{
            border: "1px solid var(--color-border)",
            background: "#fff",
            color: "var(--color-text-primary)",
            fontFamily: "var(--font-arabic)"
          }}
        >
          → السابق
        </button>
        <button
          onClick={handleNext}
          disabled={uploading}
          className="flex-[2] py-3 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: "var(--color-brand)" }}
        >
          {uploading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              جاري الرفع...
            </>
          ) : (
            "التالي: المراجعة ←"
          )}
        </button>
      </div>
    </div>
  )
}