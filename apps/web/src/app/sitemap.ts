import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://zentory.ch"

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/login`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/signup`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/status`, changeFrequency: "always", priority: 0.3 },
    { url: `${baseUrl}/datenschutz`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/agb`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/impressum`, changeFrequency: "yearly", priority: 0.2 },
  ]
}
