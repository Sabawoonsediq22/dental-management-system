import React from "react";
import { cn } from "../../lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui";
import { EditIcon, ErrorTriangleIcon } from "../../shared/icons/icons";
import { AllergyAlert } from "../../types/PatientTypes";

interface AllergiesMedicalAlertsCardProps {
  alerts: AllergyAlert[];
  onEdit?: () => void;
  className?: string;
}

const AllergiesMedicalAlertsCard: React.FC<AllergiesMedicalAlertsCardProps> = ({
  alerts,
  onEdit,
  className,
}) => {
  return (
    <Card className={cn("w-full bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-900/30", className)}>
      <CardHeader className="pb-3 bg-red-100 dark:bg-red-900/30 border-b border-red-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ErrorTriangleIcon className="w-5 h-5 text-red-500" />
            <CardTitle className="text-lg font-semibold text-red-500 dark:text-white">
              Allergies & Medical Alerts
            </CardTitle>
          </div>
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-2 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              aria-label="Edit allergies and alerts"
            >
              <EditIcon size="md" className="text-red-500 dark:text-red-400" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <div key={index} className="space-y-1 border border-red-200 dark:border-red-700 rounded-md p-3 bg-red-50 dark:bg-red-900/20">
              <p className="text-xs font-bold text-red-500 dark:text-red-400 uppercase tracking-wider">
                {alert.label}
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {alert.value || "None recorded"}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AllergiesMedicalAlertsCard;