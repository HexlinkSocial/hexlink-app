import React, { useEffect } from "react";
import CommunitiesCard from "../communities/CommunitiesCard";
import { useMap } from "../../hooks/useMap";
import { useH3LayerStack } from "../../hooks/useH3LayerStack";
import Banner from "../Banner";
import type { CameraState } from "../../hooks/useMapCore";
import SuccessOverlay from "./components/SuccessOverlay";
import { logger } from "../../helpers/logger";

const DisplayMap: React.FC<{
  containerRef: React.RefObject<HTMLDivElement | null>;
  initialCamera?: CameraState;
  onAddCommunity: (camera: CameraState) => void;
  onDismissError: (err: string) => void;
  dismissedError: unknown;
  showSuccess?: boolean;
  onSuccessDismiss?: () => void;
}> = ({
  containerRef,
  initialCamera,
  onAddCommunity,
  onDismissError,
  dismissedError,
  showSuccess = false,
  onSuccessDismiss,
}) => {
  const {
    map,
    isMapReady,
    selectedCellId,
    selectedCellHasCommunities,
    setSelectedCellId,
    error,
  } = useMap(
    containerRef,
    initialCamera,
    showSuccess ? onSuccessDismiss : undefined,
  );

  useH3LayerStack(map, isMapReady);

  useEffect(() => {
    if (error) {
      logger.error(
        `DisplayMap: Map layers failed to load or initialize: ${error}`
      );
    }
  }, [error, isMapReady, selectedCellId]);

  useEffect(() => {
    if (showSuccess && selectedCellId != null) {
      onSuccessDismiss?.();
    }
  }, [onSuccessDismiss, selectedCellId, showSuccess]);

  const activeError = error != null && error !== dismissedError ? error : null;
  const handleCloseCard = (): void => setSelectedCellId(null);
  const handleAddCommunity = (): void => {
    if (map == null) return;
    onAddCommunity({ center: map.getCenter(), zoom: map.getZoom() });
  };

  return (
    <>
      <Banner message={activeError} onClose={() => onDismissError(error!)} />
      {showSuccess ? (
        <SuccessOverlay onClose={onSuccessDismiss ?? ((): void => {})} />
      ) : (
        <CommunitiesCard
          cellId={selectedCellId}
          hasCommunities={selectedCellHasCommunities}
          onClose={handleCloseCard}
          onAddCommunityClick={handleAddCommunity}
        />
      )}
    </>
  );
};

export default DisplayMap;
