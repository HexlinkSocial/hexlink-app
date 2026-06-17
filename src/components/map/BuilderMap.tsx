import React from "react";
import { useMapBuilder } from "../../hooks/useMapBuilder";
import { useH3LayerStack } from "../../hooks/useH3LayerStack";
import ErrorBanner from "../ErrorBanner";

const BuilderMap: React.FC<{
  containerRef: React.RefObject<HTMLDivElement | null>;
  onCancel: () => void;
  onDismissError: (err: string) => void;
  dismissedError: unknown;
}> = ({ containerRef, onCancel, onDismissError, dismissedError }) => {
  const { map, isMapReady, selectedCellId, setSelectedCellId, error } =
    useMapBuilder(containerRef);

  useH3LayerStack(map, isMapReady);

  const activeError = error != null && error !== dismissedError ? error : null;

  void selectedCellId;
  void setSelectedCellId;

  return (
    <>
      <ErrorBanner error={activeError} onClose={() => onDismissError(error!)} />
      <button onClick={onCancel}>Cancel</button>
    </>
  );
};

export default BuilderMap;
