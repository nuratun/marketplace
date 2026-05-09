"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { apiFetch } from "@/lib/api"

interface SaveButtonProps {
  listingId: string
  /** Pass true if the server already knows this listing is saved */
  initialSaved?: boolean
  /** "icon" = small overlay for cards, "full" = larger button for detail page */
  variant?: "icon" | "full"
}

export default function SaveButton({ listingId, initialSaved = false, variant = "icon" }: SaveButtonProps) {
  const { user, accessToken, refreshToken } = useAuth()
  const router = useRouter()
  const [saved, setSaved] = useState(initialSaved)
  const [isPending, startTransition] = useTransition()

  async function getToken(): Promise<string | null> {
    if (accessToken) return accessToken
    return refreshToken()
  }

  async function toggle(e: React.MouseEvent) {
    // Prevent the parent <Link> from navigating when clicking the button on a card
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      // Redirect to login, then come back
      router.push(`/auth?from=/listing/${listingId}`)
      return
    }

    const token = await getToken()
    if (!token) return

    // Optimistic update
    const next = !saved
    setSaved(next)

    startTransition(async () => {
      try {
        await apiFetch(`/listings/${listingId}/save`, {
          method: next ? "POST" : "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        })
      } catch {
        // Roll back on failure
        setSaved(!next)
      }
    })
  }

  if (variant === "full") {
    return (
      <button
        onClick={toggle}
        disabled={isPending}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "8px 16px",
          borderRadius: "8px",
          border: `1px solid ${saved ? "#C2622A" : "var(--color-border)"}`,
          background: saved ? "#FFF4EE" : "#fff",
          color: saved ? "#C2622A" : "var(--color-text-muted)",
          fontSize: "14px",
          cursor: isPending ? "wait" : "pointer",
          fontFamily: "var(--font-arabic)",
          transition: "all 0.15s ease"
        }}
        aria-label={saved ? "إزالة من المحفوظات" : "حفظ الإعلان"}
      >
        <Heart filled={saved} size={18} />
        <span>{saved ? "محفوظ" : "حفظ"}</span>
      </button>
    )
  }

  // "icon" variant — small overlay for listing cards
  return (
    <button
      onClick={toggle}
      disabled={isPending}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "30px",
        height: "30px",
        borderRadius: "50%",
        border: "none",
        background: "rgba(255,255,255,0.9)",
        cursor: isPending ? "wait" : "pointer",
        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
        backdropFilter: "blur(4px)",
        transition: "transform 0.1s ease",
        flexShrink: 0,
      }}
      aria-label={saved ? "إزالة من المحفوظات" : "حفظ الإعلان"}
    >
      <Heart filled={saved} size={14} />
    </button>
  )
}

// Inline SVG heart — no icon library dependency
function Heart({ filled, size }: { filled: boolean; size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "#C2622A" : "none"}
      stroke={filled ? "#C2622A" : "#888"}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}