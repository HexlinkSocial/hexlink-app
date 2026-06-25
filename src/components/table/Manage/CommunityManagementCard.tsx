import { JSX } from "react";
import { UnifiedCommunityItem } from "../../../helpers/userCommunitiesApiHelpers";
import StatusBadge from "../../StatusBadge";
import DescriptionBlock from "../../DescriptionBlock";
import PencilIcon from "../../icons/PencilIcon";

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
          <PencilIcon />
        </button>
      </div>
    </div>
  );
}

export default CommunityManagementCard;
