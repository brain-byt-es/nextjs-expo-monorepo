// ---------------------------------------------------------------------------
// UHF RFID Reader Integration
// ---------------------------------------------------------------------------
// Unterstützt:
// 1. Keyboard-Wedge-Modus (USB/Bluetooth HID) — z.B. Zebra MC3300
//    → Nutzt den bestehenden useBarcodeScanner-Hook, da RFID-Guns im HID-Modus
//      den EPC-Code einfach als Tastatureingabe "tippen".
// 2. Netzwerk-Reader (WebSocket) — z.B. Impinj Speedway, Zebra FX7500
//    → Verbindung über WebSocket zu einem lokalen Reader-Agent/Gateway.
// 3. LLRP-Protokoll — Low Level Reader Protocol (Industrie-Standard)
//    → Wird über einen lokalen Middleware-Agent abgewickelt, der LLRP in
//      WebSocket-Events übersetzt.
// ---------------------------------------------------------------------------

export interface RfidTag {
  /** Electronic Product Code — hex string, z.B. "E2003412012345670000ABCD" */
  epc: string
  /** Received Signal Strength Indicator in dBm */
  rssi: number
  /** ISO 8601 timestamp */
  timestamp: string
  /** Antennen-Port des Readers (bei Fixed Readern) */
  antennaPort?: number
}

export interface RfidReaderConfig {
  /** Verbindungstyp */
  type: "keyboard_wedge" | "network"
  /** Hostname / IP für Netzwerk-Reader */
  host?: string
  /** Port für Netzwerk-Reader (Standard: 8080) */
  port?: number
}

// ---------------------------------------------------------------------------
// EPC-96 Parser
// ---------------------------------------------------------------------------
// Das EPC-96 Format (12 Bytes / 24 Hex-Zeichen) ist der häufigste UHF-Tag-
// Standard. Die ersten 8 Bits = Header, die nächsten Bits enthalten Typ und
// Seriennummer je nach Partition.
//
// Vereinfachte Extraktion: Header → Typ, restliche Bytes → Seriennummer.
// ---------------------------------------------------------------------------

export interface ParsedEPC {
  /** EPC-Typ basierend auf Header (z.B. "SGTIN-96", "SSCC-96", "Unbekannt") */
  type: string
  /** Seriennummer (Hex) */
  serialNumber: string
  /** Rohes EPC als Hex */
  raw: string
}

const EPC_HEADER_MAP: Record<string, string> = {
  "30": "SGTIN-96",
  "31": "SSCC-96",
  "32": "SGLN-96",
  "33": "GRAI-96",
  "34": "GIAI-96",
  "35": "GID-96",
  "36": "GSRN-96",
  "37": "GDTI-96",
}

export function parseEPC(epc: string): ParsedEPC {
  const cleaned = epc.replace(/[\s-]/g, "").toUpperCase()

  if (cleaned.length < 4) {
    return { type: "Unbekannt", serialNumber: cleaned, raw: cleaned }
  }

  const headerByte = cleaned.substring(0, 2)
  const type = EPC_HEADER_MAP[headerByte] ?? "Unbekannt"

  // Letzten 8 Hex-Zeichen als Seriennummer (32-Bit Serial)
  const serialNumber =
    cleaned.length >= 8
      ? cleaned.substring(cleaned.length - 8)
      : cleaned.substring(2)

  return { type, serialNumber, raw: cleaned }
}

// ---------------------------------------------------------------------------
// EPC Validierung
// ---------------------------------------------------------------------------

export function isValidEPC(epc: string): boolean {
  const cleaned = epc.replace(/[\s-]/g, "")
  // EPC-96 = 24 hex chars, EPC-128 = 32 hex chars
  return /^[0-9A-Fa-f]{16,32}$/.test(cleaned)
}

// ---------------------------------------------------------------------------
// Tag-Read Event System (für Keyboard-Wedge UND Netzwerk)
// ---------------------------------------------------------------------------

type TagReadCallback = (tag: RfidTag) => void

const tagReadListeners = new Set<TagReadCallback>()

/** Subscribe to RFID tag read events */
export function onTagRead(callback: TagReadCallback): () => void {
  tagReadListeners.add(callback)
  return () => {
    tagReadListeners.delete(callback)
  }
}

/** Dispatch a tag read event to all listeners */
export function dispatchTagRead(tag: RfidTag): void {
  // Also dispatch a DOM event so UI components can react
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("rfid-tag-read", { detail: tag })
    )
  }
  tagReadListeners.forEach((cb) => {
    try {
      cb(tag)
    } catch {
      // listener error — ignore
    }
  })
}

/**
 * Convert a keyboard-wedge scan into an RFID tag read event.
 * Call this from the barcode scanner callback when the scanned value
 * looks like an EPC (hex string, 16-32 chars).
 */
export function handleKeyboardWedgeRfid(scannedValue: string): RfidTag | null {
  if (!isValidEPC(scannedValue)) return null

  const tag: RfidTag = {
    epc: scannedValue.replace(/[\s-]/g, "").toUpperCase(),
    rssi: 0, // nicht verfügbar im Keyboard-Wedge-Modus
    timestamp: new Date().toISOString(),
  }

  dispatchTagRead(tag)
  return tag
}

// ---------------------------------------------------------------------------
// Network Reader (WebSocket)
// ---------------------------------------------------------------------------

export interface NetworkReaderConnection {
  ws: WebSocket
  disconnect: () => void
  isConnected: () => boolean
}

/**
 * Connect to a network RFID reader via WebSocket.
 *
 * Der Reader (oder ein lokaler Agent/Gateway) muss auf dem angegebenen
 * Host/Port einen WebSocket-Endpunkt bereitstellen, der JSON-Objekte
 * mit { epc, rssi, antennaPort } sendet.
 */
export function connectNetworkReader(
  host: string,
  port: number
): NetworkReaderConnection {
  const url = `ws://${host}:${port}`
  const ws = new WebSocket(url)

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)

      // Unterstützt sowohl einzelne Tags als auch Arrays
      const tags: Array<{ epc?: string; rssi?: number; antennaPort?: number }> =
        Array.isArray(data) ? data : [data]

      for (const raw of tags) {
        if (!raw.epc) continue

        const tag: RfidTag = {
          epc: raw.epc.replace(/[\s-]/g, "").toUpperCase(),
          rssi: raw.rssi ?? 0,
          timestamp: new Date().toISOString(),
          antennaPort: raw.antennaPort,
        }

        dispatchTagRead(tag)
      }
    } catch {
      // malformed message — ignore
    }
  }

  ws.onerror = () => {
    // Connection errors are surfaced via onclose / readyState
  }

  return {
    ws,
    disconnect: () => {
      ws.close()
    },
    isConnected: () => ws.readyState === WebSocket.OPEN,
  }
}

// ---------------------------------------------------------------------------
// RFID Config Persistence (localStorage)
// ---------------------------------------------------------------------------

const RFID_CONFIG_KEY = "rfid_reader_config"

export function loadRfidConfig(): RfidReaderConfig {
  if (typeof window === "undefined") {
    return { type: "keyboard_wedge" }
  }
  try {
    const raw = localStorage.getItem(RFID_CONFIG_KEY)
    if (raw) return JSON.parse(raw) as RfidReaderConfig
  } catch {
    // corrupted — return default
  }
  return { type: "keyboard_wedge" }
}

export function saveRfidConfig(config: RfidReaderConfig): void {
  try {
    localStorage.setItem(RFID_CONFIG_KEY, JSON.stringify(config))
  } catch {
    // storage full — ignore
  }
}

// ---------------------------------------------------------------------------
// Tag-EPC to Asset Mapping (localStorage)
// ---------------------------------------------------------------------------

export interface TagMapping {
  epc: string
  assetType: "material" | "tool" | "location"
  assetId: string
  assetName: string
  mappedAt: string
}

const TAG_MAPPING_KEY = "rfid_tag_mappings"

export function loadTagMappings(): TagMapping[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(TAG_MAPPING_KEY)
    if (raw) return JSON.parse(raw) as TagMapping[]
  } catch {
    // corrupted
  }
  return []
}

export function saveTagMapping(mapping: TagMapping): void {
  const existing = loadTagMappings()
  const idx = existing.findIndex((m) => m.epc === mapping.epc)
  if (idx >= 0) {
    existing[idx] = mapping
  } else {
    existing.push(mapping)
  }
  try {
    localStorage.setItem(TAG_MAPPING_KEY, JSON.stringify(existing))
  } catch {
    // storage full
  }
}

export function removeTagMapping(epc: string): void {
  const existing = loadTagMappings().filter((m) => m.epc !== epc)
  try {
    localStorage.setItem(TAG_MAPPING_KEY, JSON.stringify(existing))
  } catch {
    // ignore
  }
}
