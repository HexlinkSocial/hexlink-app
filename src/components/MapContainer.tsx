import React, { useRef, useState } from "react";
import CommunitiesCard from "./communities/CommunitiesCard";
import { useMap } from "../hooks/useMap";
import { useH3LayerStack } from "../hooks/useH3LayerStack";
import ErrorBanner from "./ErrorBanner";

const MapContainer: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const [dismissedError, setDismissedError] = useState<unknown>(null);
  const {
    map,
    isMapReady,
    selectedCellId,
    selectedCellHasCommunities,
    setSelectedCellId,
    error,
  } = useMap(mapContainer);
  useH3LayerStack(map, isMapReady);

  const activeError = error != null && error !== dismissedError ? error : null;

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      <ErrorBanner
        error={activeError}
        onClose={() => setDismissedError(error)}
      />
      <div
        ref={mapContainer}
        style={{
          width: "100%",
          height: "100%",
        }}
      />

      <CommunitiesCard
        cellId={selectedCellId}
        hasCommunities={selectedCellHasCommunities}
        onClose={() => setSelectedCellId(null)}
      />
    </div>
  );
};

export default MapContainer;
