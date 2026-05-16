export function EmptyState({ message }: { message: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "64px 24px",
        gap: "12px",
        color: "var(--color-text-muted)"
      }}
    >
      <span style={{ fontSize: "48px", opacity: 0.4 }}>🔔</span>
      <p style={{ margin: 0, fontSize: "15px" }}>{message}</p>
    </div>
  )
}