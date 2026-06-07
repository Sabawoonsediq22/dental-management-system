import React from "react";
import { useTranslation } from "react-i18next";

const Help: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        {t("nav.help")}
      </h2>
      <p className="text-gray-600 dark:text-gray-400">
        Help.
      </p>
    </div>
  );
};

export default Help;