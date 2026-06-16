import React from "react";
import { cn } from "../../lib/utils";
import { PatientAvatar } from "../ui";

interface PatientAvatarWithStatusProps {
  name: string;
  size?: "sm" | "md" | "lg" | "xl" | "xxl";
  status?: "online" | "offline" | "away";
  className?: string;
}

const statusConfig = {
  online: {
    bg: "bg-green-500",
    label: "Online",
  },
  offline: {
    bg: "bg-gray-400",
    label: "Offline",
  },
  away: {
    bg: "bg-yellow-500",
    label: "Away",
  },
};

const PatientAvatarWithStatus: React.FC<PatientAvatarWithStatusProps> = ({
  name,
  size = "lg",
  status = "online",
  className,
}) => {
  const statusClasses = {
    sm: "w-2.5 h-2.5",
    md: "w-3 h-3",
    lg: "w-4 h-4",
    xl: "w-5 h-5",
    xxl: "w-6 h-6",
  };

  const statusStyle = statusConfig[status];

  return (
    <div className={cn("relative inline-block", className)}>
      <PatientAvatar name={name} size={size} className={cn("border-2 border-white dark:border-gray-800", className)} />
      <span
        className={cn(
          "absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-gray-800",
          statusClasses[size],
          statusStyle.bg,
        )}
        title={statusStyle.label}
        aria-label={statusStyle.label}
      />
    </div>
  );
};

export default PatientAvatarWithStatus;