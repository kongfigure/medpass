import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// base "./" lets the built site work from any path (for example GitHub Pages).
export default defineConfig({
  base: "./",
  plugins: [react()],
  server: { fs: { allow: ["../.."] } },
});
