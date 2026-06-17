import React, { useRef, useState } from "react";
import BuilderMap from "./BuilderMap";
import DisplayMap from "./DisplayMap";

const MapContainer: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const [dismissedError, setDismissedError] = useState<unknown>(null);
  const [isAddingCommunity, setIsAddingCommunity] = useState<boolean>(false);

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />
      {isAddingCommunity ? (
        <BuilderMap
          containerRef={mapContainer}
          onCancel={() => setIsAddingCommunity(false)}
          onDismissError={setDismissedError}
          dismissedError={dismissedError}
        />
      ) : (
        <DisplayMap
          containerRef={mapContainer}
          onAddCommunity={() => setIsAddingCommunity(true)}
          onDismissError={setDismissedError}
          dismissedError={dismissedError}
        />
      )}
    </div>
  );
};

export default MapContainer;
