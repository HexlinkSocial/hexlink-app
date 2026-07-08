import { JSX } from "react";
import { UnifiedCommunityItem } from "../../../helpers/userCommunitiesApiHelpers";
import StatusBadge from "../../StatusBadge";
import DescriptionBlock from "../../DescriptionBlock";
import PencilIcon from "../../icons/PencilIcon";
import TrashIcon from "../../icons/TrashIcon";

interface CommunityCardProps {
  item: UnifiedCommunityItem;
  onEditClick: (item: UnifiedCommunityItem) => void;
  onDeleteClick: (item: UnifiedCommunityItem) => void;
}

function CommunityManagementCard({
  item,
  onEditClick,
  onDeleteClick,
}: CommunityCardProps): JSX.Element {
  return (
    <div className="custom-table-row">
      <div className="custom-table-row__header">
        <div className="custom-table-row__meta">
          <h2 className="custom-table-row__title">{item.name}</h2>
        </div>

        <div className="custom-table-row__actions">
          <StatusBadge status={item.status} />
          <button
            className="custom-table-row__btn custom-table-row__btn--edit"
            onClick={() => onEditClick(item)}
            aria-label="Edit community"
          >
            <PencilIcon />
          </button>
          <button
            className="custom-table-row__btn custom-table-row__btn--delete"
            onClick={() => onDeleteClick(item)}
            aria-label="Delete community"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {item.status === "amendments_requested" && item.comments! && (
        <div className="custom-table-row__feedback custom-table-row__feedback--amendments">
          <strong className="custom-table-row__feedback-label">
            Changes Required:
          </strong>
          <div className="custom-table-row__feedback-scroll-container">
            <p className="custom-table-row__feedback-text">{item.comments}</p>
          </div>
        </div>
      )}

      <div className="custom-table-row__body">
        <DescriptionBlock
          description={item.description}
          maxLength={200}
          baseClassName="custom-table-row"
        />
      </div>
    </div>
  );
}

export default CommunityManagementCard;
