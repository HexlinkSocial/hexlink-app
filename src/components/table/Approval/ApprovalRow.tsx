import { JSX } from "react";
import TableRow from "../TableRow";
import { ApprovalItem } from "../../../helpers/approvalsApiHelpers";

interface ApprovalRowProps {
  item: ApprovalItem;
  isAmending: boolean;
  commentText: string;
  onCommentChange: (text: string) => void;
  onApprove: () => void;
  onReject: () => void;
  onToggleAmend: () => void;
  onSubmitAmend: () => void;
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
  return (
    <TableRow>
      <div className="custom-table-row__content">
        <div className="custom-table-row__meta">
          <span className="custom-table-row__title">{item.name}</span>
          <span className="custom-table-row__subtitle">
            submitted by &lt;{item.owner}&gt;
          </span>
        </div>
        <p className="custom-table-row__description">
          {item.description ?? "No description provided."}
        </p>
      </div>

      <div className="custom-table-row__actions">
        <button
          className="custom-table-row__btn"
          title="Approve"
          onClick={onApprove}
        >
          <svg viewBox="0 0 24 24">
            <path
              d="M20 6L9 17l-5-5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <button
          className="custom-table-row__btn"
          title="Reject"
          onClick={onReject}
        >
          <svg viewBox="0 0 24 24">
            <path
              d="M18 6L6 18M6 6l12 12"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <button
          className="custom-table-row__btn"
          title="Request Amendments"
          onClick={onToggleAmend}
        >
          <svg viewBox="0 0 24 24">
            <path
              d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
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
              disabled={!commentText.trim()}
              onClick={onSubmitAmend}
            >
              Submit
            </button>
          </div>
        )}
      </div>
    </TableRow>
  );
}

export default ApprovalRow;
