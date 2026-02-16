import localforage from "localforage";
import JSZip from "jszip";

// TODO: actually fetch the data for the active tiles instead of hardcoding some ids here
export async function fetchTileData(): Promise<{ [id: string]: number }> {
    return Array.from(await fetchActiveTiles())
    .sort(() => 0.5 - Math.random())
    .slice(0, 500)
    .reduce((acc, id) => {
        acc[id] = Math.floor(Math.random() * 20);
        return acc;
    }, {} as { [id: string]: number });
}

// TODO: add error screen if load failed
export async function fetchActiveTiles(): Promise<Set<string>> {
  const cached = await localforage.getItem<string[]>("activeTiles");

  if (cached && Array.isArray(cached)) {
    return new Set(cached);
  }

  const response = await fetch(process.env.REACT_APP_ACTIVE_TILE_FILE_LOCATION!);
  if (!response.ok) {
    throw new Error("Failed to fetch active tiles zip");
  }

  const arrayBuffer = await response.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const file = zip.file(process.env.REACT_APP_ACTIVE_TILE_FILE!);

  if (!file) {
    throw new Error("Failed to find file in the zip");
  }
  const text = await file.async("text");
  const fresh = text.split(",").map(s => s.trim());
  await localforage.setItem("activeTiles", fresh);
  return new Set(fresh);
}
