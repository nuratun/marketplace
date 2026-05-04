import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import { type HeroCategory } from "@/components/hero"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

