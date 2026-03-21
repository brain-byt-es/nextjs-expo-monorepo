"use client"

import { useState, useCallback } from "react"
import { useTranslations } from "next-intl"
import {
  IconPackage,
  IconTool,
  IconArrowsTransferDown,
  IconClipboardList,
  IconDownload,
  IconPrinter,
  IconAlertTriangle,
  IconCalendarOff,
  IconCurrencyEuro,
  IconLoader2,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { downloadCsv, printReport, type ExportColumn } from "@/lib/export-utils"

// ---------------------------------------------------------------------------
// Types mirroring API responses
// ---------------------------------------------------------------------------
interface MaterialReportRow {
  id: string
  number: string | null
  name: string
  groupName: string | null
  mainLocationName: string | null
  totalStock: number
  unit: string | null
  reorderLevel: number | null
  nearestExpiry: string | null
}

interface ToolReportRow {
  id: string
  number: string | null
  name: string
  groupName: string | null
  homeLocationName: string | null
  assignedUserName: string | null
  condition: string | null
  serialNumber: string | null
  nextMaintenanceDate: string | null
}

interface StockChangeReportRow {
  id: string
  materialName: string | null
  materialNumber: string | null
  locationName: string | null
  userName: string | null
  changeType: string
  quantity: number
  previousQuantity: number | null
  newQuantity: number | null
  notes: string | null
  createdAt: string
}

interface CommissionReportRow {
  id: string
  number: number | null
  manualNumber: string | null
  name: string
  status: string | null
  targetLocationName: string | null
  customerName: string | null
  responsibleName: string | null
  entryCount: number
  createdAt: string
}

interface ExpiryReportRow {
  stockId: string
  materialId: string
  materialName: string
  materialNumber: string | null
  locationName: string | null
  expiryDate: string
  quantity: number
  unit: string | null
  batchNumber: string | null
  daysUntil: number
}

interface DepreciationReportRow {
  id: string
  number: string | null
  name: string
  groupName: string | null
  purchasePrice: number
  purchaseDate: string | null
  expectedLifeYears: number | null
  currentBookValue: number
  depreciationMethod: string | null
  condition: string | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(d: string | null): string {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function thirtyDaysAgo(): string {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().slice(0, 10)
}

// ---------------------------------------------------------------------------
// Report card sub-component
// ---------------------------------------------------------------------------
interface ReportCardProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  badgeLabel?: string
  filters: React.ReactNode
  onCsv: () => void
  onPrint: () => void
  loadingCsv: boolean
  loadingPrint: boolean
  csvLabel: string
  printLabel: string
  filterLabel: string
}

function ReportCard({
  icon: Icon,
  title,
  description,
  badgeLabel,
  filters,
  onCsv,
  onPrint,
  loadingCsv,
  loadingPrint,
  csvLabel,
  printLabel,
  filterLabel,
}: ReportCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="size-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="mt-0.5 text-xs">{description}</CardDescription>
            </div>
          </div>
          {badgeLabel && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              {badgeLabel}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Filters */}
        <div className="rounded-md border bg-muted/40 p-3">
          <p className="mb-3 text-xs font-medium text-muted-foreground">{filterLabel}</p>
          <div className="flex flex-col gap-2">{filters}</div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onCsv}
            disabled={loadingCsv || loadingPrint}
          >
            {loadingCsv ? (
              <IconLoader2 className="size-4 animate-spin" />
            ) : (
              <IconDownload className="size-4" />
            )}
            {csvLabel}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onPrint}
            disabled={loadingCsv || loadingPrint}
          >
            {loadingPrint ? (
              <IconLoader2 className="size-4 animate-spin" />
            ) : (
              <IconPrinter className="size-4" />
            )}
            {printLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function ReportsPage() {
  const t = useTranslations("reports")

  // ── Inventarbericht filters ──────────────────────────────────────────────
  const [invLowStock, setInvLowStock] = useState(false)
  const [invLoading, setInvLoading] = useState<"csv" | "print" | null>(null)

  // ── Werkzeugbericht filters ──────────────────────────────────────────────
  const [toolCondition, setToolCondition] = useState("all")
  const [toolOverdue, setToolOverdue] = useState(false)
  const [toolLoading, setToolLoading] = useState<"csv" | "print" | null>(null)

  // ── Bewegungsbericht filters ─────────────────────────────────────────────
  const [moveFrom, setMoveFrom] = useState(thirtyDaysAgo())
  const [moveTo, setMoveTo] = useState(today())
  const [moveType, setMoveType] = useState("all")
  const [moveLoading, setMoveLoading] = useState<"csv" | "print" | null>(null)

  // ── Lieferschein-Bericht filters ────────────────────────────────────────
  const [commFrom, setCommFrom] = useState(thirtyDaysAgo())
  const [commTo, setCommTo] = useState(today())
  const [commStatus, setCommStatus] = useState("all")
  const [commLoading, setCommLoading] = useState<"csv" | "print" | null>(null)

  // ── Ablaufbericht filters ────────────────────────────────────────────
  const [expiryDays, setExpiryDays] = useState("30")
  const [expiryLoading, setExpiryLoading] = useState<"csv" | "print" | null>(null)

  // ── Abschreibungsbericht filters ─────────────────────────────────────
  const [deprCondition, setDeprCondition] = useState("all")
  const [deprLoading, setDeprLoading] = useState<"csv" | "print" | null>(null)

  // ── Inventarbericht ─────────────────────────────────────────────────────
  const fetchInventory = useCallback(async (): Promise<MaterialReportRow[]> => {
    const params = new URLSearchParams({ page: "1", limit: "9999" })
    const res = await fetch(`/api/materials?${params}`)
    if (!res.ok) return []
    const json = await res.json()
    let rows: MaterialReportRow[] = (json.data ?? []).map(
      (r: Record<string, unknown>) => ({
        id: r.id as string,
        number: (r.number as string | null) ?? null,
        name: r.name as string,
        groupName: (r.groupName as string | null) ?? null,
        mainLocationName: (r.mainLocationName as string | null) ?? null,
        totalStock: (r.totalStock as number) ?? 0,
        unit: (r.unit as string | null) ?? null,
        reorderLevel: (r.reorderLevel as number | null) ?? null,
        nearestExpiry: (r.nearestExpiry as string | null) ?? null,
      }),
    )
    if (invLowStock) {
      rows = rows.filter(
        (r) => (r.reorderLevel ?? 0) > 0 && r.totalStock <= (r.reorderLevel ?? 0),
      )
    }
    return rows
  }, [invLowStock])

  const INVENTORY_COLUMNS: ExportColumn<MaterialReportRow>[] = [
    { label: t("columns.number"), accessor: (r) => r.number ?? "" },
    { label: t("columns.name"), accessor: "name" },
    { label: t("columns.group"), accessor: (r) => r.groupName ?? "" },
    { label: t("columns.mainLocation"), accessor: (r) => r.mainLocationName ?? "" },
    { label: t("columns.stock"), accessor: "totalStock" },
    { label: t("columns.unit"), accessor: (r) => r.unit ?? "" },
    { label: t("columns.reorderLevel"), accessor: (r) => r.reorderLevel ?? "" },
    { label: t("columns.nextExpiry"), accessor: (r) => formatDate(r.nearestExpiry) },
  ]

  const handleInventoryCsv = useCallback(async () => {
    setInvLoading("csv")
    try {
      const rows = await fetchInventory()
      downloadCsv(rows, INVENTORY_COLUMNS, "inventarbericht.csv")
    } finally {
      setInvLoading(null)
    }
  }, [fetchInventory]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleInventoryPrint = useCallback(async () => {
    setInvLoading("print")
    try {
      const rows = await fetchInventory()
      printReport(t("inventory"), rows, INVENTORY_COLUMNS)
    } finally {
      setInvLoading(null)
    }
  }, [fetchInventory]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Werkzeugbericht ──────────────────────────────────────────────────────
  const fetchTools = useCallback(async (): Promise<ToolReportRow[]> => {
    const params = new URLSearchParams({ page: "1", limit: "9999" })
    if (toolCondition !== "all") params.set("condition", toolCondition)
    const res = await fetch(`/api/tools?${params}`)
    if (!res.ok) return []
    const json = await res.json()
    let rows: ToolReportRow[] = (json.data ?? []).map(
      (r: Record<string, unknown>) => ({
        id: r.id as string,
        number: (r.number as string | null) ?? null,
        name: r.name as string,
        groupName: (r.groupName as string | null) ?? null,
        homeLocationName: (r.homeLocationName as string | null) ?? null,
        assignedUserName: (r.assignedUserName as string | null) ?? null,
        condition: (r.condition as string | null) ?? null,
        serialNumber: (r.serialNumber as string | null) ?? null,
        nextMaintenanceDate: (r.nextMaintenanceDate as string | null) ?? null,
      }),
    )
    if (toolOverdue) {
      rows = rows.filter(
        (r) => r.nextMaintenanceDate && new Date(r.nextMaintenanceDate) < new Date(),
      )
    }
    return rows
  }, [toolCondition, toolOverdue])

  const TOOL_COLUMNS: ExportColumn<ToolReportRow>[] = [
    { label: t("columns.number"), accessor: (r) => r.number ?? "" },
    { label: t("columns.name"), accessor: "name" },
    { label: t("columns.group"), accessor: (r) => r.groupName ?? "" },
    { label: t("columns.homeLocation"), accessor: (r) => r.homeLocationName ?? "" },
    { label: t("columns.assignedTo"), accessor: (r) => r.assignedUserName ?? "" },
    { label: t("columns.condition"), accessor: (r) => t(`conditions.${r.condition ?? ""}` as Parameters<typeof t>[0]) || (r.condition ?? "") },
    { label: t("columns.serialNumber"), accessor: (r) => r.serialNumber ?? "" },
    { label: t("columns.nextMaintenance"), accessor: (r) => formatDate(r.nextMaintenanceDate) },
  ]

  const handleToolCsv = useCallback(async () => {
    setToolLoading("csv")
    try {
      const rows = await fetchTools()
      downloadCsv(rows, TOOL_COLUMNS, "werkzeugbericht.csv")
    } finally {
      setToolLoading(null)
    }
  }, [fetchTools]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleToolPrint = useCallback(async () => {
    setToolLoading("print")
    try {
      const rows = await fetchTools()
      printReport(t("tools"), rows, TOOL_COLUMNS)
    } finally {
      setToolLoading(null)
    }
  }, [fetchTools]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Bewegungsbericht ─────────────────────────────────────────────────────
  const fetchStockChanges = useCallback(async (): Promise<StockChangeReportRow[]> => {
    const params = new URLSearchParams({ page: "1", limit: "9999" })
    if (moveType !== "all") params.set("changeType", moveType)
    if (moveFrom) params.set("from", moveFrom)
    if (moveTo) params.set("to", moveTo)
    const res = await fetch(`/api/stock-changes?${params}`)
    if (!res.ok) return []
    const json = await res.json()
    let rows: StockChangeReportRow[] = (json.data ?? []).map(
      (r: Record<string, unknown>) => ({
        id: r.id as string,
        materialName: (r.materialName as string | null) ?? null,
        materialNumber: (r.materialNumber as string | null) ?? null,
        locationName: (r.locationName as string | null) ?? null,
        userName: (r.userName as string | null) ?? null,
        changeType: r.changeType as string,
        quantity: r.quantity as number,
        previousQuantity: (r.previousQuantity as number | null) ?? null,
        newQuantity: (r.newQuantity as number | null) ?? null,
        notes: (r.notes as string | null) ?? null,
        createdAt: r.createdAt as string,
      }),
    )
    if (moveFrom) {
      rows = rows.filter((r) => new Date(r.createdAt) >= new Date(moveFrom))
    }
    if (moveTo) {
      const toEnd = new Date(moveTo)
      toEnd.setHours(23, 59, 59, 999)
      rows = rows.filter((r) => new Date(r.createdAt) <= toEnd)
    }
    return rows
  }, [moveFrom, moveTo, moveType])

  const MOVE_COLUMNS: ExportColumn<StockChangeReportRow>[] = [
    { label: t("columns.date"), accessor: (r) => formatDate(r.createdAt) },
    { label: t("columns.materialNumber"), accessor: (r) => r.materialNumber ?? "" },
    { label: t("columns.material"), accessor: (r) => r.materialName ?? "" },
    { label: t("columns.location"), accessor: (r) => r.locationName ?? "" },
    { label: t("columns.user"), accessor: (r) => r.userName ?? "" },
    { label: t("columns.type" as Parameters<typeof t>[0]), accessor: (r) => t(`changeTypes.${r.changeType}` as Parameters<typeof t>[0]) || r.changeType },
    { label: t("columns.quantity"), accessor: "quantity" },
    { label: t("columns.previousStock"), accessor: (r) => r.previousQuantity ?? "" },
    { label: t("columns.newStock"), accessor: (r) => r.newQuantity ?? "" },
    { label: t("columns.note"), accessor: (r) => r.notes ?? "" },
  ]

  const handleMoveCsv = useCallback(async () => {
    setMoveLoading("csv")
    try {
      const rows = await fetchStockChanges()
      downloadCsv(rows, MOVE_COLUMNS, "bewegungsbericht.csv")
    } finally {
      setMoveLoading(null)
    }
  }, [fetchStockChanges]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleMovePrint = useCallback(async () => {
    setMoveLoading("print")
    try {
      const rows = await fetchStockChanges()
      printReport(t("movements"), rows, MOVE_COLUMNS)
    } finally {
      setMoveLoading(null)
    }
  }, [fetchStockChanges]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Lieferschein-Bericht ────────────────────────────────────────────────
  const fetchCommissions = useCallback(async (): Promise<CommissionReportRow[]> => {
    const params = new URLSearchParams({ page: "1", limit: "9999" })
    if (commStatus !== "all") params.set("status", commStatus)
    const res = await fetch(`/api/commissions?${params}`)
    if (!res.ok) return []
    const json = await res.json()
    let rows: CommissionReportRow[] = (json.data ?? []).map(
      (r: Record<string, unknown>) => ({
        id: r.id as string,
        number: (r.number as number | null) ?? null,
        manualNumber: (r.manualNumber as string | null) ?? null,
        name: r.name as string,
        status: (r.status as string | null) ?? null,
        targetLocationName: (r.targetLocationName as string | null) ?? null,
        customerName: (r.customerName as string | null) ?? null,
        responsibleName: (r.responsibleName as string | null) ?? null,
        entryCount: (r.entryCount as number) ?? 0,
        createdAt: r.createdAt as string,
      }),
    )
    if (commFrom) {
      rows = rows.filter((r) => new Date(r.createdAt) >= new Date(commFrom))
    }
    if (commTo) {
      const toEnd = new Date(commTo)
      toEnd.setHours(23, 59, 59, 999)
      rows = rows.filter((r) => new Date(r.createdAt) <= toEnd)
    }
    return rows
  }, [commFrom, commTo, commStatus])

  const COMMISSION_COLUMNS: ExportColumn<CommissionReportRow>[] = [
    { label: t("columns.number"), accessor: (r) => r.manualNumber ?? r.number ?? "" },
    { label: t("columns.name"), accessor: "name" },
    { label: t("columns.status"), accessor: (r) => {
      const key = r.status === "in_progress" ? "inProgress" : (r.status ?? "")
      return t(`commissionStatuses.${key}` as Parameters<typeof t>[0]) || (r.status ?? "")
    }},
    { label: t("columns.targetLocation"), accessor: (r) => r.targetLocationName ?? "" },
    { label: t("columns.customer"), accessor: (r) => r.customerName ?? "" },
    { label: t("columns.responsible"), accessor: (r) => r.responsibleName ?? "" },
    { label: t("columns.entryCount"), accessor: "entryCount" },
    { label: t("columns.createdAt"), accessor: (r) => formatDate(r.createdAt) },
  ]

  const handleCommCsv = useCallback(async () => {
    setCommLoading("csv")
    try {
      const rows = await fetchCommissions()
      downloadCsv(rows, COMMISSION_COLUMNS, "lieferschein-bericht.csv")
    } finally {
      setCommLoading(null)
    }
  }, [fetchCommissions]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCommPrint = useCallback(async () => {
    setCommLoading("print")
    try {
      const rows = await fetchCommissions()
      printReport(t("commissions"), rows, COMMISSION_COLUMNS)
    } finally {
      setCommLoading(null)
    }
  }, [fetchCommissions]) // eslint-disable-line react-hooks/exhaustive-deps


  // ── Ablaufbericht ────────────────────────────────────────────────────
  const fetchExpiryReport = useCallback(async (): Promise<ExpiryReportRow[]> => {
    const params = new URLSearchParams({ days: expiryDays })
    const res = await fetch(`/api/materials/expiring?${params}`)
    if (!res.ok) return []
    const json = await res.json()
    return (json.data ?? []) as ExpiryReportRow[]
  }, [expiryDays])

  const EXPIRY_COLUMNS: ExportColumn<ExpiryReportRow>[] = [
    { label: t("columns.material"), accessor: "materialName" },
    { label: t("columns.number"), accessor: (r) => r.materialNumber ?? "" },
    { label: t("columns.location"), accessor: (r) => r.locationName ?? "" },
    { label: t("columns.batch"), accessor: (r) => r.batchNumber ?? "" },
    { label: t("columns.expiryDate"), accessor: (r) => formatDate(r.expiryDate) },
    { label: t("columns.daysUntilExpiry"), accessor: "daysUntil" },
    { label: t("columns.quantity"), accessor: "quantity" },
    { label: t("columns.unit"), accessor: (r) => r.unit ?? "" },
  ]

  const handleExpiryCsv = useCallback(async () => {
    setExpiryLoading("csv")
    try {
      const rows = await fetchExpiryReport()
      downloadCsv(rows, EXPIRY_COLUMNS, "ablaufbericht.csv")
    } finally { setExpiryLoading(null) }
  }, [fetchExpiryReport]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleExpiryPrint = useCallback(async () => {
    setExpiryLoading("print")
    try {
      const rows = await fetchExpiryReport()
      printReport(t("expiry"), rows, EXPIRY_COLUMNS)
    } finally { setExpiryLoading(null) }
  }, [fetchExpiryReport]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Abschreibungsbericht ─────────────────────────────────────────────
  const fetchDepreciationReport = useCallback(async (): Promise<DepreciationReportRow[]> => {
    const params = new URLSearchParams({ page: "1", limit: "9999" })
    if (deprCondition !== "all") params.set("condition", deprCondition)
    const res = await fetch(`/api/tools?${params}`)
    if (!res.ok) return []
    const json = await res.json()
    const tools: Record<string, unknown>[] = json.data ?? []
    const depRows: DepreciationReportRow[] = []
    const slice = tools.slice(0, 50)
    const deprResults = await Promise.allSettled(
      slice.map((t) => fetch(`/api/tools/${t.id}/depreciation`).then((r) => r.ok ? r.json() : null))
    )
    slice.forEach((tool, i) => {
      const depr = deprResults[i]?.status === "fulfilled" ? deprResults[i].value : null
      depRows.push({
        id: tool.id as string,
        number: (tool.number as string | null) ?? null,
        name: tool.name as string,
        groupName: (tool.groupName as string | null) ?? null,
        purchasePrice: depr?.purchasePrice ?? 0,
        purchaseDate: depr?.purchaseDate ?? null,
        expectedLifeYears: depr?.lifeYears ?? null,
        currentBookValue: depr?.currentBookValue ?? 0,
        depreciationMethod: depr?.method ?? null,
        condition: (tool.condition as string | null) ?? null,
      })
    })
    return depRows
  }, [deprCondition])

  const DEPR_COLUMNS: ExportColumn<DepreciationReportRow>[] = [
    { label: t("columns.number"), accessor: (r) => r.number ?? "" },
    { label: t("columns.name"), accessor: "name" },
    { label: t("columns.group"), accessor: (r) => r.groupName ?? "" },
    { label: t("columns.purchasePrice"), accessor: (r) => r.purchasePrice.toFixed(2) },
    { label: t("columns.purchaseDate"), accessor: (r) => formatDate(r.purchaseDate) },
    { label: t("columns.usefulLife"), accessor: (r) => r.expectedLifeYears ?? "" },
    { label: t("columns.bookValue"), accessor: (r) => r.currentBookValue.toFixed(2) },
    { label: t("columns.method"), accessor: (r) => r.depreciationMethod === "declining" ? t("columns.declining") : r.depreciationMethod === "linear" ? t("columns.linear") : "" },
    { label: t("columns.condition"), accessor: (r) => t(`conditions.${r.condition ?? ""}` as Parameters<typeof t>[0]) || (r.condition ?? "") },
  ]

  const handleDeprCsv = useCallback(async () => {
    setDeprLoading("csv")
    try {
      const rows = await fetchDepreciationReport()
      downloadCsv(rows, DEPR_COLUMNS, "abschreibungsbericht.csv")
    } finally { setDeprLoading(null) }
  }, [fetchDepreciationReport]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDeprPrint = useCallback(async () => {
    setDeprLoading("print")
    try {
      const rows = await fetchDepreciationReport()
      printReport(t("depreciation"), rows, DEPR_COLUMNS)
    } finally { setDeprLoading(null) }
  }, [fetchDepreciationReport]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="flex flex-col gap-6 px-4 py-6 lg:px-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("description")}
        </p>
      </div>

      {/* Report cards grid */}
      <div className="grid gap-6 md:grid-cols-2">

        {/* ── Inventarbericht ─────────────────────────────────────────── */}
        <ReportCard
          icon={IconPackage}
          title={t("inventory")}
          description={t("inventoryDesc")}
          loadingCsv={invLoading === "csv"}
          loadingPrint={invLoading === "print"}
          onCsv={handleInventoryCsv}
          onPrint={handleInventoryPrint}
          csvLabel={t("csvExport")}
          printLabel={t("pdfPrint")}
          filterLabel={t("filterLabel")}
          filters={
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={invLowStock}
                onChange={(e) => setInvLowStock(e.target.checked)}
                className="rounded border-border accent-primary"
              />
              <span className="flex items-center gap-1.5">
                <IconAlertTriangle className="size-3.5 text-orange-500" />
                {t("lowStockOnly")}
              </span>
            </label>
          }
        />

        {/* ── Werkzeugbericht ──────────────────────────────────────────── */}
        <ReportCard
          icon={IconTool}
          title={t("tools")}
          description={t("toolsDesc")}
          loadingCsv={toolLoading === "csv"}
          loadingPrint={toolLoading === "print"}
          onCsv={handleToolCsv}
          onPrint={handleToolPrint}
          csvLabel={t("csvExport")}
          printLabel={t("pdfPrint")}
          filterLabel={t("filterLabel")}
          filters={
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Label className="w-20 shrink-0 text-xs">{t("condition")}</Label>
                <Select value={toolCondition} onValueChange={setToolCondition}>
                  <SelectTrigger className="h-8 flex-1 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("conditions.all")}</SelectItem>
                    <SelectItem value="good">{t("conditions.good")}</SelectItem>
                    <SelectItem value="damaged">{t("conditions.damaged")}</SelectItem>
                    <SelectItem value="repair">{t("conditions.repair")}</SelectItem>
                    <SelectItem value="decommissioned">{t("conditions.decommissioned")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={toolOverdue}
                  onChange={(e) => setToolOverdue(e.target.checked)}
                  className="rounded border-border accent-primary"
                />
                <span className="flex items-center gap-1.5">
                  <IconAlertTriangle className="size-3.5 text-destructive" />
                  {t("overdueMaintenanceOnly")}
                </span>
              </label>
            </div>
          }
        />

        {/* ── Bewegungsbericht ─────────────────────────────────────────── */}
        <ReportCard
          icon={IconArrowsTransferDown}
          title={t("movements")}
          description={t("movementsDesc")}
          loadingCsv={moveLoading === "csv"}
          loadingPrint={moveLoading === "print"}
          onCsv={handleMoveCsv}
          onPrint={handleMovePrint}
          csvLabel={t("csvExport")}
          printLabel={t("pdfPrint")}
          filterLabel={t("filterLabel")}
          filters={
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Label className="w-20 shrink-0 text-xs">{t("from")}</Label>
                <Input
                  type="date"
                  value={moveFrom}
                  onChange={(e) => setMoveFrom(e.target.value)}
                  className="h-8 flex-1 text-xs"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-20 shrink-0 text-xs">{t("to")}</Label>
                <Input
                  type="date"
                  value={moveTo}
                  onChange={(e) => setMoveTo(e.target.value)}
                  className="h-8 flex-1 text-xs"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-20 shrink-0 text-xs">{t("type")}</Label>
                <Select value={moveType} onValueChange={setMoveType}>
                  <SelectTrigger className="h-8 flex-1 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("conditions.all")}</SelectItem>
                    <SelectItem value="in">{t("changeTypes.in")}</SelectItem>
                    <SelectItem value="out">{t("changeTypes.out")}</SelectItem>
                    <SelectItem value="transfer">{t("changeTypes.transfer")}</SelectItem>
                    <SelectItem value="correction">{t("changeTypes.correction")}</SelectItem>
                    <SelectItem value="inventory">{t("changeTypes.inventory")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          }
        />

        {/* ── Lieferschein-Bericht ─────────────────────────────────────── */}
        <ReportCard
          icon={IconClipboardList}
          title={t("commissions")}
          description={t("commissionsDesc")}
          loadingCsv={commLoading === "csv"}
          loadingPrint={commLoading === "print"}
          onCsv={handleCommCsv}
          onPrint={handleCommPrint}
          csvLabel={t("csvExport")}
          printLabel={t("pdfPrint")}
          filterLabel={t("filterLabel")}
          filters={
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Label className="w-20 shrink-0 text-xs">{t("from")}</Label>
                <Input
                  type="date"
                  value={commFrom}
                  onChange={(e) => setCommFrom(e.target.value)}
                  className="h-8 flex-1 text-xs"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-20 shrink-0 text-xs">{t("to")}</Label>
                <Input
                  type="date"
                  value={commTo}
                  onChange={(e) => setCommTo(e.target.value)}
                  className="h-8 flex-1 text-xs"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-20 shrink-0 text-xs">{t("columns.status")}</Label>
                <Select value={commStatus} onValueChange={setCommStatus}>
                  <SelectTrigger className="h-8 flex-1 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("commissionStatuses.all")}</SelectItem>
                    <SelectItem value="open">{t("commissionStatuses.open")}</SelectItem>
                    <SelectItem value="in_progress">{t("commissionStatuses.inProgress")}</SelectItem>
                    <SelectItem value="completed">{t("commissionStatuses.completed")}</SelectItem>
                    <SelectItem value="cancelled">{t("commissionStatuses.cancelled")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          }
        />

        {/* ── Ablaufbericht ────────────────────────────────────────────── */}
        <ReportCard
          icon={IconCalendarOff}
          title={t("expiry")}
          description={t("expiryDesc")}
          loadingCsv={expiryLoading === "csv"}
          loadingPrint={expiryLoading === "print"}
          onCsv={handleExpiryCsv}
          onPrint={handleExpiryPrint}
          csvLabel={t("csvExport")}
          printLabel={t("pdfPrint")}
          filterLabel={t("filterLabel")}
          filters={
            <div className="flex items-center gap-2">
              <Label className="w-20 shrink-0 text-xs">{t("period")}</Label>
              <Select value={expiryDays} onValueChange={setExpiryDays}>
                <SelectTrigger className="h-8 flex-1 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">{t("next7Days")}</SelectItem>
                  <SelectItem value="30">{t("next30Days")}</SelectItem>
                  <SelectItem value="90">{t("next90Days")}</SelectItem>
                  <SelectItem value="365">{t("nextYear")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        />

        {/* ── Abschreibungsbericht ──────────────────────────────────────── */}
        <ReportCard
          icon={IconCurrencyEuro}
          title={t("depreciation")}
          description={t("depreciationDesc")}
          loadingCsv={deprLoading === "csv"}
          loadingPrint={deprLoading === "print"}
          onCsv={handleDeprCsv}
          onPrint={handleDeprPrint}
          csvLabel={t("csvExport")}
          printLabel={t("pdfPrint")}
          filterLabel={t("filterLabel")}
          filters={
            <div className="flex items-center gap-2">
              <Label className="w-20 shrink-0 text-xs">{t("condition")}</Label>
              <Select value={deprCondition} onValueChange={setDeprCondition}>
                <SelectTrigger className="h-8 flex-1 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("conditions.all")}</SelectItem>
                  <SelectItem value="good">{t("conditions.good")}</SelectItem>
                  <SelectItem value="damaged">{t("conditions.damaged")}</SelectItem>
                  <SelectItem value="repair">{t("conditions.repair")}</SelectItem>
                  <SelectItem value="decommissioned">{t("conditions.decommissioned")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        />

      </div>
    </div>
  )
}
