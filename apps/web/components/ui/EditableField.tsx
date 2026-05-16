import { useState } from "react"
import { Check, X } from "lucide-react"

// ── Inline editable field ────────────────────────────────────────────────────

export function EditableField({ label, value, placeholder, onSave, multiline = false }: {
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