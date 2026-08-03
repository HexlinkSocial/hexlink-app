import * as fs from 'fs/promises';
import * as path from 'path';
import { cellToChildren, cellToBoundary, getResolution, isValidCell } from 'h3-js';

type Coordinates = [number, number];

interface WaterCheckResponse {
  isWater: boolean;
}

const DEFAULT_OUTPUT_FILE = './utils/res8ids.txt';

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isPointInWater(lat: number, lng: number): Promise<boolean> {
  const url = `https://is-on-water.balbona.me/api/v1/get/${lat}/${lng}`;
  let attempt = 0;

  while (true) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to check water status: ${response.statusText}`);
      }

      const data = (await response.json()) as WaterCheckResponse;
      return data.isWater;
    } catch (error) {
      attempt++;
      const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      await delay(backoffMs);
    }
  }
}

async function areAllVerticesInWater(h3Index: string): Promise<boolean> {
  const boundary: Coordinates[] = cellToBoundary(h3Index);

  for (const [lat, lng] of boundary) {
    const inWater = await isPointInWater(lat, lng);
    if (!inWater) {
      return false;
    }
  }

  return true;
}

function filterParentTiles(inputIds: string[]): string[] {
  return inputIds.filter((id) => {
    if (!isValidCell(id)) {
      console.warn(`Skipping invalid H3 cell ID: "${id}"`);
      return false;
    }

    const res = getResolution(id);
    if (res >= 8) {
      console.warn(`Skipping ID "${id}" with resolution ${res} (must be resolution < 8)`);
      return false;
    }

    return true;
  });
}

function renderProgressBar(current: number, total: number, width: number = 30): void {
  if (total === 0) return;
  const percentage = Math.floor((current / total) * 100);
  const completed = Math.round((width * current) / total);
  const remaining = width - completed;
  const bar = '='.repeat(completed) + '-'.repeat(remaining);

  process.stdout.write(`\rChecking water status: [${bar}] ${current}/${total} (${percentage}%)`);
}

async function appendTileToFile(fileHandle: fs.FileHandle, tileId: string, isFirst: boolean): Promise<void> {
  const prefix = isFirst ? '' : ',';
  await fileHandle.appendFile(`${prefix}${tileId}`, 'utf-8');
}

export async function processH3Tiles(
  inputIds: string[],
  outputFilePath: string = DEFAULT_OUTPUT_FILE
): Promise<string[]> {
  const validParentIds = filterParentTiles(inputIds);
  const absolutePath = path.resolve(process.cwd(), outputFilePath);

  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  const fileHandle = await fs.open(absolutePath, 'w');

  const processedRes8Ids = new Set<string>();
  const landTiles: string[] = [];

  let totalRes8Count = 0;
  for (const parentId of validParentIds) {
    const children = cellToChildren(parentId, 8);
    totalRes8Count += children.length;
  }

  let processedCount = 0;
  let isFirstWrite = true;

  try {
    for (const parentId of validParentIds) {
      const children = cellToChildren(parentId, 8);

      for (const res8Id of children) {
        renderProgressBar(processedCount, totalRes8Count);

        if (!processedRes8Ids.has(res8Id)) {
          processedRes8Ids.add(res8Id);

          const isWater = await areAllVerticesInWater(res8Id);
          if (!isWater) {
            landTiles.push(res8Id);
            await appendTileToFile(fileHandle, res8Id, isFirstWrite);
            isFirstWrite = false;
          }
        }

        processedCount++;
      }
    }

    renderProgressBar(totalRes8Count, totalRes8Count);
    process.stdout.write('\n');
  } finally {
    await fileHandle.close();
  }

  console.log(`File saved at: ${absolutePath}`);
  return landTiles;
}

function extractRawTokens(args: string[]): { rawTokens: string[]; outputFilePath: string } {
  let outputFilePath = DEFAULT_OUTPUT_FILE;
  const rawTokens: string[] = [];

  for (const arg of args) {
    if (arg.startsWith('--out=')) {
      outputFilePath = arg.split('=')[1];
    } else {
      rawTokens.push(arg);
    }
  }

  return { rawTokens, outputFilePath };
}

function parseTileIds(rawTokens: string[]): string[] {
  return rawTokens
    .flatMap((token) => token.split(','))
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
}

function parseCliArgs(): { inputIds: string[]; outputFilePath: string } {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Error: Please provide at least one parent H3 tile ID.');
    console.error('Usage: npm run tiles:ids -- <id1>, <id2>, ... [--out=<filePath>]');
    process.exit(1);
  }

  const { rawTokens, outputFilePath } = extractRawTokens(args);
  const inputIds = parseTileIds(rawTokens);

  if (inputIds.length === 0) {
    console.error('Error: No target tile IDs provided.');
    process.exit(1);
  }

  return { inputIds, outputFilePath };
}

async function runCli(): Promise<void> {
  const { inputIds, outputFilePath } = parseCliArgs();

  console.log(`Processing ${inputIds.length} input tile(s)...`);
  const result = await processH3Tiles(inputIds, outputFilePath);
  console.log(`Done! Written ${result.length} resolution 8 land-touching tiles to ${outputFilePath}`);
}

if (require.main === module || process.argv[1]?.endsWith('getRes8Ids.ts')) {
  runCli().catch((err) => {
    console.error('Execution failed:', err);
    process.exit(1);
  });
}