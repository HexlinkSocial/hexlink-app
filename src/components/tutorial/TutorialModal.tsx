import { JSX, useState } from "react";
import { TUTORIAL_SLIDES } from "./tutorialData";
import TutorialVideo from "./TutorialVideo";

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TutorialModal({
  isOpen,
  onClose,
}: TutorialModalProps): JSX.Element | null {
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  if (!isOpen) {
    return null;
  }

  const currentSlide = TUTORIAL_SLIDES[currentIndex];
  const isFirstSlide = currentIndex === 0;
  const isLastSlide = currentIndex === TUTORIAL_SLIDES.length - 1;

  const handlePrev = (): void => {
    if (!isFirstSlide) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleNext = (): void => {
    if (!isLastSlide) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  return (
    <div className="tutorial-modal-backdrop" onClick={onClose}>
      <div
        className="tutorial-modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-heading"
      >
        <header className="tutorial-modal__header">
          <h2 id="tutorial-heading" className="tutorial-modal__heading">
            {currentSlide.title}
          </h2>
          <button
            type="button"
            className="tutorial-modal__close-btn"
            onClick={onClose}
            aria-label="Close tutorial"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <div className="tutorial-modal__body">
          <TutorialVideo
            src={currentSlide.videoSrc}
            title={currentSlide.title}
          />
        </div>

        <footer className="tutorial-modal__footer">
          <div className="tutorial-modal__indicators">
            {TUTORIAL_SLIDES.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                className={`tutorial-modal__dot ${
                  index === currentIndex ? "tutorial-modal__dot--active" : ""
                }`}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <div className="tutorial-modal__actions">
            <button
              type="button"
              className="tutorial-modal__btn tutorial-modal__btn--secondary"
              onClick={handlePrev}
              disabled={isFirstSlide}
            >
              Previous
            </button>
            {isLastSlide ? (
              <button
                type="button"
                className="tutorial-modal__btn tutorial-modal__btn--primary"
                onClick={onClose}
              >
                Done
              </button>
            ) : (
              <button
                type="button"
                className="tutorial-modal__btn tutorial-modal__btn--primary"
                onClick={handleNext}
              >
                Next
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
