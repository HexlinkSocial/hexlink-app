import { JSX } from "react";

interface TutorialVideoProps {
  src: string;
  title: string;
}

export default function TutorialVideo({
  src,
  title,
}: TutorialVideoProps): JSX.Element {
  return (
    <div className="tutorial-modal__video-wrapper">
      <video
        src={src}
        title={title}
        autoPlay
        loop
        muted
        playsInline
        className="tutorial-modal__video"
        style={{ pointerEvents: "none" }}
      />
    </div>
  );
}
