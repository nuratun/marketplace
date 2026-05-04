import Hero, { type HeroCategory } from "@/components/hero"
import CategorySection, { type SectionCategory } from "@/components/category-section"

// Categories drive both the Hero sidebar and the per-category sections below.
// Add, remove, or reorder entries here to control what appears on the homepage.
const CATEGORIES: (HeroCategory & SectionCategory)[] = [
  {
    slug: "cars",
    name: "سيارات",
    icon: "🚗",
    bannerImage: "/categories/category-cars.webp",
    bannerHeading: "سيارات بأفضل الأسعار",
    bannerSubtext: "آلاف الإعلانات من أصحابها مباشرة",
    accentColor: "linear-gradient(135deg, #1a1a2e 0%, #0f4a30 100%)",
    description: "تصفح آلاف السيارات المعروضة من أصحابها مباشرة",
  },
  {
    slug: "real-estate",
    name: "عقارات",
    icon: "🏠",
    bannerImage: "/categories/category-real-estate.webp",
    bannerHeading: "ابحث عن بيتك المثالي",
    bannerSubtext: "شقق وبيوت للبيع والإيجار في كل المدن",
    accentColor: "linear-gradient(135deg, #1a3a2e 0%, #0f4a30 100%)",
    description: "شقق وبيوت للبيع والإيجار في كل مدن سوريا",
  },
  {
    slug: "electronics",
    name: "إلكترونيات",
    icon: "📱",
    bannerImage: "/categories/category-electronics.jpg",
    bannerHeading: "اعثر على هاتفك أو جهاز الكمبيوتر المثالي لك",
    bannerSubtext: "",
    accentColor: "linear-gradient(135deg, #1a3a2e 0%, #0f4a30 100%)",
    description: "هواتف، لابتوبات، وإلكترونيات بأسعار مناسبة",
  },
  {
    slug: "furniture",
    name: "أثاث ومنزل",
    icon: "🛋️",
    bannerImage: "/categories/category-furniture.webp",
    bannerHeading: "اعثر على تصميم منزلك المثالي",
    bannerSubtext: "",
    accentColor: "linear-gradient(135deg, #1a3a2e 0%, #0f4a30 100%)",
    description: "أثاث وديكورات ومستلزمات المنزل بأسعار رائعة",
  },
  {
    slug: "clothing",
    name: "ملابس",
    icon: "👗",
    bannerImage: "/categories/category-clothing.webp",
    bannerHeading: "اعثري على إطلالتكِ المثالية",
    bannerSubtext: "",
    accentColor: "linear-gradient(135deg, #1a3a2e 0%, #0f4a30 100%)",
    description: "ملابس وإكسسوارات وأحذية لكل الأذواق",
  },
  {
    slug: "jobs",
    name: "وظائف وخدمات",
    icon: "💼",
    bannerImage: "/categories/category-jobs.webp",
    bannerHeading: "ابحث عن وظيفتك التالية",
    bannerSubtext: "",
    accentColor: "linear - gradient(135deg, #1a3a2e 0%, #0f4a30 100%)",
    description: "أعلن عن خدمتك أو ابحث عن فرصة عمل",
  }
]

export default function Home() {
  return (
    <>
      <Hero categories={CATEGORIES} />

      <div className="py-4" />

      {CATEGORIES.map((cat) => (
        <CategorySection key={cat.slug} category={cat} />
      ))}
    </>
  )
}