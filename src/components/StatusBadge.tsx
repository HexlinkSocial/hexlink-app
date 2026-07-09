import { JSX } from "react";
import styles from "../styles/components/StatusBadge.module.scss";

interface StatusBadgeProps {
  status: "amendments_requested" | "pending" | "approved";
  labelText?: string;
}

const STATUS_CONFIG: Record<
  StatusBadgeProps["status"],
  { label: string; className: string }
> = {
  amendments_requested: {
    label: "Requires changes",
    className: styles["badge--amendments-requested"],
  },
  pending: {
    label: "Pending review",
    className: styles["badge--pending"],
  },
  approved: {
    label: "Approved",
    className: styles["badge--approved"],
  },
};

function StatusBadge({
  status,
  labelText,
}: StatusBadgeProps): JSX.Element | null {
  const config = STATUS_CONFIG[status];

  if (config == null) {
    return null;
  }

  const displayLabel = labelText ?? config.label;

  return (
    <span className={`${styles.badge} ${config.className}`}>
      {displayLabel}
    </span>
  );
}

export default StatusBadge;
