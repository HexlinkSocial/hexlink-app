import { useEffect } from "react";
import maplibregl from "maplibre-gl";

const GRID_LAYER_ID = "h3-grid-fill";

const LAYER_ZOOM_RULES = [
  { id: "h3-counts-r4", minZoom: 0, maxZoom: 9.5 },
  { id: "h3-counts-r6", minZoom: 8.5, maxZoom: 12.5 },
  { id: "h3-counts-r8", minZoom: 11.5, maxZoom: 24 },
];

export function useH3LayerStack(
  map: maplibregl.Map | null,
  isMapReady: boolean,
): void {
  useEffect(() => {
    if (map === null || !isMapReady) return;

    const updateEraseFilter = (): void => {
      const zoom = map.getZoom();

      const activePurpleLayers = LAYER_ZOOM_RULES.filter(
        (layer) =>
          zoom >= layer.minZoom &&
          zoom <= layer.maxZoom &&
          map.getLayer(layer.id),
      ).map((layer) => layer.id);

      const features = map.queryRenderedFeatures({
        layers: activePurpleLayers,
      });

      const purpleH3Ids = Array.from(
        new Set(features.map((x) => x.properties?.cell_id)),
      );

      const filterExpression =
        purpleH3Ids.length > 0
          ? ["!", ["in", ["string", ["get", "h3"]], ["literal", purpleH3Ids]]]
          : null;
      map.setFilter(GRID_LAYER_ID, filterExpression);
    };

    map.on("moveend", updateEraseFilter);

    updateEraseFilter();
  }, [map, isMapReady]);
}
