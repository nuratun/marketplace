import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import { type HeroCategory } from "@/components/hero"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "الآن"
  if (mins < 60) return `منذ ${mins} دقيقة`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `منذ ${hours} ساعة`
  const days = Math.floor(hours / 24)
  if (days < 30) return `منذ ${days} يوم`
  return new Date(dateStr).toLocaleDateString("ar-SY")
}

export function getInitials(name: string | null) {
  if (!name) return "؟"
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2)
}

export const categoryLabels: Record<string, string> = {
  "real-estate": "عقارات",
  cars: "سيارات",
  electronics: "إلكترونيات",
  furniture: "أثاث ومنزل",
  clothing: "ملابس",
  jobs: "وظائف وخدمات"
}

export const statusStyles: Record<string, { label: string; bg: string; color: string }> = {
  active: { label: "نشط", bg: "#E6FAF0", color: "#0F6E56" },
  sold: { label: "مباع", bg: "#FFF3E0", color: "#E65100" },
  expired: { label: "منتهي", bg: "#F5F5F5", color: "#757575" }
}

export function notificationIcon(type: string): string {
  if (type.startsWith("LISTING_EXPIRING")) return "⏰"
  if (type.startsWith("LISTING_EXPIRED")) return "🕐"
  if (type.startsWith("LISTING_REMOVED")) return "🚫"
  if (type.startsWith("LISTING_PHONE")) return "📞"
  if (type === "WELCOME") return "👋"
  if (type.startsWith("ACCOUNT_WARNING")) return "⚠️"
  if (type.startsWith("ACCOUNT_SUSPENDED")) return "🔒"
  if (type.startsWith("ACCOUNT_REINSTATED")) return "✅"
  if (type.startsWith("SAVED_PRICE")) return "💰"
  if (type.startsWith("SAVED_LISTING_SOLD")) return "🏷️"
  if (type.startsWith("SAVED_LISTING_REMOVED")) return "💔"
  if (type.startsWith("RATING")) return "⭐"
  if (type.startsWith("ADMIN")) return "📢"
  return "🔔"
}