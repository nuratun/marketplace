import { Suspense } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { apiFetch } from "@/lib/api"
import { type Listing, type ListingsResponse } from "@/types/listing"
import ListingGallery from "@/components/listing-gallery"
import PhoneReveal from "@/components/phone-reveal"
import ReportButton from "@/components/report-button"
import ListingCard from "@/components/listing-card"
import SaveButton from "@/components/save-button"

const categoryLabels: Record<string, string> = {
  "real-estate": "عقارات",
  cars: "سيارات",
  electronics: "إلكترونيات",
  furniture: "أثاث ومنزل",
  clothing: "ملابس",
  jobs: "وظائف وخدمات"
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 24) return `منذ ${h} ساعة`
  return `منذ ${Math.floor(h / 24)} يوم`
}

function getInitials(name: string | null) {
  if (!name) return "؟"
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2)
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-4 mb-4"
      style={{ background: "#fff", border: "1px solid var(--color-border)" }}
    >
      {children}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs mb-3 font-medium" style={{ color: "var(--color-text-muted)" }}>
      {children}
    </p>
  )
}

const conditionLabels: Record<string, string> = {
  new: "جديد",
  used: "مستعمل"
}

export default async function ListingDetailPage({ params }: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  let listing: Listing
  let similar: Listing[] = []

  try {
    listing = await apiFetch<Listing>(`/listings/${id}`)
  } catch {
    notFound()
  }

  try {
    const similarData = await apiFetch<ListingsResponse>(
      `/listings?category=${listing.category}&limit=4`
    )
    similar = similarData.results.filter((l) => l.id !== listing.id).slice(0, 4)
  } catch {
    similar = []
  }

  return (
    <div
      className="max-w-2xl mx-auto px-4 py-8"
      style={{ fontFamily: "var(--font-arabic)" }}
    >
      {/* Breadcrumb */}
      <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>
        <Link href="/" style={{ color: "var(--color-text-muted)" }}>الرئيسية</Link>
        {" · "}
        <Link
          href={`/category/${listing.category}`}
          style={{ color: "var(--color-text-muted)" }}
        >
          {categoryLabels[listing.category] ?? listing.category}
        </Link>
        {" · "}
        <span style={{ color: "var(--color-brand)" }}>{listing.title}</span>
      </p>

      <Suspense>
        <ListingGallery images={listing.image_urls} />
      </Suspense>

      {/* Title + price */}
      <Card>
        <span
          className="inline-block text-xs px-2 py-0.5 rounded-full mb-2"
          style={{ background: "#E6FAF0", color: "#0F6E56" }}
        >
          {conditionLabels[listing.condition] ?? listing.condition}
        </span>
        <h1
          className="text-xl font-semibold mb-1"
          style={{ color: "var(--color-text-primary)" }}
        >
          {listing.title}
        </h1>
        <p className="text-2xl font-bold mb-3" style={{ color: "var(--color-brand)" }}>
          {listing.price.toLocaleString("en-US")} {listing.currency}
        </p>
        <div className="flex items-center justify-between mt-3">
          <div className="flex gap-4 text-xs" style={{ color: "var(--color-text-muted)" }}>
            <span>📍 {listing.city}</span>
            <span>🕐 {timeAgo(listing.created_at)}</span>
            <span>👁 {listing.views} مشاهدة</span>
          </div>
          <SaveButton listingId={id} variant="full" />
        </div>
      </Card>

      {/* Description */}
      <Card>
        <SectionLabel>الوصف</SectionLabel>
        <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-primary)" }}>
          {listing.description}
        </p>
      </Card>

      {/* Seller + contact */}
      <Card>
        <SectionLabel>البائع</SectionLabel>
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium shrink-0"
            style={{ background: "#F5EDE6", color: "#C2622A" }}
          >
            {getInitials(listing.seller.name)}
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
              {listing.seller.name ?? "مستخدم شامنا"}
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              عضو منذ {listing.seller.member_since}
            </p>
          </div>
        </div>
        <Suspense>
          <PhoneReveal listingId={id} />
        </Suspense>
        <ReportButton listingId={id} />
      </Card>

      {/* Location */}
      <Card>
        <SectionLabel>الموقع</SectionLabel>
        <p className="text-sm" style={{ color: "var(--color-text-primary)" }}>
          📍 {listing.city}، سوريا
        </p>
      </Card>

      {/* Similar listings */}
      {similar.length > 0 && (
        <div className="mt-6">
          <h2
            className="text-base font-semibold mb-4"
            style={{ color: "var(--color-text-primary)" }}
          >
            إعلانات مشابهة
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {similar.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        </div>
      )}
    </div>
  )
}