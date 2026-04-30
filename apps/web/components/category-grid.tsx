import Link from "next/link"

const categories = [
  { slug: "real-estate", label: "عقارات", icon: "🏠", color: "#FFF0E6" },
  { slug: "cars", label: "سيارات", icon: "🚗", color: "#E6F0FF" },
  { slug: "electronics", label: "إلكترونيات", icon: "📱", color: "#E6FAF0" },
  { slug: "furniture", label: "أثاث ومنزل", icon: "🛋️", color: "#FFF8E6" },
  { slug: "clothing", label: "ملابس", icon: "👗", color: "#F9E6FF" },
  { slug: "jobs", label: "وظائف وخدمات", icon: "💼", color: "#E6FFF6" },
]

export default function CategoryGrid() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-6" style={{ fontFamily: "var(--font-arabic)" }}>
      <h2 className="text-base font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>
        تصفح حسب الفئة
      </h2>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/category/${cat.slug}`}
            className="flex flex-col items-center gap-2 p-4 rounded-xl transition-shadow hover:shadow-sm"
            style={{
              background: "#fff",
              border: "1px solid var(--color-border)",
            }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
              style={{ background: cat.color }}
            >
              {cat.icon}
            </div>
            <span
              className="text-xs font-medium text-center"
              style={{ color: "var(--color-text-primary)" }}
            >
              {cat.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}