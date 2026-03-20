export const TOOLTIPS = {
  // Materials
  materialMinStock: "Mindestbestand: Bei Unterschreitung wird eine Warnung angezeigt.",
  materialBarcode: "EAN/GTIN Barcode. Scannen Sie den Barcode des Produkts für automatische Erkennung.",
  materialUnit: "Mengeneinheit für dieses Material (z.B. Stk, m, kg, Liter).",

  // Tools
  toolStatus: "Aktueller Status: Verfügbar, Ausgeliehen, In Wartung oder Defekt.",
  toolCalibration: "Nächstes Kalibrierungsdatum. Überfällige Kalibrierungen werden rot markiert.",

  // Orders
  orderAutoReorder: "Automatische Nachbestellung wenn der Mindestbestand unterschritten wird.",

  // Time Tracking
  timeTrackingBillable: "Abrechenbare Stunden werden in der Monatsauswertung berücksichtigt.",
  timeTrackingRate: "Stundensatz in CHF für die Abrechnung.",

  // Delivery
  deliveryOverdue: "Lieferungen die das erwartete Lieferdatum überschritten haben.",
  deliveryCarrier: "Schweizer Spediteure: Post, DHL, DPD, Planzer, Camion Transport.",

  // Stock
  stockSafetyFactor: "Sicherheitsfaktor: 1.5 = 50% Puffer über dem berechneten Mindestbestand.",
  stockLookbackDays: "Analyse-Zeitraum: Wie viele Tage Verbrauchsdaten für die Berechnung verwendet werden.",

  // Settings
  settingsWebhook: "Webhooks senden HTTP-Benachrichtigungen an externe Systeme bei Änderungen.",
  settingsRbac: "Rollenbasierte Zugriffskontrolle: Definieren Sie wer was sehen und bearbeiten darf.",
  settingsApiKey: "API-Schlüssel für die Integration mit externen Systemen (ERP, Buchhaltung).",

  // Portals
  portalVendor: "Lieferanten-Portal: Ihre Lieferanten können Bestellungen einsehen und bestätigen.",
  portalCustomer: "Kunden-Portal: Ihre Kunden können den Kommissions-Fortschritt verfolgen.",
  portalExpiry: "Nach Ablauf kann der Token-Link nicht mehr verwendet werden.",

  // Scanner
  scannerKeyboardWedge: "Keyboard-Wedge: Der Scanner 'tippt' den Barcode als Tastatureingabe. Funktioniert mit jedem USB/Bluetooth-Scanner.",

  // General
  csvExport: "Export als CSV-Datei (Semikolon-getrennt, UTF-8 mit BOM für Excel-Kompatibilität).",
  bulkActions: "Wählen Sie mehrere Einträge mit den Checkboxen aus für Sammelaktionen.",
} as const
