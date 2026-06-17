import { useEffect, useState, useRef } from "react";
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set<string>(),
  );
  const [availableIds, setAvailableIds] = useState<Set<string>>(
    new Set<string>(),
  );

  useEffect(() => {
    if (map == null || !isMapReady) return;

    map.setMinZoom(12);
  }, [map, isMapReady]);

  const stateRef = useRef({ selectedIds, availableIds });
  useEffect(() => {
    stateRef.current = { selectedIds, availableIds };
  }, [selectedIds, availableIds]);

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

    const dynamicOutlineId = "h3-grid-dynamic-outline";
    if (
      map.getLayer(dynamicOutlineId) == null &&
      map.getSource("h3_grid_source") != null
    ) {
      map.addLayer(
        {
          id: dynamicOutlineId,
          type: "line",
          source: "h3_grid_source",
          "source-layer": "h3_grid",
          paint: {
            "line-width": 3,
            "line-color": "rgba(0,0,0,0)",
            "line-opacity": 1.0,
          },
        },
        "h3-grid-fill",
      );
    }
  }, [map, isMapReady]);

  useEffect(() => {
    if (map == null || !isMapReady) return;

    const coarseLayers = ["h3-counts-r4", "h3-counts-r6"] as const;
    coarseLayers.forEach((layer) => {
      map.on("click", layer, (e) => flyToFeature(e, map));
    });

    const handleGridClick = (e: maplibregl.MapLayerMouseEvent): void => {
      const f = e.features?.[0];
      if (f === undefined) return;

      const id = f.properties?.h3 as string;
      const { selectedIds: currentSelected, availableIds: currentAvailable } =
        stateRef.current;

      if (currentSelected.size > 0 && !currentAvailable.has(id)) {
        return;
      }

      setSelectedIds((prevSelected) => {
        const nextSelected = new Set(prevSelected);
        nextSelected.add(id);

        setAvailableIds((prevAvailable) => {
          const neighbors = gridDisk(id, 1) as H3Index[];
          const nextAvailable = new Set(prevAvailable);

          neighbors.forEach((nId) => nextAvailable.add(nId as string));

          nextSelected.forEach((sId) => nextAvailable.delete(sId));
          return nextAvailable;
        });

        return nextSelected;
      });
    };

    map.on("click", "h3-grid-fill", handleGridClick);

    return () => {
      map.off("click", "h3-grid-fill", handleGridClick);
    };
  }, [map, isMapReady]);

  useEffect(() => {
    if (map == null || !isMapReady) return;

    const dynamicOutlineId = "h3-grid-dynamic-outline";

    if (selectedIds.size === 0) {
      map.setPaintProperty("h3-grid-fill", "fill-color", [
        "match",
        ["get", "isActive"],
        1,
        "#5cb04f",
        0,
        "#626262",
        "#626262",
      ]);
      map.setPaintProperty("h3-grid-fill", "fill-opacity", [
        "match",
        ["get", "isActive"],
        1,
        0.5,
        0,
        0.3,
        0.3,
      ]);
      map.setPaintProperty("h3-grid-fill", "fill-outline-color", [
        "match",
        ["get", "isActive"],
        1,
        "rgba(76, 160, 63, 0.5)",
        0,
        "rgba(82, 82, 82, 0.4)",
        "rgba(82, 82, 82, 0.4)",
      ]);

      if (map.getLayer(dynamicOutlineId) != null) {
        map.setPaintProperty(dynamicOutlineId, "line-color", [
          "match",
          ["get", "isActive"],
          1,
          "rgba(76, 160, 63, 0.5)",
          0,
          "rgba(82, 82, 82, 0.4)",
          "rgba(82, 82, 82, 0.4)",
        ]);
      }
      return;
    }

    const fillColorExpr: unknown[] = ["match", ["get", "h3"]];
    const fillOpacityExpr: unknown[] = ["match", ["get", "h3"]];

    selectedIds.forEach((id) => {
      fillColorExpr.push(id, "#73197A");
      fillOpacityExpr.push(id, 0.6);
    });

    availableIds.forEach((id) => {
      fillColorExpr.push(id, "#5cb04f");
      fillOpacityExpr.push(id, 0.5);
    });

    fillColorExpr.push("#626262");
    fillOpacityExpr.push(0.3);

    map.setPaintProperty("h3-grid-fill", "fill-color", fillColorExpr);
    map.setPaintProperty("h3-grid-fill", "fill-opacity", fillOpacityExpr);

    map.setPaintProperty("h3-grid-fill", "fill-outline-color", "rgba(0,0,0,0)");

    if (map.getLayer(dynamicOutlineId) != null) {
      const lineColorExpr: unknown[] = ["match", ["get", "h3"]];

      selectedIds.forEach((id) => {
        lineColorExpr.push(id, "#73197A");
      });

      availableIds.forEach((id) => {
        lineColorExpr.push(id, "rgba(76, 160, 63, 0.5)");
      });

      lineColorExpr.push("rgba(82, 82, 82, 0.4)");

      map.setPaintProperty(dynamicOutlineId, "line-color", lineColorExpr);
    }
  }, [map, isMapReady, selectedIds, availableIds]);

  return { map, isMapReady, error };
}
