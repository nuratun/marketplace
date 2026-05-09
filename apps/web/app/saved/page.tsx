"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { apiFetch } from "@/lib/api"
import { type Listing } from "@/types/listing"
import ListingCard from "@/components/listing-card"

export default function SavedListingsPage() {
  const { user, accessToken, isLoading: authLoading, refreshToken } = useAuth()
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Wait for auth to hydrate before deciding anything
    if (authLoading) return

    if (!user) {
      router.replace("/auth?from=/saved")
      return
    }

    async function fetchSaved() {
      try {
        let token = accessToken
        if (!token) token = await refreshToken()
        if (!token) {
          router.replace("/auth?from=/saved")
          return
        }

        const data = await apiFetch<{ results: Listing[] }>("/listings/saved", {
          headers: { Authorization: `Bearer ${token}` },
        })
        setListings(data.results)
      } catch {
        setError("تعذّر تحميل المحفوظات. حاول مجدداً.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSaved()
  }, [user, accessToken, authLoading, refreshToken, router])

  if (authLoading || isLoading) {
    return (
      <div
        className="max-w-4xl mx-auto px-4 py-16 text-center"
        style={{ fontFamily: "var(--font-arabic)", color: "var(--color-text-muted)" }}
      >
        جارٍ التحميل...
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="max-w-4xl mx-auto px-4 py-16 text-center"
        style={{ fontFamily: "var(--font-arabic)", color: "var(--color-text-muted)" }}
      >
        {error}
      </div>
    )
  }

  return (
    <div
      className="max-w-4xl mx-auto px-4 py-8"
      style={{ fontFamily: "var(--font-arabic)" }}
    >
      <h1
        className="text-xl font-semibold mb-6"
        style={{ color: "var(--color-text-primary)" }}
      >
        الإعلانات المحفوظة
      </h1>

      {listings.length === 0 ? (
        <div
          className="text-center py-20 rounded-xl"
          style={{ border: "1px dashed var(--color-border)" }}
        >
          <p className="text-4xl mb-4">🤍</p>
          <p
            className="text-sm mb-1"
            style={{ color: "var(--color-text-primary)" }}
          >
            لا توجد إعلانات محفوظة بعد
          </p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            اضغط على أيقونة القلب في أي إعلان لحفظه هنا
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  )
}