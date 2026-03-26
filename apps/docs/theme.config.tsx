import { DocsThemeConfig } from 'nextra-theme-docs'

const config: DocsThemeConfig = {
  logo: (
    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <img src="/zentory-logo.svg" alt="Zentory" width="26" height="26" style={{ objectFit: 'contain', display: 'block' }} className="dark:hidden" />
      <img src="/zentory-logo-dark.svg" alt="Zentory" width="26" height="26" style={{ objectFit: 'contain', display: 'none' }} className="hidden dark:block" />
      <span style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '-0.03em', fontSize: '1rem' }}>
        <span style={{ fontWeight: 700 }}>Zen</span><span style={{ fontWeight: 300 }}>tory</span>
      </span>
      <span style={{ fontWeight: 400, color: '#6b7280', fontSize: '0.8em' }}>Docs</span>
    </span>
  ),
  project: { link: '' },
  docsRepositoryBase: '',
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:title" content="Zentory Dokumentation" />
      <meta property="og:description" content="Handbuch für Zentory — Inventar- und Werkzeugverwaltung für Schweizer KMU" />
      <link rel="icon" href="/favicon.ico" />
    </>
  ),
  footer: { content: <span>© {new Date().getFullYear()} Zentory</span> },
  sidebar: { defaultMenuCollapseLevel: 1, toggleButton: true },
  toc: { title: 'Auf dieser Seite' },
  editLink: { component: () => null },
  feedback: { content: null },
  search: { placeholder: 'Dokumentation durchsuchen...' },
  navigation: { prev: true, next: true },
  color: { hue: 163, saturation: 51 },
}

export default config
