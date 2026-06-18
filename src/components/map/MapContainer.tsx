import React, { useRef, useState } from "react";
import BuilderMap from "./BuilderMap";
import DisplayMap from "./DisplayMap";
import type { CameraState } from "../../hooks/useMapCore";

const MapContainer: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const [dismissedError, setDismissedError] = useState<unknown>(null);
  const [isAddingCommunity, setIsAddingCommunity] = useState<boolean>(false);
  const [camera, setCamera] = useState<CameraState | undefined>(undefined);

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />
      {isAddingCommunity ? (
        <BuilderMap
          containerRef={mapContainer}
          initialCamera={camera}
          onDismissError={setDismissedError}
          dismissedError={dismissedError}
          onCancel={() => setIsAddingCommunity(false)}
        />
      ) : (
        <DisplayMap
          containerRef={mapContainer}
          initialCamera={camera}
          onAddCommunity={(cam: CameraState) => {
            setCamera(cam);
            setIsAddingCommunity(true);
          }}
          onDismissError={setDismissedError}
          dismissedError={dismissedError}
        />
      )}
    </div>
  );
};

export default MapContainer;
