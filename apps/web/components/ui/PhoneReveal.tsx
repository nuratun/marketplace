"use client"

import { useState } from "react"
import { apiFetch } from "@/lib/api"

export default function PhoneReveal({ listingId }: { listingId: string }) {
  const [phone, setPhone] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function reveal() {
    setLoading(true)
    try {
      const data = await apiFetch<{ phone: string }>(
        `/listings/${listingId}/phone`
      )
      setPhone(data.phone)
    } catch {
      // for now just show a mock
      setPhone("+963 912 345 678")
    } finally {
      setLoading(false)
    }
  }

  const whatsappUrl = phone
    ? `https://wa.me/${phone.replace(/\s+/g, "").replace("+", "")}`
    : null

  return (
    <div className="space-y-2" style={{ fontFamily: "var(--font-arabic)" }}>
      {!phone ? (
        <button
          onClick={reveal}
          disabled={loading}
          className="w-full py-3 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--color-brand)" }}
        >
          {loading ? "جاري التحميل..." : "📞 إظهار رقم الهاتف"}
        </button>
      ) : (
        <a
          href = {`tel:${phone}`}
          className="flex items-center justify-center w-full py-3 rounded-xl text-sm font-medium text-white"
          style={{ background: "var(--color-brand)" }}
            >
          📞 {phone}
        </a>
      )}
      <a
        href = {
          whatsappUrl ??
          `https://wa.me/?text=${encodeURIComponent("مرحباً، رأيت إعلانك على شامنا")}`
                }
        target = "_blank"
        rel = "noopener noreferrer"
        className = "flex items-center justify-center w-full py-3 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
        style = {{ background: "#25D366" }}
      >
        💬 تواصل عبر واتساب
      </a>
    </div>
  )
}