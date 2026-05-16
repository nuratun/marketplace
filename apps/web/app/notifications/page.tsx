"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { apiFetch } from "@/lib/api"
import { timeAgo, notificationIcon } from "@/lib/utils"
import type {
  Notification,
  NotificationThread,
  NotificationThreadSummary,
  UnreadCount
} from "@/types/notification"
import { EmptyState } from "@/components/ui/EmptyState"
import { NotificationRow } from "@/components/ui/NotificationRow"
import { ThreadRow } from "@/components/ui/ThreadRow"

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ThreadDetail({ threadId, onBack }: {
  threadId: string
  onBack: () => void
}) {
  const { user } = useAuth()
  const [thread, setThread] = useState<NotificationThread | null>(null)
  const [loading, setLoading] = useState(true)
  const [replyBody, setReplyBody] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    apiFetch(`/notifications/threads/${threadId}`)
      .then((data: any) => {
        if (!cancelled) setThread(data)
      })
      .catch(() => {
        if (!cancelled) setError("تعذّر تحميل المحادثة")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [threadId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [thread?.messages.length])

  async function handleReply() {
    if (!replyBody.trim() || !thread) return
    setSending(true)
    try {
      const msg = await apiFetch(`/notifications/threads/${thread.id}/reply`, {
        method: "POST",
        body: JSON.stringify({ body: replyBody.trim() }),
      })
      setThread((prev) =>
        prev ? { ...(prev as any), messages: [...prev.messages, msg] } : prev
      )
      setReplyBody("")
    } catch {
      setError("فشل إرسال الرسالة، حاول مجدداً")
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>
        جاري التحميل...
      </div>
    )
  }

  if (error || !thread) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>
        {error || "خطأ غير متوقع"}
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Thread header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "16px 20px",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-surface)"
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "20px",
            color: "var(--color-text-muted)",
            padding: "4px 8px",
            borderRadius: "6px"
          }}
        >
          →
        </button>
        <div>
          <div style={{ fontWeight: 600, fontSize: "15px", color: "var(--color-text-primary)" }}>
            {thread.subject}
          </div>
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
              لا يمكن الرد على هذه الرسالة
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "12px"
        }}
      >
        {thread.messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: "flex",
              justifyContent: msg.sender_is_admin ? "flex-start" : "flex-end",
            }}
          >
            <div
              style={{
                maxWidth: "75%",
                padding: "10px 14px",
                borderRadius: msg.sender_is_admin
                  ? "4px 16px 16px 16px"
                  : "16px 4px 16px 16px",
                background: msg.sender_is_admin
                  ? "var(--color-surface)"
                  : "var(--color-brand)",
                color: msg.sender_is_admin
                  ? "var(--color-text-primary)"
                  : "#fff",
                border: msg.sender_is_admin
                  ? "1px solid var(--color-border)"
                  : "none",
                fontSize: "14px",
                lineHeight: 1.6,
              }}
            >
              <p style={{ margin: 0 }}>{msg.body}</p>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "11px",
                  opacity: 0.65,
                  textAlign: "left"
                }}
              >
                {timeAgo(msg.created_at)}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Reply box */}
      {!thread.is_noreply && (
        <div
          style={{
            padding: "12px 16px",
            borderTop: "1px solid var(--color-border)",
            display: "flex",
            gap: "10px",
            alignItems: "flex-end",
            background: "var(--color-surface)",
          }}
        >
          <textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder="اكتب ردك هنا..."
            rows={2}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleReply()
              }
            }}
            style={{
              flex: 1,
              resize: "none",
              border: "1px solid var(--color-border)",
              borderRadius: "10px",
              padding: "10px 14px",
              fontSize: "14px",
              fontFamily: "inherit",
              background: "transparent",
              color: "var(--color-text-primary)",
              outline: "none",
            }}
          />
          <button
            onClick={handleReply}
            disabled={sending || !replyBody.trim()}
            style={{
              background: "var(--color-brand)",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              padding: "10px 18px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: sending || !replyBody.trim() ? "not-allowed" : "pointer",
              opacity: sending || !replyBody.trim() ? 0.5 : 1,
              transition: "opacity 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            {sending ? "..." : "إرسال"}
          </button>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function NotificationsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<"notifications" | "messages">("notifications")
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [threads, setThreads] = useState<NotificationThreadSummary[]>([])
  const [openThreadId, setOpenThreadId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth?from=/notifications")
    }
  }, [user, authLoading, router])

  // Fetch flat notifications + thread summaries
  useEffect(() => {
    if (!user) return
    setLoading(true)

    Promise.all([
      apiFetch("/notifications"),
      apiFetch("/notifications/threads"),
    ])
      .then(([notifs, threadList]) => {
        setNotifications(notifs as any)
        setThreads(threadList as any)
      })
      .finally(() => setLoading(false))
  }, [user])

  async function markOneRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    )
    await apiFetch(`/notifications/${id}/read`, { method: "PATCH" }).catch(() => { })
  }

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    await apiFetch("/notifications/read-all", { method: "PATCH" }).catch(() => { })
  }

  function openThread(threadId: string) {
    setOpenThreadId(threadId)
    // Optimistically mark as read in the list
    setThreads((prev) =>
      prev.map((t) => (t.id === threadId ? { ...t, user_has_unread: false } : t))
    )
  }

  const unreadNotifCount = notifications.filter((n) => !n.is_read).length
  const unreadThreadCount = threads.filter((t) => t.user_has_unread).length

  if (authLoading || !user) return null

  // If a thread is open, show the thread detail view
  if (openThreadId) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--color-surface, #fafaf8)",
          display: "flex",
          flexDirection: "column",
        }}
        dir="rtl"
      >
        <div
          style={{
            maxWidth: "680px",
            margin: "0 auto",
            width: "100%",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: "#fff",
            minHeight: "calc(100vh - 64px)",
            borderInline: "1px solid var(--color-border)",
          }}
        >
          <ThreadDetail
            threadId={openThreadId}
            onBack={() => setOpenThreadId(null)}
          />
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-surface, #fafaf8)",
      }}
      dir="rtl"
    >
      <div
        style={{
          maxWidth: "680px",
          margin: "0 auto",
          width: "100%",
          background: "#fff",
          minHeight: "calc(100vh - 64px)",
          borderInline: "1px solid var(--color-border)",
        }}
      >
        {/* Page header */}
        <div
          style={{
            padding: "24px 20px 0",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: "20px",
                fontWeight: 700,
                color: "var(--color-text-primary)",
              }}
            >
              الإشعارات
            </h1>
            {unreadNotifCount > 0 && activeTab === "notifications" && (
              <button
                onClick={markAllRead}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--color-brand)",
                  fontSize: "13px",
                  cursor: "pointer",
                  padding: "4px 8px",
                  fontFamily: "inherit",
                }}
              >
                تحديد الكل كمقروء
              </button>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: "0" }}>
            {(
              [
                { key: "notifications", label: "الإشعارات", count: unreadNotifCount },
                { key: "messages", label: "الرسائل", count: unreadThreadCount },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: 1,
                  background: "none",
                  border: "none",
                  borderBottom:
                    activeTab === tab.key
                      ? "2px solid var(--color-brand)"
                      : "2px solid transparent",
                  padding: "10px 0 12px",
                  fontSize: "14px",
                  fontWeight: activeTab === tab.key ? 600 : 400,
                  color:
                    activeTab === tab.key
                      ? "var(--color-text-primary)"
                      : "var(--color-text-muted)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  transition: "color 0.15s",
                }}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span
                    style={{
                      background: "var(--color-brand)",
                      color: "#fff",
                      borderRadius: "10px",
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "1px 7px",
                      minWidth: "18px",
                      textAlign: "center",
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div
            style={{
              padding: "60px",
              textAlign: "center",
              color: "var(--color-text-muted)",
              fontSize: "14px",
            }}
          >
            جاري التحميل...
          </div>
        ) : activeTab === "notifications" ? (
          notifications.length === 0 ? (
            <EmptyState message="لا توجد إشعارات بعد" />
          ) : (
            <div>
              {notifications.map((notif) => (
                <NotificationRow key={notif.id} notif={notif} onRead={markOneRead} />
              ))}
            </div>
          )
        ) : threads.length === 0 ? (
          <EmptyState message="لا توجد رسائل بعد" />
        ) : (
          <div>
            {threads.map((thread) => (
              <ThreadRow
                key={thread.id}
                thread={thread}
                onClick={() => openThread(thread.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}