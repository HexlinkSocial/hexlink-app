import React from "react";

interface LegendProps {
  selectedCount: number;
  onCancel: () => void;
  onNext: () => void;
}

const Legend: React.FC<LegendProps> = ({ selectedCount, onCancel, onNext }) => {
  return (
    <div className="info-card">
      <p className="info-card-title">
        Please select the tiles where you want your community to be based
      </p>

      <div className="info-card-legend">
        <div className="info-card-legend-item">
          <span className="info-card-color color-selected" />
          <span>Selected ({selectedCount})</span>
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
        <button
          type="button"
          className="btn-submit"
          onClick={onNext}
          disabled={selectedCount === 0}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Legend;
