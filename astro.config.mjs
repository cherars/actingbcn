import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://akterskaya-barcelona.vercel.app",
  output: "static",
  trailingSlash: "always",
  integrations: [sitemap()],
});
