"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"

export default function Hero() {
  const [query, setQuery] = useState("")
  const router = useRouter()

  function handleSearch() {
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query)}`)
  }

  return (
    <section
      className="py-12 px-4 text-center"
      style={{
        background: "linear-gradient(160deg, #F5EDE6 0%, #FDFAF7 60%)",
        fontFamily: "var(--font-arabic)",
      }}
    >
      <h1
        className="text-3xl font-semibold mb-2"
        style={{ color: "var(--color-text-primary)" }}
      >
        اشتري وبيع في سوريا
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
        ملايين الإعلانات في مكان واحد
      </p>

      <div className="flex max-w-xl mx-auto rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--color-border)", background: "#fff" }}
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="ابحث عن سيارات، شقق، إلكترونيات..."
          className="flex-1 px-4 py-3 text-sm outline-none bg-transparent"
          style={{ fontFamily: "var(--font-arabic)" }}
        />
        <button
          onClick={handleSearch}
          className="px-5 py-3 text-sm font-medium text-white flex items-center gap-2 transition-opacity hover:opacity-90"
          style={{ background: "var(--color-brand)" }}
        >
          <Search size={15} />
          <span>بحث</span>
        </button>
      </div>
    </section>
  )
}