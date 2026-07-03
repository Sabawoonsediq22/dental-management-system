import React from "react";
import { Card, CardContent } from "../../components/ui";
import { TrendingDownIcon, TrendingUpIcon } from "../../shared/icons/icons";

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  trend?: { value: string; positive: boolean };
  loading?: boolean;
  secondary?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, badge, trend, loading, secondary }) => (
  <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg border shadow-lg group">
    <CardContent className="relative p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] sm:text-xs font-bold tracking-wide text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <p className="mt-2 text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                ...
              </span>
            ) : (
              value
            )}
          </p>
          {secondary && !loading && (
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
              {secondary}
            </p>
          )}
          {trend && !loading && (
            <div className="flex items-center gap-1 mt-1">
              {trend.positive ? (
                <TrendingUpIcon size="xs" className="text-green-600"/>
              ) : (
                <TrendingDownIcon size="xs" className="text-red-600"/>
              )}
              <span
                className={`text-[10px] sm:text-xs font-semibold ${trend.positive ? "text-green-600" : "text-red-600"}`}
              >
                {trend.value}
              </span>
            </div>
          )}
        </div>
        <div className="rounded-xl bg-linear-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 p-2.5 sm:p-3 text-primary shadow-sm group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
      </div>
      {badge && <div className="mt-3 sm:mt-4">{badge}</div>}
    </CardContent>
  </Card>
);

export default StatCard;
