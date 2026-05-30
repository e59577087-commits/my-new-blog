import { site } from "../data/site";

const staticRoutes = ["/", "/about/", "/tools/", "/share/", "/login/"];

export async function GET() {
  const urls = staticRoutes
    .map((route) => {
      const loc = new URL(route, site.url).toString();

      return `
  <url>
    <loc>${loc}</loc>
  </url>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
