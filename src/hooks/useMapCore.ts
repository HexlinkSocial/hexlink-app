import { useEffect, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { LngLatLike } from "maplibre-gl";
import { Protocol } from "pmtiles";
import "maplibre-gl/dist/maplibre-gl.css";
import baseStyle from "../../public/style.json";

const protocol = new Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);

export const europeBounds: maplibregl.LngLatBoundsLike = [
  [-25.0, 34.0],
  [45.0, 72.0],
];
export const mapCenter: LngLatLike = [-0.1276, 51.5072];

export const zoomBreakpoints = [9, 12] as const;

export function getNextZoom(currentZoom: number): number {
  const match = zoomBreakpoints.find((z) => currentZoom < z);
  return match ? match + 0.5 : 14;
}

export const getCentre = (
  f: maplibregl.MapGeoJSONFeature,
): maplibregl.LngLatLike => {
  const coords = (f.geometry as GeoJSON.Polygon).coordinates[0];
  const center: [number, number] = [
    coords.reduce((s: number, c: number[]) => s + c[0], 0) / coords.length,
    coords.reduce((s: number, c: number[]) => s + c[1], 0) / coords.length,
  ];
  return center;
};

export function flyToFeature(
  e: maplibregl.MapLayerMouseEvent,
  map: maplibregl.Map,
): void {
  const f = e.features?.[0];
  if (f === undefined) return;
  map.flyTo({
    center: getCentre(f),
    zoom: getNextZoom(map.getZoom() as number),
  });
}

export type CameraState = {
  center: maplibregl.LngLatLike;
  zoom: number;
};

type MapCoreInfo = {
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  map: maplibregl.Map | null;
  isMapReady: boolean;
  error: string | null;
};

export function useMapCore(
  containerRef: React.RefObject<HTMLDivElement | null>,
  initialCamera?: CameraState,
): MapCoreInfo {
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const baseUrl = window.location.origin;

    const style = {
      ...baseStyle,
      sources: {
        ...baseStyle.sources,
        h3_counts: {
          type: "vector",
          url: `pmtiles://${baseUrl}/tiles/h3-counts.pmtiles`,
        },
        h3_grid_source: {
          type: "vector",
          url: `pmtiles://${baseUrl}/tiles/h3-grid.pmtiles`,
        },
      },
    } as maplibregl.StyleSpecification;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style,
      center: initialCamera?.center ?? mapCenter,
      zoom: initialCamera?.zoom ?? 8,
      minZoom: 4,
      maxZoom: 16,
      maxBounds: europeBounds,
      dragRotate: false,
    });

    setMapInstance(map);

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-left",
    );

    map.on("error", (e) => {
      if (e != null && "sourceId" in e) {
        const sourceId = (e as { sourceId: string }).sourceId;
        if (sourceId === "osm") {
          setError("Failed to load background base map layer.");
        } else if (sourceId === "h3_counts" || sourceId === "h3_grid_source") {
          setError("Failed to load map data layers.");
        }
      }
    });

    map.on("load", () => {
      setIsMapReady(true);
    });

    return () => {
      map.remove();
    };
  }, [containerRef, initialCamera?.center, initialCamera?.zoom]);

  return { map: mapInstance, isMapReady, error };
}
