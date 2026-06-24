import { JSX, ReactNode } from "react";
import SpinnerIcon from "../../icons/SpinnerIcon";

interface ActionButtonProps {
  onClick: () => void;
  title: string;
  disabled?: boolean;
  isPending?: boolean;
  icon: ReactNode;
  className?: string;
}

function ActionButton({
  onClick,
  title,
  disabled = false,
  isPending = false,
  icon,
  className = "custom-table-row__btn",
}: ActionButtonProps): JSX.Element {
  return (
    <button
      className={className}
      title={title}
      onClick={onClick}
      disabled={disabled}
    >
      {isPending ? <SpinnerIcon /> : icon}
    </button>
  );
}

export default ActionButton;
