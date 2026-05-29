// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

const siteUrl = (process.env.PUBLIC_SITE_URL ?? 'https://example.com').replace(/\/$/, '');

// https://astro.build/config
export default defineConfig({
  site: siteUrl,
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true
    }
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
