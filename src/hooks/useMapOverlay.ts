import { useEffect, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { LngLatLike } from "maplibre-gl";
import { Protocol } from "pmtiles";
import "maplibre-gl/dist/maplibre-gl.css";

const protocol = new Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);

const zoomBreakpoints = [9, 12] as const;

function getNextZoom(currentZoom: number): number {
  const match = zoomBreakpoints.find((z) => currentZoom < z);
  return match ? match + 0.5 : 14;
}

const getCentre = (f: maplibregl.MapGeoJSONFeature): maplibregl.LngLatLike => {
  const coords = (f.geometry as GeoJSON.Polygon).coordinates[0];

  const center: [number, number] = [
    coords.reduce((s: number, c: number[]) => s + c[0], 0) / coords.length,
    coords.reduce((s: number, c: number[]) => s + c[1], 0) / coords.length,
  ];

  return center;
};

const closeCard = (
  setSelectedCellId: React.Dispatch<React.SetStateAction<string | null>>,
): void => setSelectedCellId(null);

const flyToFeature = (
  e: maplibregl.MapLayerMouseEvent,
  map: maplibregl.Map,
): void => {
  const f = e.features?.[0];
  if (f === undefined) return;

  map.flyTo({
    center: getCentre(f),
    zoom: getNextZoom(map.getZoom() as number),
  });
};

const openCard = (
  e: maplibregl.MapLayerMouseEvent,
  map: maplibregl.Map,
  setSelectedCellId: React.Dispatch<React.SetStateAction<string | null>>,
): void => {
  const f = e.features?.[0];
  if (f === undefined) return;

  const id = f.properties?.cell_id as string;

  map.flyTo({
    center: getCentre(f),
    zoom: map.getZoom(),
  });

  setSelectedCellId(id);
};

const europeBounds: maplibregl.LngLatBoundsLike = [
  [-25.0, 34.0],
  [45.0, 72.0],
];
const mapCenter: LngLatLike = [-0.1276, 51.5072];

type MapInfo = {
  /* eslint-disable @typescript-eslint/no-redundant-type-constituents */
  map: maplibregl.Map | null;
  isMapReady: boolean;
  selectedCellId: string | null;
  setSelectedCellId: React.Dispatch<React.SetStateAction<string | null>>;
};

export function useMapOverlay(
  containerRef: React.RefObject<HTMLDivElement | null>,
): MapInfo {
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "/style.json",
      center: mapCenter,
      zoom: 8,
      minZoom: 4,
      maxZoom: 16,
      maxBounds: europeBounds,
    });

    setMapInstance(map);

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-left",
    );

    map.on("load", () => {
      setIsMapReady(true);
    });

    map.on("dragstart", () => closeCard(setSelectedCellId));
    map.on("zoomstart", () => closeCard(setSelectedCellId));

    map.on("load", () => {
      const coarseLayers = [
        "h3-active-r4",
        "h3-active-r6",
        "h3-counts-r4",
        "h3-counts-r6",
      ] as const;

      coarseLayers.forEach((layer) => {
        map.on("click", layer, (e) => flyToFeature(e, map));
      });

      const fineLayers = ["h3-active-r8", "h3-counts-r8"] as const;

      fineLayers.forEach((layer) => {
        map.on("click", layer, (e) => openCard(e, map, setSelectedCellId));
      });
    });
  }, [containerRef]);

  return {
    map: mapInstance,
    isMapReady,
    selectedCellId,
    setSelectedCellId,
  };
}
