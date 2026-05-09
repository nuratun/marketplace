export type NotificationType =
  | "ADMIN_BROADCAST"
  | "ADMIN_MESSAGE"
  | "LISTING_EXPIRING_SOON"
  | "LISTING_EXPIRED"
  | "LISTING_REMOVED"
  | "LISTING_PHONE_REVEALED"
  | "WELCOME"
  | "ACCOUNT_WARNING"
  | "ACCOUNT_SUSPENDED"
  | "ACCOUNT_REINSTATED"
  | "SAVED_PRICE_DROP"
  | "SAVED_LISTING_SOLD"
  | "SAVED_LISTING_REMOVED"
  | "RATING_RECEIVED"

export interface Notification {
  id: string
  type: NotificationType
  title: string
  body: string
  listing_id: string | null
  is_read: boolean
  created_at: string
}

export interface NotificationMessage {
  id: string
  body: string
  sender_is_admin: boolean
  created_at: string
}

export interface NotificationThread {
  id: string
  subject: string
  type: NotificationType
  is_noreply: boolean
  user_has_unread: boolean
  created_at: string
  updated_at: string
  messages: NotificationMessage[]
}

export interface NotificationThreadSummary {
  id: string
  subject: string
  type: NotificationType
  is_noreply: boolean
  user_has_unread: boolean
  created_at: string
  updated_at: string
}

export interface UnreadCount {
  unread_notifications: number
  unread_threads: number
  total: number
}