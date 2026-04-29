"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCallback } from "react"

const CITIES = [
  "دمشق", 
  "حلب", 
  "حمص", 
  "حماة", 
  "اللاذقية", 
  "طرطوس", 
  "إدلب", 
  "دير الزور"
]

export default function CategoryFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const condition = searchParams.get("condition") ?? "all"
  const city = searchParams.get("city") ?? ""
  const minPrice = searchParams.get("min") ?? ""
  const maxPrice = searchParams.get("max") ?? ""
  const sort = searchParams.get("sort") ?? "newest"

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      params.delete("page")
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  return (
    <div
      className="space-y-4 mb-6"
      style={{ fontFamily: "var(--font-arabic)" }}
    >
      {/* Toolbar row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Condition chips */}
          {[
            { value: "all", label: "الكل" },
            { value: "new", label: "جديد" },
            { value: "used", label: "مستعمل" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setParam("condition", opt.value === "all" ? "" : opt.value)}
              className="px-3 py-1.5 rounded-full text-xs transition-colors"
              style={{
                background: condition === opt.value ? "#F5EDE6" : "#fff",
                border: condition === opt.value
                  ? "1px solid #C2622A"
                  : "1px solid var(--color-border)",
                color: condition === opt.value ? "#8C4420" : "var(--color-text-primary)",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setParam("sort", e.target.value)}
          className="text-xs px-3 py-1.5 rounded-lg outline-none"
          style={{
            border: "1px solid var(--color-border)",
            background: "#fff",
            color: "var(--color-text-primary)",
            fontFamily: "var(--font-arabic)",
          }}
        >
          <option value="newest">الأحدث</option>
          <option value="price_asc">السعر: الأقل أولاً</option>
          <option value="price_desc">السعر: الأعلى أولاً</option>
        </select>
      </div>

      {/* Second row: city + price */}
      <div className="flex flex-wrap gap-2">
        {/* City picker */}
        <select
          value={city}
          onChange={(e) => setParam("city", e.target.value)}
          className="text-xs px-3 py-1.5 rounded-full outline-none"
          style={{
            border: city
              ? "1px solid #C2622A"
              : "1px solid var(--color-border)",
            background: city ? "#F5EDE6" : "#fff",
            color: city ? "#8C4420" : "var(--color-text-primary)",
            fontFamily: "var(--font-arabic)",
          }}
        >
          <option value="">📍 كل المدن</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* Price range */}
        <div
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs"
          style={{
            border: minPrice || maxPrice
              ? "1px solid #C2622A"
              : "1px solid var(--color-border)",
            background: minPrice || maxPrice ? "#F5EDE6" : "#fff",
          }}
        >
          <span style={{ color: "var(--color-text-muted)" }}>💰</span>
          <input
            type="number"
            placeholder="من"
            value={minPrice}
            onChange={(e) => setParam("min", e.target.value)}
            className="w-14 outline-none bg-transparent text-xs"
            style={{
              color: "var(--color-text-primary)",
              fontFamily: "var(--font-arabic)",
            }}
          />
          <span style={{ color: "var(--color-text-muted)" }}>—</span>
          <input
            type="number"
            placeholder="إلى"
            value={maxPrice}
            onChange={(e) => setParam("max", e.target.value)}
            className="w-14 outline-none bg-transparent text-xs"
            style={{
              color: "var(--color-text-primary)",
              fontFamily: "var(--font-arabic)",
            }}
          />
          <span style={{ color: "var(--color-text-muted)" }}>د.أ</span>
        </div>

        {/* Clear filters */}
        {(condition !== "all" || city || minPrice || maxPrice) && (
          <button
            onClick={() => router.push(pathname)}
            className="text-xs px-3 py-1.5 rounded-full transition-colors"
            style={{
              border: "1px solid var(--color-border)",
              color: "var(--color-text-muted)",
              background: "#fff",
            }}
          >
            مسح الفلاتر ✕
          </button>
        )}
      </div>
    </div>
  )
}