import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import {
  polygonToCells,
  cellToBoundary,
  cellToParent,
  getResolution,
  H3Index,
} from "h3-js";

const ALLOWLIST_PATH = path.resolve(process.cwd(), "res8_hex_ids.txt");

// CRITICAL SPEED FIX: Put the temp directory directly in native Linux virtual memory storage (/tmp)
const TMP_DIR = "/tmp/h3-combined-build";
const OUT_FILE = path.resolve(process.cwd(), "public/tiles/h3-grid.pmtiles");

const EUROPE_POLYGON: [number, number][] = [
  [-25.0, 72.0],
  [45.0, 72.0],
  [45.0, 34.0],
  [-25.0, 34.0],
  [-25.0, 72.0],
];

const RESOLUTION_ZOOM_RANGES = [
  { resolution: 4, minZoom: 0, maxZoom: 8, generateBaseGrid: true },
  { resolution: 6, minZoom: 9, maxZoom: 11, generateBaseGrid: true },
  { resolution: 8, minZoom: 12, maxZoom: 16, generateBaseGrid: false },
] as const;

async function build() {
  console.log("=== Starting H3 Base Grid PMTiles Generation ===");

  if (fs.existsSync(TMP_DIR))
    fs.rmSync(TMP_DIR, { recursive: true, force: true });
  fs.mkdirSync(TMP_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });

  const activeRes4 = new Set<string>();
  const activeRes6 = new Set<string>();
  const activeRes8 = new Set<string>();

  if (fs.existsSync(ALLOWLIST_PATH)) {
    let content = fs.readFileSync(ALLOWLIST_PATH, "utf-8");
    if (content.charCodeAt(0) === 0xfeff) content = content.slice(1);

    const hexTokens = content.split(",");
    for (const rawToken of hexTokens) {
      const h3Index = rawToken
        .replace(/[^a-zA-Z0-9]/g, "")
        .trim()
        .toLowerCase();
      if (!h3Index) continue;

      activeRes8.add(h3Index);
      activeRes6.add(cellToParent(h3Index, 6));
      activeRes4.add(cellToParent(h3Index, 4));
    }
    console.log(
      `✓ Allowlist parsed. Total Res 8 target markers: ${activeRes8.size}`,
    );
  }

  const partFiles: string[] = [];

  for (const {
    resolution,
    minZoom,
    maxZoom,
    generateBaseGrid,
  } of RESOLUTION_ZOOM_RANGES) {
    console.log(`\n--- Processing Resolution ${resolution} ---`);

    const ndjson = path.join(TMP_DIR, `res${resolution}.ndjson`);
    const pmtiles = path.join(TMP_DIR, `res${resolution}.pmtiles`);
    const writeStream = fs.createWriteStream(ndjson, { flags: "w" });

    const currentActiveSet =
      resolution === 4
        ? activeRes4
        : resolution === 6
          ? activeRes6
          : activeRes8;
    let targetCells: Iterable<string> = [];

    if (generateBaseGrid) {
      console.log(`Computing Europe base grid boundaries...`);
      targetCells = polygonToCells(
        EUROPE_POLYGON,
        resolution,
        true,
      ) as H3Index[];
    } else {
      console.log(`Processing explicit active markers...`);
      targetCells = currentActiveSet;
    }

    let writtenCount = 0;
    for (const h3Index of targetCells) {
      try {
        const boundary = cellToBoundary(h3Index, true);
        if (!boundary || boundary.length === 0) continue;

        const ring = boundary.map(([lng, lat]) => [Number(lng), Number(lat)]);
        ring.push([Number(boundary[0][0]), Number(boundary[0][1])]);

        const isActive = currentActiveSet.has(h3Index) ? 1 : 0;

        const featureString = JSON.stringify({
          type: "Feature",
          geometry: { type: "Polygon", coordinates: [ring] },
          properties: { h3: h3Index, resolution, isActive },
        });

        writeStream.write(featureString + "\n");
        writtenCount++;
      } catch (e) {}
    }

    await new Promise<void>((resolve) => writeStream.end(() => resolve()));
    console.log(`✓ Wrote ${writtenCount} features to Linux temporary storage.`);

    if (writtenCount === 0) continue;

    console.log(`Running optimized Tippecanoe compression natively...`);
    execSync(
      [
        "tippecanoe",
        `--output=${pmtiles}`,
        "--layer=h3_grid",
        `--minimum-zoom=${minZoom}`,
        `--maximum-zoom=${maxZoom}`,
        "--no-simplification-of-shared-nodes",
        "--no-tile-size-limit",
        "--read-parallel",
        `--temporary-directory=${TMP_DIR}`,
        "--force",
        ndjson,
      ].join(" "),
      { stdio: "inherit" },
    );

    partFiles.push(pmtiles);
  }

  if (partFiles.length > 0) {
    console.log("\nMerging layers via tile-join inside Linux...");
    const mergedPmtilesLinux = path.join(TMP_DIR, "final.pmtiles");

    execSync(
      [
        "tile-join",
        `--output=${mergedPmtilesLinux}`,
        "--force",
        "--no-tile-size-limit",
        ...partFiles,
      ].join(" "),
      { stdio: "inherit" },
    );

    // Move ONLY the final complete file over to your Windows folder at the very end
    console.log("Moving final build to Windows project folder...");
    fs.copyFileSync(mergedPmtilesLinux, OUT_FILE);
  }

  fs.rmSync(TMP_DIR, { recursive: true, force: true });
  console.log(`\n✓ Job Complete! Saved to Windows destination: ${OUT_FILE}`);
}

build().catch(console.error);
