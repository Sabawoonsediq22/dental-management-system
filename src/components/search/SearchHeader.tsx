import * as React from "react";
import { useTranslation } from "react-i18next";
import { SearchIcon } from "../../shared/icons/icons";
import { cn } from "../../lib/utils";

interface TopHeaderSearchProps {
  onClick: () => void;
  className?: string;
}

const TopHeaderSearch: React.FC<TopHeaderSearchProps> = ({ onClick, className }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ps";

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={t("search.openGlobalSearch")}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "flex items-center gap-3 w-80 max-w-md h-10 px-4 rounded-full",
        "bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600",
        "hover:bg-gray-200 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500",
        "transition-all duration-200 cursor-pointer",
        isRTL && "flex-row-reverse",
        className,
      )}
    >
      <SearchIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 shrink-0" />
      <span className="flex-1 text-sm text-gray-500 dark:text-gray-400 truncate">
        {t("search.placeholder")}
      </span>
      <kbd
        className={cn(
          "hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-mono",
          "border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-800",
          "text-gray-500 dark:text-gray-400",
        )}
      >
        <span>{t("search.ctrl")}</span>
        <span>+</span>
        <span>{t("search.k")}</span>
      </kbd>
    </div>
  );
};

export default TopHeaderSearch;
export type { TopHeaderSearchProps };
