import React, { useState } from "react";
import ExternalLinkIcon from "../../icons/ExternalLinkIcon";
import { getDocsUrl } from "../../../helpers/docsUrl";

const DISMISS_DURATION_MS = 500;

const SuccessOverlay: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [dismissing, setDismissing] = useState(false);

  const handleClose = (): void => {
    setDismissing(true);
    setTimeout(onClose, DISMISS_DURATION_MS);
  };

  const tipsUrl = getDocsUrl("docs/category/tips-for-community-runners");

  return (
    <div
      className={`success-card${dismissing ? " success-card--dismissing" : ""}`}
    >
      <p className="success-card__title">Community submitted!</p>
      <p className="success-card__body">
        Thank you for adding your community. It will be reviewed by our internal
        team before it can appear on the map. In the meantime,{" "}
        <a href={tipsUrl} target="_blank" rel="noopener noreferrer">
          <span>have a look at our community runner tips</span>
          <ExternalLinkIcon />
        </a>
        .
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
