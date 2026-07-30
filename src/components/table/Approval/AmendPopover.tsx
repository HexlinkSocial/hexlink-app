import { JSX } from "react";
import SpinnerIcon from "../../icons/SpinnerIcon";

interface AmendPopoverProps {
  commentText: string;
  onCommentChange: (text: string) => void;
  onSubmit: () => void;
  isPending?: boolean;
  isDisabled?: boolean;
  placeholder?: string;
  submitText?: string;
  isOptional?: boolean;
}

function AmendPopover({
  commentText,
  onCommentChange,
  onSubmit,
  isPending = false,
  isDisabled = false,
  placeholder = "Your change request comment...",
  submitText = "Submit",
  isOptional = false,
}: AmendPopoverProps): JSX.Element {
  const isButtonDisabled =
    (!isOptional && !commentText.trim()) || isDisabled || isPending;

  return (
    <div className="amend-popover">
      <textarea
        className="amend-popover__textarea"
        rows={3}
        placeholder={placeholder}
        value={commentText}
        onChange={(e) => onCommentChange(e.target.value as string)}
      />
      <button
        className="btn btn--primary amend-popover__submit"
        disabled={isButtonDisabled}
        onClick={onSubmit}
      >
        {isPending ? (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <SpinnerIcon />
            <span>Submitting...</span>
          </div>
        ) : (
          submitText
        )}
      </button>
    </div>
  );
}

export default AmendPopover;
