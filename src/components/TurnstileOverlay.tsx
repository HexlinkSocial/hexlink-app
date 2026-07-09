import React from "react";
import { createPortal } from "react-dom";

interface TurnstileOverlayProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export const TurnstileOverlay: React.FC<TurnstileOverlayProps> = ({
  containerRef,
}) => {
  return createPortal(
    <div className="turnstile-overlay">
      <div className="turnstile-wrapper">
        <p className="turnstile-label">
          Please verify you are human to proceed:
        </p>
        <div ref={containerRef} />
      </div>
    </div>,
    document.body,
  );
};
