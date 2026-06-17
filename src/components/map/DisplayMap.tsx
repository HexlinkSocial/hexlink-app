import React from "react";
import CommunitiesCard from "../communities/CommunitiesCard";
import { useMap } from "../../hooks/useMap";
import { useH3LayerStack } from "../../hooks/useH3LayerStack";
import ErrorBanner from "../ErrorBanner";

const DisplayMap: React.FC<{
  containerRef: React.RefObject<HTMLDivElement | null>;
  onAddCommunity: () => void;
  onDismissError: (err: string) => void;
  dismissedError: unknown;
}> = ({ containerRef, onAddCommunity, onDismissError, dismissedError }) => {
  const {
    map,
    isMapReady,
    selectedCellId,
    selectedCellHasCommunities,
    setSelectedCellId,
    error,
  } = useMap(containerRef);

  useH3LayerStack(map, isMapReady);

  const activeError = error != null && error !== dismissedError ? error : null;

  const handleCloseCard = () => setSelectedCellId(null);

  return (
    <>
      <ErrorBanner error={activeError} onClose={() => onDismissError(error!)} />
      <CommunitiesCard
        cellId={selectedCellId}
        hasCommunities={selectedCellHasCommunities}
        onClose={handleCloseCard}
        onAddCommunityClick={onAddCommunity}
      />
    </>
  );
};

export default DisplayMap;
