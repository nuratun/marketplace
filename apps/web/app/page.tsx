import Hero from "@/components/hero"
import CategoryGrid from "@/components/category-grid"
import RecentListings from "@/components/recent-listings"

export default function Home() {
  return (
    <>
      <Hero />
      <div
        className="max-w-6xl mx-auto"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      />
      <CategoryGrid />
      <div
        className="max-w-6xl mx-auto"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      />
      <RecentListings />
    </>
  )
}