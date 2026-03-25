"use client"

import { useState, useMemo, useEffect } from "react"
import { useTranslations } from "next-intl"
import {
  IconSearch,
  IconFileInvoice,
  IconDotsVertical,
  IconEye,
  IconTrash,
  IconTruck,
  IconUpload,
  IconChevronDown,
  IconChevronRight,
  IconPackage,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"

// ── Types ──────────────────────────────────────────────────────────────
type OrderStatus = "ordered" | "partial" | "delivered" | "cancelled"

interface OrderItem {
  id: string
  materialId: string
  materialName: string | null
  mainLocationId: string | null
  quantity: number
  receivedQuantity: number | null
  unitPrice: number | null
  currency: string | null
}

/** Shape returned by GET /api/orders */
interface Order {
  id: string
  orderNumber: string | null
  ownOrderNumber: string | null
  status: OrderStatus
  orderDate: string
  totalAmount: string | number | null
  currency: string | null
  notes: string | null
  documentUrl: string | null
  supplierId: string
  supplierName: string | null
  createdAt: string
  updatedAt: string
}

interface ApiResponse {
  data: Order[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  ordered: "bg-primary/10 text-primary",
  partial: "bg-primary/10 text-primary",
  delivered: "bg-secondary/10 text-secondary",
  cancelled: "bg-muted text-muted-foreground",
}

const ALL_STATUSES = Object.keys(STATUS_COLORS) as OrderStatus[]

function formatCHF(val: number) {
  return `CHF ${val.toFixed(2)}`
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" })
}
function toNumber(val: string | number | null | undefined): number {
  if (val == null) return 0
  const n = typeof val === "number" ? val : parseFloat(val)
  return isNaN(n) ? 0 : n
}

// ── Page ───────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const t = useTranslations("orders")
  const tc = useTranslations("common")

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())
  const [orderItemsMap, setOrderItemsMap] = useState<Record<string, OrderItem[]>>({})
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false
    async function fetchOrders() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/orders?limit=100")
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json: ApiResponse = await res.json()
        if (!cancelled) setOrders(json.data ?? [])
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchOrders()
    return () => { cancelled = true }
  }, [])

  async function toggleExpand(id: string) {
    setExpandedOrders(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    if (!orderItemsMap[id] && !loadingItems.has(id)) {
      setLoadingItems(prev => new Set(prev).add(id))
      try {
        const res = await fetch(`/api/orders/${id}`)
        if (res.ok) {
          const data = await res.json()
          setOrderItemsMap(prev => ({ ...prev, [id]: data.items ?? [] }))
        }
      } catch {
        // silent
      } finally {
        setLoadingItems(prev => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      }
    }
  }

  async function handleCancelOrder(id: string) {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      })
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "cancelled" } : o))
        toast.success("Bestellung storniert")
      } else {
        toast.error("Fehler beim Stornieren")
      }
    } catch {
      toast.error("Fehler beim Stornieren")
    }
  }

  async function handleBookItem(orderId: string, item: OrderItem) {
    if (!item.mainLocationId) {
      toast.error("Kein Hauptlagerort hinterlegt")
      return
    }
    try {
      const res = await fetch(`/api/materials/${item.materialId}/stock-changes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          changeType: "in",
          quantity: item.quantity,
          locationId: item.mainLocationId,
          notes: `Wareneingang Bestellung ${orderId}`,
        }),
      })
      if (res.ok) {
        toast.success(`${item.materialName ?? "Material"} eingebucht`)
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error ?? "Einbuchen fehlgeschlagen")
      }
    } catch {
      toast.error("Einbuchen fehlgeschlagen")
    }
  }

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const searchLower = search.toLowerCase()
      const matchSearch =
        !search ||
        (o.orderNumber ?? "").toLowerCase().includes(searchLower) ||
        (o.supplierName ?? "").toLowerCase().includes(searchLower) ||
        (o.ownOrderNumber ?? "").toLowerCase().includes(searchLower)
      const matchStatus = statusFilter === "all" || o.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [orders, search, statusFilter])

  const openOrders = orders.filter(o => o.status !== "delivered" && o.status !== "cancelled")
  const openTotal = orders
    .filter(o => o.status === "ordered" || o.status === "partial")
    .reduce((sum, o) => sum + toNumber(o.totalAmount), 0)

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t("openPositions")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {openOrders.length} {t("openOrders")} · {formatCHF(openTotal)}
          </p>
        </div>
      </div>

      {/* Status quick filters */}
      <div className="flex gap-2 flex-wrap">
        {["all", ...ALL_STATUSES].map(s => {
          const isAll = s === "all"
          const count = isAll ? orders.length : orders.filter(o => o.status === s).length
          const label = isAll ? tc("all") : t(`statuses.${s}`)
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all cursor-pointer
                ${statusFilter === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-border/80"}`}
            >
              {label}
              <span className={`inline-flex items-center justify-center size-4 rounded-full text-[10px] ${statusFilter === s ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder={`${tc("search")}…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : error ? (
        <Card className="border-0 shadow-sm">
          <CardContent>
            <Empty className="py-16">
              <EmptyMedia>
                <IconFileInvoice className="size-12 text-muted-foreground/40" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>{tc("error")}</EmptyTitle>
                <EmptyDescription>{error}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent>
            <Empty className="py-16">
              <EmptyMedia>
                <IconFileInvoice className="size-12 text-muted-foreground/40" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>{t("noOrdersFound")}</EmptyTitle>
                <EmptyDescription>{t("adjustFilters")}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((order) => {
            const isExpanded = expandedOrders.has(order.id)
            const statusColor = STATUS_COLORS[order.status] ?? STATUS_COLORS.ordered
            const orderItems = orderItemsMap[order.id]
            const isLoadingItems = loadingItems.has(order.id)

            return (
              <Card key={order.id} className="border-0 shadow-sm overflow-hidden">
                {/* Order header */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/80 transition-colors"
                  onClick={() => toggleExpand(order.id)}
                >
                  <div className="flex-shrink-0">
                    {isExpanded
                      ? <IconChevronDown className="size-4 text-muted-foreground" />
                      : <IconChevronRight className="size-4 text-muted-foreground" />
                    }
                  </div>

                  <div className="flex-1 grid grid-cols-5 gap-4 items-center">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{order.orderNumber ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(order.orderDate)}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <IconTruck className="size-3.5 text-muted-foreground/60" />
                      <span className="text-sm text-foreground">{order.supplierName ?? "—"}</span>
                    </div>
                    <div>
                      <span className={`inline-flex items-center text-xs font-medium px-2 py-1 rounded-md ${statusColor}`}>
                        {t(`statuses.${order.status}`)}
                      </span>
                    </div>
                    <div>
                      {order.ownOrderNumber ? (
                        <div>
                          <p className="text-xs text-muted-foreground">{t("uploadDeliveryNote")}</p>
                          <p className="text-sm font-mono text-foreground">{order.ownOrderNumber}</p>
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <IconUpload className="size-3" />
                          {t("uploadDeliveryNote")}
                        </Button>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">
                        {order.totalAmount != null ? formatCHF(toNumber(order.totalAmount)) : "—"}
                      </p>
                    </div>
                  </div>

                  <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <IconDotsVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2"><IconEye className="size-4" /> {tc("details")}</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2"><IconUpload className="size-4" /> {t("uploadDocument")}</DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 text-destructive focus:text-destructive"
                          disabled={order.status === "cancelled"}
                          onClick={() => handleCancelOrder(order.id)}
                        >
                          <IconTrash className="size-4" /> {t("cancel")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Expanded: order items + notes */}
                {isExpanded && (
                  <div className="border-t border-border px-12 py-4 space-y-4 bg-muted/30">
                    {isLoadingItems ? (
                      <div className="space-y-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-2/3" />
                      </div>
                    ) : orderItems && orderItems.length > 0 ? (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Positionen</p>
                        {orderItems.map((item) => (
                          <div key={item.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                            <div className="flex items-center gap-2 flex-1">
                              <IconPackage className="size-4 text-muted-foreground/60 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-foreground">{item.materialName ?? "—"}</p>
                                <p className="text-xs text-muted-foreground">
                                  {item.quantity} Stk{item.unitPrice != null ? ` · CHF ${Number(item.unitPrice).toFixed(2)}` : ""}
                                </p>
                              </div>
                            </div>
                            {order.status !== "cancelled" && order.status !== "delivered" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => handleBookItem(order.id, item)}
                              >
                                Buchen
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {order.notes && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{tc("notes")}:</span> {order.notes}
                      </p>
                    )}
                    {order.documentUrl && (
                      <a
                        href={order.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-primary underline-offset-4 hover:underline"
                      >
                        <IconFileInvoice className="size-3.5" />
                        {t("uploadDocument")}
                      </a>
                    )}
                    {!order.notes && !order.documentUrl && (!orderItems || orderItems.length === 0) && !isLoadingItems && (
                      <p className="text-sm text-muted-foreground">{tc("noData")}</p>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
