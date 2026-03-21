"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslations } from "next-intl"
import {
  IconChartBar,
  IconTool,
  IconClock,
  IconLoader2,
  IconTrendingUp,
  IconTrendingDown,
  IconInfoCircle,
} from "@tabler/icons-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// ── Types ──────────────────────────────────────────────────────────────────────
interface ToolUtilization {
  id: string
  name: string
  number: string | null
  bookingCount: number
  checkedOutHours: number
  daysSinceLastBooking: number | null
  utilizationRate: number
  lastBookingDate: string | null
}

interface Summary {
  avgUtilization: number
  mostUsed: { name: string; utilization: number } | null
  leastUsed: { name: string; utilization: number } | null
  totalBookingHours: number
}

interface UtilizationData {
  tools: ToolUtilization[]
  summary: Summary
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function getUtilizationColor(rate: number): string {
  if (rate >= 50) return "hsl(142, 76%, 36%)" // green
  if (rate >= 20) return "hsl(45, 93%, 47%)"  // yellow
  return "hsl(0, 72%, 51%)"                    // red
}

function getUtilizationBadge(rate: number) {
  if (rate >= 50)
    return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">{rate}%</Badge>
  if (rate >= 20)
    return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">{rate}%</Badge>
  return <Badge variant="destructive">{rate}%</Badge>
}

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function UtilizationPage() {
  const t = useTranslations("utilization")
  const [data, setData] = useState<UtilizationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(30)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/analytics/utilization?period=${period}`)
      if (res.ok) {
        setData(await res.json())
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const periods = [
    { label: t("days7"), value: 7 },
    { label: t("days30"), value: 30 },
    { label: t("days90"), value: 90 },
  ]

  // Top 10 by utilization for chart (highest first)
  const chartData = data
    ? [...data.tools]
        .sort((a, b) => b.utilizationRate - a.utilizationRate)
        .slice(0, 10)
        .map((t) => ({
          name: t.name.length > 20 ? t.name.slice(0, 18) + "…" : t.name,
          auslastung: t.utilizationRate,
        }))
    : []

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("description")}
          </p>
        </div>

        {/* Period selector */}
        <div className="flex gap-1 rounded-lg border p-1">
          {periods.map((p) => (
            <Button
              key={p.value}
              variant={period === p.value ? "default" : "ghost"}
              size="sm"
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center py-20">
          <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : !data || data.tools.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20">
            <IconTool className="mb-4 size-12 text-muted-foreground/40" />
            <p className="text-lg font-medium text-muted-foreground">
              {t("noToolData")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("noToolDataDesc")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("avgUtilization")}
                </CardTitle>
                <IconChartBar className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.summary.avgUtilization}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("avgUtilizationDesc")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("mostUsed")}
                </CardTitle>
                <IconTrendingUp className="size-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="truncate text-2xl font-bold">
                  {data.summary.mostUsed?.name ?? "—"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {data.summary.mostUsed
                    ? `${data.summary.mostUsed.utilization}% ${t("utilization")}`
                    : t("noData")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("leastUsed")}
                </CardTitle>
                <IconTrendingDown className="size-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="truncate text-2xl font-bold">
                  {data.summary.leastUsed?.name ?? "—"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {data.summary.leastUsed
                    ? `${data.summary.leastUsed.utilization}% ${t("utilization")}`
                    : t("noData")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("totalBookingHours")}
                </CardTitle>
                <IconClock className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.summary.totalBookingHours}h
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("totalBookingHoursDesc")}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Bar chart: top 10 */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {t("top10ByUtilization")}
                </CardTitle>
                <CardDescription>
                  {t("top10Desc", { period })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      layout="vertical"
                      margin={{ top: 0, right: 20, bottom: 0, left: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                      />
                      <XAxis type="number" domain={[0, 100]} unit="%" />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={160}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        formatter={(value) => [
                          `${value}%`,
                          t("utilization"),
                        ]}
                      />
                      <Bar dataKey="auslastung" radius={[0, 4, 4, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={getUtilizationColor(entry.auslastung)}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tip callout */}
          <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
            <IconInfoCircle className="mt-0.5 size-5 shrink-0 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {t("tip")}
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {t("tipText")}
              </p>
            </div>
          </div>

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("allTools")}
              </CardTitle>
              <CardDescription>
                {t("allToolsDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("tool")}</TableHead>
                      <TableHead>{t("articleNumber")}</TableHead>
                      <TableHead className="text-right">{t("bookings")}</TableHead>
                      <TableHead className="text-right">
                        {t("rentalHours")}
                      </TableHead>
                      <TableHead>{t("lastUsage")}</TableHead>
                      <TableHead className="text-right">
                        {t("utilization")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.tools.map((tool) => (
                      <TableRow key={tool.id}>
                        <TableCell className="font-medium">
                          {tool.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {tool.number ?? "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {tool.bookingCount}
                        </TableCell>
                        <TableCell className="text-right">
                          {tool.checkedOutHours}h
                        </TableCell>
                        <TableCell>
                          {formatDate(tool.lastBookingDate)}
                          {tool.daysSinceLastBooking !== null && (
                            <span className="ml-1 text-xs text-muted-foreground">
                              ({t("agoShort", { count: tool.daysSinceLastBooking ?? 0 })})
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="h-2 w-16 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${Math.min(tool.utilizationRate, 100)}%`,
                                  backgroundColor: getUtilizationColor(
                                    tool.utilizationRate
                                  ),
                                }}
                              />
                            </div>
                            {getUtilizationBadge(tool.utilizationRate)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
