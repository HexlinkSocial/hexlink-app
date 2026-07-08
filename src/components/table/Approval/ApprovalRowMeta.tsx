import { JSX } from "react";
import StatusBadge from "../../StatusBadge";

interface ApprovalRowMetaProps {
  name: string;
  ownerEmail: string;
  communityLink?: string | null;
  cellIds?: string[];
  lastEdited?: string | null;
}

function buildH3MapUrl(cellIds?: string[]): string | null {
  if (!cellIds || cellIds.length === 0) {
    return null;
  }
  const encodedIds = cellIds.map((id) => encodeURIComponent(id)).join("%2C+");
  return `https://h3geo.org/#hex=${encodedIds}`;
}

function formatBadgeDate(dateString: string): string {
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "";

  return d.toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function ApprovalRowMeta({
  name,
  ownerEmail,
  communityLink,
  cellIds,
  lastEdited,
}: ApprovalRowMetaProps): JSX.Element {
  const mapUrl = buildH3MapUrl(cellIds);

  return (
    <div className="custom-table-row__meta">
      <span className="custom-table-row__title">{name}</span>
      <span className="custom-table-row__subtitle">
        submitted by {ownerEmail}
      </span>
      {mapUrl != null && (
        <span className="custom-table-row__link-wrapper">
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="custom-table-row__link"
          >
            Map
          </a>
        </span>
      )}
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
      {lastEdited != null && (
        <span className="custom-table-row__link-wrapper custom-table-row__link-wrapper--badge">
          <StatusBadge
            status="pending"
            labelText={`Edited on ${formatBadgeDate(lastEdited)}`}
          />
        </span>
      )}
    </div>
  );
}

export default ApprovalRowMeta;
