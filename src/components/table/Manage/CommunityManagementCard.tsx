import { JSX } from "react";
import { UnifiedCommunityItem } from "../../../helpers/userCommunitiesApiHelpers";
import StatusBadge from "../../StatusBadge";
import DescriptionBlock from "../../DescriptionBlock";

interface CommunityCardProps {
  item: UnifiedCommunityItem;
  onEditClick: (item: UnifiedCommunityItem) => void;
}

function CommunityManagementCard({
  item,
  onEditClick,
}: CommunityCardProps): JSX.Element {
  return (
    <div className="custom-table-row">
      <div className="custom-table-row__content">
        <div className="custom-table-row__meta">
          <h2 className="custom-table-row__title">{item.name}</h2>
        </div>

        <DescriptionBlock
          description={item.description}
          maxLength={200}
          baseClassName="custom-table-row"
        />
      </div>

      <div className="custom-table-row__actions">
        <StatusBadge status={item.status} />
        <button
          className="custom-table-row__btn custom-table-row__btn--edit"
          onClick={() => onEditClick(item)}
          aria-label="Edit community"
        >
          <svg viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default CommunityManagementCard;
