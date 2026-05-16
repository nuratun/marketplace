import { timeAgo, notificationIcon } from "@/lib/utils"
import type { NotificationThreadSummary } from "@/types/notification"

export function ThreadRow({ thread, onClick }: {
  thread: NotificationThreadSummary
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "14px",
        padding: "16px 20px",
        borderBottom: "1px solid var(--color-border)",
        background: thread.user_has_unread
          ? "rgba(var(--color-brand-rgb, 180,140,100), 0.06)"
          : "transparent",
        cursor: "pointer",
        transition: "background 0.15s"
      }}
    >
      {/* Unread dot */}
      <div style={{ paddingTop: "4px", flexShrink: 0 }}>
        {thread.user_has_unread ? (
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "var(--color-brand)"
            }}
          />
        ) : (
          <div style={{ width: "8px" }} />
        )}
      </div>

      <span style={{ fontSize: "22px", flexShrink: 0, lineHeight: 1.3 }}>
        {notificationIcon(thread.type)}
      </span>

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
              fontWeight: thread.user_has_unread ? 600 : 400,
              fontSize: "14px",
              color: "var(--color-text-primary)"
            }}
          >
            {thread.subject}
          </span>
          <span style={{ fontSize: "12px", color: "var(--color-text-muted)", flexShrink: 0 }}>
            {timeAgo(thread.updated_at)}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {thread.is_noreply && (
            <span
              style={{
                fontSize: "11px",
                color: "var(--color-text-muted)",
                border: "1px solid var(--color-border)",
                borderRadius: "4px",
                padding: "1px 6px"
              }}
            >
              بدون رد
            </span>
          )}
          <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
            انقر للعرض ←
          </span>
        </div>
      </div>
    </div>
  )
}