import { cellToChildren } from "h3-js";

// TODO: actually fetch the data for the active tiles instead of hardcoding some ids here
export function fetchTileData(): { [id: string]: number } {
    return Array.from(fetchActiveTiles())
    .sort(() => 0.5 - Math.random())
    .slice(0, 500)
    .reduce((acc, id) => {
        acc[id] = Math.floor(Math.random() * 20);
        return acc;
    }, {} as { [id: string]: number });
}

// TODO: actually fetch the data for the active tiles instead of hardcoding some ids here
export function fetchActiveTiles(): string[] {
    const res5ids = ["85194ad3fffffff", "85194adbfffffff", "85195da7fffffff", "85194e6bfffffff"];
    const res8ids = res5ids.map((cell) => cellToChildren(cell, 8)).flat();
    return res8ids;
}