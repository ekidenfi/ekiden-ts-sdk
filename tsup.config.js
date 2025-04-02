import { defineConfig } from "tsup";

export default defineConfig((options) => ({
  platform: "neutral",
  entry: ["src/index.ts"],
  // minify: true,
  splitting: true,
  metafile: false,
}));
