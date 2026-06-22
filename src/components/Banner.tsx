import React from "react";

type BannerVariant = "error" | "warning" | "info";

interface BannerProps {
  message: string | null;
  subtext?: string;
  variant?: BannerVariant;
  onClose: () => void;
}

const Banner: React.FC<BannerProps> = ({
  message,
  subtext = "Please refresh the page or try again later.",
  variant = "error",
  onClose,
}) => {
  if (message == null) return null;

  const cls = variant !== "error" ? ` banner--${variant}` : "";

  return (
    <div className={`banner${cls}`}>
      <div className="banner__content">
        {message}
        {subtext && <span className="banner__subtext">{subtext}</span>}
      </div>
      <button
        className="banner__close"
        onClick={onClose}
        aria-label="Close banner"
      >
        &times;
      </button>
    </div>
  );
};

export default Banner;
