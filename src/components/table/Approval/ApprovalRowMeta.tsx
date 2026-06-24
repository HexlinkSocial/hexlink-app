import { JSX } from "react";

interface ApprovalRowMetaProps {
  name: string;
  ownerEmail: string;
  communityLink?: string | null;
}

function ApprovalRowMeta({
  name,
  ownerEmail,
  communityLink,
}: ApprovalRowMetaProps): JSX.Element {
  return (
    <div className="custom-table-row__meta">
      <span className="custom-table-row__title">{name}</span>
      <span className="custom-table-row__subtitle">
        submitted by {ownerEmail}
      </span>
      {communityLink != null && (
        <span className="custom-table-row__link-wrapper">
          Link:{" "}
          <a
            href={communityLink}
            target="_blank"
            rel="noopener noreferrer"
            className="custom-table-row__link"
          >
            {communityLink}
          </a>
        </span>
      )}
    </div>
  );
}

export default ApprovalRowMeta;
