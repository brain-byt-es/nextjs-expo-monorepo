"use client"

import { useState, useEffect, useCallback } from "react"
import {
  IconArrowRight,
  IconLoader2,
  IconAlertTriangle,
  IconHistory,
} from "@tabler/icons-react"
import { Skeleton } from "@/components/ui/skeleton"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ActivityEntry {
  id: string
  objectType: string
  objectId: string
  field: string | null
  oldValue: string | null
  newValue: string | null
  createdAt: string
  userId: string | null
  userName: string | null
  userEmail: string | null
}

interface Props {
  entityType: string
  entityId: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return "Gerade eben"
  if (mins < 60) return `vor ${mins} Min.`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `vor ${hours} Std.`
  const days = Math.floor(hours / 24)
  if (days < 30) return `vor ${days} Tag${days !== 1 ? "en" : ""}`
  return new Date(dateStr).toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function absoluteTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Determine change type from field / values
function changeType(entry: ActivityEntry): "created" | "deleted" | "updated" {
  if (entry.field === "__create__" || (!entry.oldValue && !entry.field)) return "created"
  if (entry.field === "__delete__") return "deleted"
  return "updated"
}

const CHANGE_COLORS = {
  created: "bg-secondary/10 text-secondary border-secondary/20",
  updated: "bg-primary/10 text-primary border-primary/20",
  deleted: "bg-destructive/10 text-destructive border-destructive/20",
} as const

const CHANGE_LABELS = {
  created: "Erstellt",
  updated: "Geändert",
  deleted: "Gelöscht",
} as const

const DOT_COLORS = {
  created: "bg-secondary",
  updated: "bg-primary",
  deleted: "bg-destructive",
} as const

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ActivityTimeline({ entityType, entityId }: Props) {
  const [entries, setEntries] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)

  const fetchEntries = useCallback(
    async (pageNum: number, append = false) => {
      if (pageNum === 1) setLoading(true)
      else setLoadingMore(true)
      setError(null)
      try {
        const params = new URLSearchParams({
          objectType: entityType,
          objectId: entityId,
          page: String(pageNum),
          pageSize: "20",
        })
        const res = await fetch(`/api/activity?${params.toString()}`)
        if (!res.ok) throw new Error("Fehler beim Laden der Aktivitäten")
        const data: {
          data: ActivityEntry[]
          totalPages: number
          page: number
        } = await res.json()
        setEntries((prev) => (append ? [...prev, ...data.data] : data.data))
        setTotalPages(data.totalPages)
        setPage(data.page)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unbekannter Fehler")
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [entityType, entityId]
  )

  useEffect(() => {
    void fetchEntries(1)
  }, [fetchEntries])

  if (loading) {
    return (
      <div className="space-y-4 py-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <Skeleton className="size-3 rounded-full mt-1.5" />
              <Skeleton className="w-px flex-1 mt-1" />
            </div>
            <div className="pb-5 space-y-1.5 flex-1">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive py-4">
        <IconAlertTriangle className="size-4 shrink-0" />
        {error}
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
        <IconHistory className="size-8 opacity-30" />
        <p className="text-sm">Keine Aktivitäten vorhanden</p>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {entries.map((entry, idx) => {
        const type = changeType(entry)
        const isLast = idx === entries.length - 1

        return (
          <div key={entry.id} className="flex gap-3">
            {/* Timeline spine */}
            <div className="flex flex-col items-center shrink-0" aria-hidden>
              <div className={`size-2.5 rounded-full mt-1.5 shrink-0 ${DOT_COLORS[type]}`} />
              {!isLast && <div className="w-px flex-1 bg-border mt-1" />}
            </div>

            {/* Content */}
            <div className={`pb-5 flex-1 min-w-0 ${isLast ? "pb-2" : ""}`}>
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded border ${CHANGE_COLORS[type]}`}
                  >
                    {CHANGE_LABELS[type]}
                  </span>
                  {entry.field && entry.field !== "__create__" && entry.field !== "__delete__" && (
                    <span className="text-sm font-medium text-foreground">
                      {entry.field}
                    </span>
                  )}
                </div>
                <span
                  className="text-xs text-muted-foreground shrink-0 font-mono"
                  title={absoluteTime(entry.createdAt)}
                >
                  {relativeTime(entry.createdAt)}
                </span>
              </div>

              {/* Old → New value */}
              {entry.field && entry.field !== "__create__" && entry.field !== "__delete__" && (
                <div className="flex items-center gap-1.5 mt-1 text-sm flex-wrap">
                  {entry.oldValue ? (
                    <span className="text-muted-foreground line-through">{entry.oldValue}</span>
                  ) : (
                    <span className="text-muted-foreground italic text-xs">leer</span>
                  )}
                  <IconArrowRight className="size-3.5 text-muted-foreground/40 shrink-0" />
                  <span className="font-medium text-foreground">{entry.newValue ?? "—"}</span>
                </div>
              )}

              {/* User */}
              <p className="text-xs text-muted-foreground mt-0.5">
                {entry.userName ?? entry.userEmail ?? "Unbekannter Benutzer"}
              </p>
            </div>
          </div>
        )
      })}

      {/* Load more */}
      {page < totalPages && (
        <div className="pt-2 pl-5">
          <button
            type="button"
            onClick={() => void fetchEntries(page + 1, true)}
            disabled={loadingMore}
            className="flex items-center gap-1.5 text-xs text-primary hover:underline disabled:opacity-50"
          >
            {loadingMore && <IconLoader2 className="size-3.5 animate-spin" />}
            Ältere Einträge laden
          </button>
        </div>
      )}
    </div>
  )
}
