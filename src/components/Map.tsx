import React, { useRef } from "react";
import CommunitiesCard from "./communities/CommunitiesCard";
import { useMapOverlay } from "../hooks/useMapOverlay";
import { useH3LayerStack } from "../hooks/useH3LayerStack";

const Map: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);

  const { map, isMapReady, selectedCellId, setSelectedCellId } =
    useMapOverlay(mapContainer);

  useH3LayerStack(map, isMapReady);

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      <div
        ref={mapContainer}
        style={{
          width: "100%",
          height: "100%",
        }}
      />

      <CommunitiesCard
        cellId={selectedCellId}
        onClose={() => setSelectedCellId(null)}
      />
    </div>
  );
};

export default Map;
