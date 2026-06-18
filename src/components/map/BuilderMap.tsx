import React from "react";
import { useMapBuilder } from "../../hooks/useMapBuilder";
import { useH3LayerStack } from "../../hooks/useH3LayerStack";
import ErrorBanner from "../ErrorBanner";
import type { CameraState } from "../../hooks/useMapCore";
import "../../styles/InfoCard.css";

const BuilderMap: React.FC<{
  containerRef: React.RefObject<HTMLDivElement | null>;
  initialCamera?: CameraState;
  onDismissError: (err: string) => void;
  dismissedError: unknown;
  onCancel: () => void;
}> = ({
  containerRef,
  initialCamera,
  onDismissError,
  dismissedError,
  onCancel,
}) => {
  const { map, isMapReady, error } = useMapBuilder(containerRef, initialCamera);

  useH3LayerStack(map, isMapReady);

  const activeError = error != null && error !== dismissedError ? error : null;

  const handleSubmit = (): void => {
    // Placeholder execution placeholder context
  };

  return (
    <>
      <ErrorBanner error={activeError} onClose={() => onDismissError(error!)} />

      <div className="info-card">
        <p className="info-card-title">
          Please select the tiles where you want your community to be based
        </p>

        <div className="info-card-legend">
          <div className="info-card-legend-item">
            <span className="info-card-color color-selected" />
            <span>Selected</span>
          </div>
          <div className="info-card-legend-item">
            <span className="info-card-color color-available" />
            <span>Available for selection</span>
          </div>
          <div className="info-card-legend-item">
            <span className="info-card-color color-unavailable" />
            <span>Not available</span>
          </div>
        </div>

        <div className="info-card-actions">
          <button type="button" className="btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn-submit" onClick={handleSubmit}>
            Next
          </button>
        </div>
      </div>
    </>
  );
};

export default BuilderMap;
