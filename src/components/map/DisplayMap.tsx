import React from "react";
import CommunitiesCard from "../communities/CommunitiesCard";
import { useMap } from "../../hooks/useMap";
import { useH3LayerStack } from "../../hooks/useH3LayerStack";
import ErrorBanner from "../ErrorBanner";
import type { CameraState } from "../../hooks/useMapCore";

const DisplayMap: React.FC<{
  containerRef: React.RefObject<HTMLDivElement | null>;
  initialCamera?: CameraState;
  onAddCommunity: (camera: CameraState) => void;
  onDismissError: (err: string) => void;
  dismissedError: unknown;
}> = ({
  containerRef,
  initialCamera,
  onAddCommunity,
  onDismissError,
  dismissedError,
}) => {
  const {
    map,
    isMapReady,
    selectedCellId,
    selectedCellHasCommunities,
    setSelectedCellId,
    error,
  } = useMap(containerRef, initialCamera);
  useH3LayerStack(map, isMapReady);
  const activeError = error != null && error !== dismissedError ? error : null;
  const handleCloseCard = (): void => setSelectedCellId(null);

  const handleAddCommunity = (): void => {
    if (map == null) return;
    onAddCommunity({ center: map.getCenter(), zoom: map.getZoom() });
  };

  return (
    <>
      <ErrorBanner error={activeError} onClose={() => onDismissError(error!)} />
      <CommunitiesCard
        cellId={selectedCellId}
        hasCommunities={selectedCellHasCommunities}
        onClose={handleCloseCard}
        onAddCommunityClick={handleAddCommunity}
      />
    </>
  );
};

export default DisplayMap;
