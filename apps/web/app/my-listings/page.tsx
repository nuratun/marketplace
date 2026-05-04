"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { getApiBaseUrl, getAuthHeaders } from "@/lib/api"
import { type Listing } from "@/types/listing"

const categoryLabels: Record<string, string> = {
  "real-estate": "عقارات",
  cars: "سيارات",
  electronics: "إلكترونيات",
  furniture: "أثاث ومنزل",
  clothing: "ملابس",
  jobs: "وظائف وخدمات"
}

const statusStyles: Record<string, { label: string; bg: string; color: string }> = {
  active: { label: "نشط", bg: "#E6FAF0", color: "#0F6E56" },
  sold: { label: "مباع", bg: "#FFF3E0", color: "#E65100" },
  expired: { label: "منتهي", bg: "#F5F5F5", color: "#757575" }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return "منذ أقل من ساعة"
  if (h < 24) return `منذ ${h} ساعة`
  return `منذ ${Math.floor(h / 24)} يوم`
}

export default function MyListingsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null) // listing id being acted on
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace("/auth?from=/my-listings")
      return
    }
    fetchMyListings()
  }, [user, authLoading])

  async function fetchMyListings() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${getApiBaseUrl()}/listings/mine`, {
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        credentials: "include",
      })
      if (!res.ok) throw new Error("فشل تحميل الإعلانات")
      const data = await res.json()
      setListings(data.results)
    } catch {
      setError("تعذّر تحميل إعلاناتك. حاول مجدداً.")
    } finally {
      setLoading(false)
    }
  }

  async function markAsSold(id: string) {
    setActionLoading(id)
    try {
      const res = await fetch(`${getApiBaseUrl()}/listings/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        credentials: "include",
        body: JSON.stringify({ status: "sold" }),
      })
      if (!res.ok) throw new Error()
      setListings((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: "sold" } : l))
      )
    } catch {
      alert("حدث خطأ. حاول مجدداً.")
    } finally {
      setActionLoading(null)
    }
  }

  async function deleteListing(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا الإعلان؟")) return
    setActionLoading(id)
    try {
      const res = await fetch(`${getApiBaseUrl()}/listings/${id}`, {
        method: "DELETE",
        headers: { ...getAuthHeaders() },
        credentials: "include",
      })
      if (!res.ok) throw new Error()
      setListings((prev) => prev.filter((l) => l.id !== id))
    } catch {
      alert("حدث خطأ أثناء الحذف. حاول مجدداً.")
    } finally {
      setActionLoading(null)
    }
  }

  // ── Render states ──────────────────────────────────────

  if (authLoading || loading) {
    return (
      <div
        className="max-w-2xl mx-auto px-4 py-16 text-center"
        style={{ fontFamily: "var(--font-arabic)", color: "var(--color-text-muted)" }}
      >
        جاري التحميل...
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="max-w-2xl mx-auto px-4 py-16 text-center"
        style={{ fontFamily: "var(--font-arabic)" }}
      >
        <p style={{ color: "var(--color-text-muted)" }}>{error}</p>
        <button
          onClick={fetchMyListings}
          className="mt-4 px-4 py-2 rounded-lg text-sm"
          style={{ background: "var(--color-brand)", color: "#fff" }}
        >
          إعادة المحاولة
        </button>
      </div>
    )
  }

  if (listings.length === 0) {
    return (
      <div
        className="max-w-2xl mx-auto px-4 py-20 text-center"
        style={{ fontFamily: "var(--font-arabic)", direction: "rtl" }}
      >
        <div style={{ fontSize: 52, marginBottom: 16 }}>📭</div>
        <h2
          className="text-lg font-semibold mb-2"
          style={{ color: "var(--color-text-primary)" }}
        >
          لا توجد إعلانات بعد
        </h2>
        <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
          أضف أول إعلان لك وابدأ البيع الآن
        </p>
        <Link
          href="/post"
          className="inline-block px-6 py-2.5 rounded-lg text-sm font-medium"
          style={{ background: "var(--color-brand)", color: "#fff", textDecoration: "none" }}
        >
          أضف إعلاناً
        </Link>
      </div>
    )
  }

  // ── Main list ──────────────────────────────────────────

  return (
    <div
      className="max-w-2xl mx-auto px-4 py-8"
      style={{ fontFamily: "var(--font-arabic)", direction: "rtl" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold" style={{ color: "var(--color-text-primary)" }}>
          إعلاناتي
        </h1>
        <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          {listings.length} إعلان
        </span>
      </div>

      {/* Listing rows */}
      <div className="flex flex-col gap-3">
        {listings.map((listing) => {
          const st = statusStyles[listing.status] ?? statusStyles.active
          const isActing = actionLoading === listing.id

          return (
            <div
              key={listing.id}
              className="rounded-xl overflow-hidden"
              style={{
                background: "#fff",
                border: "1px solid var(--color-border)",
                opacity: isActing ? 0.6 : 1,
                transition: "opacity 0.2s",
              }}
            >
              <div className="flex gap-3 p-3">
                {/* Thumbnail */}
                <div
                  className="shrink-0 rounded-lg overflow-hidden"
                  style={{
                    width: 90,
                    height: 90,
                    background: "var(--color-surface)",
                    position: "relative",
                  }}
                >
                  {listing.image_urls?.[0] ? (
                    <Image
                      src={listing.image_urls[0]}
                      alt={listing.title}
                      fill
                      sizes="90px"
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 32,
                      }}
                    >
                      {categoryLabels[listing.category] ? "🖼️" : "📦"}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/listing/${listing.id}`}
                      className="text-sm font-medium leading-snug"
                      style={{
                        color: "var(--color-text-primary)",
                        textDecoration: "none",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {listing.title}
                    </Link>
                    {/* Status badge */}
                    <span
                      className="shrink-0 text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: st.bg, color: st.color }}
                    >
                      {st.label}
                    </span>
                  </div>

                  <p
                    className="text-base font-bold mt-1"
                    style={{ color: "var(--color-brand)" }}
                  >
                    {listing.price.toLocaleString("en-US")} {listing.currency}
                  </p>

                  <div
                    className="flex gap-3 text-xs mt-1"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    <span>📍 {listing.city}</span>
                    <span>👁 {listing.views}</span>
                    <span>{timeAgo(listing.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* Action bar */}
              <div
                className="flex gap-2 px-3 pb-3"
                style={{ borderTop: "1px solid var(--color-border)", paddingTop: 10 }}
              >
                <Link
                  href={`/listing/${listing.id}`}
                  className="flex-1 text-center text-xs py-1.5 rounded-lg"
                  style={{
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-primary)",
                    textDecoration: "none",
                  }}
                >
                  عرض
                </Link>

                {listing.status === "active" && (
                  <button
                    onClick={() => markAsSold(listing.id)}
                    disabled={isActing}
                    className="flex-1 text-xs py-1.5 rounded-lg"
                    style={{
                      border: "1px solid #E65100",
                      color: "#E65100",
                      background: "transparent",
                      cursor: isActing ? "not-allowed" : "pointer",
                    }}
                  >
                    تم البيع
                  </button>
                )}

                <button
                  onClick={() => deleteListing(listing.id)}
                  disabled={isActing}
                  className="flex-1 text-xs py-1.5 rounded-lg"
                  style={{
                    border: "1px solid #D32F2F",
                    color: "#D32F2F",
                    background: "transparent",
                    cursor: isActing ? "not-allowed" : "pointer",
                  }}
                >
                  حذف
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}