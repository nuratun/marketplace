"use client"

import { useState, Suspense } from "react"
import { useParams } from "next/navigation"
import CategoryFilters from "@/components/category-filters"
import ViewToggle from "@/components/view-toggle"
import ListingCard, { type Listing } from "@/components/listing-card"
import ListingListCard from "@/components/listing-list-card"

const CATEGORY_LABELS: Record<string, string> = {
  "real-estate": "عقارات",
  cars: "سيارات",
  electronics: "إلكترونيات",
  furniture: "أثاث ومنزل",
  clothing: "ملابس",
  jobs: "وظائف وخدمات"
}

const MOCK_LISTINGS: Listing[] = [
  { id: "1", title: "آيفون ١٥ برو ماكس", price: 850, currency: "د.أ", city: "دمشق", category: "electronics", created_at: new Date(Date.now() - 3 * 3600000).toISOString() },
  { id: "2", title: "ماك بوك برو M3", price: 1400, currency: "د.أ", city: "حلب", category: "electronics", created_at: new Date(Date.now() - 5 * 3600000).toISOString() },
  { id: "3", title: "شاشة سامسونج ٢٧ بوصة", price: 220, currency: "د.أ", city: "دمشق", category: "electronics", created_at: new Date(Date.now() - 24 * 3600000).toISOString() },
  { id: "4", title: "بلايستيشن ٥", price: 650, currency: "د.أ", city: "حمص", category: "electronics", created_at: new Date(Date.now() - 48 * 3600000).toISOString() },
  { id: "5", title: "سماعات سوني WH-1000XM5", price: 180, currency: "د.أ", city: "اللاذقية", category: "electronics", created_at: new Date(Date.now() - 72 * 3600000).toISOString() },
  { id: "6", title: "آيباد برو ١٢.٩", price: 950, currency: "د.أ", city: "دمشق", category: "electronics", created_at: new Date(Date.now() - 96 * 3600000).toISOString() }
]

type View = "grid" | "list"

function CategoryPageInner() {
  const { slug } = useParams<{ slug: string }>()
  const [view, setView] = useState<View>("grid")
  const label = CATEGORY_LABELS[slug] ?? slug

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

      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-xl font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            {label}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {MOCK_LISTINGS.length} إعلان
          </p>
        </div>
        <ViewToggle view={view} onChange={setView} />
      </div>

      {/* Filters */}
      <CategoryFilters />

      {/* Listings */}
      {view === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {MOCK_LISTINGS.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {MOCK_LISTINGS.map((l) => (
            <ListingListCard key={l.id} listing={l} />
          ))}
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