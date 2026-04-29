import { Suspense } from "react"
import Link from "next/link"
import ListingGallery from "@/components/listing-gallery"
import PhoneReveal from "@/components/phone-reveal"
import ReportButton from "@/components/report-button"
import ListingCard, { type Listing } from "@/components/listing-card"

// Mock data — replace with apiFetch(`/listings/${id}`) once API is ready
const MOCK: Listing & {
  description: string
  condition: string
  views: number
  seller: { name: string; memberSince: string }
  images: string[]
  similar: Listing[]
} = {
  id: "1",
  title: "آيفون ١٥ برو ماكس ٢٥٦ جيجا",
  price: 850,
  currency: "د.أ",
  city: "دمشق",
  category: "electronics",
  created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
  condition: "جديد",
  views: 124,
  description:
    "آيفون ١٥ برو ماكس بحالة ممتازة، اشتريته من السعودية قبل شهرين. معه كرتونه الأصلي وكابل الشحن. البطارية ٩٨٪. لون تيتانيوم الطبيعي. السعر غير قابل للتفاوض.",
  seller: { name: "أحمد الخطيب", memberSince: "يناير ٢٠٢٤" },
  images: [],
  similar: [
    { id: "2", title: "آيفون ١٤ برو", price: 650, currency: "د.أ", city: "دمشق", category: "electronics", created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: "3", title: "سامسونج S24 Ultra", price: 780, currency: "د.أ", city: "حلب", category: "electronics", created_at: new Date(Date.now() - 172800000).toISOString() },
    { id: "4", title: "بيكسل ٨ برو", price: 700, currency: "د.أ", city: "دمشق", category: "electronics", created_at: new Date(Date.now() - 259200000).toISOString() },
    { id: "5", title: "ون بلس ١٢", price: 520, currency: "د.أ", city: "حمص", category: "electronics", created_at: new Date(Date.now() - 345600000).toISOString() },
  ],
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 24) return `منذ ${h} ساعة`
  return `منذ ${Math.floor(h / 24)} يوم`
}

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2)
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl p-4 mb-4 ${className}`}
      style={{ background: "#fff", border: "1px solid var(--color-border)" }}
    >
      {children}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-xs mb-3 font-medium"
      style={{ color: "var(--color-text-muted)" }}
    >
      {children}
    </p>
  )
}

export default function ListingDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const listing = MOCK // replace with await apiFetch(...)

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
          {listing.category}
        </Link>
        {" · "}
        <span style={{ color: "var(--color-brand)" }}>{listing.title}</span>
      </p>

      {/* Gallery */}
      <Suspense>
        <ListingGallery images={listing.images} />
      </Suspense>

      {/* Title + price */}
      <Card>
        <span
          className="inline-block text-xs px-2 py-0.5 rounded-full mb-2"
          style={{ background: "#E6FAF0", color: "#0F6E56" }}
        >
          {listing.condition}
        </span>
        <h1
          className="text-xl font-semibold mb-1"
          style={{ color: "var(--color-text-primary)" }}
        >
          {listing.title}
        </h1>
        <p
          className="text-2xl font-bold mb-3"
          style={{ color: "var(--color-brand)" }}
        >
          {listing.price.toLocaleString("ar-SY")} {listing.currency}
        </p>
        <div
          className="flex gap-4 text-xs"
          style={{ color: "var(--color-text-muted)" }}
        >
          <span>📍 {listing.city}</span>
          <span>🕐 {timeAgo(listing.created_at)}</span>
          <span>👁 {listing.views} مشاهدة</span>
        </div>
      </Card>

      {/* Description */}
      <Card>
        <SectionLabel>الوصف</SectionLabel>
        <p
          className="text-sm leading-relaxed"
          style={{ color: "var(--color-text-primary)" }}
        >
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
            <p
              className="text-sm font-medium"
              style={{ color: "var(--color-text-primary)" }}
            >
              {listing.seller.name}
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              عضو منذ {listing.seller.memberSince}
            </p>
          </div>
        </div>
        <Suspense>
          <PhoneReveal listingId={params.id} />
        </Suspense>
        <ReportButton listingId={params.id} />
      </Card>

      {/* Location */}
      <Card>
        <SectionLabel>الموقع</SectionLabel>
        <p
          className="text-sm"
          style={{ color: "var(--color-text-primary)" }}
        >
          📍 {listing.city}، سوريا
        </p>
      </Card>

      {/* Similar listings */}
      {listing.similar.length > 0 && (
        <div className="mt-6">
          <h2
            className="text-base font-semibold mb-4"
            style={{ color: "var(--color-text-primary)" }}
          >
            إعلانات مشابهة
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {listing.similar.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}