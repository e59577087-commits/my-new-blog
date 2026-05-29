import { site } from "../data/site";

export function GET() {
  const sitemapUrl = new URL("/sitemap.xml", site.url).toString();

  return new Response(`User-agent: *
Allow: /

Sitemap: ${sitemapUrl}
`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
