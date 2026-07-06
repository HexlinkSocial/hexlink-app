import { context } from "esbuild";
import { readdirSync } from "fs";
import { resolve, extname } from "path";
import { sassPlugin } from "esbuild-sass-plugin";

const emailsDir = resolve(__dirname, "../emails");
const entryPoints = readdirSync(emailsDir)
  .filter((f) => extname(f) === ".tsx" && !f.includes("EmailLayout"))
  .map((f) => resolve(emailsDir, f));

const outDir = resolve(__dirname, "../dist/email_templates");

async function main(): Promise<void> {
  const ctx = await context({
    entryPoints,
    bundle: true,
    format: "esm",
    jsx: "automatic",
    outdir: outDir,
    external: ["react", "react-dom", "react-dom/server"],
    plugins: [sassPlugin({ type: "css-text" })],
  });
  await ctx.watch();
  console.log("watching emails...");
}

void main();
