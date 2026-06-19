import { useState } from "react";

const DISMISS_DURATION_MS = 500;

const SuccessOverlay: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [dismissing, setDismissing] = useState(false);

  const handleClose = (): void => {
    setDismissing(true);
    setTimeout(onClose, DISMISS_DURATION_MS);
  };

  return (
    <div
      className={`success-card${dismissing == true ? " success-card--dismissing" : ""}`}
    >
      <p className="success-card__title">Community submitted!</p>
      <p className="success-card__body">
        Thank you for adding your community to the map.
      </p>
      <div className="success-card__actions">
        <button className="success-card__close" onClick={handleClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default SuccessOverlay;
