import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import {
  useMapCore,
  getCentre,
  flyToFeature,
  type CameraState,
} from "./useMapCore";

const closeCard = (
  setSelectedCellId: React.Dispatch<React.SetStateAction<string | null>>,
): void => setSelectedCellId(null);

const openCard = (
  e: maplibregl.MapLayerMouseEvent,
  map: maplibregl.Map,
  setSelectedCellId: React.Dispatch<React.SetStateAction<string | null>>,
  setSelectedCellHasCommunities: React.Dispatch<React.SetStateAction<boolean>>,
): void => {
  const f = e.features?.[0];
  if (f === undefined) return;

  const resolution = f.properties?.resolution;
  if (resolution !== undefined && Number(resolution) !== 8) {
    flyToFeature(e, map);
    return;
  }

  const id = f.properties?.cell_id as string;

  map.flyTo({
    center: getCentre(f),
    zoom: map.getZoom(),
  });

  setSelectedCellId(id);
  setSelectedCellHasCommunities(f.properties.communities_count > 0);
};

type MapInfo = {
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  map: maplibregl.Map | null;
  isMapReady: boolean;
  selectedCellId: string | null;
  selectedCellHasCommunities: boolean;
  setSelectedCellId: React.Dispatch<React.SetStateAction<string | null>>;
  error: string | null;
};

export function useMap(
  containerRef: React.RefObject<HTMLDivElement | null>,
  initialCamera?: CameraState,
  onBeforeCellSelect?: () => void,
): MapInfo {
  const { map, isMapReady, error } = useMapCore(containerRef, initialCamera);
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);
  const [selectedCellHasCommunities, setSelectedCellHasCommunities] =
    useState<boolean>(false);

  const onBeforeCellSelectRef = useRef(onBeforeCellSelect);
  useEffect(() => {
    onBeforeCellSelectRef.current = onBeforeCellSelect;
  }, [onBeforeCellSelect]);

  useEffect(() => {
    if (map == null || !isMapReady) return;

    map.on("dragstart", () => closeCard(setSelectedCellId));
    map.on("zoomstart", () => closeCard(setSelectedCellId));

    const coarseLayers = ["h3-counts-r4", "h3-counts-r6"] as const;
    coarseLayers.forEach((layer) => {
      map.on("click", layer, (e) => flyToFeature(e, map));
    });

    const fineLayers = ["h3-counts-r8", "h3-grid-fill"] as const;
    fineLayers.forEach((layer) => {
      map.on("click", layer, (e) => {
        onBeforeCellSelectRef.current?.();
        openCard(e, map, setSelectedCellId, setSelectedCellHasCommunities);
      });
    });
  }, [map, isMapReady]);

  return {
    map,
    isMapReady,
    selectedCellId,
    selectedCellHasCommunities,
    setSelectedCellId,
    error,
  };
}
