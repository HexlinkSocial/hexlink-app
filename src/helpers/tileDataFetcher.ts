import localforage from "localforage";
import JSZip from "jszip";
import { CommunityCount } from "../objects/CommunityCount";

export async function fetchTileData(): Promise<{ [id: string]: number }> {
  return await fetch(import.meta.env.VITE_BACKEND_URL! + "/communityCounts")
    .then((response) => response.json())
    .then((data) => {
      const result: { [id: string]: number } = {};
      data.forEach((entry: CommunityCount) => {
        result[entry.cellId] = entry.communityCount;
      });
      return result;
    });
}

// TODO: add error screen if load failed
export async function fetchActiveTiles(): Promise<Set<string>> {
  const cached = await localforage.getItem<string[]>("activeTiles");

  if (cached !== null && Array.isArray(cached)) {
    return new Set(cached);
  }

  const activeTileFileLocation = import.meta.env.VITE_ACTIVE_TILE_FILE_LOCATION;

  if (activeTileFileLocation === undefined) {
    throw new Error("Active tile file location is not defined");
  }

  const response = await fetch(activeTileFileLocation as URL);
  if (!response.ok) {
    throw new Error("Failed to fetch active tiles zip");
  }

  const arrayBuffer = await response.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const file = zip.file(import.meta.env.VITE_ACTIVE_TILE_FILE);

  if (file === null) {
    throw new Error("Failed to find file in the zip");
  }
  const text = await file.async("text");
  const fresh = text.split(",").map((s) => s.trim()) as string[];
  await localforage.setItem("activeTiles", fresh);
  return new Set(fresh);
}
