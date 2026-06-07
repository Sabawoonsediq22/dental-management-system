import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "./button";
import {
  DirectionalNextIcon,
  DirectionalPreviousIcon,
} from "../../shared/icons/icons";
import { PaginationProps } from "../../types/PaginationTypes";

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}) => {
  const { t } = useTranslation();
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      {/* Results info */}
      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
        <span>
          {t("pagination.showing", {
            start: startItem,
            end: endItem,
            total: totalItems,
          })}
        </span>

        {/* Items per page selector */}
        {onItemsPerPageChange && (
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={10}>{t("pagination.perPage", { count: 10 })}</option>
            <option value={25}>{t("pagination.perPage", { count: 25 })}</option>
            <option value={50}>{t("pagination.perPage", { count: 50 })}</option>
            <option value={100}>
              {t("pagination.perPage", { count: 100 })}
            </option>
          </select>
        )}
      </div>

      {/* Page navigation */}
      <nav className="flex items-center gap-1">
        {/* Previous button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label={t("pagination.previous", "Previous page")}
          className="cursor-pointer"
        >
          <DirectionalPreviousIcon className="w-5 h-5" />
        </Button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) =>
            typeof page === "number" ? (
              <Button
                key={index}
                variant={currentPage === page ? "default" : "ghost"}
                size="sm"
                onClick={() => onPageChange(page)}
                className="cursor-pointer"
              >
                {page}
              </Button>
            ) : (
              <span key={index} className="px-2 text-gray-400">
                {page}
              </span>
            ),
          )}
        </div>

        {/* Next button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label={t("pagination.next", "Next page")}
          className="cursor-pointer"
        >
          <DirectionalNextIcon className="w-5 h-5" />
        </Button>
      </nav>
    </div>
  );
};

export default Pagination;
