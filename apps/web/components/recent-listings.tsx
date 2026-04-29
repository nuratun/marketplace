import ListingCard, { type Listing } from "@/components/listing-card"

const MOCK_LISTINGS: Listing[] = [
  { id: "1", title: "آيفون ١٥ برو ماكس", price: 850, currency: "د.أ", city: "دمشق", category: "electronics", created_at: new Date(Date.now() - 3 * 3600000).toISOString() },
  { id: "2", title: "تويوتا كورولا ٢٠٢٠", price: 12000, currency: "د.أ", city: "حلب", category: "cars", created_at: new Date(Date.now() - 5 * 3600000).toISOString() },
  { id: "3", title: "شقة للإيجار - المزة", price: 450, currency: "د.أ", city: "دمشق", category: "real-estate", created_at: new Date(Date.now() - 8 * 3600000).toISOString() },
  { id: "4", title: "طقم غرفة نوم كامل", price: 600, currency: "د.أ", city: "حمص", category: "furniture", created_at: new Date(Date.now() - 24 * 3600000).toISOString() },
]

export default function RecentListings() {
  return (
    <section
      className="max-w-6xl mx-auto px-4 pb-12"
      style={{ fontFamily: "var(--font-arabic)" }}
    >
      <h2
        className="text-base font-semibold mb-4"
        style={{ color: "var(--color-text-primary)" }}
      >
        أحدث الإعلانات
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {MOCK_LISTINGS.map((l) => (
          <ListingCard key={l.id} listing={l} />
        ))}
      </div>
    </section>
  )
}