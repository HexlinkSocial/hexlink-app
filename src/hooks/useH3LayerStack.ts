import { useEffect, useRef } from "react";
import maplibregl, { FilterSpecification } from "maplibre-gl";

const GRID_LAYER_ID = "h3-grid-fill";

const LAYER_ZOOM_RULES = [
  { id: "h3-counts-r4", minZoom: 0, maxZoom: 9.5 },
  { id: "h3-counts-r6", minZoom: 8.5, maxZoom: 12.5 },
  { id: "h3-counts-r8", minZoom: 11.5, maxZoom: 24 },
];

export function useH3LayerStack(
  /* eslint-disable @typescript-eslint/no-redundant-type-constituents */
  map: maplibregl.Map | null,
  isMapReady: boolean,
): void {
  const lastFilterStrRef = useRef<string>("");

  useEffect(() => {
    if (map === null || !isMapReady) return;

    const updateEraseFilter = (): void => {
      const zoom = map.getZoom();

      const activePurpleLayers = LAYER_ZOOM_RULES.filter(
        (layer) => zoom >= layer.minZoom && zoom <= layer.maxZoom,
      ).map((layer) => layer.id);

      if (activePurpleLayers.length === 0) {
        if (lastFilterStrRef.current !== "null") {
          map.setFilter(GRID_LAYER_ID, null);
          lastFilterStrRef.current = "null";
        }
        return;
      }

      const features = map.queryRenderedFeatures({
        layers: activePurpleLayers,
      });

      const purpleH3Ids = Array.from(
        new Set(
          features
            .map((x) => x.properties?.cell_id)
            .filter(Boolean) as string[],
        ),
      );

      let filterExpression: FilterSpecification | null = null;
      if (purpleH3Ids.length > 0) {
        filterExpression = [
          "match",
          ["string", ["get", "h3"]],
          purpleH3Ids.map(String),
          false,
          true,
        ];
      }

      const currentFilterStr = JSON.stringify(filterExpression);
      if (currentFilterStr !== lastFilterStrRef.current) {
        map.setFilter(GRID_LAYER_ID, filterExpression);
        lastFilterStrRef.current = currentFilterStr;
      }
    };

    map.on("move", updateEraseFilter);
    map.on("sourcedata", updateEraseFilter);

    updateEraseFilter();

    return () => {
      map.off("move", updateEraseFilter);
      map.off("sourcedata", updateEraseFilter);
    };
  }, [map, isMapReady]);
}
