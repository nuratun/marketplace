import Link from "next/link"
import Image from "next/image"
import { ChevronLeft } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { type ListingsResponse } from "@/types/listing"
import ListingCard from "@/components/listing-card"

export type SectionCategory = {
  slug: string
  name: string
  icon: string
  description: string
  accentColor: string // CSS gradient for the feature card
}

type Props = {
  category: SectionCategory
}

export default async function CategorySection({ category }: Props) {
  let data: ListingsResponse

  try {
    data = await apiFetch<ListingsResponse>(
      `/listings?category=${category.slug}&limit=8&sort=newest`
    )
  } catch (e) {
    console.error(`CategorySection fetch failed for ${category.slug}:`, e)
    return null
  }

  if (!data.results.length) return null

  return (
    <section
      className="max-w-6xl mx-auto px-4 mb-6"
      style={{ fontFamily: "var(--font-arabic)", direction: "rtl" }}
    >
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <h2
          className="text-base font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          أحدث إعلانات {category.name}
        </h2>
        <Link
          href={`/category/${category.slug}`}
          className="flex items-center gap-1 text-sm"
          style={{ color: "var(--color-brand)", textDecoration: "none" }}
        >
          عرض الكل
          <ChevronLeft size={14} />
        </Link>
      </div>

      {/* Feature card + listings grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "200px 1fr",
          border: "1px solid var(--color-border)",
          borderRadius: 12,
          overflow: "hidden",
          background: "#fff",
        }}
        className="cat-section-grid"
      >
        {/* Feature card */}
        <Link
          href={`/category/${category.slug}`}
          style={{
            background: category.accentColor,
            padding: "24px 20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            textDecoration: "none",
            borderLeft: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div>
            <div style={{ fontSize: 44, marginBottom: 10, lineHeight: 1 }}>
              {category.icon}
            </div>
            <h3
              style={{
                fontSize: 17,
                fontWeight: 600,
                color: "#fff",
                fontFamily: "var(--font-arabic)",
                marginBottom: 8,
              }}
            >
              {category.name}
            </h3>
            <p
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.72)",
                fontFamily: "var(--font-arabic)",
                lineHeight: 1.6,
              }}
            >
              {category.description}
            </p>
          </div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginTop: 20,
              background: "rgba(255,255,255,0.18)",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 6,
              padding: "7px 12px",
              fontSize: 12,
              fontWeight: 500,
              color: "#fff",
              fontFamily: "var(--font-arabic)",
              width: "fit-content",
            }}
          >
            عرض الكل
            <ChevronLeft size={13} />
          </div>
        </Link>

        {/* Mini listings grid — 2 rows × 4 cols */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gridTemplateRows: "repeat(2, 1fr)",
            gap: 1,
            background: "var(--color-border)",
          }}
          className="mini-listings-grid"
        >
          {data.results.slice(0, 8).map((listing) => (
            <Link
              key={listing.id}
              href={`/listing/${listing.id}`}
              style={{ background: "#fff", textDecoration: "none", display: "block" }}
              className="mini-card"
            >
              {/* Thumbnail */}
              <div
                style={{
                  height: 90,
                  background: "var(--color-surface)",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {listing.images?.[0] ? (
                  <Image
                    src={listing.images[0]}
                    alt={listing.title}
                    fill
                    sizes="160px"
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 28,
                    }}
                  >
                    {category.icon}
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ padding: "8px 10px" }}>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--color-text-primary)",
                    fontFamily: "var(--font-arabic)",
                    marginBottom: 3,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    lineHeight: 1.4,
                  }}
                >
                  {listing.title}
                </p>
                {listing.price != null && (
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--color-brand)",
                      fontFamily: "var(--font-arabic)",
                    }}
                  >
                    {listing.price.toLocaleString("ar-SY")} $
                  </p>
                )}
                {listing.city && (
                  <p
                    style={{
                      fontSize: 11,
                      color: "var(--color-text-muted)",
                      fontFamily: "var(--font-arabic)",
                      marginTop: 2,
                    }}
                  >
                    📍 {listing.city}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .cat-section-grid {
            grid-template-columns: 1fr !important;
          }
          .cat-section-grid > a:first-child {
            display: none !important;
          }
          .mini-listings-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 900px) and (min-width: 641px) {
          .mini-listings-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        .mini-card:hover {
          background: var(--color-surface) !important;
        }
      `}</style>
    </section>
  )
}