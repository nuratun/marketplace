"use client"

import { useState, useEffect, Suspense } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { apiFetch } from "@/lib/api"
import { Listing, type ListingsResponse } from "@/types/listing"
import CategoryFilters from "@/components/category-filters"
import ViewToggle from "@/components/ui/ViewToggle"
import ListingCard from "@/components/listing-card"
import ListingListCard from "@/components/listing-list-card"

const CATEGORY_LABELS: Record<string, string> = {
  "real-estate": "عقارات",
  cars: "سيارات",
  electronics: "إلكترونيات",
  furniture: "أثاث ومنزل",
  clothing: "ملابس",
  jobs: "وظائف وخدمات",
}

type View = "grid" | "list"

function CategoryPageInner() {
  const { slug } = useParams<{ slug: string }>()
  const searchParams = useSearchParams()
  const [view, setView] = useState<View>("grid")
  const [data, setData] = useState<ListingsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const label = CATEGORY_LABELS[slug] ?? slug

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set("category", slug)
    if (searchParams.get("condition")) params.set("condition", searchParams.get("condition")!)
    if (searchParams.get("city")) params.set("city", searchParams.get("city")!)
    if (searchParams.get("min")) params.set("min_price", searchParams.get("min")!)
    if (searchParams.get("max")) params.set("max_price", searchParams.get("max")!)
    if (searchParams.get("sort")) params.set("sort", searchParams.get("sort")!)

    apiFetch<ListingsResponse>(`/listings?${params.toString()}`)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [slug, searchParams])

  return (
    <div
      className="max-w-6xl mx-auto px-4 py-8"
      style={{ fontFamily: "var(--font-arabic)" }}
    >
      {/* Breadcrumb */}
      <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>
        <a href="/" style={{ color: "var(--color-text-muted)" }}>الرئيسية</a>
        {" · "}
        <span style={{ color: "var(--color-brand)" }}>{label}</span>
      </p>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--color-text-primary)" }}>
            {label}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {data ? `${data.total} إعلان` : "..."}
          </p>
        </div>
        <ViewToggle view={view} onChange={setView} />
      </div>

      <CategoryFilters />

      {loading ? (
        <div className="text-center py-16" style={{ color: "var(--color-text-muted)" }}>
          جاري التحميل...
        </div>
      ) : !data?.results.length ? (
        <div className="text-center py-16" style={{ color: "var(--color-text-muted)" }}>
          لا توجد إعلانات في هذه الفئة
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {data.results.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {data.results.map((l) => <ListingListCard key={l.id} listing={l} />)}
        </div>
      )}
    </div>
  )
}

export default function CategoryPage() {
  return (
    <Suspense>
      <CategoryPageInner />
    </Suspense>
  )
}