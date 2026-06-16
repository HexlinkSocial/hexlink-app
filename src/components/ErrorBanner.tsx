import React from "react";
import "../styles/ErrorBanner.css";

interface MapErrorBannerProps {
  error: string | null;
  onClose: () => void;
}

const MapErrorBanner: React.FC<MapErrorBannerProps> = ({ error, onClose }) => {
  if (error == null) return null;

  return (
    <div className="error-banner">
      <div className="error-content">
        {error} <br />
        <span className="error-subtext">
          Please refresh the page or try again later.
        </span>
      </div>
      <button
        className="error-close-btn"
        onClick={onClose}
        aria-label="Close error banner"
      >
        &times;
      </button>
    </div>
  );
};

export default MapErrorBanner;
