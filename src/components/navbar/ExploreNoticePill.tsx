import { JSX } from "react/jsx-runtime";

interface ExploreNoticePillProps {
  text: string;
}

export const ExploreNoticePill = ({ text }: ExploreNoticePillProps): JSX.Element => {
  return (
    <div className="explore-notice-pill" role="status">
      <span className="explore-notice-pill__text">{text}</span>
    </div>
  );
};