import { JSX, useState } from "react";

interface DescriptionBlockProps {
  description?: string | null;
  maxLength?: number;
  baseClassName?: string;
}

function DescriptionBlock({
  description,
  maxLength = 200,
  baseClassName = "custom-table-row",
}: DescriptionBlockProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const text = description ?? "No description provided.";
  const isTruncatable = text.length > maxLength;

  const displayedText =
    isTruncatable && !isExpanded ? `${text.slice(0, maxLength)}...` : text;

  const renderDescriptionLines = (): JSX.Element[] => {
    return displayedText.split("\n").map((line, idx) => (
      <p
        key={idx}
        className={`${baseClassName}__description${!isExpanded ? ` ${baseClassName}__description--clamped` : ""}`}
      >
        {line}
      </p>
    ));
  };

  return (
    <div className={`${baseClassName}__description-container`}>
      {renderDescriptionLines()}
      {description != null && isTruncatable && (
        <button
          type="button"
          className={`${baseClassName}__toggle-description-btn`}
          onClick={() => setIsExpanded((prev) => !prev)}
        >
          {isExpanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

export default DescriptionBlock;
