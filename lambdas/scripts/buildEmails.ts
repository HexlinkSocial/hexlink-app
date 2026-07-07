import { build } from "esbuild";
import { readdirSync, writeFileSync } from "fs";
import { resolve, extname } from "path";
import { sassPlugin } from "esbuild-sass-plugin";
import chokidar from "chokidar";

const emailsDir = resolve(__dirname, "../emails");
const outDir = resolve(__dirname, "../dist/email_templates");

const isWatch = process.argv.includes("--watch");

function getEntryPoints(): string[] {
  return readdirSync(emailsDir)
    .filter((f) => extname(f) === ".tsx" && !f.includes("EmailLayout"))
    .map((f) => resolve(emailsDir, f));
}

async function buildEmails(): Promise<void> {
  await build({
    entryPoints: getEntryPoints(),
    bundle: true,
    format: "cjs",
    jsx: "automatic",
    outdir: outDir,
    plugins: [sassPlugin({ type: "css-text" })],
  });

  for (const file of readdirSync(outDir).filter((f) => f.endsWith(".js"))) {
    const filePath = resolve(outDir, file);
    delete require.cache[filePath];
    const mod = (await import(filePath)) as { html?: string };
    if (mod.html != null) {
      writeFileSync(
        filePath,
        `"use strict";\nObject.defineProperty(exports, "__esModule", { value: true });\nexports.html = ${JSON.stringify(mod.html)};\n`
      );
    }
  }

  console.log("emails built");
}

async function main(): Promise<void> {
  await buildEmails();

  if (isWatch) {
    chokidar.watch(emailsDir).on("change", (path) => {
      console.log(`changed: ${path}, rebuilding...`);
      void buildEmails();
    });
    console.log("watching emails...");
  } else {
    process.exit(0);
  }
}

void main();
