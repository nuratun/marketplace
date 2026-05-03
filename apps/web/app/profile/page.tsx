"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth, AuthUser } from "@/contexts/auth-context"
import { apiFetch } from "@/lib/api"
import { Camera, Check, X, AlertTriangle, ShieldCheck, ShieldOff } from "lucide-react"
import Link from "next/link"

// ── Inline editable field ────────────────────────────────────────────────────

function EditableField({
  label,
  value,
  placeholder,
  onSave,
  multiline = false
}: {
  label: string
  value: string | null
  placeholder: string
  onSave: (val: string) => Promise<void>
  multiline?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      await onSave(draft)
      setEditing(false)
    } catch {
      setError("Save failed, please try again")
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setDraft(value ?? "")
    setEditing(false)
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ fontSize: 12, color: "var(--color-text-muted)", display: "block", marginBottom: 4 }}>
        {label}
      </label>
      {editing ? (
        <div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            {multiline ? (
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={3}
                style={{
                  flex: 1, padding: "8px 12px", borderRadius: 8, fontSize: 14,
                  border: "1px solid var(--color-brand)",
                  fontFamily: "var(--font-arabic)", resize: "vertical",
                  color: "var(--color-text-primary)", outline: "none",
                }}
              />
            ) : (
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel() }}
                autoFocus
                style={{
                  flex: 1, padding: "8px 12px", borderRadius: 8, fontSize: 14,
                  border: "1px solid var(--color-brand)",
                  fontFamily: "var(--font-arabic)",
                  color: "var(--color-text-primary)", outline: "none",
                }}
              />
            )}
            <button onClick={handleSave} disabled={saving}
              style={{ padding: 8, borderRadius: 8, background: "var(--color-brand)", border: "none", cursor: "pointer", color: "#fff", display: "flex" }}>
              <Check size={16} />
            </button>
            <button onClick={handleCancel}
              style={{ padding: 8, borderRadius: 8, background: "var(--color-surface)", border: "1px solid var(--color-border)", cursor: "pointer", display: "flex" }}>
              <X size={16} />
            </button>
          </div>
          {error && (
            <p style={{ fontSize: 12, color: "#dc2626", marginTop: 4 }}>{error}</p>
          )}
        </div>
      ) : (
        <div
          onClick={() => setEditing(true)}
          style={{
            padding: "8px 12px", borderRadius: 8, fontSize: 14,
            border: "1px dashed var(--color-border)",
            color: value ? "var(--color-text-primary)" : "var(--color-text-muted)",
            cursor: "text", minHeight: 38,
            fontFamily: "var(--font-arabic)",
          }}
        >
          {value || placeholder}
        </div>
      )}
    </div>
  )
}

// ── Standing badge ───────────────────────────────────────────────────────────

function StandingBadge({ standing, reason }: { standing: string; reason: string | null }) {
  const config = {
    good: { label: "حساب موثوق", color: "#16a34a", bg: "#f0fdf4", Icon: ShieldCheck },
    warned: { label: "تحذير", color: "#d97706", bg: "#fffbeb", Icon: AlertTriangle },
    suspended: { label: "موقوف", color: "#dc2626", bg: "#fef2f2", Icon: ShieldOff },
  }[standing] ?? { label: standing, color: "#6b7280", bg: "#f9fafb", Icon: ShieldCheck }

  const { label, color, bg, Icon } = config

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "6px 12px", borderRadius: 20,
      background: bg, color, fontSize: 13, fontWeight: 500,
    }}>
      <Icon size={14} />
      {label}
      {reason && <span style={{ fontWeight: 400, marginRight: 4 }}>— {reason}</span>}
    </div>
  )
}

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