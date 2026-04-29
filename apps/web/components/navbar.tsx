"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search, PlusCircle, User } from "lucide-react"
import { useState } from "react"

export default function Navbar() {
  const [query, setQuery] = useState("")
  const pathname = usePathname()

  return (
    <header
      style={{ borderBottom: "1px solid var(--color-border)", background: "#fff" }}
      className="sticky top-0 z-50"
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">

        {/* Logo */}
        <Link
          href="/"
          className="text-2xl font-bold shrink-0"
          style={{ color: "var(--color-brand)", fontFamily: "var(--font-arabic)" }}
        >
          شامنا
        </Link>

        {/* Search bar */}
        <div className="flex-1 relative max-w-xl">
          <Search
            size={16}
            className="absolute top-1/2 -translate-y-1/2 right-3 pointer-events-none"
            style={{ color: "var(--color-text-muted)" }}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن أي شيء..."
            className="w-full h-10 pr-9 pl-4 rounded-lg text-sm outline-none"
            style={{
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              fontFamily: "var(--font-arabic)",
            }}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/post"
            className="flex items-center gap-2 px-4 h-10 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: "var(--color-brand)", fontFamily: "var(--font-arabic)" }}
          >
            <PlusCircle size={16} />
            <span>أضف إعلان</span>
          </Link>

          <Link
            href={`/auth?from=${pathname}`}
            className="flex items-center gap-2 px-4 h-10 rounded-lg text-sm font-medium transition-colors"
            style={{
              border: "1px solid var(--color-border)",
              color: "var(--color-text-primary)",
              fontFamily: "var(--font-arabic)",
            }}
          >
            <User size={16} />
            <span>دخول</span>
          </Link>
        </div>
      </div>
    </header>
  )
}