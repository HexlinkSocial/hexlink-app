import { JSX, useState } from "react";

interface CommunityDescriptionProps {
  description?: string | null;
}

const MAX_DESCRIPTION_LENGTH = 90;

function CommunityDescription({
  description,
}: CommunityDescriptionProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const text = description ?? "No description provided.";
  const isTruncatable = text.length > MAX_DESCRIPTION_LENGTH;

  const displayedText =
    isTruncatable && !isExpanded
      ? `${text.slice(0, MAX_DESCRIPTION_LENGTH)}...`
      : text;

  return (
    <div className="community-item__description-container">
      <p
        className={`community-item__description${!isExpanded ? " community-item__description--clamped" : ""}`}
      >
        {displayedText}
      </p>
      {description != null && isTruncatable && (
        <button
          type="button"
          className="community-item__toggle-description-btn"
          onClick={() => setIsExpanded((prev) => !prev)}
        >
          {isExpanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

export default CommunityDescription;
