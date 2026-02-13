import { useEffect, useState } from "react";
import { Polygon, useMap } from "react-leaflet";
import { CoordPair, polygonToCells, cellToBoundary } from "h3-js";
import "leaflet/dist/leaflet.css";
import { bounds } from "leaflet";

const BOUNDS_PADDING = 0.1;

const zoomBreakpoints = [
  { maxZoom: 5, resolution: 2, boundsPadding: 1.5 },
  { maxZoom: 8, resolution: 4, boundsPadding: 0.2 },
  { maxZoom: 11, resolution: 6, boundsPadding: 0.1 }
];

function getResolution(zoom: number) {
  const match = zoomBreakpoints.find(z => zoom <= z.maxZoom);
  return match?.resolution || 8;
}

function getBoundsPadding(zoom: number) {
  const match = zoomBreakpoints.find(z => zoom <= z.maxZoom);
  return match?.boundsPadding || 0.1;
}

export default function H3Layer() {
  const map = useMap();
  const [hexes, setHexes] = useState<CoordPair[][]>([]);

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

    const boundaries = cells.map((cell) =>
      cellToBoundary(cell)
    );

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
      {hexes.map((boundary, i) => (
        <Polygon
          key={i}
          positions={boundary}
          pathOptions={{
            color: "#626262ff",
            weight: 3,
            fillOpacity: 0.3,
          }}
        />
      ))}
    </>
  );
}
