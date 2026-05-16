export type Rating = {
  id: string
  listing_id: string
  rater_id: string
  ratee_id: string
  role: "buyer" | "seller"
  score: number
  recommended: boolean
  created_at: string
  rater_name: string | null
}

export type RatingSummary = {
  total: number
  average_score: number | null
  recommend_pct: number | null
}