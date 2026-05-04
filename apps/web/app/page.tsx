import { HERO_CATEGORIES } from "@/lib/utils"
import Hero, { type HeroCategory } from "@/components/hero"
import CategorySection, { type SectionCategory } from "@/components/category-section"

// Categories drive both the Hero sidebar and the per-category sections below.
// Add, remove, or reorder entries here to control what appears on the homepage.
const CATEGORIES: (HeroCategory & SectionCategory)[] = [
  {
    slug: "cars",
    name: "سيارات",
    icon: "🚗",
    bannerHeading: "سيارات بأفضل الأسعار",
    bannerSubtext: "آلاف الإعلانات من أصحابها مباشرة",
    accentColor: "linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)",
    description: "تصفح آلاف السيارات المعروضة من أصحابها مباشرة",
  },
  {
    slug: "real-estate",
    name: "عقارات",
    icon: "🏠",
    bannerHeading: "ابحث عن بيتك المثالي",
    bannerSubtext: "شقق وبيوت للبيع والإيجار في كل المدن",
    accentColor: "linear-gradient(135deg, #1a3a2e 0%, #0f4a30 100%)",
    description: "شقق وبيوت للبيع والإيجار في كل مدن سوريا",
  },
  {
    slug: "electronics",
    name: "إلكترونيات",
    icon: "📱",
    bannerHeading: "إلكترونيات وأجهزة",
    bannerSubtext: "هواتف، لابتوبات، وكل ما تحتاجه",
    accentColor: "linear-gradient(135deg, #1a2a3a 0%, #0f2a4a 100%)",
    description: "هواتف، لابتوبات، وإلكترونيات بأسعار مناسبة",
  },
  {
    slug: "furniture",
    name: "أثاث ومنزل",
    icon: "🛋️",
    bannerHeading: "أثاث ومستلزمات المنزل",
    bannerSubtext: "اشتر وبع الأثاث بسهولة",
    accentColor: "linear-gradient(135deg, #3a2a1a 0%, #4a3a0f 100%)",
    description: "أثاث وديكورات ومستلزمات المنزل بأسعار رائعة",
  },
  {
    slug: "clothing",
    name: "ملابس وأزياء",
    icon: "👗",
    bannerHeading: "موضة وأزياء",
    bannerSubtext: "ملابس، إكسسوارات، وأحذية بأسعار رائعة",
    accentColor: "linear-gradient(135deg, #3a1a2e 0%, #4a0f3a 100%)",
    description: "ملابس وإكسسوارات وأحذية لكل الأذواق",
  },
  {
    slug: "jobs",
    name: "وظائف وخدمات",
    icon: "💼",
    bannerHeading: "وظائف وخدمات",
    bannerSubtext: "أعلن عن خدمتك أو ابحث عن عمل",
    accentColor: "linear-gradient(135deg, #1a2a1a 0%, #0f3a20 100%)",
    description: "أعلن عن خدمتك أو ابحث عن فرصة عمل",
  },
]

export default function Home() {
  return (
    <>
      <Hero categories={HERO_CATEGORIES} />

      <div className="py-4" />

      {CATEGORIES.map((cat) => (
        <CategorySection key={cat.slug} category={cat} />
      ))}
    </>
  )
}