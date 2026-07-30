import React from "react";
import ExternalLinkIcon from "../../icons/ExternalLinkIcon";

interface SelectionLegendProps {
  selectedCount: number;
  onCancel: () => void;
  onNext: () => void;
}
const getHelpDocUrl = (): string => {
  const baseUrl = import.meta.env.VITE_DOCS_URL ?? "https://docs.hexlink.org";
  return `${baseUrl.replace(/\/$/, "")}/docs/tips-for-community-runners/creating-your-community`;
};

const AreaHelpLink: React.FC = () => (
  <p className="info-card__help">
    <a
      href={getHelpDocUrl()}
      target="_blank"
      rel="noopener noreferrer"
      className="info-card__help-link"
    >
      <span>Unsure what to select?</span>
      <ExternalLinkIcon />
    </a>
  </p>
);

const SelectionLegend: React.FC<SelectionLegendProps> = ({
  selectedCount,
  onCancel,
  onNext,
}) => {
  return (
    <div className="info-card">
      <p className="info-card__title">
        Please select the tiles where you want your community to be based
      </p>
      <AreaHelpLink />
      <div className="info-card__legend">
        <div className="info-card__legend-item">
          <span className="info-card__color info-card__color--selected" />
          <span>Selected ({selectedCount})</span>
        </div>
        <div className="info-card__legend-item">
          <span className="info-card__color info-card__color--available" />
          <span>Available for selection</span>
        </div>
        <div className="info-card__legend-item">
          <span className="info-card__color info-card__color--unavailable" />
          <span>Not available</span>
        </div>
      </div>
      <div className="info-card__actions">
        <button
          type="button"
          className="btn btn--secondary btn--flex"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn btn--primary btn--flex"
          onClick={onNext}
          disabled={selectedCount === 0}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default SelectionLegend;
