import { useEffect, useState } from "react";
import * as maplibregl from "maplibre-gl";
import {
  useMapCore,
  getCentre,
  flyToFeature,
  type CameraState,
} from "./useMapCore";

type MapBuilderInfo = {
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  map: maplibregl.Map | null;
  isMapReady: boolean;
  selectedCellId: string | null;
  setSelectedCellId: React.Dispatch<React.SetStateAction<string | null>>;
  error: string | null;
};

export function useMapBuilder(
  containerRef: React.RefObject<HTMLDivElement | null>,
  initialCamera?: CameraState,
): MapBuilderInfo {
  const { map, isMapReady, error } = useMapCore(containerRef, initialCamera);
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);

  useEffect(() => {
    if (map == null || !isMapReady) return;

    const purpleLayers = [
      "h3-counts-r4",
      "h3-counts-outline-r4",
      "h3-counts-r6",
      "h3-counts-outline-r6",
      "h3-counts-r8",
      "h3-counts-outline-r8",
    ];

    purpleLayers.forEach((layerId) => {
      if (map.getLayer(layerId) != null) {
        map.setLayoutProperty(layerId, "visibility", "none");
      }
    });
  }, [map, isMapReady]);

  useEffect(() => {
    if (map == null || !isMapReady) return;

    const coarseLayers = ["h3-counts-r4", "h3-counts-r6"] as const;
    coarseLayers.forEach((layer) => {
      map.on("click", layer, (e) => flyToFeature(e, map));
    });

    map.on("click", "h3-grid-fill", (e) => {
      const f = e.features?.[0];
      if (f === undefined) return;

      const id = f.properties?.cell_id as string;

      map.flyTo({
        center: getCentre(f),
        zoom: map.getZoom(),
      });

      setSelectedCellId(id);
    });

    map.on("dragstart", () => setSelectedCellId(null));
    map.on("zoomstart", () => setSelectedCellId(null));
  }, [map, isMapReady]);

  return { map, isMapReady, selectedCellId, setSelectedCellId, error };
}
