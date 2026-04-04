import { JSX, useEffect, useState } from "react";
import { Polygon, useMap } from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";
import {
  CoordPair,
  polygonToCells,
  cellToLatLng,
  cellToBoundary,
  cellToChildren,
  H3Index,
} from "h3-js";
import "leaflet/dist/leaflet.css";
import { HexCell } from "../objects/HexCell";
import { fetchActiveTiles, fetchTileData } from "../helpers/tileDataFetcher";
import CommunitiesCard from "./communities/CommunitiesCard";

const zoomBreakpoints = [
  { maxZoom: 8, resolution: 4, boundsPadding: 0.2 },
  { maxZoom: 11, resolution: 6, boundsPadding: 0.1 },
];

const resolutionBreakpoints = [
  { resolution: 4, nextZoomLevel: 11 },
  { resolution: 6, nextZoomLevel: 14 },
];

function getResolution(zoom: number): number {
  const match = zoomBreakpoints.find((z) => zoom <= z.maxZoom);
  return match?.resolution ?? 8;
}

function getBoundsPadding(zoom: number): number {
  const match = zoomBreakpoints.find((z) => zoom <= z.maxZoom);
  return match?.boundsPadding ?? 0.1;
}

function getNextZoomFromResolution(resolution: number): number {
  const match = resolutionBreakpoints.find((z) => resolution === z.resolution);
  return match?.nextZoomLevel ?? 14;
}

function handleHexClick(
  map: LeafletMap,
  cellCoords: CoordPair,
  cellId: H3Index,
  setSelectedCellId: (id: H3Index) => void,
): void {
  const [lat, lng]: [number, number] = cellCoords;
  map.flyTo(
    [lat, lng],
    getNextZoomFromResolution(getResolution(map.getZoom())),
  );
  setSelectedCellId(cellId);
}

function getFillColor(isActive: boolean, communitiesCount: number): string {
  if (communitiesCount > 0) {
    return "#73197A";
  } else if (isActive) {
    return "#5cb04fff";
  } else {
    return "#626262ff";
  }
}

function getFillOpacity(communitiesCount: number): number {
  return Math.min(communitiesCount * 2, 7) * 0.09 + 0.3;
}

function drawHexagon(
  cell: HexCell,
  map: LeafletMap,
  setSelectedCellId: (id: H3Index) => void,
): JSX.Element {
  return (
    <Polygon
      key={cell.id}
      positions={cell.boundaries}
      pathOptions={{
        color: getFillColor(cell.isActive, cell.communitiesCount),
        weight: 3,
        fillOpacity: getFillOpacity(cell.communitiesCount),
      }}
      eventHandlers={{
        click: () => {
          handleHexClick(map, cell.centre, cell.id, setSelectedCellId);
        },
      }}
    />
  );
}

export default function H3Layer(): JSX.Element {
  const map: LeafletMap = useMap() as LeafletMap;
  const [hexes, setHexes] = useState<HexCell[]>([]);
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);

  useEffect(() => {
    const updateHexes = async (): Promise<void> => {
      const bounds = map.getBounds();

      const polygon = [
        [
          [
            bounds.getSouth() - getBoundsPadding(map.getZoom()),
            bounds.getWest() - getBoundsPadding(map.getZoom()),
          ],
          [
            bounds.getSouth() - getBoundsPadding(map.getZoom()),
            bounds.getEast() + getBoundsPadding(map.getZoom()),
          ],
          [
            bounds.getNorth() + getBoundsPadding(map.getZoom()),
            bounds.getEast() + getBoundsPadding(map.getZoom()),
          ],
          [
            bounds.getNorth() + getBoundsPadding(map.getZoom()),
            bounds.getWest() - getBoundsPadding(map.getZoom()),
          ],
          [
            bounds.getSouth() - getBoundsPadding(map.getZoom()),
            bounds.getWest() - getBoundsPadding(map.getZoom()),
          ],
        ],
      ];

      const cells = polygonToCells(polygon, getResolution(map.getZoom()));

      const activeTiles: Set<H3Index> = await fetchActiveTiles();
      const cellsWithData: Record<H3Index, number> = await fetchTileData();

      const hexes: HexCell[] = cells.map((cell: H3Index): HexCell => {
        const res8Children: H3Index[] = cellToChildren(cell, 8) as H3Index[];

        return new HexCell(
          cell,
          cellToBoundary(cell) as CoordPair[],
          cellToLatLng(cell) as CoordPair,
          activeTiles.has(cell) ||
            res8Children.some((child) => activeTiles.has(child)),
          cellsWithData[cell] ||
            (res8Children.reduce(
              (sum, child) => sum + (cellsWithData[child] || 0),
              0,
            ) as number),
        );
      });

      setHexes(hexes);
    };

    const handleUpdateHexes = (): void => {
      updateHexes().catch((error) => {
        console.error("Failed to update hexes:", error);
      });
    };

    handleUpdateHexes();

    map.on("moveend", handleUpdateHexes);
    return () => {
      map.off("moveend", handleUpdateHexes);
    };
  }, [map]);

  // Need to render in this order to make sure the more "important" tiles are on top;
  // mostly affects the visibility of tile borders
  return (
    <>
      {hexes
        .filter((cell) => !cell.isActive)
        .map((cell) => drawHexagon(cell, map, setSelectedCellId))}
      {hexes
        .filter((cell) => cell.communitiesCount === 0 && cell.isActive)
        .map((cell) => drawHexagon(cell, map, setSelectedCellId))}
      {hexes
        .filter((cell) => cell.communitiesCount > 0 && cell.isActive)
        .map((cell) => drawHexagon(cell, map, setSelectedCellId))}

      <CommunitiesCard
        cellId={selectedCellId}
        onClose={() => setSelectedCellId(null)}
      />
    </>
  );
}
