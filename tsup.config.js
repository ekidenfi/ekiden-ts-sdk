import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  platform: "neutral",
  splitting: true,
  clean: true,
  dts: true,
  format: ["esm", "cjs"],
  target: "es2020",
  sourcemap: true,
  minify: true,
  metafile: false,
});
