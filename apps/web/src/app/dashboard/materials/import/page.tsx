"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  IconFileSpreadsheet,
  IconCheck,
  IconX,
  IconArrowLeft,
  IconDownload,
  IconSearch,
  IconLoader2,
  IconBarcode,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ParsedRow {
  raw: Record<string, string>
  mapped: {
    name?: string
    number?: string
    unit?: string
    barcode?: string
    manufacturer?: string
    manufacturerNumber?: string
    reorderLevel?: number
    notes?: string
  }
  valid: boolean
  error?: string
  eanLooking?: boolean   // EAN lookup in progress
  eanError?: string      // last EAN lookup error message
}

// Auto-mapping confidence level for UI feedback
type MappingConfidence = "auto" | "manual" | "skip"

// ---------------------------------------------------------------------------
// Column mapping config
// ---------------------------------------------------------------------------
const MATERIAL_FIELDS = [
  { key: "name",               label: "Name *",            required: true  },
  { key: "number",             label: "Artikelnummer",     required: false },
  { key: "unit",               label: "Einheit",           required: false },
  { key: "barcode",            label: "Barcode / EAN",     required: false },
  { key: "manufacturer",       label: "Hersteller",        required: false },
  { key: "manufacturerNumber", label: "Herstellernummer",  required: false },
  { key: "reorderLevel",       label: "Meldebestand",      required: false },
  { key: "notes",              label: "Notizen",           required: false },
  { key: "_skip",              label: "— Ignorieren —",    required: false },
] as const

type FieldKey = (typeof MATERIAL_FIELDS)[number]["key"]

// ---------------------------------------------------------------------------
// Auto-detect column → field mapping
// Returns { fieldKey, confidence } for a given CSV header string.
// ---------------------------------------------------------------------------
function detectField(header: string): { field: FieldKey; confidence: MappingConfidence } {
  const h = header.toLowerCase().replace(/[\s_\-]/g, "")

  if (h.includes("name") || h.includes("bezeichnung") || h.includes("beschreibung") || h.includes("artikel") && h.includes("bez"))
    return { field: "name", confidence: "auto" }
  if (h === "ean" || h === "ean13" || h === "ean8" || h.includes("strichcode") || h.includes("barcode") || h.includes("qrcode") || h.includes("code"))
    return { field: "barcode", confidence: "auto" }
  if (h.includes("einheit") || h === "unit" || h === "me" || h === "masseinheit")
    return { field: "unit", confidence: "auto" }
  if ((h.includes("artikel") && h.includes("nr")) || h.includes("artikelnummer") || h === "nr" || h === "number" || h.includes("artnr"))
    return { field: "number", confidence: "auto" }
  if (h.includes("melde") || h.includes("reorder") || h.includes("minbestand") || h.includes("mindestbestand"))
    return { field: "reorderLevel", confidence: "auto" }
  if (h.includes("herstellernummer") || h.includes("manufacturernumber") || h.includes("artnrhersteller") || h.includes("herstellerart"))
    return { field: "manufacturerNumber", confidence: "auto" }
  if (h.includes("hersteller") || h.includes("manufacturer") || h.includes("brand") || h.includes("marke"))
    return { field: "manufacturer", confidence: "auto" }
  if (h.includes("notiz") || h.includes("note") || h.includes("bemerk") || h.includes("komment") || h.includes("info"))
    return { field: "notes", confidence: "auto" }

  return { field: "_skip", confidence: "skip" }
}

// ---------------------------------------------------------------------------
// CSV Parser (no library — handles comma and semicolon delimiters)
// ---------------------------------------------------------------------------
function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter(Boolean)
  if (lines.length < 2) return { headers: [], rows: [] }

  // Detect delimiter from first line
  const firstLine = lines[0]!
  const delimiter = (firstLine.split(";").length >= firstLine.split(",").length) ? ";" : ","

  function parseRow(line: string): string[] {
    const result: string[] = []
    let current = ""
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]!
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
        else inQuotes = !inQuotes
      } else if (ch === delimiter && !inQuotes) {
        result.push(current.trim())
        current = ""
      } else {
        current += ch
      }
    }
    result.push(current.trim())
    return result
  }

  const headers = parseRow(firstLine)
  const rows = lines.slice(1).map((line) => {
    const values = parseRow(line)
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]))
  })
  return { headers, rows }
}

// ---------------------------------------------------------------------------
// Excel parser (dynamic import of read-excel-file to keep bundle lean)
// ---------------------------------------------------------------------------
async function parseExcel(file: File): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const readXlsxFile = ((await import("read-excel-file/browser")) as any).default as (
    input: File
  ) => Promise<(string | number | boolean | null)[][]>
  // readXlsxFile returns rows as arrays of cell values
  const rawRows: (string | number | boolean | null)[][] = await readXlsxFile(file)
  if (!rawRows || rawRows.length < 2) return { headers: [], rows: [] }

  const headers = rawRows[0]!.map((cell) => String(cell ?? "").trim())
  const dataRows = rawRows.slice(1).map((row) =>
    Object.fromEntries(headers.map((h, i) => [h, String(row[i] ?? "").trim()]))
  )
  return { headers, rows: dataRows }
}

// ---------------------------------------------------------------------------
// Template download
// ---------------------------------------------------------------------------
function downloadTemplate() {
  const headers = "Name;Nummer;Einheit;Barcode;Hersteller;Herstellernummer;Meldebestand;Notizen"
  const example  = "Kabelrohr 20mm grau;M-001;m;4006787123456;Hersteller AG;H-123;50;Lager A"
  const blob = new Blob(["\uFEFF" + headers + "\n" + example], {
    type: "text/csv;charset=utf-8;",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "materialien-vorlage.csv"
  a.click()
  URL.revokeObjectURL(url)
}

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------
const STEPS = [
  { key: "upload",  label: "Datei"    },
  { key: "map",     label: "Spalten"  },
  { key: "preview", label: "Vorschau" },
  { key: "done",    label: "Fertig"   },
] as const

type Step = (typeof STEPS)[number]["key"]

// ---------------------------------------------------------------------------
// Confidence badge component
// ---------------------------------------------------------------------------
function ConfidenceBadge({ confidence }: { confidence: MappingConfidence }) {
  if (confidence === "auto")
    return (
      <span title="Automatisch erkannt" className="ml-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 border border-green-500/20">
        auto
      </span>
    )
  if (confidence === "manual")
    return (
      <span title="Manuell zugeordnet" className="ml-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-600 border border-yellow-500/20">
        manuell
      </span>
    )
  return null
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default function MaterialImportPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [step, setStep]             = useState<Step>("upload")
  const [fileName, setFileName]     = useState("")
  const [headers, setHeaders]       = useState<string[]>([])
  const [rawRows, setRawRows]       = useState<Record<string, string>[]>([])
  const [mapping, setMapping]       = useState<Record<string, string>>({})
  const [confidence, setConfidence] = useState<Record<string, MappingConfidence>>({})
  const [parsed, setParsed]         = useState<ParsedRow[]>([])
  const [importing, setImporting]   = useState(false)
  const [results, setResults]       = useState<{ imported: number; failed: number; errors: string[] }>({
    imported: 0, failed: 0, errors: [],
  })
  const [eanLookingAll, setEanLookingAll] = useState(false)

  // ---------------------------------------------------------------------------
  // Step 1: Handle file
  // ---------------------------------------------------------------------------
  async function handleFile(file: File) {
    setFileName(file.name)
    const ext = file.name.split(".").pop()?.toLowerCase()

    let parsedFile: { headers: string[]; rows: Record<string, string>[] }

    if (ext === "xlsx" || ext === "xls") {
      try {
        parsedFile = await parseExcel(file)
      } catch {
        alert("Excel-Datei konnte nicht gelesen werden. Bitte als CSV exportieren.")
        return
      }
    } else {
      // CSV / TXT
      const text = await file.text()
      parsedFile = parseCsv(text)
    }

    const { headers: h, rows } = parsedFile
    if (h.length === 0) {
      alert("Die Datei enthält keine erkennbaren Spalten.")
      return
    }

    setHeaders(h)
    setRawRows(rows)

    const autoMap: Record<string, string>             = {}
    const autoConfidence: Record<string, MappingConfidence> = {}

    h.forEach((col) => {
      const { field, confidence: conf } = detectField(col)
      autoMap[col]        = field
      autoConfidence[col] = conf
    })

    setMapping(autoMap)
    setConfidence(autoConfidence)
    setStep("map")
  }

  // ---------------------------------------------------------------------------
  // Step 2: Apply mapping and validate
  // ---------------------------------------------------------------------------
  function applyMapping() {
    const rows: ParsedRow[] = rawRows.map((raw) => {
      const mapped: ParsedRow["mapped"] = {}
      Object.entries(mapping).forEach(([csvHeader, fieldKey]) => {
        if (fieldKey === "_skip") return
        const val = raw[csvHeader]?.trim()
        if (!val) return
        if (fieldKey === "reorderLevel") {
          const n = Number(val.replace(",", "."))
          if (!isNaN(n)) mapped.reorderLevel = Math.round(n)
        } else {
          ;(mapped as Record<string, string>)[fieldKey] = val
        }
      })
      const valid = !!mapped.name
      return {
        raw,
        mapped,
        valid,
        error: valid ? undefined : "Name ist Pflichtfeld",
      }
    })
    setParsed(rows)
    setStep("preview")
  }

  // ---------------------------------------------------------------------------
  // EAN lookup — single row
  // ---------------------------------------------------------------------------
  const lookupEan = useCallback(async (rowIndex: number) => {
    const row = parsed[rowIndex]
    if (!row?.mapped.barcode) return

    setParsed((prev) =>
      prev.map((r, i) => (i === rowIndex ? { ...r, eanLooking: true, eanError: undefined } : r))
    )

    try {
      const res = await fetch(`/api/ean-lookup?code=${encodeURIComponent(row.mapped.barcode)}`)
      if (res.ok) {
        const data = await res.json()
        setParsed((prev) =>
          prev.map((r, i) => {
            if (i !== rowIndex) return r
            return {
              ...r,
              eanLooking: false,
              mapped: {
                ...r.mapped,
                name:         r.mapped.name         || data.name         || r.mapped.name,
                manufacturer: r.mapped.manufacturer  || data.manufacturer || r.mapped.manufacturer,
              },
              valid: !!(r.mapped.name || data.name),
            }
          })
        )
      } else {
        const err = await res.json()
        setParsed((prev) =>
          prev.map((r, i) =>
            i === rowIndex ? { ...r, eanLooking: false, eanError: err.error ?? "Nicht gefunden" } : r
          )
        )
      }
    } catch {
      setParsed((prev) =>
        prev.map((r, i) =>
          i === rowIndex ? { ...r, eanLooking: false, eanError: "Netzwerkfehler" } : r
        )
      )
    }
  }, [parsed])

  // ---------------------------------------------------------------------------
  // EAN lookup — all rows that have a barcode but no name (rate-limited 1/sec)
  // ---------------------------------------------------------------------------
  const lookupAllEans = useCallback(async () => {
    setEanLookingAll(true)
    const indices = parsed
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => r.mapped.barcode && !r.mapped.name)
      .map(({ i }) => i)

    for (const idx of indices) {
      await lookupEan(idx)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
    setEanLookingAll(false)
  }, [parsed, lookupEan])

  // ---------------------------------------------------------------------------
  // Step 3: Bulk import
  // ---------------------------------------------------------------------------
  async function handleImport() {
    setImporting(true)

    const validRows = parsed
      .filter((r) => r.valid)
      .map((r) => ({
        name:               r.mapped.name!,
        number:             r.mapped.number,
        unit:               r.mapped.unit,
        barcode:            r.mapped.barcode,
        manufacturer:       r.mapped.manufacturer,
        manufacturerNumber: r.mapped.manufacturerNumber,
        reorderLevel:       r.mapped.reorderLevel,
        notes:              r.mapped.notes,
      }))

    try {
      const res = await fetch("/api/materials/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: validRows }),
      })

      if (res.ok) {
        const data = await res.json()
        setResults({ imported: data.imported, failed: data.failed, errors: data.errors ?? [] })
      } else {
        const err = await res.json()
        setResults({ imported: 0, failed: validRows.length, errors: [err.error ?? "Unbekannter Fehler"] })
      }
    } catch {
      setResults({ imported: 0, failed: validRows.length, errors: ["Netzwerkfehler"] })
    }

    setImporting(false)
    setStep("done")
  }

  const validCount   = parsed.filter((r) => r.valid).length
  const invalidCount = parsed.filter((r) => !r.valid).length
  // Rows with barcode but no name — candidates for EAN lookup
  const eanCandidates = parsed.filter((r) => r.mapped.barcode && !r.mapped.name).length

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl">

      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/materials">
          <Button variant="ghost" size="icon" className="size-8">
            <IconArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">
            Materialien
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Import
            {fileName && (
              <span className="ml-2 text-sm font-mono text-muted-foreground font-normal">
                {fileName}
              </span>
            )}
          </h1>
        </div>

        {/* Step indicator */}
        <div className="ml-auto flex items-center gap-3">
          {STEPS.map((s, i) => {
            const isDone = STEPS.findIndex((x) => x.key === step) > i
            return (
              <div
                key={s.key}
                className={`flex items-center gap-1.5 text-xs font-mono ${
                  step === s.key ? "text-primary" : isDone ? "text-secondary" : "text-muted-foreground"
                }`}
              >
                <div
                  className={`size-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                    step === s.key
                      ? "border-primary bg-primary/10 text-primary"
                      : isDone
                        ? "border-secondary bg-secondary/10 text-secondary"
                        : "border-border"
                  }`}
                >
                  {isDone ? <IconCheck className="size-3" /> : i + 1}
                </div>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Step 1: Upload ── */}
      {step === "upload" && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div
              className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const f = e.dataTransfer.files[0]
                if (f) handleFile(f)
              }}
            >
              <IconFileSpreadsheet className="size-10 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm font-medium mb-1">
                Datei hierher ziehen oder klicken
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                .xlsx &middot; .xls &middot; .csv &middot; .txt &nbsp;&mdash;&nbsp;
                UTF-8, Komma- oder Semikolon-getrennt
              </p>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv,.txt"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFile(f)
                // reset so the same file can be re-selected
                e.target.value = ""
              }}
            />

            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={downloadTemplate}
              >
                <IconDownload className="size-3.5" />
                Vorlage herunterladen (.csv)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 2: Column Mapping ── */}
      {step === "map" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Spalten zuordnen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground font-mono">
              {rawRows.length} Zeilen erkannt &middot; {headers.length} Spalten
            </p>

            <div className="grid gap-3">
              {headers.map((h) => {
                const conf = confidence[h] ?? "manual"
                return (
                  <div key={h} className="flex items-center gap-3">
                    {/* Source column label */}
                    <div className="w-52 flex items-center text-sm font-mono truncate text-muted-foreground border border-border rounded px-2 py-1.5 bg-muted/30">
                      <span className="truncate">{h}</span>
                      <ConfidenceBadge confidence={conf} />
                    </div>

                    <span className="text-muted-foreground shrink-0">&rarr;</span>

                    {/* Target field select */}
                    <Select
                      value={mapping[h] ?? "_skip"}
                      onValueChange={(v) => {
                        setMapping((prev) => ({ ...prev, [h]: v }))
                        setConfidence((prev) => ({ ...prev, [h]: "manual" }))
                      }}
                    >
                      <SelectTrigger className="w-52">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MATERIAL_FIELDS.map((f) => (
                          <SelectItem key={f.key} value={f.key}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Preview of first value */}
                    {rawRows[0]?.[h] && (
                      <span className="text-xs text-muted-foreground font-mono truncate max-w-[10rem]">
                        z.B. {rawRows[0][h]}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={applyMapping}
                disabled={!Object.values(mapping).includes("name")}
              >
                Weiter zur Vorschau
              </Button>
              <Button variant="outline" onClick={() => setStep("upload")}>
                Zur&uuml;ck
              </Button>
            </div>

            {!Object.values(mapping).includes("name") && (
              <p className="text-xs text-destructive">
                Mindestens eine Spalte muss auf &laquo;Name *&raquo; gemappt werden.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Step 3: Preview ── */}
      {step === "preview" && (
        <div className="space-y-4">

          {/* Summary row */}
          <div className="flex flex-wrap items-center gap-3">
            <Badge
              variant="outline"
              className="text-secondary border-secondary/30 bg-secondary/10"
            >
              <IconCheck className="size-3 mr-1" />
              {validCount} g&uuml;ltig
            </Badge>
            {invalidCount > 0 && (
              <Badge
                variant="outline"
                className="text-destructive border-destructive/30 bg-destructive/10"
              >
                <IconX className="size-3 mr-1" />
                {invalidCount} Fehler (werden &uuml;bersprungen)
              </Badge>
            )}

            {/* EAN batch lookup */}
            {eanCandidates > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="ml-auto gap-1.5 text-xs"
                disabled={eanLookingAll}
                onClick={lookupAllEans}
              >
                {eanLookingAll ? (
                  <IconLoader2 className="size-3.5 animate-spin" />
                ) : (
                  <IconBarcode className="size-3.5" />
                )}
                Alle {eanCandidates} EANs nachschlagen
              </Button>
            )}
          </div>

          {/* Table */}
          <div className="rounded-lg border border-border overflow-auto max-h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8 sticky top-0 bg-background"></TableHead>
                  <TableHead className="sticky top-0 bg-background">Name</TableHead>
                  <TableHead className="sticky top-0 bg-background">Nummer</TableHead>
                  <TableHead className="sticky top-0 bg-background">Einheit</TableHead>
                  <TableHead className="sticky top-0 bg-background">Barcode</TableHead>
                  <TableHead className="sticky top-0 bg-background">Meldebestand</TableHead>
                  <TableHead className="sticky top-0 bg-background">Hersteller</TableHead>
                  <TableHead className="w-28 sticky top-0 bg-background"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsed.map((row, i) => {
                  const needsEan = row.mapped.barcode && !row.mapped.name
                  return (
                    <TableRow
                      key={i}
                      className={!row.valid ? "opacity-50" : ""}
                    >
                      <TableCell>
                        {row.valid ? (
                          <IconCheck className="size-3.5 text-secondary" />
                        ) : (
                          <span title={row.error}>
                            <IconX className="size-3.5 text-destructive" />
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {row.mapped.name || (
                          <span className="text-destructive text-xs">fehlt</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {row.mapped.number ?? "\u2014"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {row.mapped.unit ?? "\u2014"}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {row.mapped.barcode ?? "\u2014"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {row.mapped.reorderLevel ?? "\u2014"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {row.mapped.manufacturer ?? "\u2014"}
                      </TableCell>

                      {/* EAN lookup cell */}
                      <TableCell>
                        {needsEan && (
                          <div className="flex flex-col items-start gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-[10px] gap-1"
                              disabled={row.eanLooking || eanLookingAll}
                              onClick={() => lookupEan(i)}
                            >
                              {row.eanLooking ? (
                                <IconLoader2 className="size-3 animate-spin" />
                              ) : (
                                <IconSearch className="size-3" />
                              )}
                              EAN
                            </Button>
                            {row.eanError && (
                              <span className="text-[10px] text-destructive font-mono">
                                {row.eanError}
                              </span>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {parsed.length > 50 && (
            <p className="text-xs text-muted-foreground font-mono text-center">
              Alle {parsed.length} Zeilen werden importiert.
            </p>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleImport}
              disabled={importing || validCount === 0}
              className="gap-2"
            >
              {importing ? (
                <>
                  <IconLoader2 className="size-4 animate-spin" />
                  Importiert&hellip;
                </>
              ) : (
                `${validCount} Materialien importieren`
              )}
            </Button>
            <Button variant="outline" onClick={() => setStep("map")}>
              Zur&uuml;ck
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 4: Done ── */}
      {step === "done" && (
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <div className="size-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto">
              <IconCheck className="size-8 text-secondary" />
            </div>
            <div>
              <p className="text-xl font-bold">
                {results.imported} Materialien importiert
              </p>
              {results.failed > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  {results.failed} Fehler &mdash;{" "}
                  {results.errors.slice(0, 3).join(", ")}
                  {results.errors.length > 3 && " \u2026"}
                </p>
              )}
            </div>
            <div className="flex justify-center gap-2">
              <Button onClick={() => router.push("/dashboard/materials")}>
                Zur Materialliste
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setStep("upload")
                  setFileName("")
                  setHeaders([])
                  setRawRows([])
                  setMapping({})
                  setConfidence({})
                  setParsed([])
                  setResults({ imported: 0, failed: 0, errors: [] })
                }}
              >
                Weitere Datei importieren
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
