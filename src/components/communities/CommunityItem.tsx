import { JSX } from "react";
import { Community } from "./types";

interface CommunityItemProps {
  community: Community;
}

export default function CommunityItem({
  community,
}: CommunityItemProps): JSX.Element {
  return (
    <div className="community-item">
      <div className="community-item__info">
        <span className="community-item__name">{community.name}</span>
        {community.description !== null && (
          <p className="community-item__description">{community.description}</p>
        )}
      </div>
      {community.communityLink !== null ? (
        <a
          className="community-item__join"
          href={community.communityLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          Join
        </a>
      ) : (
        <button
          className="community-item__join community-item__join--disabled"
          disabled
        >
          Join
        </button>
      )}
    </div>
  );
}
