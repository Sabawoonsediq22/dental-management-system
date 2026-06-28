import React from "react";
import { useTranslation } from "react-i18next";
import { cn } from "../../lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui";
import { EditIcon } from "../../shared/icons/icons";
import { PersonalDetail } from "../../types/PatientTypes";

interface PersonalDetailsCardProps {
  details: PersonalDetail[];
  onEdit?: () => void;
  className?: string;
}

const PersonalDetailsCard: React.FC<PersonalDetailsCardProps> = ({
  details,
  onEdit,
  className,
}) => {
  const { t } = useTranslation();
  return (
    <Card className={cn("w-full bg-white dark:bg-gray-800", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            {t("patientProfile.personalDetails")}
          </CardTitle>
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-2 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              aria-label={t("patientProfile.editPersonalDetailsAria")}
            >
              <EditIcon size="md" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {details.map((detail, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                {detail.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {detail.label}
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
                  {detail.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalDetailsCard;