import { context, type Plugin } from "esbuild";
import { readdirSync, writeFileSync } from "fs";
import { resolve, extname } from "path";
import { sassPlugin } from "esbuild-sass-plugin";

const emailsDir = resolve(__dirname, "../emails");
const entryPoints = readdirSync(emailsDir)
  .filter((f) => extname(f) === ".tsx" && !f.includes("EmailLayout"))
  .map((f) => resolve(emailsDir, f));
const outDir = resolve(__dirname, "../dist/email_templates");
const isWatch = process.argv.includes("--watch");

function renderTemplates(): void {
  for (const file of readdirSync(outDir).filter((f) => f.endsWith(".js"))) {
    const filePath = resolve(outDir, file);
    delete require.cache[require.resolve(filePath)];
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require(filePath) as { html?: string };
    if (mod.html != null) {
      writeFileSync(
        filePath,
        `"use strict";\nObject.defineProperty(exports, "__esModule", { value: true });\nexports.html = ${JSON.stringify(mod.html)};\n`,
      );
    }
  }
}

const renderPlugin: Plugin = {
  name: "render-templates",
  setup(build) {
    build.onEnd((result) => {
      if (result.errors.length > 0) return;
      try {
        renderTemplates();
        console.log("emails built");
      } catch (err) {
        console.error("renderTemplates failed:", err);
      }
    });
  },
};

async function main(): Promise<void> {
  const ctx = await context({
    entryPoints,
    bundle: true,
    format: "cjs",
    jsx: "automatic",
    outdir: outDir,
    plugins: [sassPlugin({ type: "css-text" }), renderPlugin],
  });

  if (isWatch) {
    await ctx.watch();
    console.log("watching emails...");
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
}

void main();
