import { useState, useEffect, RefObject } from "react";

interface Coords {
  top: number;
  left: number;
  width: number;
}

export function useDropdownPosition(
  buttonRef: RefObject<HTMLButtonElement | null>,
  isOpen: boolean
) {
  const [coords, setCoords] = useState<Coords>({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (!isOpen) return;

    const updateCoords = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setCoords({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    };

    updateCoords();
    window.addEventListener("resize", updateCoords);

    const scrollContainer = buttonRef.current?.closest(".communities-card__body");
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", updateCoords);
    }

    return () => {
      window.removeEventListener("resize", updateCoords);
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", updateCoords);
      }
    };
  }, [isOpen, buttonRef]);

  return coords;
}