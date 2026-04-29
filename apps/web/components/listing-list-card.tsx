import Link from "next/link"
import { type Listing } from "@/components/listing-card"

const categoryIcons: Record<string, { icon: string; color: string }> = {
  "real-estate": { icon: "🏠", color: "#FFF0E6" },
  cars: { icon: "🚗", color: "#E6F0FF" },
  electronics: { icon: "📱", color: "#E6FAF0" },
  furniture: { icon: "🛋️", color: "#FFF8E6" },
  clothing: { icon: "👗", color: "#F9E6FF" },
  jobs: { icon: "💼", color: "#E6FFF6" }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 24) return `منذ ${h} ساعة`
  return `منذ ${Math.floor(h / 24)} يوم`
}

export default function ListingListCard({ listing }: { listing: Listing }) {
  const meta = categoryIcons[listing.category] ?? { icon: "📦", color: "#F1EFE8" }

  return (
    <Link
      href={`/listing/${listing.id}`}
      className="flex rounded-xl overflow-hidden transition-shadow hover:shadow-md"
      style={{
        background: "#fff",
        border: "1px solid var(--color-border)",
        fontFamily: "var(--font-arabic)"
      }}
    >
      <div
        className="w-24 shrink-0 flex items-center justify-center text-3xl"
        style={{ background: meta.color }}
      >
        {listing.thumbnail ? (
          <img
            src={listing.thumbnail}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        ) : (
          meta.icon
        )}
      </div>
      <div className="flex-1 p-3 min-w-0">
        <span
          className="inline-block text-xs px-2 py-0.5 rounded-full mb-1"
          style={{ background: "#F5EDE6", color: "#8C4420" }}
        >
          {listing.category}
        </span>
        <p
          className="text-sm font-medium truncate"
          style={{ color: "var(--color-text-primary)" }}
        >
          {listing.title}
        </p>
        <p
          className="text-sm font-semibold mt-1"
          style={{ color: "var(--color-brand)" }}
        >
          {listing.price.toLocaleString("ar-SY")} {listing.currency}
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
          {listing.city} · {timeAgo(listing.created_at)}
        </p>
      </div>
    </Link>
  )
}