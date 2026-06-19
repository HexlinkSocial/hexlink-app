import React, { useRef, useState } from "react";
import BuilderMap from "./BuilderMap";
import DisplayMap from "./DisplayMap";
import type { CameraState } from "../../hooks/useMapCore";

type MapMode = "display" | "building" | "success";

const PENDING_KEY = "pendingCommunityPayload";

function hasPendingPayload(): boolean {
  return sessionStorage.getItem(PENDING_KEY) !== null;
}

const MapContainer: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const [dismissedError, setDismissedError] = useState<unknown>(null);
  const [mode, setMode] = useState<MapMode>(() =>
    hasPendingPayload() ? "building" : "display",
  );
  const [camera, setCamera] = useState<CameraState | undefined>(undefined);

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />

      {mode === "building" && (
        <BuilderMap
          containerRef={mapContainer}
          initialCamera={camera}
          onDismissError={setDismissedError}
          dismissedError={dismissedError}
          onCancel={() => setMode("display")}
          onSuccess={() => setMode("success")}
        />
      )}

      {mode !== "building" && (
        <DisplayMap
          containerRef={mapContainer}
          initialCamera={camera}
          onAddCommunity={(cam: CameraState) => {
            setCamera(cam);
            setMode("building");
          }}
          onDismissError={setDismissedError}
          dismissedError={dismissedError}
          showSuccess={mode === "success"}
          onSuccessDismiss={() => setMode("display")}
        />
      )}
    </div>
  );
};

export default MapContainer;
