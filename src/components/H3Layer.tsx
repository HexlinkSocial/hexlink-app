import { useEffect, useState } from "react";
import { Polygon, useMap } from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";
import {
  CoordPair,
  polygonToCells,
  cellToLatLng,
  cellToBoundary,
  cellToChildren,
} from "h3-js";
import "leaflet/dist/leaflet.css";
import { HexCell } from "../objects/HexCell";
import { fetchActiveTiles, fetchTileData } from "../helpers/tileDataFetcher";

const zoomBreakpoints = [
  { maxZoom: 8, resolution: 4, boundsPadding: 0.2 },
  { maxZoom: 11, resolution: 6, boundsPadding: 0.1 },
];

const resolutionBreakpoints = [
  { resolution: 4, nextZoomLevel: 11 },
  { resolution: 6, nextZoomLevel: 14 },
];

function getResolution(zoom: number) {
  const match = zoomBreakpoints.find((z) => zoom <= z.maxZoom);
  return match?.resolution || 8;
}

function getBoundsPadding(zoom: number) {
  const match = zoomBreakpoints.find((z) => zoom <= z.maxZoom);
  return match?.boundsPadding || 0.1;
}

function getNextZoomFromResolution(resolution: number) {
  const match = resolutionBreakpoints.find((z) => resolution === z.resolution);
  return match?.nextZoomLevel || 14;
}

function handleHexClick(map: LeafletMap, cellCoords: CoordPair) {
  map.flyTo(
    [cellCoords[0], cellCoords[1]],
    getNextZoomFromResolution(getResolution(map.getZoom())),
  );
}

function getFillColor(isActive: boolean, communitiesCount: number) {
  if (communitiesCount > 0) {
    return "#73197A";
  } else if (isActive) {
    return "#5cb04fff";
  } else {
    return "#626262ff";
  }
}

function getFillOpacity(communitiesCount: number) {
  return Math.min(communitiesCount * 2, 7) * 0.09 + 0.3;
}

function drawHexagon(cell: HexCell, map: LeafletMap) {
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
        click: (e) => {
          handleHexClick(map, cell.centre);
        },
      }}
    />
  );
}

export default function H3Layer() {
  const map = useMap();
  const [hexes, setHexes] = useState<HexCell[]>([]);

  const updateHexes = async () => {
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

    const activeTiles = await fetchActiveTiles();
    const cellsWithData = await fetchTileData();

    const hexes = cells.map((cell) => {
      const res8Children = cellToChildren(cell, 8);

      return new HexCell(
        cell,
        cellToBoundary(cell),
        cellToLatLng(cell),
        activeTiles.has(cell) ||
          res8Children.some((child) => activeTiles.has(child)),
        cellsWithData[cell] ||
          res8Children.reduce(
            (sum, child) => sum + (cellsWithData[child] || 0),
            0,
          ),
      );
    });

    setHexes(hexes);
  };

  useEffect(() => {
    updateHexes();

    map.on("moveend", updateHexes);
    return () => {
      map.off("moveend", updateHexes);
    };
  }, []);

  // Need to render in this order to make sure the more "important" tiles are on top;
  // mostly affects the visibility of tile borders
  return (
    <>
      {hexes
        .filter((cell) => !cell.isActive)
        .map((cell) => drawHexagon(cell, map))}
      {hexes
        .filter((cell) => cell.communitiesCount === 0 && cell.isActive)
        .map((cell) => drawHexagon(cell, map))}
      {hexes
        .filter((cell) => cell.communitiesCount > 0 && cell.isActive)
        .map((cell) => drawHexagon(cell, map))}
    </>
  );
}
