import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button, SearchInput } from "../ui";
import { BillingHeaderProps, INVOICE_STATUS_FILTER_OPTIONS } from "../../types/BillingTypes";

const BillingHeader: React.FC<BillingHeaderProps> = ({
  invoices,
  totalInvoices,
  totalOutstanding,
  searchQuery,
  selectedStatus,
  onSearchChange,
  onStatusChange,
}) => {
  const { t } = useTranslation();

  const stats = useMemo(() => {
    const unpaid = invoices.filter((i) => i.status === "Unpaid").length;
    const partial = invoices.filter((i) => i.status === "Partial").length;
    const paid = invoices.filter((i) => i.status === "Paid").length;
    return { unpaid, partial, paid };
  }, [invoices]);

  const getStatusLabel = (status: string) => {
    return t(`billing.filters.${status.toLowerCase()}`, status);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder={t(
            "billing.searchPlaceholder",
            "Search by invoice number, patient name or phone...",
          )}
          className="w-full sm:w-lg"
        />
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3 gap-4 my-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2 py-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {t("billing.totalInvoices", "Total Invoices")} |{" "}
            </span>
            <span className="text-xs font-bold text-gray-900 dark:text-white">
              {totalInvoices}
            </span>
          </div>
          <div className="flex items-center gap-2 py-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {t("billing.outstandingBalance", "Outstanding")} |{" "}
            </span>
            <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
              {totalOutstanding.toLocaleString()} AFN
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {t("billing.filters.status", "Status")}
          </span>
          <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-800 rounded-lg p-0.5 px-1 py-1">
            {INVOICE_STATUS_FILTER_OPTIONS.map((opt) => (
              <Button
                key={opt}
                variant={selectedStatus === opt ? "default" : "ghost"}
                size="sm"
                onClick={() => onStatusChange(opt)}
                className="cursor-pointer"
              >
                {getStatusLabel(opt)}
                {opt !== "All" && stats[opt.toLowerCase() as keyof typeof stats] > 0 && (
                  <span className="ml-1 text-[10px] bg-white/20 px-1 rounded">
                    {stats[opt.toLowerCase() as keyof typeof stats]}
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingHeader;