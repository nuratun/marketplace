import { apiFetch } from "@/lib/api"
import { type ListingsResponse } from "@/types/listing"
import ListingCard, { type Listing } from "@/components/listing-card"

export default async function RecentListings() {
  let data: ListingsResponse

  try {
    data = await apiFetch<ListingsResponse>("/listings?limit=8&sort=newest")
  } catch {
    return null
  }

  if (!data.results.length) return null

  return (
    <section
      className="max-w-6xl mx-auto px-4 pb-12"
      style={{ fontFamily: "var(--font-arabic)" }}
    >
      <h2
        className="text-base font-semibold my-4"
        style={{ color: "var(--color-text-primary)" }}
      >
        أحدث الإعلانات
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {data.results.map((l) => (
          <ListingCard key={l.id} listing={l} />
        ))}
      </div>
    </section>
  )
}