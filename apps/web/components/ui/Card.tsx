export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-4 mb-4"
      style={{ background: "#fff", border: "1px solid var(--color-border)" }}
    >
      {children}
    </div>
  )
}