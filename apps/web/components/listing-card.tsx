import Link from "next/link"
import { categoryLabels, categoryIcons, timeAgo } from "@/lib/utils"
import { Listing } from "@/types/listing"
import SaveButton from "@/components/ui/SaveButton"

export default function ListingCard({ listing }: { listing: Listing }) {
  const meta = categoryIcons[listing.category] ?? { icon: "📦", color: "#F1EFE8" }

  return (
    <Link
      href={`/listing/${listing.id}`}
      className="block rounded-xl overflow-hidden transition-shadow hover:shadow-md"
      style={{
        background: "#fff",
        border: "1px solid var(--color-border)",
        fontFamily: "var(--font-arabic)",
        position: "relative" // needed for the absolute-positioned save button
      }}
    >
      {/* Image / placeholder */}
      <div
        className="h-36 flex items-center justify-center text-4xl"
        style={{ background: listing.image_urls[0] ? undefined : meta.color, position: "relative" }}
      >
        {listing.image_urls[0] ? (
          <img
            src={listing.image_urls[0]}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        ) : (
          meta.icon
        )}

        {/* Save button — top-left corner (RTL: visually top-end) */}
        <div
          style={{ position: "absolute", top: "8px", left: "8px" }}
        // stopPropagation is handled inside SaveButton itself
        >
          <SaveButton listingId={listing.id} variant="icon" />
        </div>
      </div>

      <div className="p-3">
        <span
          className="inline-block text-xs px-2 py-0.5 rounded-full mb-1"
          style={{ background: "#F5EDE6", color: "#8C4420" }}
        >
          {categoryLabels[listing.category] ?? listing.category}
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