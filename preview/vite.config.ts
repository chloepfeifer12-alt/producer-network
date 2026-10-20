import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { fileURLToPath } from "node:url";

/**
 * Builds the whole prototype as ONE self-contained HTML file (no server), so it
 * can be viewed as a Claude Artifact. Same pages and components as the Next.js
 * app; only next/link, next/navigation and next/font are swapped for small shims.
 */
const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  root: r("."),
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: [
      { find: /^next\/link$/, replacement: r("./shims/next-link.tsx") },
      { find: /^next\/navigation$/, replacement: r("./shims/next-navigation.ts") },
      { find: /^geist\/font\/sans$/, replacement: r("./shims/geist.ts") },
      { find: /^geist\/font\/mono$/, replacement: r("./shims/geist.ts") },
      { find: /^@\//, replacement: r("../src/") + "/" },
    ],
  },
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  css: { postcss: { plugins: [] } },
  build: {
    outDir: r("./dist"),
    emptyOutDir: true,
    target: "es2022",
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    chunkSizeWarningLimit: 100_000,
  },
});
