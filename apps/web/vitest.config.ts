import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./vitest.setup.ts",
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
      "@shishu/core": path.resolve(__dirname, "../../packages/core/src/index.ts"),
      "@shishu/content-schema": path.resolve(__dirname, "../../packages/content-schema/src/index.ts"),
    },
  },
});
