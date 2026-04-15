import clsx from "clsx";

interface StatusChipProps {
  label: string;
  tone: "pending" | "success" | "error" | "warning" | "info";
}

export function StatusChip({ label, tone }: StatusChipProps) {
  return <span className={clsx("status-chip", `tone-${tone}`)}>{label}</span>;
}
