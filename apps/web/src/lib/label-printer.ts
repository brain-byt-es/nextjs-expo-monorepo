// ---------------------------------------------------------------------------
// Label Printer Integration — Zebra (ZPL) + Brother (ESC/P)
// ---------------------------------------------------------------------------

// Minimal WebUSB type declarations for USB label printing
interface WebUSBEndpoint {
  endpointNumber: number;
  direction: "in" | "out";
}

interface WebUSBAlternateInterface {
  endpoints: WebUSBEndpoint[];
}

interface WebUSBInterface {
  interfaceNumber: number;
  alternate: WebUSBAlternateInterface;
}

interface WebUSBConfiguration {
  interfaces: WebUSBInterface[];
}

interface WebUSBDevice {
  open(): Promise<void>;
  close(): Promise<void>;
  selectConfiguration(configurationValue: number): Promise<void>;
  claimInterface(interfaceNumber: number): Promise<void>;
  transferOut(endpointNumber: number, data: BufferSource): Promise<void>;
  configuration: WebUSBConfiguration | null;
}

interface WebUSB {
  requestDevice(options: { filters: { vendorId: number }[] }): Promise<WebUSBDevice>;
}

interface NavigatorWithUSB extends Navigator {
  usb: WebUSB;
}

export interface LabelData {
  type: "material" | "tool" | "location" | "barcode";
  name: string;
  number: string;
  barcode?: string;
  orgName?: string;
  date?: string;
}

export type PrinterType = "zebra" | "brother" | "generic";
export type ConnectionType = "usb" | "network" | "bluetooth";
export type LabelSize = "50x25" | "100x50" | "100x150";

export interface PrinterSettings {
  printerType: PrinterType;
  connection: ConnectionType;
  networkIp?: string;
  networkPort?: number;
  labelSize: LabelSize;
}

// ---------------------------------------------------------------------------
// Label size dimensions (in dots at 203 DPI)
// ---------------------------------------------------------------------------
const LABEL_DIMENSIONS: Record<LabelSize, { width: number; height: number }> = {
  "50x25": { width: 400, height: 200 },
  "100x50": { width: 800, height: 400 },
  "100x150": { width: 800, height: 1200 },
};

// ---------------------------------------------------------------------------
// ZPL Generation (Zebra printers)
// ---------------------------------------------------------------------------

/**
 * Generates ZPL code for Zebra label printers.
 */
export function generateZPL(data: LabelData, labelSize: LabelSize = "100x50"): string {
  const dim = LABEL_DIMENSIONS[labelSize];
  const barcodeValue = data.barcode || data.number;
  const dateStr = data.date || new Date().toLocaleDateString("de-CH");

  const lines: string[] = [
    "^XA", // Start format
    `^PW${dim.width}`, // Print width
    `^LL${dim.height}`, // Label length
    "^CF0,24", // Default font
  ];

  switch (data.type) {
    case "material":
      lines.push(
        // Org name (top-left, small)
        data.orgName ? `^FO20,15^A0N,18,18^FD${escapeZPL(data.orgName)}^FS` : "",
        // Material name (large)
        `^FO20,40^A0N,32,32^FD${escapeZPL(data.name)}^FS`,
        // Material number
        `^FO20,80^A0N,22,22^FDNr: ${escapeZPL(data.number)}^FS`,
        // Date
        `^FO20,110^A0N,18,18^FD${escapeZPL(dateStr)}^FS`,
        // Barcode (Code128)
        `^FO20,145^BCN,60,Y,N,N^FD${escapeZPL(barcodeValue)}^FS`
      );
      break;

    case "tool":
      lines.push(
        data.orgName ? `^FO20,15^A0N,18,18^FD${escapeZPL(data.orgName)}^FS` : "",
        `^FO20,40^A0N,28,28^FDWerkzeug: ${escapeZPL(data.name)}^FS`,
        `^FO20,75^A0N,22,22^FDNr: ${escapeZPL(data.number)}^FS`,
        `^FO20,105^A0N,18,18^FD${escapeZPL(dateStr)}^FS`,
        `^FO20,135^BCN,60,Y,N,N^FD${escapeZPL(barcodeValue)}^FS`
      );
      break;

    case "location":
      lines.push(
        data.orgName ? `^FO20,15^A0N,18,18^FD${escapeZPL(data.orgName)}^FS` : "",
        `^FO20,40^A0N,32,32^FDStandort^FS`,
        `^FO20,80^A0N,28,28^FD${escapeZPL(data.name)}^FS`,
        `^FO20,115^A0N,22,22^FD${escapeZPL(data.number)}^FS`,
        `^FO20,150^BCN,60,Y,N,N^FD${escapeZPL(barcodeValue)}^FS`
      );
      break;

    case "barcode":
    default:
      // Simple barcode-only label
      lines.push(
        `^FO20,20^A0N,28,28^FD${escapeZPL(data.name)}^FS`,
        `^FO20,55^A0N,20,20^FD${escapeZPL(data.number)}^FS`,
        `^FO20,90^BCN,80,Y,N,N^FD${escapeZPL(barcodeValue)}^FS`
      );
      break;
  }

  lines.push(
    "^XZ" // End format
  );

  return lines.filter(Boolean).join("\n");
}

function escapeZPL(text: string): string {
  // ZPL special characters that need escaping
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\^/g, "\\^")
    .replace(/~/g, "\\~");
}

// ---------------------------------------------------------------------------
// Brother ESC/P Label Generation
// ---------------------------------------------------------------------------

/**
 * Generates ESC/P commands for Brother QL label printers.
 */
export function generateBrotherLabel(data: LabelData, labelSize: LabelSize = "100x50"): string {
  const barcodeValue = data.barcode || data.number;
  const dateStr = data.date || new Date().toLocaleDateString("de-CH");

  // ESC/P command sequences (as readable hex/ascii representation)
  const commands: string[] = [
    "\x1B@", // Initialize printer
    "\x1B\x69\x61\x01", // Switch to raster mode
  ];

  // Set print info based on label size
  switch (labelSize) {
    case "50x25":
      commands.push("\x1B\x69\x7A\x02\x04\x00\x00\xE0\x00\x00\x00\x00\x00");
      break;
    case "100x50":
      commands.push("\x1B\x69\x7A\x0A\x04\x00\x00\xC0\x01\x00\x00\x00\x00");
      break;
    case "100x150":
      commands.push("\x1B\x69\x7A\x0A\x0C\x00\x00\x40\x05\x00\x00\x00\x00");
      break;
  }

  // Build text content — Brother QL uses simplified ESC/P
  const textBlock: string[] = [];

  if (data.orgName) {
    textBlock.push(data.orgName);
  }

  switch (data.type) {
    case "material":
      textBlock.push(`Material: ${data.name}`, `Nr: ${data.number}`, dateStr);
      break;
    case "tool":
      textBlock.push(`Werkzeug: ${data.name}`, `Nr: ${data.number}`, dateStr);
      break;
    case "location":
      textBlock.push(`Standort: ${data.name}`, data.number);
      break;
    case "barcode":
    default:
      textBlock.push(data.name, data.number);
      break;
  }

  // Add barcode command (Code128)
  commands.push(
    "\x1B\x69\x74\x31", // Select barcode type: Code128
    `\x1B\x69\x42${barcodeValue}\x5C`, // Print barcode data
  );

  // Add text lines
  for (const line of textBlock) {
    commands.push(`${line}\n`);
  }

  // Print and feed
  commands.push("\x0C"); // Form feed / print

  return commands.join("");
}

// ---------------------------------------------------------------------------
// Printing methods
// ---------------------------------------------------------------------------

/**
 * Print via WebUSB API (Chrome only).
 * Sends raw ZPL/ESC data to a USB-connected label printer.
 */
export async function printViaUSB(data: string): Promise<void> {
  if (!("usb" in navigator)) {
    throw new Error(
      "WebUSB wird von diesem Browser nicht unterstützt. Bitte verwenden Sie Google Chrome."
    );
  }

  try {
    const usb = (navigator as NavigatorWithUSB).usb;
    const device = await usb.requestDevice({
      filters: [
        // Zebra printers
        { vendorId: 0x0a5f },
        // Brother printers
        { vendorId: 0x04f9 },
        // Dymo printers
        { vendorId: 0x0922 },
      ],
    });

    await device.open();

    // Select the first configuration and claim the first interface
    if (device.configuration === null) {
      await device.selectConfiguration(1);
    }

    const iface = device.configuration!.interfaces[0];
    await device.claimInterface(iface.interfaceNumber);

    // Find the OUT endpoint
    const outEndpoint = iface.alternate.endpoints.find(
      (ep: WebUSBEndpoint) => ep.direction === "out"
    );

    if (!outEndpoint) {
      throw new Error("Kein Ausgabe-Endpunkt am Drucker gefunden.");
    }

    // Send the data
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    await device.transferOut(outEndpoint.endpointNumber, dataBuffer);

    await device.close();
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "NotFoundError") {
      throw new Error("Kein Drucker ausgewählt. Bitte verbinden Sie einen USB-Drucker.");
    }
    throw new Error(`USB-Druckfehler: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Print via Bluetooth (placeholder — requires Web Bluetooth or native bridge).
 */
export async function printViaBluetooth(data: string): Promise<void> {
  if (!("bluetooth" in navigator)) {
    throw new Error(
      "Web Bluetooth wird von diesem Browser nicht unterstützt. Bitte verwenden Sie Google Chrome."
    );
  }

  try {
    const device = await navigator.bluetooth.requestDevice({
      filters: [
        { services: ["000018f0-0000-1000-8000-00805f9b34fb"] }, // Zebra BT printer service
      ],
      optionalServices: [
        "000018f0-0000-1000-8000-00805f9b34fb",
        "e7810a71-73ae-499d-8c15-faa9aef0c3f2", // Generic serial
      ],
    });

    const server = await device.gatt!.connect();

    // Try Zebra-specific service first, then generic serial
    let characteristic: BluetoothRemoteGATTCharacteristic | null = null;

    for (const serviceUUID of [
      "000018f0-0000-1000-8000-00805f9b34fb",
      "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
    ]) {
      try {
        const service = await server.getPrimaryService(serviceUUID);
        const chars = await service.getCharacteristics();
        characteristic = chars.find((c) => c.properties.write || c.properties.writeWithoutResponse) ?? null;
        if (characteristic) break;
      } catch {
        continue;
      }
    }

    if (!characteristic) {
      throw new Error("Keine beschreibbare Bluetooth-Eigenschaft gefunden.");
    }

    // Send data in chunks (BLE has a 512 byte MTU limit)
    const encoder = new TextEncoder();
    const encoded = encoder.encode(data);
    const chunkSize = 512;

    for (let i = 0; i < encoded.length; i += chunkSize) {
      const chunk = encoded.slice(i, i + chunkSize);
      if (characteristic.properties.writeWithoutResponse) {
        await characteristic.writeValueWithoutResponse(chunk);
      } else {
        await characteristic.writeValueWithResponse(chunk);
      }
    }

    server.disconnect();
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "NotFoundError") {
      throw new Error("Kein Bluetooth-Drucker ausgewählt.");
    }
    throw new Error(`Bluetooth-Druckfehler: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Print via network (TCP on port 9100) — requires server-side proxy.
 * On the client, this sends the data to a Next.js API route that forwards
 * to the printer's IP address.
 */
export async function printViaNetwork(
  data: string,
  ip: string,
  port: number = 9100
): Promise<void> {
  const response = await fetch("/api/print", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data, ip, port }),
  });

  if (!response.ok) {
    const error = await response.text().catch(() => "Unbekannter Fehler");
    throw new Error(`Netzwerk-Druckfehler: ${error}`);
  }
}

// ---------------------------------------------------------------------------
// High-level print function
// ---------------------------------------------------------------------------

/**
 * Print a label using the configured printer settings.
 */
export async function printLabel(
  labelData: LabelData,
  settings: PrinterSettings
): Promise<void> {
  // Generate the label data
  let printData: string;
  if (settings.printerType === "brother") {
    printData = generateBrotherLabel(labelData, settings.labelSize);
  } else {
    // Zebra and generic both use ZPL
    printData = generateZPL(labelData, settings.labelSize);
  }

  // Send to printer
  switch (settings.connection) {
    case "usb":
      await printViaUSB(printData);
      break;
    case "bluetooth":
      await printViaBluetooth(printData);
      break;
    case "network":
      if (!settings.networkIp) {
        throw new Error("Keine Netzwerkadresse konfiguriert.");
      }
      await printViaNetwork(printData, settings.networkIp, settings.networkPort);
      break;
  }
}

// ---------------------------------------------------------------------------
// Settings persistence (localStorage)
// ---------------------------------------------------------------------------
const PRINTER_SETTINGS_KEY = "logistikapp_printer_settings";

export function loadPrinterSettings(): PrinterSettings {
  if (typeof window === "undefined") {
    return {
      printerType: "zebra",
      connection: "usb",
      labelSize: "100x50",
    };
  }
  try {
    const raw = localStorage.getItem(PRINTER_SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {
    printerType: "zebra",
    connection: "usb",
    labelSize: "100x50",
  };
}

export function savePrinterSettings(settings: PrinterSettings): void {
  try {
    localStorage.setItem(PRINTER_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}
