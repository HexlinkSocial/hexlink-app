import { JSX, useEffect, useRef } from "react";
import { UnifiedCommunityItem } from "../../helpers/userCommunitiesApiHelpers";

interface DeleteCommunityConfirmationModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  item: UnifiedCommunityItem | null;
  scope: "approval" | "production" | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DeleteCommunityConfirmationModal({
  isOpen,
  isSubmitting,
  item,
  scope,
  onCancel,
  onConfirm,
}: DeleteCommunityConfirmationModalProps): JSX.Element | null {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen || !item) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.target === overlayRef.current) {
      onCancel();
    }
  };

  return (
    <div
      ref={overlayRef}
      className="modal-overlay"
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title-id"
      >
        <h2 id="modal-title-id" className="modal-title">
          Delete Community
        </h2>

        <p className="modal-text">
          Are you sure you want to delete <strong>{item.name}</strong>?{" "}
          {scope === "production"
            ? "This will permanently remove the production community from your profile, along with any pending revisions. It will completely disappear from the map within 24 hours."
            : "This will discard your pending review edits. Your live production map data will remain unchanged."}
        </p>

        <div className="modal-actions">
          <button
            className="btn btn--primary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            No, Cancel
          </button>
          <button
            className="btn btn--primary"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Deleting..." : "Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
