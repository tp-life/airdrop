import { defineConfig } from "tsup";

export default defineConfig({
  // entry: ['index.ts'],
  entry: {
    main: "main.ts", // 主线程
    worker: "worker.ts", // 子线程
  },
  format: ["cjs"],
  outDir: "dist",
  splitting: false,
  sourcemap: false,
  clean: true,
  minify: true,
  target: "node18",
  dts: false,
  bundle: true, // ✅ 开启打包依赖
  external: [], // ✅ 明确不要排除任何依赖（默认会排除 node_modules 里的）
  banner: {
    js: "#!/usr/bin/env node",
  },
  // noExternal: ['toml', "p-queue", "mysql2", "ethers", "node-imap", "puppeteer-real-browser", "puppeteer", "rimraf", "random-useragent", "drizzle-orm"],
  noExternal: [/./],
});
