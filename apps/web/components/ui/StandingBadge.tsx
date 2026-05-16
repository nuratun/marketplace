import {
  AlertTriangle,
  ShieldCheck,
  ShieldOff
} from "lucide-react"

// ── Standing badge ───────────────────────────────────────────────────────────

export function StandingBadge({ standing, reason }: { standing: string; reason: string | null }) {
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
