import { JSX, useState } from "react";
import TableRow from "../TableRow";
import { ApprovalItem } from "../../../helpers/approvalsApiHelpers";
import CheckIcon from "../../icons/CheckIcon";
import CrossIcon from "../../icons/CrossIcon";
import PencilIcon from "../../icons/PencilIcon";
import SpinnerIcon from "../../icons/SpinnerIcon";

const MAX_DESCRIPTION_LENGTH = 200;

type PendingAction = "approve" | "reject" | "amend" | null;

interface ApprovalRowProps {
  item: ApprovalItem;
  isAmending: boolean;
  commentText: string;
  onCommentChange: (text: string) => void;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
  onToggleAmend: () => void;
  onSubmitAmend: () => Promise<void>;
}

function ApprovalRow({
  item,
  isAmending,
  commentText,
  onCommentChange,
  onApprove,
  onReject,
  onToggleAmend,
  onSubmitAmend,
}: ApprovalRowProps): JSX.Element {
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const isDisabled = pendingAction !== null;
  const description = item.description ?? "No description provided.";
  const isTruncatable = description.length > MAX_DESCRIPTION_LENGTH;

  const displayedDescription =
    isTruncatable && !isExpanded
      ? `${description.slice(0, MAX_DESCRIPTION_LENGTH)}...`
      : description;

  async function handleApprove(): Promise<void> {
    setPendingAction("approve");
    try {
      await onApprove();
    } finally {
      setPendingAction(null);
    }
  }

  async function handleReject(): Promise<void> {
    setPendingAction("reject");
    try {
      await onReject();
    } finally {
      setPendingAction(null);
    }
  }

  async function handleSubmitAmend(): Promise<void> {
    setPendingAction("amend");
    try {
      await onSubmitAmend();
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <TableRow>
      <div
        className={`custom-table-row__content${isDisabled ? " custom-table-row__content--disabled" : ""}${isExpanded ? " custom-table-row__content--expanded" : ""}`}
      >
        <div className="custom-table-row__meta">
          <span className="custom-table-row__title">{item.name}</span>
          <span className="custom-table-row__subtitle">
            submitted by {item.ownerEmail}
          </span>
        </div>
        <div className="custom-table-row__description-container">
          <p
            className={`custom-table-row__description${!isExpanded ? " custom-table-row__description--clamped" : ""}`}
          >
            {displayedDescription}
          </p>
          {item.description != null && isTruncatable && (
            <button
              type="button"
              className="custom-table-row__toggle-description-btn"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      </div>
      <div className="custom-table-row__actions">
        <button
          className="custom-table-row__btn"
          title="Approve"
          onClick={handleApprove}
          disabled={isDisabled}
        >
          {pendingAction === "approve" ? <SpinnerIcon /> : <CheckIcon />}
        </button>
        <button
          className="custom-table-row__btn"
          title="Reject"
          onClick={handleReject}
          disabled={isDisabled}
        >
          {pendingAction === "reject" ? <SpinnerIcon /> : <CrossIcon />}
        </button>
        <button
          className="custom-table-row__btn"
          title="Request Amendments"
          onClick={onToggleAmend}
          disabled={isDisabled}
        >
          <PencilIcon />
        </button>
        {isAmending && (
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
              onClick={handleSubmitAmend}
            >
              {pendingAction === "amend" ? <SpinnerIcon /> : "Submit"}
            </button>
          </div>
        )}
      </div>
    </TableRow>
  );
}

export default ApprovalRow;
