// ---------------------------------------------------------------------------
// Export utilities — CSV download + print-to-PDF via window.print()
// ---------------------------------------------------------------------------

export interface ExportColumn<T> {
  /** Column header label (German) */
  label: string
  /** Accessor: field key or function returning a cell value */
  accessor: keyof T | ((row: T) => string | number | null | undefined)
}

/**
 * Build a RFC-4180-compliant CSV string with a UTF-8 BOM so Excel opens it
 * correctly without import wizards.
 *
 * - Fields are double-quoted and inner quotes are escaped as "".
 * - Delimiter is semicolon (European Excel default).
 */
function buildCsv<T>(
  data: T[],
  columns: ExportColumn<T>[],
): string {
  const escape = (v: unknown): string => {
    const s = v == null ? "" : String(v)
    return `"${s.replace(/"/g, '""')}"`
  }

  const headerRow = columns.map((c) => escape(c.label)).join(";")

  const dataRows = data.map((row) =>
    columns
      .map((col) => {
        const val =
          typeof col.accessor === "function"
            ? col.accessor(row)
            : row[col.accessor]
        return escape(val)
      })
      .join(";"),
  )

  return "\uFEFF" + [headerRow, ...dataRows].join("\n")
}

/**
 * Trigger a CSV file download in the browser.
 *
 * @param data      Array of row objects
 * @param columns   Column definitions (label + accessor)
 * @param filename  Download filename, e.g. "bericht.csv"
 */
export function downloadCsv<T>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string,
): void {
  const csv = buildCsv(data, columns)
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename.endsWith(".csv") ? filename : `${filename}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}

/**
 * Open a new browser window with a styled HTML table and immediately trigger
 * window.print(). No PDF library required — the user's OS print dialog handles
 * save-as-PDF.
 *
 * @param title    Page title / heading shown above the table
 * @param data     Array of row objects
 * @param columns  Column definitions (label + accessor)
 */
export function printReport<T>(
  title: string,
  data: T[],
  columns: ExportColumn<T>[],
): void {
  const getCellValue = (row: T, col: ExportColumn<T>): string => {
    const val =
      typeof col.accessor === "function"
        ? col.accessor(row)
        : row[col.accessor]
    return val == null ? "" : String(val)
  }

  const headerCells = columns
    .map((c) => `<th>${escapeHtml(c.label)}</th>`)
    .join("")

  const bodyRows = data
    .map(
      (row) =>
        `<tr>${columns.map((col) => `<td>${escapeHtml(getCellValue(row, col))}</td>`).join("")}</tr>`,
    )
    .join("")

  const now = new Date().toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: A4 landscape; margin: 15mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
      font-size: 10px;
      color: #111;
      margin: 0;
      padding: 0;
    }
    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid #111;
    }
    h1 { font-size: 16px; margin: 0; }
    .report-date { font-size: 9px; color: #555; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9px;
    }
    thead th {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 5px 7px;
      text-align: left;
      font-weight: 600;
      white-space: nowrap;
    }
    tbody tr:nth-child(even) td { background: #f8fafc; }
    tbody td {
      border: 1px solid #e2e8f0;
      padding: 4px 7px;
      vertical-align: top;
    }
    .report-footer {
      margin-top: 10px;
      font-size: 8px;
      color: #888;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="report-header">
    <h1>${escapeHtml(title)}</h1>
    <span class="report-date">Erstellt am ${escapeHtml(now)}</span>
  </div>
  <table>
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
  <div class="report-footer">${escapeHtml(title)} &mdash; LogistikApp &mdash; ${escapeHtml(now)}</div>
  <script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`

  const printWindow = window.open("", "_blank", "width=1200,height=800")
  if (!printWindow) return
  printWindow.document.write(html)
  printWindow.document.close()
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
