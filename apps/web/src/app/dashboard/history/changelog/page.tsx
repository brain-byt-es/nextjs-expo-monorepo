"use client"

import { useState, useMemo } from "react"
import { useTranslations } from "next-intl"
import {
  IconSearch,
  IconHistory,
  IconTool,
  IconPackage,
  IconMapPin,
  IconUser,
  IconKey,
  IconClipboardList,
  IconDownload,
  IconArrowRight,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

type EntityType = "tool" | "material" | "location" | "supplier" | "key" | "commission"

interface ChangelogEntry {
  id: string
  date: string
  entityType: EntityType
  entityName: string
  entityNumber: string
  field: string
  oldValue: string | null
  newValue: string
  changedBy: string
}

const MOCK: ChangelogEntry[] = [
  { id: "1", date: "2025-03-15 14:32", entityType: "tool", entityName: "Hilti TE 70-ATC", entityNumber: "WZ-001", field: "Zustand", oldValue: "Gut", newValue: "Reparatur nötig", changedBy: "Thomas Müller" },
  { id: "2", date: "2025-03-15 11:20", entityType: "material", entityName: "Kabelrohr 20mm grau", entityNumber: "M-001", field: "Meldebestand", oldValue: "50 m", newValue: "80 m", changedBy: "Anna Weber" },
  { id: "3", date: "2025-03-14 16:45", entityType: "location", entityName: "Baustelle Oerlikon", entityNumber: "LO-007", field: "Typ", oldValue: "Baustelle", newValue: "Baustelle (abgeschlossen)", changedBy: "Peter Keller" },
  { id: "4", date: "2025-03-13 09:15", entityType: "tool", entityName: "Bosch GBH 5-40 DE", entityNumber: "WZ-002", field: "Nächste Wartung", oldValue: "2025-06-01", newValue: "2025-04-15", changedBy: "Sandra Huber" },
  { id: "5", date: "2025-03-12 13:00", entityType: "material", entityName: "Verbindungsbox IP65", entityNumber: "M-002", field: "Haupt Lagerort", oldValue: "Lager B", newValue: "Lager A", changedBy: "Thomas Müller" },
  { id: "6", date: "2025-03-11 10:30", entityType: "key", entityName: "Fahrzeug VW Transporter ZH-123", entityNumber: "SCH-002", field: "Zugewiesen an", oldValue: "Anna Weber", newValue: "Thomas Müller", changedBy: "Peter Keller" },
  { id: "7", date: "2025-03-10 15:20", entityType: "commission", entityName: "K-2025-004 Zürich Nord", entityNumber: "K-2025-004", field: "Status", oldValue: "Offen", newValue: "In Bearbeitung", changedBy: "Thomas Müller" },
  { id: "8", date: "2025-03-09 08:45", entityType: "supplier", entityName: "Hilti AG", entityNumber: "LF-001", field: "Ansprechpartner", oldValue: "Hans Meier", newValue: "Lisa Bernhard", changedBy: "Anna Weber" },
]

const ENTITY_CFG: Record<EntityType, { icon: React.ComponentType<{ className?: string }>; label: string; color: string }> = {
  tool: { icon: IconTool, label: "Werkzeug", color: "text-blue-600 bg-blue-50" },
  material: { icon: IconPackage, label: "Material", color: "text-emerald-600 bg-emerald-50" },
  location: { icon: IconMapPin, label: "Lagerort", color: "text-purple-600 bg-purple-50" },
  supplier: { icon: IconUser, label: "Lieferant", color: "text-amber-600 bg-amber-50" },
  key: { icon: IconKey, label: "Schlüssel", color: "text-orange-600 bg-orange-50" },
  commission: { icon: IconClipboardList, label: "Kommission", color: "text-slate-600 bg-slate-100" },
}

export default function HistoryChangelogPage() {
  const t = useTranslations("history")
  const [search, setSearch] = useState("")
  const [entityFilter, setEntityFilter] = useState("all")
  const [loading] = useState(false)

  const filtered = useMemo(() => MOCK.filter(c => {
    const ms = !search || c.entityName.toLowerCase().includes(search.toLowerCase()) || c.field.toLowerCase().includes(search.toLowerCase()) || c.changedBy.toLowerCase().includes(search.toLowerCase())
    const me = entityFilter === "all" || c.entityType === entityFilter
    return ms && me
  }), [search, entityFilter])

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t("title")}</p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t("changelog")}</h1>
        </div>
        <Button variant="outline" className="gap-2 text-sm">
          <IconDownload className="size-4" /> Export CSV
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Artikel, Feld oder Benutzer…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Typen</SelectItem>
            <SelectItem value="tool">Werkzeug</SelectItem>
            <SelectItem value="material">Material</SelectItem>
            <SelectItem value="location">Lagerort</SelectItem>
            <SelectItem value="key">Schlüssel</SelectItem>
            <SelectItem value="commission">Kommission</SelectItem>
            <SelectItem value="supplier">Lieferant</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-slate-100">
                  <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider w-[150px]">{t("date")}</TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider w-[110px]">Typ</TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Artikel</TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider w-[130px]">{t("field")}</TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Änderung</TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider w-[130px]">{t("user")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(c => {
                  const cfg = ENTITY_CFG[c.entityType]
                  const Icon = cfg.icon
                  return (
                    <TableRow key={c.id} className="hover:bg-slate-50/80 border-b border-slate-50">
                      <TableCell className="text-xs font-mono text-muted-foreground">{c.date}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md ${cfg.color}`}>
                          <Icon className="size-3" />{cfg.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{c.entityName}</p>
                          <p className="text-xs text-muted-foreground font-mono">{c.entityNumber}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-slate-700">{c.field}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          {c.oldValue ? (
                            <>
                              <span className="text-muted-foreground line-through">{c.oldValue}</span>
                              <IconArrowRight className="size-3.5 text-muted-foreground/50 flex-shrink-0" />
                            </>
                          ) : (
                            <>
                              <span className="text-muted-foreground italic">—</span>
                              <IconArrowRight className="size-3.5 text-muted-foreground/50 flex-shrink-0" />
                            </>
                          )}
                          <span className="font-medium text-slate-800">{c.newValue}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-700">{c.changedBy}</TableCell>
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
