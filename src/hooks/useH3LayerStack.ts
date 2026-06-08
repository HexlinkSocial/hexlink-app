import { useEffect } from "react";
import maplibregl from "maplibre-gl";

const PURPLE_LAYERS = ["h3-counts-r4", "h3-counts-r6", "h3-counts-r8"];
const GRID_SOURCE = "h3_grid_source";
const GRID_LAYER_ID = "h3-grid-fill";

export function useH3LayerStack(
  map: maplibregl.Map | null,
  isMapReady: boolean,
): void {
  useEffect(() => {
    if (map === null || !isMapReady) return;

    const setupUnderlayLayers = () => {
      if (!map.getSource(GRID_SOURCE)) {
        // should already be added
        map.addSource(GRID_SOURCE, {
          type: "vector",
          url: "pmtiles:///tiles/h3-grid.pmtiles",
        });
      }

      // should be added already and either way should live in style.json
      if (!map.getLayer(GRID_LAYER_ID) && map.getSource(GRID_SOURCE)) {
        map.addLayer(
          {
            id: GRID_LAYER_ID,
            type: "fill",
            source: GRID_SOURCE,
            "source-layer": "h3_grid",
            paint: {
              "fill-color": [
                "match",
                ["get", "isActive"],
                1,
                "#5cb04f",
                0,
                "#626262",
                "#626262",
              ],
              "fill-opacity": [
                "match",
                ["get", "isActive"],
                1,
                0.5,
                0,
                0.3,
                0.3,
              ],
              "fill-outline-color": [
                "match",
                ["get", "isActive"],
                1,
                "rgba(76, 160, 63, 0.5)",
                0,
                "rgba(82, 82, 82, 0.4)",
                "rgba(82, 82, 82, 0.4)",
              ],
            },
          },
          "h3-counts-r4",
        );
      }
    };

    try {
      setupUnderlayLayers();
    } catch (error) {
      return;
    }

    let lastFilterKey = "";

    const updateEraseFilter = () => {
      const zoom = map.getZoom();

      // visible purple? is there a nicer way what is this
      const activePurpleLayers = PURPLE_LAYERS.filter((id) => {
        if (!map.getLayer(id)) return false;

        if (id.endsWith("r4") && zoom > 9.5) return false;
        if (id.endsWith("r6") && (zoom < 8.5 || zoom > 12.5)) return false;
        if (id.endsWith("r8") && zoom < 11.5) return false;

        return true;
      });

      if (activePurpleLayers.length === 0) return;

      // can we use something else? maybe why it's a bit slower still
      const features = map.queryRenderedFeatures({
        layers: activePurpleLayers,
      });

      const purpleH3Ids = Array.from(
        new Set(features.map((f) => f.properties?.cell_id || f.properties?.h3)), // probably just need 1 of these
      ).filter(Boolean) as string[];

      // what
      const currentFilterKey = purpleH3Ids.sort().join(",");
      if (currentFilterKey === lastFilterKey) return;
      lastFilterKey = currentFilterKey;

      const filterExpression =
        purpleH3Ids.length > 0
          ? ["!", ["in", ["string", ["get", "h3"]], ["literal", purpleH3Ids]]]
          : null;

      if (map.getLayer(GRID_LAYER_ID)) {
        map.setFilter(GRID_LAYER_ID, filterExpression);
      }
    };

    // probably dont need this?
    map.on("zoom", updateEraseFilter);
    map.on("moveend", updateEraseFilter);

    updateEraseFilter();

    return () => {
      map.off("zoom", updateEraseFilter);
      map.off("moveend", updateEraseFilter);
    };
  }, [map, isMapReady]);
}
