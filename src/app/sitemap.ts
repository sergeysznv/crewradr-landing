import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://crewradr.com";
  const lastModified = new Date();

  const locales = ["en", "es", "fr", "ar", "zh", "ru"];
  const routes = ["", "/privacy", "/terms"];

  const entries: MetadataRoute.Sitemap = [];

  for (const route of routes) {
    for (const loc of locales) {
      const url =
        loc === "en"
          ? `${baseUrl}${route || "/"}`
          : `${baseUrl}${route ? `${route}/${loc}` : `/?lang=${loc}`}`;

      entries.push({
        url,
        lastModified,
        changeFrequency: route === "" ? "weekly" : "monthly",
        priority: route === "" ? 1.0 : 0.5,
      });
    }
  }

  return entries;
}
