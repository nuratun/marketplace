"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ChevronLeft, PlusCircle } from "lucide-react"

export type HeroCategory = {
  slug: string
  name: string
  icon: string
  bannerImage?: string
  bannerHeading: string
  bannerSubtext: string
  accentColor?: string // optional per-category banner gradient, defaults to brand
}

type Props = {
  categories: HeroCategory[]
}

export default function Hero({ categories }: Props) {
  const router = useRouter()
  const [activeIndex, setActiveIndex] = useState(0)

  const active = categories[activeIndex]

  return (
    <section
      style={{ fontFamily: "var(--font-arabic)", direction: "rtl", padding: "0px" }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "220px 1fr 220px",
          borderRadius: 1,
          overflow: "hidden",
          border: "1px solid var(--color-border)",
          height: 320,
        }}
        className="hero-grid"
      >

        {/* ── RIGHT PANEL: category sidebar ── */}
        <aside style={{ background: "#fff", borderLeft: "1px solid var(--color-border)", overflowY: "auto" }}>
          {categories.map((cat, i) => (
            <button
              key={cat.slug}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => router.push(`/category/${cat.slug}`)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "11px 16px",
                background: i === activeIndex ? "var(--color-surface)" : "transparent",
                borderRight: i === activeIndex ? "3px solid var(--color-brand)" : "3px solid transparent",
                borderBottom: "1px solid var(--color-border)",
                cursor: "pointer",
                textAlign: "right",
                transition: "background 0.15s",
              }}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>{cat.icon}</span>
              <span
                style={{
                  fontSize: 13,
                  fontFamily: "var(--font-arabic)",
                  color: i === activeIndex ? "var(--color-brand)" : "var(--color-text-primary)",
                  fontWeight: i === activeIndex ? 500 : 400,
                  flex: 1,
                  textAlign: "right",
                }}
              >
                {cat.name}
              </span>
              <ChevronLeft
                size={14}
                style={{ color: "var(--color-text-muted)", flexShrink: 0 }}
              />
            </button>
          ))}
        </aside>

        {/* ── CENTER PANEL: animated banner ── */}
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            background: active.accentColor ?? "linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)",
            transition: "background 0.4s ease",
            display: "flex",
            alignItems: "center",
            padding: "32px 40px",
          }}
        >
          {/* Full-panel background image */}
          {active.bannerImage && (
            <Image
              key={active.slug}
              src={active.bannerImage}
              alt={active.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 900px) calc(100vw - 180px), calc(100vw - 440px)"
              style={{ objectFit: "cover", objectPosition: "center", opacity:1 }}
              priority={activeIndex === 0}
            />
          )}
          {/* Text content — keyed so it re-mounts on category change */}
          <div key={active.slug} style={{ position: "relative", zIndex: 1 }} className="banner-text">
            <h2
              style={{
                fontSize: 26,
                fontWeight: 600,
                color: "#fff",
                fontFamily: "var(--font-arabic)",
                marginBottom: 8,
                lineHeight: 1.35,
              }}
            >
              {active.bannerHeading}
            </h2>
            <p
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.72)",
                fontFamily: "var(--font-arabic)",
                marginBottom: 22,
              }}
            >
              {active.bannerSubtext}
            </p>
            <Link
              href={`/category/${active.slug}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "var(--color-brand)",
                color: "#fff",
                borderRadius: 8,
                padding: "10px 20px",
                fontSize: 14,
                fontWeight: 500,
                fontFamily: "var(--font-arabic)",
                textDecoration: "none",
                transition: "opacity 0.15s",
              }}
            >
              تصفح {active.name}
              <ChevronLeft size={15} />
            </Link>
          </div>
        </div>

        {/* ── LEFT PANEL: post-ad promo card ── */}
        <div
          style={{
            background: "var(--color-surface)",
            borderRight: "1px solid var(--color-border)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px 16px",
            gap: 12,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "var(--color-brand)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PlusCircle size={26} color="#fff" />
          </div>
          <div>
            <p
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "var(--color-text-primary)",
                fontFamily: "var(--font-arabic)",
                marginBottom: 6,
              }}
            >
              أضف إعلانك مجاناً
            </p>
            <p
              style={{
                fontSize: 12,
                color: "var(--color-text-muted)",
                fontFamily: "var(--font-arabic)",
                lineHeight: 1.6,
              }}
            >
              وصول لآلاف المشترين في سوريا
            </p>
          </div>
          <Link
            href="/post"
            style={{
              display: "block",
              width: "100%",
              background: "var(--color-brand)",
              color: "#fff",
              borderRadius: 8,
              padding: "10px 0",
              fontSize: 13,
              fontWeight: 500,
              fontFamily: "var(--font-arabic)",
              textDecoration: "none",
              textAlign: "center",
              transition: "opacity 0.15s",
            }}
          >
            ابدأ الآن
          </Link>
          <p style={{ fontSize: 11, color: "var(--color-text-muted)", fontFamily: "var(--font-arabic)" }}>
            مجاني تماماً، بدون رسوم
          </p>
        </div>

      </div>

      {/* Mobile: simplified banner only (sidebar + promo hidden) */}
      <style>{`
        @media (max-width: 640px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            height: auto !important;
          }
          .hero-grid aside,
          .hero-grid > div:last-child {
            display: none !important;
          }
          .hero-grid > div:nth-child(2) {
            height: 220px;
            padding: 24px !important;
            border-radius: 0 !important;
          }
          .banner-text h2 { font-size: 20px !important; }
          .banner-text > div:first-child { font-size: 36px !important; margin-bottom: 8px !important; }
        }
        @media (max-width: 900px) and (min-width: 641px) {
          .hero-grid {
            grid-template-columns: 180px 1fr !important;
          }
          .hero-grid > div:last-child {
            display: none !important;
          }
        }
        .banner-text {
          animation: fadeSlideIn 0.25s ease;
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  )
}