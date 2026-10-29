import react from "@astrojs/react";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import remarkCollapse from "remark-collapse";
import remarkToc from "remark-toc";

import mdx from "@astrojs/mdx";

import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  site: import.meta.env.SITE_URL || undefined,
  integrations: [tailwind(), react(), sitemap(), mdx()],
  markdown: {
    remarkPlugins: [remarkToc, [remarkCollapse, { test: "Table of contents" }]],
    shikiConfig: { theme: "one-dark-pro", wrap: true },
  },
  base: "/",
  vite: {
    // Dependencies are shared with OPSS25, but each site's dev cache must be separate.
    cacheDir: ".astro/vite",
    server: {
      fs: {
        allow: [
          fileURLToPath(new URL(".", import.meta.url)),
          realpathSync(new URL("./node_modules", import.meta.url)),
        ],
      },
    },
    optimizeDeps: { exclude: ["@resvg/resvg-js"] },
  },
  scopedStyleStrategy: "where",
});
