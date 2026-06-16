import React from "react";
import { cn } from "../../lib/utils";
import { CheckCircleIcon, ClockIcon, CurrencyIcon } from "../../shared/icons/icons";

export type StatisticsCardVariant = "success" | "info" | "warning" | "destructive";

export interface StatisticsCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  variant?: StatisticsCardVariant;
  icon?: "check" | "clock" | "currency" | "custom";
  className?: string;
}

const variantConfig: Record<StatisticsCardVariant, { bg: string; text: string; iconBg: string }> = {
  success: {
    bg: "bg-green-50 dark:bg-green-950/20",
    text: "text-green-600 dark:text-green-400",
    iconBg: "bg-green-100 dark:bg-green-900/30",
  },
  info: {
    bg: "bg-blue-50 dark:bg-blue-950/20",
    text: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
  },
  warning: {
    bg: "bg-yellow-50 dark:bg-yellow-950/20",
    text: "text-yellow-600 dark:text-yellow-400",
    iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  destructive: {
    bg: "bg-red-50 dark:bg-red-950/20",
    text: "text-red-600 dark:text-red-400",
    iconBg: "bg-red-100 dark:bg-red-900/30",
  },
};

const StatisticsCard: React.FC<StatisticsCardProps> = ({
  label,
  value,
  subtitle,
  variant = "success",
  icon,
  className,
}) => {
  const config = variantConfig[variant];

  const renderIcon = () => {
    if (icon === "check") {
      return (
        <div className={cn("p-2 rounded-lg", config.iconBg)}>
          <CheckCircleIcon className={cn("w-5 h-5", config.text)} />
        </div>
      );
    }
    if (icon === "clock") {
      return (
        <div className={cn("p-2 rounded-lg", config.iconBg)}>
          <ClockIcon className={cn("w-5 h-5", config.text)} />
        </div>
      );
    }
    if (icon === "currency") {
      return (
        <div className={cn("p-2 rounded-lg", config.iconBg)}>
          <CurrencyIcon className={cn("w-5 h-5", config.text)} />
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={cn(
        "flex-1 rounded-lg p-5 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {label}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {value}
          </p>
          {subtitle && (
            <p className={cn("text-xs mt-2", config.text)}>{subtitle}</p>
          )}
        </div>
        {icon && renderIcon()}
      </div>
    </div>
  );
};

export default StatisticsCard;