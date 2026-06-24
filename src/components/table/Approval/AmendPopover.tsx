import { JSX } from "react";
import SpinnerIcon from "../../icons/SpinnerIcon";

interface AmendPopoverProps {
  commentText: string;
  onCommentChange: (text: string) => void;
  onSubmit: () => void;
  isPending?: boolean;
  isDisabled?: boolean;
}

function AmendPopover({
  commentText,
  onCommentChange,
  onSubmit,
  isPending = false,
  isDisabled = false,
}: AmendPopoverProps): JSX.Element {
  return (
    <div className="amend-popover">
      <textarea
        className="amend-popover__textarea"
        rows={3}
        placeholder="Your change request comment..."
        value={commentText}
        onChange={(e) => onCommentChange(e.target.value as string)}
      />
      <button
        className="btn btn--primary amend-popover__submit"
        disabled={!commentText.trim() || isDisabled}
        onClick={onSubmit}
      >
        {isPending ? <SpinnerIcon /> : "Submit"}
      </button>
    </div>
  );
}

export default AmendPopover;
