import { JSX } from "react";

function SpinnerIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" className="spinner-icon">
      <circle
        cx="12"
        cy="12"
        r="10"
        strokeLinecap="round"
        strokeDasharray="32"
        strokeDashoffset="12"
      />
    </svg>
  );
}

export default SpinnerIcon;