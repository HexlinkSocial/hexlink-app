import { JSX, useState } from "react";
import TableRow from "../TableRow";
import { ApprovalItem } from "../../../helpers/approvalsApiHelpers";
import CheckIcon from "../../icons/CheckIcon";
import CrossIcon from "../../icons/CrossIcon";
import PencilIcon from "../../icons/PencilIcon";
import ActionButton from "./ActionButton";
import AmendPopover from "./AmendPopover";
import ApprovalRowMeta from "./ApprovalRowMeta";
import DescriptionBlock from "./DescriptionBlock";

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
      <div
        className={`custom-table-row__content${isDisabled ? " custom-table-row__content--disabled" : ""}`}
      >
        <ApprovalRowMeta
          name={item.name}
          ownerEmail={item.ownerEmail}
          communityLink={item.communityLink}
          cellIds={item.cellIds}
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
          title="Reject"
          onClick={handleReject}
          disabled={isDisabled}
          isPending={pendingAction === "reject"}
          icon={<CrossIcon />}
        />
        <ActionButton
          title="Request Amendments"
          onClick={onToggleAmend}
          disabled={isDisabled}
          icon={<PencilIcon />}
        />
        {isAmending && (
          <AmendPopover
            commentText={commentText}
            onCommentChange={onCommentChange}
            onSubmit={handleSubmitAmend}
            isPending={pendingAction === "amend"}
            isDisabled={isDisabled}
          />
        )}
      </div>
    </TableRow>
  );
}

export default ApprovalRow;
