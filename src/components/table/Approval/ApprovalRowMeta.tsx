import { JSX } from "react";
import StatusBadge from "../../StatusBadge";
import DiscordIcon from "../../icons/DiscordIcon";
import FacebookIcon from "../../icons/FacebookIcon";
import WhatsAppIcon from "../../icons/WhatsAppIcon";
import OtherIcon from "../../icons/OtherIcon";

interface ApprovalRowMetaProps {
  name: string;
  ownerEmail: string;
  cellIds?: string[];
  lastEdited?: string | null;
  hasChangesRequested?: boolean;
  whatsapp?: string | null;
  discord?: string | null;
  facebook?: string | null;
  other?: string | null;
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
  cellIds,
  lastEdited,
  hasChangesRequested,
  whatsapp,
  discord,
  facebook,
  other,
}: ApprovalRowMetaProps): JSX.Element {
  const mapUrl = buildH3MapUrl(cellIds);

  return (
    <div className="custom-table-row__meta">
      <span className="custom-table-row__title">{name}</span>
      <span className="custom-table-row__subtitle">
        submitted by {ownerEmail}
      </span>

      <div className="custom-table-row__links-group">
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
        {whatsapp && (
          <span className="custom-table-row__link-wrapper custom-table-row__link-wrapper--icon-pair">
            <WhatsAppIcon />
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="custom-table-row__link"
            >
              {whatsapp}
            </a>
          </span>
        )}
        {discord && (
          <span className="custom-table-row__link-wrapper custom-table-row__link-wrapper--icon-pair">
            <DiscordIcon />
            <a
              href={discord}
              target="_blank"
              rel="noopener noreferrer"
              className="custom-table-row__link"
            >
              {discord}
            </a>
          </span>
        )}
        {facebook && (
          <span className="custom-table-row__link-wrapper custom-table-row__link-wrapper--icon-pair">
            <FacebookIcon />
            <a
              href={facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="custom-table-row__link"
            >
              {facebook}
            </a>
          </span>
        )}
        {other && (
          <span className="custom-table-row__link-wrapper custom-table-row__link-wrapper--icon-pair">
            <OtherIcon />
            <a
              href={other}
              target="_blank"
              rel="noopener noreferrer"
              className="custom-table-row__link"
            >
              {other}
            </a>
          </span>
        )}
      </div>

      {hasChangesRequested ? (
        <span className="custom-table-row__link-wrapper custom-table-row__link-wrapper--badge">
          <StatusBadge status="amendments_requested" />
        </span>
      ) : (
        lastEdited != null && (
          <span className="custom-table-row__link-wrapper custom-table-row__link-wrapper--badge">
            <StatusBadge
              status="pending"
              labelText={`Edited on ${formatBadgeDate(lastEdited)}`}
            />
          </span>
        )
      )}
    </div>
  );
}

export default ApprovalRowMeta;
