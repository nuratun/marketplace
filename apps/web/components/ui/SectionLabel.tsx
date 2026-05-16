export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs mb-3 font-medium" style={{ color: "var(--color-text-muted)" }}>
      {children}
    </p>
  )
}