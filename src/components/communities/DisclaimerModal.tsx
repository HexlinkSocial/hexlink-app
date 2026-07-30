import React from "react";
import { createPortal } from "react-dom";
import { getDocsUrl } from "../../helpers/docsUrl";

interface DisclaimerModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const GovernanceLinks: React.FC = () => (
  <p className="disclaimer-modal-terms">
    By accessing this link you agree to our{" "}
    <a
      href={getDocsUrl("docs/governance/terms-and-conditions")}
      target="_blank"
      rel="noopener noreferrer"
    >
      terms and conditions
    </a>{" "}
    and{" "}
    <a
      href={getDocsUrl("docs/governance/community-guidelines")}
      target="_blank"
      rel="noopener noreferrer"
    >
      community guidelines
    </a>
    .
  </p>
);

const MemberTipsLink: React.FC = () => (
  <p className="disclaimer-modal-tips">
    Check out our{" "}
    <a
      href={getDocsUrl("docs/category/tips-for-community-members")}
      target="_blank"
      rel="noopener noreferrer"
    >
      tips for community members
    </a>
    .
  </p>
);

export const DisclaimerModal: React.FC<DisclaimerModalProps> = ({
  isOpen,
  onCancel,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="disclaimer-modal-overlay">
      <div className="disclaimer-modal-content">
        <h3>Leaving Our Website</h3>
        <p>
          This link will take you to an independent community managed
          externally. We do not screen, monitor, or accept liability for
          interaction, content, or data protection on external applications.
        </p>
        <GovernanceLinks />
        <MemberTipsLink />
        <div className="disclaimer-modal-actions">
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
            onClick={onConfirm}
          >
            Continue
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
