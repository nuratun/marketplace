import Link from "next/link"
import { categoryIcons, timeAgo } from "@/lib/utils"
import { Listing } from "@/types/listing"

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
          {listing.price.toLocaleString("en-US")} {listing.currency}
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
          {listing.city} · {timeAgo(listing.created_at)}
        </p>
      </div>
    </Link>
  )
}