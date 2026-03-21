"use client"

import { useTranslations } from "next-intl"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  IconBell,
  IconPackage,
  IconTool,
  IconAlertTriangle,
  IconCircleCheck,
  IconAt,
  IconClock,
  IconShieldCheck,
  IconX,
  IconCheck,
} from "@tabler/icons-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ── Types ─────────────────────────────────────────────────────────────────────

interface AppNotification {
  id: string
  type: string
  title: string
  body: string | null
  entityType: string | null
  entityId: string | null
  isRead: boolean
  createdAt: string
}

// ── Icon map by notification type ─────────────────────────────────────────────

function NotificationIcon({
  type,
  className,
}: {
  type: string
  className?: string
}) {
  const base = cn("size-4 shrink-0", className)
  switch (type) {
    case "low_stock":
      return <IconPackage className={cn(base, "text-amber-500")} />
    case "maintenance_due":
      return <IconTool className={cn(base, "text-blue-500")} />
    case "tool_overdue":
      return <IconClock className={cn(base, "text-red-500")} />
    case "approval_request":
      return <IconShieldCheck className={cn(base, "text-violet-500")} />
    case "approval_resolved":
      return <IconCircleCheck className={cn(base, "text-green-500")} />
    case "comment_mention":
      return <IconAt className={cn(base, "text-sky-500")} />
    case "expiry_warning":
      return <IconAlertTriangle className={cn(base, "text-orange-500")} />
    default:
      return <IconBell className={cn(base, "text-muted-foreground")} />
  }
}

// ── Relative time ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function relativeTime(dateStr: string, t: (key: string) => string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffSec = Math.floor((now - then) / 1000)

  if (diffSec < 60) return t("justNow")
  if (diffSec < 3600) return `vor ${Math.floor(diffSec / 60)} Min.`
  if (diffSec < 86400) return `vor ${Math.floor(diffSec / 3600)} Std.`
  return `vor ${Math.floor(diffSec / 86400)} Tagen`
}

// ── Entity URL builder ────────────────────────────────────────────────────────

function buildEntityUrl(
  entityType: string | null,
  entityId: string | null
): string | null {
  if (!entityType || !entityId) return null
  switch (entityType) {
    case "material":
      return `/dashboard/materials/${entityId}`
    case "tool":
      return `/dashboard/tools/${entityId}`
    case "location":
      return `/dashboard/locations/${entityId}`
    case "commission":
      return `/dashboard/commissions/${entityId}`
    case "approval":
      return `/dashboard/approvals/${entityId}`
    default:
      return null
  }
}

// ── Main component ────────────────────────────────────────────────────────────

export function NotificationBell() {
  const t = useTranslations("notifications")
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [notifications, setNotifications] = React.useState<AppNotification[]>([])
  const [loading, setLoading] = React.useState(false)

  const unreadCount = notifications.filter((n) => !n.isRead).length

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchNotifications = React.useCallback(async () => {
    try {
      const res = await fetch("/api/notifications")
      if (!res.ok) return
      const data: AppNotification[] = await res.json()
      setNotifications(data)
    } catch {
      // fail-open: network errors are silent
    }
  }, [])

  // Initial load
  React.useEffect(() => {
    void fetchNotifications()
  }, [fetchNotifications])

  // Poll every 30 seconds
  React.useEffect(() => {
    const interval = setInterval(() => void fetchNotifications(), 30_000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Refresh when popover opens
  React.useEffect(() => {
    if (open) void fetchNotifications()
  }, [open, fetchNotifications])

  // ── Actions ──────────────────────────────────────────────────────────────

  async function markAsRead(ids: string[]) {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      })
      setNotifications((prev) =>
        prev.map((n) => (ids.includes(n.id) ? { ...n, isRead: true } : n))
      )
    } catch {
      // silent
    }
  }

  async function markAllRead() {
    setLoading(true)
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  async function clearAll() {
    setLoading(true)
    try {
      await fetch("/api/notifications", { method: "DELETE" })
      setNotifications([])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  function handleNotificationClick(n: AppNotification) {
    // Mark as read
    if (!n.isRead) void markAsRead([n.id])

    // Navigate to entity
    const url = buildEntityUrl(n.entityType, n.entityId)
    if (url) {
      router.push(url)
      setOpen(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-8 w-8 p-0"
          aria-label={`Benachrichtigungen${unreadCount > 0 ? ` (${unreadCount} ungelesen)` : ""}`}
        >
          <IconBell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[380px] p-0 shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">Benachrichtigungen</h3>
          {notifications.length > 0 && (
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  disabled={loading}
                  className="flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
                  title="Alle als gelesen markieren"
                >
                  <IconCheck className="size-3" />
                  Alle lesen
                </button>
              )}
              <button
                type="button"
                onClick={clearAll}
                disabled={loading}
                className="flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
                title="Alle löschen"
              >
                <IconX className="size-3" />
                {t("clearAll")}
              </button>
            </div>
          )}
        </div>

        {/* Notification list */}
        <div className="max-h-[420px] overflow-y-auto overscroll-contain">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <IconBell className="size-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                {t("empty")}
              </p>
            </div>
          ) : (
            <ul role="list">
              {notifications.map((n) => {
                const hasLink = !!buildEntityUrl(n.entityType, n.entityId)
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleNotificationClick(n)}
                      className={cn(
                        "group w-full flex items-start gap-3 px-4 py-3 text-left transition-colors",
                        "hover:bg-accent",
                        !n.isRead && "bg-accent/30",
                        !hasLink && "cursor-default"
                      )}
                    >
                      {/* Unread dot */}
                      <span
                        className={cn(
                          "mt-0.5 shrink-0 size-1.5 rounded-full transition-opacity",
                          n.isRead ? "opacity-0" : "bg-primary opacity-100"
                        )}
                        aria-hidden
                      />

                      <NotificationIcon type={n.type} />

                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-sm leading-snug truncate",
                            !n.isRead && "font-medium"
                          )}
                        >
                          {n.title}
                        </p>
                        {n.body && (
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                            {n.body}
                          </p>
                        )}
                        <p className="mt-1 text-[10px] text-muted-foreground/60">
                          {relativeTime(n.createdAt, t)}
                        </p>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
