"use client"

import { useState } from "react"

export default function ReportButton({ listingId }: { listingId: string }) {
  const [reported, setReported] = useState(false)

  return (
    <button
      onClick={() => setReported(true)}
      disabled={reported}
      className="w-full text-xs mt-2 py-1 transition-colors"
      style={{
        color: reported ? "var(--color-text-muted)" : "#dc2626",
        fontFamily: "var(--font-arabic)",
        background: "none",
        border: "none",
        cursor: reported ? "default" : "pointer",
      }}
    >
      {reported ? "✓ تم الإبلاغ عن هذا الإعلان" : "الإبلاغ عن هذا الإعلان"}
    </button>
  )
}