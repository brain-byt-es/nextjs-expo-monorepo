import { DocsThemeConfig } from 'nextra-theme-docs'

const config: DocsThemeConfig = {
  logo: (
    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
      <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill="#F97316" />
        <rect x="6" y="6" width="8" height="8" rx="1.5" fill="white" fillOpacity={0.3} />
        <rect x="18" y="6" width="8" height="8" rx="1.5" fill="white" fillOpacity={0.9} />
        <rect x="6" y="17" width="20" height="4" rx="1.5" fill="white" fillOpacity={0.65} />
        <rect x="6" y="24" width="12" height="2" rx="1" fill="white" fillOpacity={0.9} />
        <circle cx="25" cy="25" r="2.5" fill="#2C9FA6" />
      </svg>
      LogistikApp Docs
    </span>
  ),
  project: { link: '' },
  docsRepositoryBase: '',
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:title" content="LogistikApp Dokumentation" />
      <meta property="og:description" content="Handbuch für LogistikApp — Inventar- und Werkzeugverwaltung für Schweizer KMU" />
      <link rel="icon" href="/favicon.ico" />
    </>
  ),
  footer: { content: <span>© {new Date().getFullYear()} BrainBytes GmbH · LogistikApp</span> },
  sidebar: { defaultMenuCollapseLevel: 1, toggleButton: true },
  toc: { title: 'Auf dieser Seite' },
  editLink: { component: () => null },
  feedback: { content: null },
  search: { placeholder: 'Dokumentation durchsuchen...' },
  navigation: { prev: true, next: true },
  color: { hue: 24, saturation: 95 },
}

export default config
