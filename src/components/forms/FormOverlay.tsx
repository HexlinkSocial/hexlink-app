import React from "react";

interface FormOverlayProps {
  isOpen: boolean;
  title: string;
  submitLabel?: string;
  isSubmitting?: boolean;
  isDisabled?: boolean;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  children: React.ReactNode;
}

const FormOverlay: React.FC<FormOverlayProps> = ({
  isOpen,
  title,
  submitLabel = "Submit",
  isSubmitting = false,
  isDisabled = false,
  onCancel,
  onSubmit,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div className="form-overlay-backdrop">
      <div className="form-overlay-container">
        <form onSubmit={onSubmit} className="form">
          <h2 className="form__heading">{title}</h2>
          <div className="form__body">{children}</div>
          <div className="form__actions">
            <button
              type="button"
              className="btn btn--secondary btn--flex"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn--primary btn--flex"
              disabled={isSubmitting || isDisabled}
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
