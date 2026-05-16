"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Camera } from "lucide-react"
import { useAuth, AuthUser } from "@/contexts/auth-context"
import { apiFetch } from "@/lib/api"
import { EditableField } from "@/components/ui/EditableField"
import { StandingBadge } from "@/components/ui/StandingBadge"

// ── Main page ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, login, accessToken, refreshToken } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)

  // Redirect if not logged in (belt-and-suspenders alongside middleware)
  if (!user) {
    router.push("/auth?from=/profile")
    return null
  }

  async function getToken() {
    return accessToken ?? await refreshToken()
  }

  // ── Save profile fields ──────────────────────────────────────────────────
  async function saveField(field: "name" | "email" | "bio", value: string) {
    const token = await getToken()
    if (!token) return

    const updated = await apiFetch<AuthUser>("/auth/me", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ [field]: value }),
    })
    // Update context so navbar reflects changes immediately
    login(token, updated)
  }

  // ── Profile photo upload ─────────────────────────────────────────────────
  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoError(null)
    setPhotoUploading(true)

    try {
      const token = await getToken()
      if (!token) throw new Error("Must be logged in")

      // 1. Get presigned URL
      const { upload_url, public_url } = await apiFetch<{
        upload_url: string
        public_url: string
      }>("/uploads/presign-profile", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content_type: file.type || "image/jpeg" })
      })

      // 2. PUT directly to R2
      const r2Res = await fetch(upload_url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      })
      if (!r2Res.ok) throw new Error("Image upload failed")

      // 3. Save the URL on the user record
      await apiFetch("/auth/me/profile-pic", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ profile_pic: public_url }),
      })

      login(token, { ...(user as AuthUser), profile_pic: public_url })
    } catch {
      setPhotoError("An error occurred while uploading the image")
    } finally {
      setPhotoUploading(false)
    }
  }

  const memberSince = new Date(user.created_at).toLocaleDateString("ar-SY", {
    year: "numeric", month: "long",
  })

  return (
    <main
      className="max-w-2xl mx-auto px-4 py-10"
      style={{ fontFamily: "var(--font-arabic)" }}
    >
      {/* ── Header card ── */}
      <div style={{
        background: "#fff",
        border: "1px solid var(--color-border)",
        borderRadius: 16, padding: 28, marginBottom: 20,
      }}>
        {/* Avatar + upload */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 20, marginBottom: 24 }}>
          <div style={{ position: "relative" }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: "var(--color-brand)", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, fontWeight: 700, overflow: "hidden",
            }}>
              {user.profile_pic
                ? <img src={user.profile_pic} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : (user.name?.[0] ?? "؟")}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={photoUploading}
              style={{
                position: "absolute", bottom: 0, insetInlineEnd: 0,
                width: 26, height: 26, borderRadius: "50%",
                background: "var(--color-brand)", border: "2px solid #fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#fff",
              }}
            >
              <Camera size={13} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={handlePhotoChange}
            />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 4 }}>
              {user.name ?? user.phone}
            </div>
            <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 10 }}>
              عضو منذ {memberSince}
            </div>
            <StandingBadge standing={user.standing ?? "good"} reason={user.warning_reason ?? null} />
          </div>
        </div>

        {photoUploading && (
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 12 }}>جاري رفع الصورة...</p>
        )}
        {photoError && (
          <p style={{ fontSize: 13, color: "#dc2626", marginBottom: 12 }}>{photoError}</p>
        )}

        {/* Editable fields */}
        <EditableField
          label="الاسم"
          value={user.name}
          placeholder="أضف اسمك"
          onSave={(v) => saveField("name", v)}
        />
        <EditableField
          label="البريد الإلكتروني"
          value={user.email}
          placeholder="أضف بريدك الإلكتروني"
          onSave={(v) => saveField("email", v)}
        />
        <EditableField
          label="نبذة عنك"
          value={(user as any).bio ?? null}
          placeholder="أضف نبذة مختصرة عنك..."
          onSave={(v) => saveField("bio", v)}
          multiline
        />

        <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
          رقم الهاتف: <span dir="ltr" style={{ display: "inline-block" }}>{user.phone}</span>
        </div>
      </div>

      {/* ── Listings shortcut ── */}
      <Link href="/my-listings" style={{ textDecoration: "none" }}>
        <div style={{
          background: "#fff",
          border: "1px solid var(--color-border)",
          borderRadius: 16, padding: "18px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer", transition: "border-color 0.15s",
        }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-brand)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
        >
          <span style={{ fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)" }}>
            إعلاناتي
          </span>
          <span style={{ fontSize: 20, color: "var(--color-text-muted)" }}>←</span>
        </div>
      </Link>
    </main>
  )
}