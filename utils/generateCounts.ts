import "dotenv/config";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import {
  H3Index,
  cellToBoundary,
  cellToParent,
  getResolution,
  CoordPair,
} from "h3-js";

// TODO will be replaced by sam local invoke
const API_BASE_URL = (process.env.VITE_BACKEND_URL ?? "").replace(/\/$/, "");
if (!API_BASE_URL) throw new Error("Missing VITE_BACKEND_URL");

const OUT_FILE = path.resolve("public/tiles/h3-counts.pmtiles");
const TMP_DIR = path.resolve("tmp-h3-counts");

const RESOLUTION_ZOOM_RANGES = [
  { resolution: 4, minZoom: 0, maxZoom: 8 },
  { resolution: 6, minZoom: 9, maxZoom: 11 },
  { resolution: 8, minZoom: 12, maxZoom: 14 },
] as const;

interface Row {
  cellId: H3Index;
  communityCount: number;
}

async function fetchCounts(): Promise<Map<H3Index, number>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (process.env.ORIGIN_VERIFY_SECRET) {
    headers["x-origin-verify"] = process.env.ORIGIN_VERIFY_SECRET;
  }

  const res = await fetch(`${API_BASE_URL}/CommunityCounts`, { headers });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = (await res.json()) as Row[];
  return new Map(data.map((r) => [r.cellId, r.communityCount]));
}

function ring(b: CoordPair[]): [number, number][] {
  const r = b.map(([lat, lng]) => [lng, lat] as [number, number]);
  r.push(r[0]);
  return r;
}

function buildResolution(
  resolution: number,
  counts: Map<H3Index, number>,
): string[] {
  const cellCounts = new Map<H3Index, number>();

  for (const [id, count] of counts) {
    const r = getResolution(id as string);
    let cell: H3Index;

    if (r === resolution) {
      cell = id;
    } else if (r > resolution) {
      cell = cellToParent(id as string, resolution) as H3Index;
    } else {
      continue;
    }

    // TODO tinker this to divide at higher resolutions later, creates dense tiles at the moment
    cellCounts.set(cell, (cellCounts.get(cell) ?? 0) + count);
  }

  return [...cellCounts.entries()]
    .filter(([, count]) => count > 0)
    .map(([cell, count]) =>
      JSON.stringify({
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [ring(cellToBoundary(cell as string) as CoordPair[])],
        },
        properties: {
          cell_id: cell,
          resolution,
          communities_count: count,
        },
      }),
    );
}

async function main() {
  console.log("=== H3 counts build ===");

  fs.mkdirSync(TMP_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });

  const counts = await fetchCounts();
  console.log(`  Count cells: ${counts.size}`);

  const partFiles: string[] = [];

  for (const { resolution, minZoom, maxZoom } of RESOLUTION_ZOOM_RANGES) {
    console.log(`→ res ${resolution} (zoom ${minZoom}–${maxZoom})`);
    const lines = buildResolution(resolution, counts);
    console.log(`  ${lines.length} features`);

    const ndjson = path.join(TMP_DIR, `res${resolution}.ndjson`);
    const pmtiles = path.join(TMP_DIR, `res${resolution}.pmtiles`);

    fs.writeFileSync(ndjson, lines.join("\n") + "\n");

    execSync(
      [
        "tippecanoe",
        `--output=${pmtiles}`,
        "--layer=h3_counts",
        `--minimum-zoom=${minZoom}`,
        `--maximum-zoom=${maxZoom}`,
        "--no-simplification-of-shared-nodes",
        "--no-tile-size-limit",
        "--force",
        ndjson,
      ].join(" "),
      { stdio: "inherit" },
    );

    partFiles.push(pmtiles);
  }

  console.log("→ tile-join");
  execSync(
    [
      "tile-join",
      `--output=${OUT_FILE}`,
      "--force",
      "--no-tile-size-limit",
      ...partFiles,
    ].join(" "),
    { stdio: "inherit" },
  );

  fs.rmSync(TMP_DIR, { recursive: true, force: true });
  console.log("✓ done — counts pmtiles updated");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
