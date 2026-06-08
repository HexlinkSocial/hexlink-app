import { useEffect, useRef, useState } from "react";
import maplibregl, { LngLatLike } from "maplibre-gl";
import { Protocol } from "pmtiles";

const protocol = new Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);

const zoomBreakpoints = [
  { maxZoom: 8, nextZoom: 11 },
  { maxZoom: 11, nextZoom: 14 },
] as const;

function getNextZoom(currentZoom: number): number {
  const match = zoomBreakpoints.find((z) => currentZoom <= z.maxZoom);
  return match?.nextZoom ?? 14;
}

const europeBounds: maplibregl.LngLatBoundsLike = [
  [-25.0, 34.0],
  [45.0, 72.0],
];
const mapCenter: LngLatLike = [-0.1276, 51.5072];

type MapInfo = {
  map: maplibregl.Map | null;
  isMapReady: boolean;
  selectedCellId: string | null;
  setSelectedCellId: React.Dispatch<React.SetStateAction<string | null>>;
};

export function useMapOverlay(
  containerRef: React.RefObject<HTMLDivElement | null>,
): MapInfo {
  // do we need both map ref and map instance?
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current !== null) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "/style.json",
      center: mapCenter,
      zoom: 8,
      minZoom: 4,
      maxZoom: 16,
      maxBounds: europeBounds,
    });

    // why are we doing this?
    mapRef.current = map;
    (window as any)._map = map;
    setMapInstance(map);

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-left",
    );

    map.on("load", () => {
      setIsMapReady(true);
    });

    // TODO might need some tinkering
    const getCentre = (
      f: maplibregl.MapGeoJSONFeature,
    ): maplibregl.LngLatLike => {
      const coords = (f.geometry as GeoJSON.Polygon).coordinates[0];

      const center: [number, number] = [
        coords.reduce((s, c) => s + c[0], 0) / coords.length,
        coords.reduce((s, c) => s + c[1], 0) / coords.length,
      ];

      return center;
    };

    const closeCard = (): void => setSelectedCellId(null);

    const flyToFeature = (e: maplibregl.MapLayerMouseEvent): void => {
      const f = e.features?.[0];
      if (f === undefined) return;

      map.flyTo({
        center: getCentre(f),
        zoom: getNextZoom(map.getZoom() as number), // TODO zooms might need tinkering too
      });
    };

    const openCard = (e: maplibregl.MapLayerMouseEvent): void => {
      const id = (f.properties?.cell_id || f.properties?.h3) as
        | string
        | undefined;
      if (id === undefined) return;

      map.flyTo({
        center: getCentre(f),
        zoom: map.getZoom(),
      });

      setSelectedCellId(id);
    };

    map.on("dragstart", closeCard);
    map.on("zoomstart", closeCard);

    map.on("load", () => {
      const coarseLayers = [
        "h3-active-r4",
        "h3-active-r6",
        "h3-counts-r4",
        "h3-counts-r6",
      ] as const;

      coarseLayers.forEach((layer) => {
        if (map.getLayer(layer)) map.on("click", layer, flyToFeature);
      });

      const fineLayers = ["h3-active-r8", "h3-counts-r8"] as const;

      // active cards don't work - check if IDs are right?
      fineLayers.forEach((layer) => {
        if (map.getLayer(layer)) map.on("click", layer, openCard);
      });
    });

    return () => {
      // what does all the removing do
      map.remove();
      mapRef.current = null;
      setMapInstance(null);
    };
  }, [containerRef]);

  return {
    map: mapInstance,
    isMapReady,
    selectedCellId,
    setSelectedCellId,
  };
}
