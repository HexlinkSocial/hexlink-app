import { JSX, useState } from "react";

const MAX_DESCRIPTION_LENGTH = 200;

interface DescriptionBlockProps {
  description?: string | null;
}

function DescriptionBlock({ description }: DescriptionBlockProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const text = description ?? "No description provided.";
  const isTruncatable = text.length > MAX_DESCRIPTION_LENGTH;

  const displayedText =
    isTruncatable && !isExpanded
      ? `${text.slice(0, MAX_DESCRIPTION_LENGTH)}...`
      : text;

  return (
    <div className="custom-table-row__description-container">
      <p
        className={`custom-table-row__description${!isExpanded ? " custom-table-row__description--clamped" : ""}`}
      >
        {displayedText}
      </p>
      {description != null && isTruncatable && (
        <button
          type="button"
          className="custom-table-row__toggle-description-btn"
          onClick={() => setIsExpanded((prev) => !prev)}
        >
          {isExpanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

export default DescriptionBlock;
