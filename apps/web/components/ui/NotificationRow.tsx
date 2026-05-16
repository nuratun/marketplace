import { timeAgo, notificationIcon } from "@/lib/utils"
import type { Notification } from "@/types/notification"

export function NotificationRow({ notif, onRead }: {
  notif: Notification
  onRead: (id: string) => void
}) {
  return (
    <div
      onClick={() => !notif.is_read && onRead(notif.id)}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "14px",
        padding: "16px 20px",
        borderBottom: "1px solid var(--color-border)",
        background: notif.is_read ? "transparent" : "rgba(var(--color-brand-rgb, 180,140,100), 0.06)",
        cursor: notif.is_read ? "default" : "pointer",
        transition: "background 0.2s"
      }}
    >
      {/* Unread dot */}
      <div style={{ paddingTop: "4px", flexShrink: 0 }}>
        {!notif.is_read && (
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "var(--color-brand)"
            }}
          />
        )}
        {notif.is_read && <div style={{ width: "8px" }} />}
      </div>

      {/* Icon */}
      <span style={{ fontSize: "22px", flexShrink: 0, lineHeight: 1.3 }}>
        {notificationIcon(notif.type)}
      </span>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: "8px",
            marginBottom: "4px"
          }}
        >
          <span
            style={{
              fontWeight: notif.is_read ? 400 : 600,
              fontSize: "14px",
              color: "var(--color-text-primary)"
            }}
          >
            {notif.title}
          </span>
          <span
            style={{
              fontSize: "12px",
              color: "var(--color-text-muted)",
              flexShrink: 0
            }}
          >
            {timeAgo(notif.created_at)}
          </span>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: "13px",
            color: "var(--color-text-muted)",
            lineHeight: 1.5
          }}
        >
          {notif.body}
        </p>
      </div>
    </div>
  )
}
