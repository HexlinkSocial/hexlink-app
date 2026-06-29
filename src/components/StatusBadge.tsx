import { JSX } from "react";
import styles from "../styles/components/StatusBadge.module.scss";

interface StatusBadgeProps {
  status: "amendments_requested" | "pending" | "approved";
}

const STATUS_CONFIG: Record<
  StatusBadgeProps["status"],
  { label: string; className: string }
> = {
  amendments_requested: {
    label: "Requires change",
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

function StatusBadge({ status }: StatusBadgeProps): JSX.Element | null {
  const config = STATUS_CONFIG[status];

  if (config == null) {
    return null;
  }

  return (
    <span className={`${styles.badge} ${config.className}`}>
      {config.label}
    </span>
  );
}

export default StatusBadge;
