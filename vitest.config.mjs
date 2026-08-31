import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": here,
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
