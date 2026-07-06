import { context } from "esbuild";
import { readdirSync } from "fs";
import { resolve, extname } from "path";

const emailsDir = resolve(__dirname, "../src/emails");
const outDir = resolve(__dirname, "../lambdas/dist/email_templates");
const entryPoints = readdirSync(emailsDir)
  .filter(f => extname(f) === ".tsx" && !f.includes("EmailLayout"))
  .map(f => resolve(emailsDir, f));

async function main() {
  const ctx = await context({
    entryPoints,
    bundle: true,
    format: "esm",
    jsx: "automatic",
    outdir: outDir,
    external: ["react", "react-dom", "react-dom/server"],
    loader: {
    ".scss": "text",
    },
  });
  await ctx.watch();
  console.log("watching emails...");
}

main();