import { useEffect, useState } from "react";
import { Polygon, useMap } from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";
import { CoordPair, polygonToCells, cellToLatLng, cellToBoundary } from "h3-js";
import "leaflet/dist/leaflet.css";
import { HexCell } from "../objects/HexCell";

const zoomBreakpoints = [
  { maxZoom: 5, resolution: 2, boundsPadding: 1.5 },
  { maxZoom: 8, resolution: 4, boundsPadding: 0.2 },
  { maxZoom: 11, resolution: 6, boundsPadding: 0.1 }
];

const resolutionBreakpoints = [
  { resolution: 2, nextZoomLevel: 8 },
  { resolution: 4, nextZoomLevel: 11 },
  { resolution: 6, nextZoomLevel: 14 }
];

function getResolution(zoom: number) {
  const match = zoomBreakpoints.find(z => zoom <= z.maxZoom);
  return match?.resolution || 8;
}

function getBoundsPadding(zoom: number) {
  const match = zoomBreakpoints.find(z => zoom <= z.maxZoom);
  return match?.boundsPadding || 0.1;
}

function getNextZoomFromResolution(resolution: number) {
  const match = resolutionBreakpoints.find(z => resolution === z.resolution);
  return match?.nextZoomLevel || 14;
}

function handleHexClick(map: LeafletMap, cellCoords: CoordPair) {
    map.flyTo([cellCoords[0], cellCoords[1]], getNextZoomFromResolution(getResolution(map.getZoom())));
}

export default function H3Layer() {
  const map = useMap();
  const [hexes, setHexes] = useState<HexCell[]>([]);

  const updateHexes = () => {
    const bounds = map.getBounds();

    const polygon = [
      [
        [bounds.getSouth() - getBoundsPadding(map.getZoom()), bounds.getWest() - getBoundsPadding(map.getZoom())],
        [bounds.getSouth() - getBoundsPadding(map.getZoom()), bounds.getEast() + getBoundsPadding(map.getZoom())],
        [bounds.getNorth() + getBoundsPadding(map.getZoom()), bounds.getEast() + getBoundsPadding(map.getZoom())],
        [bounds.getNorth() + getBoundsPadding(map.getZoom()), bounds.getWest() - getBoundsPadding(map.getZoom())],
        [bounds.getSouth() - getBoundsPadding(map.getZoom()), bounds.getWest() - getBoundsPadding(map.getZoom())],
      ],
    ];

    const cells = polygonToCells(polygon, getResolution(map.getZoom()));

    const boundaries = cells.map((cell) => new HexCell(
        cell,
        cellToBoundary(cell),
        cellToLatLng(cell)));

    setHexes(boundaries);
  };

  useEffect(() => {
    updateHexes();

    map.on("moveend", updateHexes);
    return () => {
      map.off("moveend", updateHexes);
    };
  }, []);

  return (
    <>
      {hexes.map((cell, i) => (
        <Polygon
          key={i}
          positions={cell.boundaries}
          pathOptions={{
            color: "#626262ff",
            weight: 3,
            fillOpacity: 0.3,
          }}
          eventHandlers={{
            click: (e) => {
              handleHexClick(map, hexes[i].centre);
            },
          }}
        />
      ))}
    </>
  );
}
