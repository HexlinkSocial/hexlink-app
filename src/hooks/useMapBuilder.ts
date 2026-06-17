import { useEffect, useState } from "react";
import * as maplibregl from "maplibre-gl";
import { flyToFeature, useMapCore, type CameraState } from "./useMapCore";
import { gridDisk, H3Index } from "h3-js";
type MapBuilderInfo = {
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  map: maplibregl.Map | null;
  isMapReady: boolean;
  error: string | null;
};

export function useMapBuilder(
  containerRef: React.RefObject<HTMLDivElement | null>,
  initialCamera?: CameraState,
): MapBuilderInfo {
  const { map, isMapReady, error } = useMapCore(containerRef, initialCamera);
  const [selectedIds, addSelectedId] = useState<Set<string>>(new Set<string>());
  const [availableIds, addAvailableIds] = useState<Set<string> | null>(null);

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

      const id = f.properties?.h3 as string;

      addSelectedId((ids) => ids.add(id));
      addAvailableIds((ids) => {
        const currentSet = ids ?? new Set<string>();
        const newIds = new Set(gridDisk(id, 1) as H3Index[]);
        return currentSet.union(newIds).difference(selectedIds);
      });
    });
  }, [map, isMapReady, selectedIds, availableIds]);

  return { map, isMapReady, error };
}
