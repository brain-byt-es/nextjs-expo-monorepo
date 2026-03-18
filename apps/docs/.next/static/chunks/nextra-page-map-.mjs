import meta from "../../../pages/_meta.ts";
import api_docs_meta from "../../../pages/api-docs/_meta.ts";
import berichte_meta from "../../../pages/berichte/_meta.ts";
import einstellungen_meta from "../../../pages/einstellungen/_meta.ts";
import erste_schritte_meta from "../../../pages/erste-schritte/_meta.ts";
import inventur_meta from "../../../pages/inventur/_meta.ts";
import lieferscheine_meta from "../../../pages/lieferscheine/_meta.ts";
import materialien_meta from "../../../pages/materialien/_meta.ts";
import mobile_app_meta from "../../../pages/mobile-app/_meta.ts";
import sicherheit_meta from "../../../pages/sicherheit/_meta.ts";
import standorte_meta from "../../../pages/standorte/_meta.ts";
import werkzeuge_meta from "../../../pages/werkzeuge/_meta.ts";
export const pageMap = [{
  data: meta
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
    name: "profil",
    route: "/einstellungen/profil",
    frontMatter: {
      "title": "Profil & Konto"
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
  name: "faq",
  route: "/faq",
  frontMatter: {
    "title": "Häufige Fragen"
  }
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
    name: "installation",
    route: "/mobile-app/installation",
    frontMatter: {
      "title": "Installation"
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