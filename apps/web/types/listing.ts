export type Seller = {
  id: string
  name: string | null
  member_since: string
}

export type Listing = {
  id: string
  title: string
  description: string
  price: number
  currency: string
  category: string
  condition: string
  city: string
  status: string
  attrs: Record<string, unknown>
  image_urls: string[]
  views: number
  created_at: string
  expires_at: string
  seller: Seller
}

export type ListingsResponse = {
  total: number
  page: number
  limit: number
  pages: number
  results: Listing[]
}