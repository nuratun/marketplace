export default function Home() {
  return (
    <div
      className="max-w-6xl mx-auto px-4 py-12 text-center"
      style={{ fontFamily: "var(--font-arabic)" }}
    >
      <h1 className="text-4xl font-bold mb-4" style={{ color: "var(--color-brand)" }}>
        شامنا
      </h1>
      <p className="text-lg" style={{ color: "var(--color-text-muted)" }}>
        موقع الإعلانات المبوبة في سوريا
      </p>
    </div>
  )
}