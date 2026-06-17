import React from "react";
import { useMapBuilder } from "../../hooks/useMapBuilder";
import { useH3LayerStack } from "../../hooks/useH3LayerStack";
import ErrorBanner from "../ErrorBanner";
import type { CameraState } from "../../hooks/useMapCore";

const BuilderMap: React.FC<{
  containerRef: React.RefObject<HTMLDivElement | null>;
  initialCamera?: CameraState;
  onDismissError: (err: string) => void;
  dismissedError: unknown;
}> = ({ containerRef, initialCamera, onDismissError, dismissedError }) => {
  const { map, isMapReady, selectedCellId, setSelectedCellId, error } =
    useMapBuilder(containerRef, initialCamera);

  useH3LayerStack(map, isMapReady);

  const activeError = error != null && error !== dismissedError ? error : null;

  void selectedCellId;
  void setSelectedCellId;

  return (
    <>
      <ErrorBanner error={activeError} onClose={() => onDismissError(error!)} />
    </>
  );
};

export default BuilderMap;
