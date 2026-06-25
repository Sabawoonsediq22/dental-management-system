import React from "react";
import { useTranslation } from "react-i18next";
import { BillingTableProps } from "../../types/BillingTypes";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/button";
import { Popover } from "../ui/Popover";
import { MoreHorizontalIcon, PaymentIcon, ReceiptIcon } from "../../shared/icons/icons";

function formatDate(date: string | null | undefined): string {
  if (!date) return "-";
  try {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return date;
  }
}

function formatCurrency(val: number): string {
  return val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case "Paid":
      return "success";
    case "Partial":
      return "warning";
    case "Unpaid":
      return "destructive";
    default:
      return "default";
  }
};

const BillingTable: React.FC<BillingTableProps> = ({
  invoices,
  onRecordPayment,
  onPrintReceipt,
}) => {
  const { t } = useTranslation();

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-gray-800">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {t("billing.table.empty", "No invoices found matching your criteria.")}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800">
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4 font-bold text-xs uppercase tracking-wider text-gray-800 dark:text-gray-400 whitespace-nowrap">
                {t("billing.table.number", "NO.")}
              </th>
              <th className="text-left py-3 px-4 font-bold text-xs uppercase tracking-wider text-gray-800 dark:text-gray-400 whitespace-nowrap">
                {t("billing.table.invoiceNumber", "INVOICE #")}
              </th>
              <th className="text-left py-3 px-4 font-bold text-xs uppercase tracking-wider text-gray-800 dark:text-gray-400">
                {t("billing.table.patient", "PATIENT")}
              </th>
              <th className="text-left py-3 px-4 font-bold text-xs uppercase tracking-wider text-gray-800 dark:text-gray-400">
                {t("billing.table.date", "DATE")}
              </th>
              <th className="text-left py-3 px-4 font-bold text-xs uppercase tracking-wider text-gray-800 dark:text-gray-400">
                {t("billing.table.total", "TOTAL")}
              </th>
              <th className="text-left py-3 px-4 font-bold text-xs uppercase tracking-wider text-gray-800 dark:text-gray-400">
                {t("billing.table.paid", "PAID")}
              </th>
              <th className="text-left py-3 px-4 font-bold text-xs uppercase tracking-wider text-gray-800 dark:text-gray-400">
                {t("billing.table.outstanding", "OUTSTANDING")}
              </th>
              <th className="text-left py-3 px-4 font-bold text-xs uppercase tracking-wider text-gray-800 dark:text-gray-400">
                {t("billing.table.status", "STATUS")}
              </th>
              <th className="text-left py-3 px-4 font-bold text-xs uppercase tracking-wider text-gray-800 dark:text-gray-400">
                {t("billing.table.actions", "ACTIONS")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
            {invoices.map((invoice, index) => (
              <tr
                key={invoice.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
              >
                <td className="py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
                  {index + 1}
                </td>
                <td className="py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
                  {invoice.invoice_number}
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {invoice.patient_name}
                    </span>
                    {invoice.patient_phone && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {invoice.patient_phone}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                  {formatDate(invoice.issued_at)}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                  {formatCurrency(invoice.total_amount)} AFN
                </td>
                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                  {formatCurrency(invoice.paid_amount)} AFN
                </td>
                <td className="py-3 px-4 text-sm whitespace-nowrap">
                  <span
                    className={
                      invoice.outstanding_amount > 0
                        ? "text-orange-600 dark:text-orange-400 font-medium"
                        : "text-gray-600 dark:text-gray-300"
                    }
                  >
                    {formatCurrency(invoice.outstanding_amount)} AFN
                  </span>
                </td>
                <td className="py-3 px-4">
                  <Badge variant={getStatusVariant(invoice.status) as any} className="text-xs font-medium">
                    {invoice.status.toUpperCase()}
                  </Badge>
                </td>
                {/* ... keep existing cells ... */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {/* New Popover for more actions */}
                    <Popover 
                      actions={[
                        {
                          label: t("billing.actions.recordPayment", "Record Payment"),
                          onClick: () => onRecordPayment?.(invoice),
                        },
                        {
                          label: t("billing.actions.printReceipt", "Print Receipt"),
                          onClick: () => onPrintReceipt?.(invoice),
                        },
                      ]}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700/60">
        {invoices.map((invoice) => (
          <div
            key={invoice.id}
            className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {invoice.invoice_number}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {invoice.patient_name}
                </p>
              </div>
              <Badge variant={getStatusVariant(invoice.status) as any} className="text-xs">
                {invoice.status.toUpperCase()}
              </Badge>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
              <span>Date: {formatDate(invoice.issued_at)}</span>
              <span>Total: {formatCurrency(invoice.total_amount)} AFN</span>
              <span>Paid: {formatCurrency(invoice.paid_amount)} AFN</span>
              <span>Due: {formatCurrency(invoice.outstanding_amount)} AFN</span>
            </div>
            {/* Mobile Popover */}
              <Popover
                actions={[
                  {
                    label: t("billing.actions.recordPayment", "Record Payment"),
                    onClick: () => onRecordPayment?.(invoice),
                  },
                  {
                    label: t("billing.actions.printReceipt", "Print Receipt"),
                    onClick: () => onPrintReceipt?.(invoice),
                  },
                ]}
              />
          </div>
        ))}
      </div>
    </div>
  );
};

export default BillingTable;