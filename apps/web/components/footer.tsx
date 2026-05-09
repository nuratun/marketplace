export default function Footer() {
  return (
    <footer
      className="mt-auto py-8 text-sm text-center"
      style={{
        borderTop: "1px solid var(--color-border)",
        color: "var(--color-text-muted)",
        fontFamily: "var(--font-arabic)",
      }}
    >
      <div className="max-w-6xl mx-auto px-4">
        <p>Shamna — All Rights Reserved – © {new Date().getFullYear()}</p>
      </div>
    </footer>
  )
}