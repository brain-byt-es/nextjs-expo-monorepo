import meta from "../../../pages/_meta.ts";
import ai_meta from "../../../pages/ai/_meta.ts";
import api_docs_meta from "../../../pages/api-docs/_meta.ts";
import automatisierung_meta from "../../../pages/automatisierung/_meta.ts";
import berichte_meta from "../../../pages/berichte/_meta.ts";
import einstellungen_meta from "../../../pages/einstellungen/_meta.ts";
import erste_schritte_meta from "../../../pages/erste-schritte/_meta.ts";
import erweitert_meta from "../../../pages/erweitert/_meta.ts";
import finanzen_meta from "../../../pages/finanzen/_meta.ts";
import inventur_meta from "../../../pages/inventur/_meta.ts";
import lieferscheine_meta from "../../../pages/lieferscheine/_meta.ts";
import materialien_meta from "../../../pages/materialien/_meta.ts";
import mobile_app_meta from "../../../pages/mobile-app/_meta.ts";
import rueckverfolgung_meta from "../../../pages/rueckverfolgung/_meta.ts";
import sicherheit_meta from "../../../pages/sicherheit/_meta.ts";
import standorte_meta from "../../../pages/standorte/_meta.ts";
import werkzeuge_meta from "../../../pages/werkzeuge/_meta.ts";
export const pageMap = [{
  data: meta
}, {
  name: "ai",
  route: "/ai",
  children: [{
    data: ai_meta
  }, {
    name: "anomalie-erkennung",
    route: "/ai/anomalie-erkennung",
    frontMatter: {
      "title": "Anomalie-Erkennung"
    }
  }, {
    name: "foto-erkennung",
    route: "/ai/foto-erkennung",
    frontMatter: {
      "title": "Foto-Erkennung (AI)"
    }
  }, {
    name: "prognose",
    route: "/ai/prognose",
    frontMatter: {
      "title": "Nachfrageprognose"
    }
  }, {
    name: "spalten-mapping",
    route: "/ai/spalten-mapping",
    frontMatter: {
      "title": "Import AI-Mapping"
    }
  }]
}, {
  name: "api-docs",
  route: "/api-docs",
  children: [{
    data: api_docs_meta
  }, {
    name: "authentifizierung",
    route: "/api-docs/authentifizierung",
    frontMatter: {
      "title": "API-Authentifizierung"
    }
  }, {
    name: "materialien",
    route: "/api-docs/materialien",
    frontMatter: {
      "title": "API – Materialien"
    }
  }, {
    name: "standorte",
    route: "/api-docs/standorte",
    frontMatter: {
      "title": "API – Standorte"
    }
  }, {
    name: "uebersicht",
    route: "/api-docs/uebersicht",
    frontMatter: {
      "title": "API – Übersicht & Grundlagen"
    }
  }, {
    name: "v1-api",
    route: "/api-docs/v1-api",
    frontMatter: {
      "title": "REST API v1"
    }
  }, {
    name: "webhooks",
    route: "/api-docs/webhooks",
    frontMatter: {
      "title": "API – Webhooks (Verwaltung)"
    }
  }, {
    name: "werkzeuge",
    route: "/api-docs/werkzeuge",
    frontMatter: {
      "title": "API – Werkzeuge"
    }
  }]
}, {
  name: "automatisierung",
  route: "/automatisierung",
  children: [{
    data: automatisierung_meta
  }, {
    name: "auto-nachbestellung",
    route: "/automatisierung/auto-nachbestellung",
    frontMatter: {
      "title": "Auto-Nachbestellung"
    }
  }, {
    name: "genehmigungen",
    route: "/automatisierung/genehmigungen",
    frontMatter: {
      "title": "Genehmigungen"
    }
  }, {
    name: "geplante-berichte",
    route: "/automatisierung/geplante-berichte",
    frontMatter: {
      "title": "Geplante Berichte"
    }
  }, {
    name: "workflow-regeln",
    route: "/automatisierung/workflow-regeln",
    frontMatter: {
      "title": "Workflow-Regeln"
    }
  }]
}, {
  name: "berichte",
  route: "/berichte",
  children: [{
    data: berichte_meta
  }, {
    name: "analytik",
    route: "/berichte/analytik",
    frontMatter: {
      "title": "Analytik-Dashboard"
    }
  }, {
    name: "export",
    route: "/berichte/export",
    frontMatter: {
      "title": "Datenexport"
    }
  }, {
    name: "uebersicht",
    route: "/berichte/uebersicht",
    frontMatter: {
      "title": "Berichte – Übersicht"
    }
  }]
}, {
  name: "changelog",
  route: "/changelog",
  frontMatter: {
    "title": "Changelog"
  }
}, {
  name: "einstellungen",
  route: "/einstellungen",
  children: [{
    data: einstellungen_meta
  }, {
    name: "api-schluessel",
    route: "/einstellungen/api-schluessel",
    frontMatter: {
      "title": "API-Schlüssel"
    }
  }, {
    name: "automatisierungen",
    route: "/einstellungen/automatisierungen",
    frontMatter: {
      "title": "Automatisierungen"
    }
  }, {
    name: "benachrichtigungen",
    route: "/einstellungen/benachrichtigungen",
    frontMatter: {
      "title": "Benachrichtigungen"
    }
  }, {
    name: "branding",
    route: "/einstellungen/branding",
    frontMatter: {
      "title": "Unternehmens-Branding"
    }
  }, {
    name: "darstellung",
    route: "/einstellungen/darstellung",
    frontMatter: {
      "title": "Darstellung"
    }
  }, {
    name: "integrationen",
    route: "/einstellungen/integrationen",
    frontMatter: {
      "title": "Integrationen"
    }
  }, {
    name: "ki-funktionen",
    route: "/einstellungen/ki-funktionen",
    frontMatter: {
      "title": "KI-Funktionen konfigurieren"
    }
  }, {
    name: "profil",
    route: "/einstellungen/profil",
    frontMatter: {
      "title": "Profil & Konto"
    }
  }, {
    name: "rollen",
    route: "/einstellungen/rollen",
    frontMatter: {
      "title": "Rollen & Berechtigungen (RBAC)"
    }
  }, {
    name: "sso",
    route: "/einstellungen/sso",
    frontMatter: {
      "title": "Single Sign-On (SSO)"
    }
  }, {
    name: "team",
    route: "/einstellungen/team",
    frontMatter: {
      "title": "Team & Rollen"
    }
  }, {
    name: "webhooks",
    route: "/einstellungen/webhooks",
    frontMatter: {
      "title": "Webhooks"
    }
  }, {
    name: "zusatzfelder",
    route: "/einstellungen/zusatzfelder",
    frontMatter: {
      "title": "Zusatzfelder"
    }
  }]
}, {
  name: "erste-schritte",
  route: "/erste-schritte",
  children: [{
    data: erste_schritte_meta
  }, {
    name: "erste-materialien",
    route: "/erste-schritte/erste-materialien",
    frontMatter: {
      "title": "Erste Materialien erfassen"
    }
  }, {
    name: "onboarding",
    route: "/erste-schritte/onboarding",
    frontMatter: {
      "title": "Onboarding-Assistent"
    }
  }, {
    name: "registrierung",
    route: "/erste-schritte/registrierung",
    frontMatter: {
      "title": "Registrierung & Login"
    }
  }, {
    name: "team-einladen",
    route: "/erste-schritte/team-einladen",
    frontMatter: {
      "title": "Team einladen"
    }
  }]
}, {
  name: "erweitert",
  route: "/erweitert",
  children: [{
    data: erweitert_meta
  }, {
    name: "aktivitaetsprotokoll",
    route: "/erweitert/aktivitaetsprotokoll",
    frontMatter: {
      "title": "Aktivitätsprotokoll"
    }
  }, {
    name: "benachrichtigungen",
    route: "/erweitert/benachrichtigungen",
    frontMatter: {
      "title": "Benachrichtigungszentrale"
    }
  }, {
    name: "branchen-vorlagen",
    route: "/erweitert/branchen-vorlagen",
    frontMatter: {
      "title": "Branchen-Vorlagen"
    }
  }, {
    name: "bulk-operationen",
    route: "/erweitert/bulk-operationen",
    frontMatter: {
      "title": "Bulk-Operationen"
    }
  }, {
    name: "command-palette",
    route: "/erweitert/command-palette",
    frontMatter: {
      "title": "Command Palette (Cmd+K)"
    }
  }, {
    name: "dashboard-widgets",
    route: "/erweitert/dashboard-widgets",
    frontMatter: {
      "title": "Dashboard anpassen"
    }
  }, {
    name: "duplikat-erkennung",
    route: "/erweitert/duplikat-erkennung",
    frontMatter: {
      "title": "Duplikat-Erkennung"
    }
  }, {
    name: "favoriten",
    route: "/erweitert/favoriten",
    frontMatter: {
      "title": "Favoriten & Zuletzt verwendet"
    }
  }, {
    name: "grundriss",
    route: "/erweitert/grundriss",
    frontMatter: {
      "title": "Grundriss-Ansicht"
    }
  }, {
    name: "karte",
    route: "/erweitert/karte",
    frontMatter: {
      "title": "Karten-Ansicht"
    }
  }, {
    name: "materialanfragen",
    route: "/erweitert/materialanfragen",
    frontMatter: {
      "title": "Materialanfragen"
    }
  }, {
    name: "multi-unternehmen",
    route: "/erweitert/multi-unternehmen",
    frontMatter: {
      "title": "Multi-Unternehmen"
    }
  }, {
    name: "qr-self-service",
    route: "/erweitert/qr-self-service",
    frontMatter: {
      "title": "QR Self-Service"
    }
  }, {
    name: "reservierungen",
    route: "/erweitert/reservierungen",
    frontMatter: {
      "title": "Reservierungen"
    }
  }]
}, {
  name: "faq",
  route: "/faq",
  frontMatter: {
    "title": "Häufige Fragen"
  }
}, {
  name: "finanzen",
  route: "/finanzen",
  children: [{
    data: finanzen_meta
  }, {
    name: "abschreibungen",
    route: "/finanzen/abschreibungen",
    frontMatter: {
      "title": "Abschreibungen & TCO"
    }
  }, {
    name: "lieferantenpreise",
    route: "/finanzen/lieferantenpreise",
    frontMatter: {
      "title": "Lieferanten & Preise"
    }
  }]
}, {
  name: "index",
  route: "/",
  frontMatter: {
    "title": "Willkommen bei LogistikApp"
  }
}, {
  name: "inventur",
  route: "/inventur",
  children: [{
    data: inventur_meta
  }, {
    name: "durchfuehren",
    route: "/inventur/durchfuehren",
    frontMatter: {
      "title": "Inventur durchführen"
    }
  }, {
    name: "workflow",
    route: "/inventur/workflow",
    frontMatter: {
      "title": "Inventur-Workflow"
    }
  }]
}, {
  name: "lieferscheine",
  route: "/lieferscheine",
  children: [{
    data: lieferscheine_meta
  }, {
    name: "erstellen",
    route: "/lieferscheine/erstellen",
    frontMatter: {
      "title": "Lieferschein erstellen"
    }
  }, {
    name: "scannen",
    route: "/lieferscheine/scannen",
    frontMatter: {
      "title": "Positionen scannen"
    }
  }, {
    name: "uebersicht",
    route: "/lieferscheine/uebersicht",
    frontMatter: {
      "title": "Lieferscheine – Übersicht"
    }
  }]
}, {
  name: "materialien",
  route: "/materialien",
  children: [{
    data: materialien_meta
  }, {
    name: "barcode",
    route: "/materialien/barcode",
    frontMatter: {
      "title": "Barcode & Etiketten"
    }
  }, {
    name: "bestand",
    route: "/materialien/bestand",
    frontMatter: {
      "title": "Bestandsverwaltung"
    }
  }, {
    name: "ean-erkennung",
    route: "/materialien/ean-erkennung",
    frontMatter: {
      "title": "EAN Auto-Erkennung"
    }
  }, {
    name: "erstellen",
    route: "/materialien/erstellen",
    frontMatter: {
      "title": "Material erstellen"
    }
  }, {
    name: "import",
    route: "/materialien/import",
    frontMatter: {
      "title": "Import (CSV/Excel)"
    }
  }, {
    name: "uebersicht",
    route: "/materialien/uebersicht",
    frontMatter: {
      "title": "Materialien – Übersicht"
    }
  }]
}, {
  name: "mobile-app",
  route: "/mobile-app",
  children: [{
    data: mobile_app_meta
  }, {
    name: "ar-modus",
    route: "/mobile-app/ar-modus",
    frontMatter: {
      "title": "AR-Modus"
    }
  }, {
    name: "installation",
    route: "/mobile-app/installation",
    frontMatter: {
      "title": "Installation"
    }
  }, {
    name: "nfc",
    route: "/mobile-app/nfc",
    frontMatter: {
      "title": "NFC-Tags"
    }
  }, {
    name: "offline-konflikte",
    route: "/mobile-app/offline-konflikte",
    frontMatter: {
      "title": "Offline-Konflikte"
    }
  }, {
    name: "offline",
    route: "/mobile-app/offline",
    frontMatter: {
      "title": "Offline-Modus"
    }
  }, {
    name: "push-notifications",
    route: "/mobile-app/push-notifications",
    frontMatter: {
      "title": "Push-Benachrichtigungen"
    }
  }, {
    name: "scanner",
    route: "/mobile-app/scanner",
    frontMatter: {
      "title": "Barcode-Scanner"
    }
  }, {
    name: "sprachsteuerung",
    route: "/mobile-app/sprachsteuerung",
    frontMatter: {
      "title": "Sprachsteuerung"
    }
  }]
}, {
  name: "rueckverfolgung",
  route: "/rueckverfolgung",
  children: [{
    data: rueckverfolgung_meta
  }, {
    name: "ablaufdaten",
    route: "/rueckverfolgung/ablaufdaten",
    frontMatter: {
      "title": "Ablaufdaten (FIFO/FEFO)"
    }
  }, {
    name: "chargen-serien",
    route: "/rueckverfolgung/chargen-serien",
    frontMatter: {
      "title": "Chargen & Seriennummern"
    }
  }, {
    name: "kalibrierung",
    route: "/rueckverfolgung/kalibrierung",
    frontMatter: {
      "title": "Kalibrierung & Zertifikate"
    }
  }, {
    name: "versicherung",
    route: "/rueckverfolgung/versicherung",
    frontMatter: {
      "title": "Versicherung & Garantie"
    }
  }]
}, {
  name: "sicherheit",
  route: "/sicherheit",
  children: [{
    data: sicherheit_meta
  }, {
    name: "datenschutz",
    route: "/sicherheit/datenschutz",
    frontMatter: {
      "title": "Datenschutz & nDSG"
    }
  }, {
    name: "hosting",
    route: "/sicherheit/hosting",
    frontMatter: {
      "title": "Hosting & Infrastruktur"
    }
  }]
}, {
  name: "standorte",
  route: "/standorte",
  children: [{
    data: standorte_meta
  }, {
    name: "erstellen",
    route: "/standorte/erstellen",
    frontMatter: {
      "title": "Standort erstellen"
    }
  }, {
    name: "typen",
    route: "/standorte/typen",
    frontMatter: {
      "title": "Standorttypen"
    }
  }, {
    name: "uebersicht",
    route: "/standorte/uebersicht",
    frontMatter: {
      "title": "Standorte – Übersicht"
    }
  }]
}, {
  name: "werkzeuge",
  route: "/werkzeuge",
  children: [{
    data: werkzeuge_meta
  }, {
    name: "aus-einchecken",
    route: "/werkzeuge/aus-einchecken",
    frontMatter: {
      "title": "Aus- & Einchecken"
    }
  }, {
    name: "erstellen",
    route: "/werkzeuge/erstellen",
    frontMatter: {
      "title": "Werkzeug erfassen"
    }
  }, {
    name: "uebersicht",
    route: "/werkzeuge/uebersicht",
    frontMatter: {
      "title": "Werkzeuge – Übersicht"
    }
  }, {
    name: "wartung",
    route: "/werkzeuge/wartung",
    frontMatter: {
      "title": "Wartung & Service"
    }
  }]
}];