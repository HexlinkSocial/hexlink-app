import { JSX, useState } from "react";
import TableRow from "../TableRow";
import { ApprovalItem } from "../../../helpers/approvalsApiHelpers";
import CheckIcon from "../../icons/CheckIcon";
import CrossIcon from "../../icons/CrossIcon";
import PencilIcon from "../../icons/PencilIcon";
import ActionButton from "./ActionButton";
import AmendPopover from "./AmendPopover";
import ApprovalRowMeta from "./ApprovalRowMeta";
import DescriptionBlock from "../../DescriptionBlock";

type PendingAction = "approve" | "reject" | "amend" | null;

interface ApprovalRowProps {
  item: ApprovalItem;
  isAmending: boolean;
  isDenying: boolean;
  commentText: string;
  onCommentChange: (text: string) => void;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
  onToggleAmend: () => void;
  onToggleDeny: () => void;
  onSubmitAmend: () => Promise<void>;
}

function ApprovalRow({
  item,
  isAmending,
  isDenying,
  commentText,
  onCommentChange,
  onApprove,
  onReject,
  onToggleAmend,
  onToggleDeny,
  onSubmitAmend,
}: ApprovalRowProps): JSX.Element {
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const isDisabled = pendingAction !== null;

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
      <div className="custom-table-row__main">
        <div
          className={`custom-table-row__content${isDisabled ? " custom-table-row__content--disabled" : ""}`}
        >
          <ApprovalRowMeta
            name={item.name}
            ownerEmail={item.ownerEmail}
            cellIds={item.cellIds}
            lastEdited={item.lastEdited}
            hasChangesRequested={item.comments != null}
            whatsapp={item.whatsapp}
            discord={item.discord}
            facebook={item.facebook}
            other={item.other}
          />
          <DescriptionBlock description={item.description} />
        </div>
        <div className="custom-table-row__actions">
          <ActionButton
            title="Approve"
            onClick={handleApprove}
            disabled={isDisabled}
            isPending={pendingAction === "approve"}
            icon={<CheckIcon />}
          />
          <ActionButton
            title="Deny"
            onClick={onToggleDeny}
            disabled={isDisabled}
            icon={<CrossIcon />}
          />
          <ActionButton
            title="Request Amendments"
            onClick={onToggleAmend}
            disabled={isDisabled}
            icon={<PencilIcon />}
          />
        </div>
      </div>
      {isAmending && (
        <div className="custom-table-row__amend-container">
          <AmendPopover
            commentText={commentText}
            onCommentChange={onCommentChange}
            onSubmit={handleSubmitAmend}
            isPending={pendingAction === "amend"}
            isDisabled={isDisabled}
            placeholder="Your change request comment..."
            submitText="Submit"
          />
        </div>
      )}
      {isDenying && (
        <div className="custom-table-row__amend-container">
          <AmendPopover
            commentText={commentText}
            onCommentChange={onCommentChange}
            onSubmit={handleReject}
            isPending={pendingAction === "reject"}
            isDisabled={isDisabled}
            placeholder="Reason for denial (optional)..."
            submitText="Confirm Deny"
            isOptional
          />
        </div>
      )}
    </TableRow>
  );
}

export default ApprovalRow;
