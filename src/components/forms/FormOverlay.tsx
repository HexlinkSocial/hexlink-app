import React from "react";
import "../../styles/FormOverlay.css";

interface FormOverlayProps {
  isOpen: boolean;
  title: string;
  submitLabel?: string;
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  children: React.ReactNode;
}

const FormOverlay: React.FC<FormOverlayProps> = ({
  isOpen,
  title,
  submitLabel = "Submit",
  isSubmitting = false,
  onCancel,
  onSubmit,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div className="form-overlay-backdrop">
      <div className="form-overlay-container">
        <form onSubmit={onSubmit} className="generic-overlay-form">
          <h2 className="form-heading">{title}</h2>

          <div className="form-fields-body">{children}</div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormOverlay;
