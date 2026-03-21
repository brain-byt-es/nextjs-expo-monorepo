"use client"

/**
 * Forecasting Dashboard
 * Lists all active materials with demand forecasts, sortable/filterable.
 * Supports bulk draft-order creation for selected materials.
 */

import { useState, useEffect, useCallback, useMemo } from "react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  IconLoader2,
  IconAlertTriangle,
  IconShoppingCart,
  IconCheck,
  IconRefresh,
  IconChevronUp,
  IconChevronDown,
  IconSelector,
  IconFilter,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"

// ── Types ─────────────────────────────────────────────────────────────────────

interface MaterialMeta {
  id: string
  name: string
  number: string | null
  unit: string
  reorderLevel: number
}

interface ForecastRow {
  material: MaterialMeta
  currentStock: number
  avgDailyConsumption: number
  daysUntilStockout: number
  reorderQuantity: number
  reorderPoint: number
  confidence: number
  status: "critical" | "warning" | "ok" | "no-data"
}

type SortKey = "daysUntilStockout" | "avgDailyConsumption" | "confidence" | "name"
type SortDir = "asc" | "desc"
type FilterStatus = "all" | "critical" | "warning"

// ── Helpers ───────────────────────────────────────────────────────────────────

function stockoutStatus(days: number, consumption: number): ForecastRow["status"] {
  if (consumption === 0) return "no-data"
  if (days <= 7) return "critical"
  if (days <= 30) return "warning"
  return "ok"
}

function SortIcon({ col, sort }: { col: SortKey; sort: { key: SortKey; dir: SortDir } }) {
  if (sort.key !== col) return <IconSelector className="size-3.5 ml-1 text-muted-foreground" />
  return sort.dir === "asc"
    ? <IconChevronUp className="size-3.5 ml-1" />
    : <IconChevronDown className="size-3.5 ml-1" />
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ForecastingPage() {
  const t = useTranslations("forecasting")
  const router = useRouter()

  const [rows, setRows] = useState<ForecastRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkOrdering, setBulkOrdering] = useState(false)
  const [bulkDone, setBulkDone] = useState(false)
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({
    key: "daysUntilStockout",
    dir: "asc",
  })
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all")
  const [leadTime] = useState(7)

  const orgId =
    typeof window !== "undefined" ? (localStorage.getItem("organizationId") ?? undefined) : undefined

  const authHeaders = useMemo<Record<string, string>>(
    () => {
      const h: Record<string, string> = {}
      if (orgId) h["x-organization-id"] = orgId
      return h
    },
    [orgId]
  )

  function statusBadge(status: ForecastRow["status"]) {
    switch (status) {
      case "critical":
        return <Badge variant="destructive">{t("statusCritical")}</Badge>
      case "warning":
        return <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-400/30">{t("statusWarning")}</Badge>
      case "ok":
        return <Badge variant="secondary">{t("statusOk")}</Badge>
      case "no-data":
        return <Badge variant="outline" className="text-muted-foreground">{t("statusNoData")}</Badge>
    }
  }

  // ── Fetch all materials, then fan-out forecast requests ───────────────────

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    setSelected(new Set())
    setBulkDone(false)
    try {
      const matRes = await fetch("/api/materials?limit=200&page=1", { headers: authHeaders })
      if (!matRes.ok) throw new Error(t("couldNotLoad"))
      const matJson = await matRes.json()
      const mats: MaterialMeta[] = (Array.isArray(matJson) ? matJson : matJson.data ?? []).map(
        (m: Record<string, unknown>) => ({
          id: m.id as string,
          name: m.name as string,
          number: (m.number as string | null) ?? null,
          unit: (m.unit as string) ?? "Stk",
          reorderLevel: (m.reorderLevel as number) ?? 0,
        })
      )

      if (mats.length === 0) {
        setRows([])
        return
      }

      const BATCH = 10
      const result: ForecastRow[] = []

      for (let i = 0; i < mats.length; i += BATCH) {
        const batch = mats.slice(i, i + BATCH)
        const settled = await Promise.allSettled(
          batch.map((mat) =>
            fetch(
              `/api/materials/${mat.id}/forecast?days=30&leadTime=${leadTime}`,
              { headers: authHeaders }
            ).then((r) => (r.ok ? r.json() : null))
          )
        )

        for (let j = 0; j < batch.length; j++) {
          const mat = batch[j]!
          const res = settled[j]
          if (res?.status !== "fulfilled" || !res.value) {
            result.push({
              material: mat,
              currentStock: 0,
              avgDailyConsumption: 0,
              daysUntilStockout: Infinity,
              reorderQuantity: 0,
              reorderPoint: 0,
              confidence: 0,
              status: "no-data",
            })
            continue
          }

          const f = res.value
          const days = f.reorder?.daysUntilStockout ?? Infinity
          const consumption = f.avgDailyConsumption ?? 0

          result.push({
            material: mat,
            currentStock: f.currentStock ?? 0,
            avgDailyConsumption: consumption,
            daysUntilStockout: days,
            reorderQuantity: f.reorder?.reorderQuantity ?? 0,
            reorderPoint: f.reorder?.reorderPoint ?? 0,
            confidence: f.reorder?.confidence ?? 0,
            status: stockoutStatus(days, consumption),
          })
        }
      }

      setRows(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : t("unknownError"))
    } finally {
      setLoading(false)
    }
  }, [authHeaders, leadTime, t])

  useEffect(() => {
    void load()
  }, [load])

  // ── Sorted + filtered rows ─────────────────────────────────────────────────

  const displayed = useMemo(() => {
    let filtered = rows
    if (filterStatus === "critical") {
      filtered = rows.filter((r) => r.status === "critical")
    } else if (filterStatus === "warning") {
      filtered = rows.filter((r) => r.status === "critical" || r.status === "warning")
    }

    return [...filtered].sort((a, b) => {
      let cmp = 0
      switch (sort.key) {
        case "daysUntilStockout": {
          const aD = a.daysUntilStockout === Infinity ? 9999 : a.daysUntilStockout
          const bD = b.daysUntilStockout === Infinity ? 9999 : b.daysUntilStockout
          cmp = aD - bD
          break
        }
        case "avgDailyConsumption":
          cmp = a.avgDailyConsumption - b.avgDailyConsumption
          break
        case "confidence":
          cmp = a.confidence - b.confidence
          break
        case "name":
          cmp = a.material.name.localeCompare(b.material.name, "de")
          break
      }
      return sort.dir === "asc" ? cmp : -cmp
    })
  }, [rows, sort, filterStatus])

  // ── Summary counts ────────────────────────────────────────────────────────

  const counts = useMemo(() => ({
    critical: rows.filter((r) => r.status === "critical").length,
    warning: rows.filter((r) => r.status === "warning").length,
    ok: rows.filter((r) => r.status === "ok").length,
  }), [rows])

  // ── Selection helpers ─────────────────────────────────────────────────────

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })

  const toggleAll = () => {
    if (selected.size === displayed.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(displayed.map((r) => r.material.id)))
    }
  }

  const toggleSort = (key: SortKey) =>
    setSort((prev) => ({
      key,
      dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc",
    }))

  // ── Bulk order creation ───────────────────────────────────────────────────

  const handleBulkOrder = useCallback(async () => {
    if (selected.size === 0) return
    setBulkOrdering(true)
    try {
      const selectedRows = rows.filter((r) => selected.has(r.material.id))
      const todayStr = new Date().toISOString().slice(0, 10)

      const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
      const orderNumber = `PROG-BULK-${todayStr}-${rand}`

      await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          orderNumber,
          status: "draft",
          orderDate: todayStr,
          currency: "CHF",
          notes: `Prognose-Sammelbestellung (${selectedRows.length} Positionen) — ${new Date().toLocaleDateString("de-CH")}`,
          items: selectedRows.map((r) => ({
            materialId: r.material.id,
            quantity: r.reorderQuantity,
          })),
        }),
      })

      setBulkDone(true)
      setTimeout(() => router.push("/dashboard/orders"), 1500)
    } finally {
      setBulkOrdering(false)
    }
  }, [selected, rows, authHeaders, router])

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col gap-6 px-4 py-6 lg:px-6">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-96" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 px-4 py-6 lg:px-6">

      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("description")}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={load}
          disabled={loading}
          className="gap-2 self-start"
        >
          <IconRefresh className={`size-4 ${loading ? "animate-spin" : ""}`} />
          {t("refresh")}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <IconAlertTriangle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Summary KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-destructive/30">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t("criticalLess7")}
            </p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-destructive">
              {counts.critical}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{t("immediateAction")}</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-400/30">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t("warningLess30")}
            </p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-yellow-600 dark:text-yellow-400">
              {counts.warning}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{t("reorderSoon")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t("sufficientStock")}
            </p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-green-600 dark:text-green-400">
              {counts.ok}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{t("noAction")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <IconFilter className="size-4 text-muted-foreground" />
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
            <SelectTrigger className="h-8 w-48 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allMaterials")}</SelectItem>
              <SelectItem value="critical">{t("criticalOnly")}</SelectItem>
              <SelectItem value="warning">{t("criticalAndWarning")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selected.size > 0 && (
          <Button
            size="sm"
            onClick={handleBulkOrder}
            disabled={bulkOrdering || bulkDone}
            className="ml-auto gap-2"
          >
            {bulkDone ? (
              <>
                <IconCheck className="size-4" />
                {t("ordersCreated")}
              </>
            ) : bulkOrdering ? (
              <>
                <IconLoader2 className="size-4 animate-spin" />
                {t("creating")}
              </>
            ) : (
              <>
                <IconShoppingCart className="size-4" />
                {t("createOrders", { count: selected.size })}
              </>
            )}
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">{t("materialsWithForecast")}</CardTitle>
          <CardDescription className="text-xs">
            {t("materialsCount", { displayed: displayed.length, total: rows.length })}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {displayed.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              {t("noMaterials")}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selected.size === displayed.length && displayed.length > 0}
                      onCheckedChange={toggleAll}
                      aria-label={t("selectAll")}
                    />
                  </TableHead>
                  <TableHead>
                    <button
                      className="flex items-center text-xs font-medium hover:text-foreground"
                      onClick={() => toggleSort("name")}
                    >
                      {t("material")} <SortIcon col="name" sort={sort} />
                    </button>
                  </TableHead>
                  <TableHead>{t("statusLabel")}</TableHead>
                  <TableHead>
                    <button
                      className="flex items-center text-xs font-medium hover:text-foreground"
                      onClick={() => toggleSort("daysUntilStockout")}
                    >
                      {t("daysUntilStockout")} <SortIcon col="daysUntilStockout" sort={sort} />
                    </button>
                  </TableHead>
                  <TableHead>{t("currentStock")}</TableHead>
                  <TableHead>
                    <button
                      className="flex items-center text-xs font-medium hover:text-foreground"
                      onClick={() => toggleSort("avgDailyConsumption")}
                    >
                      {t("avgDailyConsumption")} <SortIcon col="avgDailyConsumption" sort={sort} />
                    </button>
                  </TableHead>
                  <TableHead>{t("recommendedQty")}</TableHead>
                  <TableHead>
                    <button
                      className="flex items-center text-xs font-medium hover:text-foreground"
                      onClick={() => toggleSort("confidence")}
                    >
                      {t("confidence")} <SortIcon col="confidence" sort={sort} />
                    </button>
                  </TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayed.map((row) => {
                  const isSelected = selected.has(row.material.id)
                  const days = row.daysUntilStockout === Infinity ? null : row.daysUntilStockout
                  return (
                    <TableRow
                      key={row.material.id}
                      className={isSelected ? "bg-muted/40" : undefined}
                    >
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(row.material.id)}
                          aria-label={t("selectItem", { name: row.material.name })}
                          disabled={row.status === "no-data"}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <Link
                            href={`/dashboard/materials/${row.material.id}`}
                            className="font-medium hover:underline"
                          >
                            {row.material.name}
                          </Link>
                          {row.material.number && (
                            <p className="text-xs font-mono text-muted-foreground">
                              {row.material.number}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{statusBadge(row.status)}</TableCell>
                      <TableCell>
                        <span
                          className={`font-semibold tabular-nums ${
                            row.status === "critical"
                              ? "text-destructive"
                              : row.status === "warning"
                              ? "text-yellow-600 dark:text-yellow-400"
                              : "text-foreground"
                          }`}
                        >
                          {days === null ? "—" : days}
                        </span>
                        {days !== null && (
                          <span className="ml-1 text-xs text-muted-foreground">{t("days")}</span>
                        )}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {row.currentStock.toLocaleString("de-CH")}{" "}
                        <span className="text-xs text-muted-foreground">{row.material.unit}</span>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {row.avgDailyConsumption > 0
                          ? `${row.avgDailyConsumption.toLocaleString("de-CH", { maximumFractionDigits: 1 })} ${row.material.unit}`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {row.reorderQuantity > 0 ? (
                          <span className="font-medium tabular-nums">
                            {row.reorderQuantity.toLocaleString("de-CH")}{" "}
                            <span className="text-xs font-normal text-muted-foreground">
                              {row.material.unit}
                            </span>
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        {row.confidence > 0 ? (
                          <div className="flex items-center gap-2">
                            <Progress
                              value={row.confidence * 100}
                              className="h-1.5 w-16"
                            />
                            <span className="text-xs tabular-nums text-muted-foreground">
                              {Math.round(row.confidence * 100)} %
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link href={`/dashboard/materials/${row.material.id}?tab=prognose`}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs">
                            {t("details")}
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
