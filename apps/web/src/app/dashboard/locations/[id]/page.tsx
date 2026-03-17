"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  IconArrowLeft,
  IconBuildingWarehouse,
  IconTruck,
  IconBuildingFactory,
  IconAmbulance,
  IconStethoscope,
  IconHeartbeat,
  IconUser,
  IconPackage,
  IconTool,
  IconKey,
  IconEdit,
  IconArrowRight,
  IconMinus,
  IconPlus,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

// ─── Type config ─────────────────────────────────────────────────────
const LOCATION_TYPES = {
  warehouse: {
    icon: IconBuildingWarehouse,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    badgeBg: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800",
  },
  vehicle: {
    icon: IconTruck,
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    badgeBg: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800",
  },
  site: {
    icon: IconBuildingFactory,
    color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    badgeBg: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800",
  },
  station: {
    icon: IconAmbulance,
    color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    badgeBg: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800",
  },
  practice: {
    icon: IconStethoscope,
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    badgeBg: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800",
  },
  operating_room: {
    icon: IconHeartbeat,
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    badgeBg: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800",
  },
  user: {
    icon: IconUser,
    color: "bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300",
    badgeBg: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-800",
  },
} as const

type LocationType = keyof typeof LOCATION_TYPES

const TYPE_I18N_MAP: Record<LocationType, string> = {
  warehouse: "warehouse",
  vehicle: "vehicle",
  site: "site",
  station: "station",
  practice: "practice",
  operating_room: "operatingRoom",
  user: "user",
}

// ─── Mock data ───────────────────────────────────────────────────────
interface LocationDetail {
  id: string
  name: string
  type: LocationType
  category: string | null
  address: string | null
  template: string | null
}

interface StockItem {
  id: string
  materialName: string
  materialNumber: string
  quantity: number
  unit: string
  minStock: number | null
  maxStock: number | null
  expiryDate: string | null
}

interface ToolItem {
  id: string
  name: string
  number: string
  group: string
  condition: string
  assignedTo: string | null
}

interface KeyItem {
  id: string
  name: string
  number: string
  address: string | null
  quantity: number
}

const MOCK_LOCATION: LocationDetail = {
  id: "1",
  name: "Hauptlager Zürich",
  type: "warehouse",
  category: "Zentral",
  address: "Bahnhofstrasse 10, 8001 Zürich",
  template: null,
}

const MOCK_STOCKS: StockItem[] = [
  { id: "s1", materialName: "Handschuhe Nitril M", materialNumber: "MAT-001", quantity: 450, unit: "Stk", minStock: 100, maxStock: 1000, expiryDate: "2026-08-15" },
  { id: "s2", materialName: "Desinfektionsmittel 500ml", materialNumber: "MAT-002", quantity: 28, unit: "Fl", minStock: 20, maxStock: 200, expiryDate: "2027-01-10" },
  { id: "s3", materialName: "Verbandsmaterial Set", materialNumber: "MAT-003", quantity: 85, unit: "Set", minStock: 30, maxStock: null, expiryDate: null },
  { id: "s4", materialName: "Schrauben M8x40", materialNumber: "MAT-004", quantity: 1200, unit: "Stk", minStock: 500, maxStock: 5000, expiryDate: null },
  { id: "s5", materialName: "Kabelkanal 2m", materialNumber: "MAT-005", quantity: 45, unit: "Stk", minStock: 10, maxStock: null, expiryDate: null },
]

const MOCK_TOOLS: ToolItem[] = [
  { id: "t1", name: "Bohrmaschine Hilti TE 6-A", number: "WZG-001", group: "Elektrowerkzeuge", condition: "good", assignedTo: null },
  { id: "t2", name: "Multimeter Fluke 117", number: "WZG-002", group: "Messinstrumente", condition: "good", assignedTo: "Max Mustermann" },
  { id: "t3", name: "Winkelschleifer 125mm", number: "WZG-003", group: "Elektrowerkzeuge", condition: "damaged", assignedTo: null },
]

const MOCK_KEYS: KeyItem[] = [
  { id: "k1", name: "Haupteingang Lager", number: "KEY-001", address: "Bahnhofstrasse 10", quantity: 3 },
  { id: "k2", name: "Serverraum", number: "KEY-002", address: "Bahnhofstrasse 10, UG", quantity: 1 },
]

// ─── Condition badge helper ──────────────────────────────────────────
function conditionBadge(condition: string) {
  const map: Record<string, { label: string; className: string }> = {
    good: { label: "Gut", className: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800" },
    damaged: { label: "Beschädigt", className: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-800" },
    repair: { label: "In Reparatur", className: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800" },
    decommissioned: { label: "Ausgemustert", className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800" },
  }
  const info = map[condition] ?? { label: condition, className: "" }
  return <Badge variant="outline" className={info.className}>{info.label}</Badge>
}

export default function LocationDetailPage() {
  const t = useTranslations("locations")
  const tCommon = useTranslations("common")
  const router = useRouter()
  const params = useParams()

  // In production, fetch location by params.id
  const location = MOCK_LOCATION
  const stocks = MOCK_STOCKS
  const tools = MOCK_TOOLS
  const keys = MOCK_KEYS

  const config = LOCATION_TYPES[location.type]
  const TypeIcon = config.icon

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      {/* Header */}
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit"
          onClick={() => router.push("/dashboard/locations")}
        >
          <IconArrowLeft className="size-4" />
          {tCommon("back")}
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`flex size-12 items-center justify-center rounded-xl ${config.color}`}>
              <TypeIcon className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{location.name}</h1>
                <Badge variant="outline" className={config.badgeBg}>
                  {t(`types.${TYPE_I18N_MAP[location.type]}`)}
                </Badge>
              </div>
              {location.category && (
                <p className="text-sm text-muted-foreground">{location.category}</p>
              )}
              {location.address && (
                <p className="mt-0.5 text-sm text-muted-foreground">{location.address}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <QuickBookingSheet t={t} tCommon={tCommon} locationName={location.name} />
            <Button variant="outline">
              <IconEdit className="size-4" />
              {tCommon("edit")}
            </Button>
          </div>
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid gap-4 px-4 sm:grid-cols-3 lg:px-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("materialCount")}</CardTitle>
            <IconPackage className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums">{stocks.length}</div>
            <p className="text-xs text-muted-foreground">
              {stocks.reduce((sum, s) => sum + s.quantity, 0)} Einheiten total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("toolCount")}</CardTitle>
            <IconTool className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums">{tools.length}</div>
            <p className="text-xs text-muted-foreground">
              {tools.filter((t) => t.condition === "good").length} in gutem Zustand
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("keyCount")}</CardTitle>
            <IconKey className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums">{keys.length}</div>
            <p className="text-xs text-muted-foreground">
              {keys.reduce((sum, k) => sum + k.quantity, 0)} Stück total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Stock / Tools / Keys */}
      <div className="px-4 lg:px-6">
        <Tabs defaultValue="stock" className="space-y-4">
          <TabsList>
            <TabsTrigger value="stock">
              <IconPackage className="size-4" />
              {t("currentStock")}
            </TabsTrigger>
            <TabsTrigger value="tools">
              <IconTool className="size-4" />
              Werkzeuge
            </TabsTrigger>
            <TabsTrigger value="keys">
              <IconKey className="size-4" />
              Schlüssel
            </TabsTrigger>
          </TabsList>

          {/* Stock Tab */}
          <TabsContent value="stock">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nummer</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead className="text-right">Bestand</TableHead>
                    <TableHead>Einheit</TableHead>
                    <TableHead className="text-right">Min</TableHead>
                    <TableHead className="text-right">Max</TableHead>
                    <TableHead>Ablaufdatum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stocks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        Keine Materialien an diesem Lagerort.
                      </TableCell>
                    </TableRow>
                  ) : (
                    stocks.map((stock) => {
                      const isLow = stock.minStock !== null && stock.quantity <= stock.minStock
                      return (
                        <TableRow key={stock.id}>
                          <TableCell className="font-mono text-sm text-muted-foreground">
                            {stock.materialNumber}
                          </TableCell>
                          <TableCell className="font-medium">{stock.materialName}</TableCell>
                          <TableCell className={`text-right tabular-nums font-semibold ${isLow ? "text-destructive" : ""}`}>
                            {stock.quantity}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{stock.unit}</TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {stock.minStock ?? "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {stock.maxStock ?? "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {stock.expiryDate ?? "—"}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Tools Tab */}
          <TabsContent value="tools">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nummer</TableHead>
                    <TableHead>Werkzeug</TableHead>
                    <TableHead>Gruppe</TableHead>
                    <TableHead>Zustand</TableHead>
                    <TableHead>Zugewiesen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tools.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        Keine Werkzeuge an diesem Lagerort.
                      </TableCell>
                    </TableRow>
                  ) : (
                    tools.map((tool) => (
                      <TableRow key={tool.id}>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {tool.number}
                        </TableCell>
                        <TableCell className="font-medium">{tool.name}</TableCell>
                        <TableCell className="text-muted-foreground">{tool.group}</TableCell>
                        <TableCell>{conditionBadge(tool.condition)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {tool.assignedTo ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Keys Tab */}
          <TabsContent value="keys">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nummer</TableHead>
                    <TableHead>Schlüssel</TableHead>
                    <TableHead>Adresse / Zuordnung</TableHead>
                    <TableHead className="text-right">Anzahl</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keys.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        Keine Schlüssel an diesem Lagerort.
                      </TableCell>
                    </TableRow>
                  ) : (
                    keys.map((key) => (
                      <TableRow key={key.id}>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {key.number}
                        </TableCell>
                        <TableCell className="font-medium">{key.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {key.address ?? "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">
                          {key.quantity}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// ─── Quick Booking Sheet ─────────────────────────────────────────────
function QuickBookingSheet({
  t,
  tCommon,
  locationName,
}: {
  t: ReturnType<typeof useTranslations<"locations">>
  tCommon: ReturnType<typeof useTranslations<"common">>
  locationName: string
}) {
  const [bookingType, setBookingType] = React.useState<string>("in")
  const [quantity, setQuantity] = React.useState<number>(1)
  const [open, setOpen] = React.useState(false)

  function handleSubmit() {
    // TODO: API call to create stock change
    setOpen(false)
    setQuantity(1)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          <IconArrowRight className="size-4" />
          {t("quickBooking")}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t("quickBooking")}</SheetTitle>
          <SheetDescription>
            Material ein- oder ausbuchen an: {locationName}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 p-4">
          {/* Booking type */}
          <div className="space-y-2">
            <Label>Buchungsart</Label>
            <Select value={bookingType} onValueChange={setBookingType}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in">
                  <IconPlus className="size-4 text-green-600" />
                  Einbuchen (Zugang)
                </SelectItem>
                <SelectItem value="out">
                  <IconMinus className="size-4 text-red-600" />
                  Ausbuchen (Abgang)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Material select placeholder */}
          <div className="space-y-2">
            <Label>Material</Label>
            <Select>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Material auswählen..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="s1">MAT-001 - Handschuhe Nitril M</SelectItem>
                <SelectItem value="s2">MAT-002 - Desinfektionsmittel 500ml</SelectItem>
                <SelectItem value="s3">MAT-003 - Verbandsmaterial Set</SelectItem>
                <SelectItem value="s4">MAT-004 - Schrauben M8x40</SelectItem>
                <SelectItem value="s5">MAT-005 - Kabelkanal 2m</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label>Menge</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <IconMinus className="size-4" />
              </Button>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="text-center tabular-nums"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(quantity + 1)}
              >
                <IconPlus className="size-4" />
              </Button>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notiz (optional)</Label>
            <Input placeholder="z.B. Lieferung vom 17.03.2026" />
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {tCommon("cancel")}
          </Button>
          <Button onClick={handleSubmit}>
            {bookingType === "in" ? (
              <>
                <IconPlus className="size-4" />
                Einbuchen
              </>
            ) : (
              <>
                <IconMinus className="size-4" />
                Ausbuchen
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
