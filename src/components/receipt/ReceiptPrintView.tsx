import React from "react";
import { useTranslation } from "react-i18next";
import { cn } from "../../lib/utils";
import { LoadingSpinner } from "../ui";
import { ReceiptData } from "./types";
import {
  formatCurrency,
  formatReceiptDate,
  getProcedureLabel,
  getReceiptTotals,
} from "./receiptUtils";

interface ReceiptPrintViewProps {
  receipt?: ReceiptData | null;
  error?: unknown;
  isLoading?: boolean;
  logoUrl?: string | null;
  className?: string;
}

const ReceiptPrintView: React.FC<ReceiptPrintViewProps> = ({
  receipt,
  error,
  isLoading = false,
  logoUrl,
  className,
}) => {
  const { t } = useTranslation();
  
  if (isLoading) {
    return (
      <div className="flex min-h-90 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
        <LoadingSpinner size="lg" text={t("receipt.loading")} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
        <p className="font-semibold">{t("receipt.unableToLoad")}</p>
        <p className="mt-1 text-sm opacity-80">{String(error)}</p>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800/50">
        <p className="font-semibold text-gray-900 dark:text-white">{t("receipt.noReceiptAvailable")}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("receipt.createBeforePrinting")}
        </p>
      </div>
    );
  }

  const totals = getReceiptTotals(receipt);

  return (
    <div
      className={cn(
        "receipt-print-surface mx-auto w-full max-w-3xl rounded-2xl border border-gray-200 bg-white p-6 shadow-xl shadow-gray-200/70 dark:border-gray-700 dark:bg-gray-900 dark:shadow-none sm:p-8",
        className,
      )}
    >
      <div className="receipt-print-content space-y-5">
        <header className="border-b border-gray-200 pb-5 text-center dark:border-gray-700">
          {logoUrl && (
            <img
              src={logoUrl}
              alt={t("receipt.clinicLogo")}
              className="mx-auto mb-3 h-14 w-14 rounded-full object-contain"
            />
          )}
          <h1 className="text-2xl font-black uppercase tracking-tight text-teal-700 dark:text-teal-300 sm:text-3xl">
            {receipt.clinic.name}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {receipt.clinic.address}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {receipt.clinic.phone}
          </p>
        </header>

        <section className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-3">
            <InfoRow label={t("receipt.receiptNo")} value={`#${receipt.invoiceNumber}`} />
            <InfoRow label={t("receipt.patientName")} value={receipt.patientName} />
          </div>
          <div className="space-y-3 text-right">
            <InfoRow label={t("receipt.date")} value={formatReceiptDate(receipt.issueDate)} />
            <InfoRow label={t("receipt.patientId")} value={receipt.patientId} />
          </div>
        </section>

        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">{t("receipt.procedure")}</th>
                <th className="px-4 py-3 text-right font-semibold">{t("receipt.price")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-900">
              {receipt.procedures.map((procedure, index) => (
                <tr key={procedure.treatmentRecordId || index}>
                  <td className="px-4 py-3 align-top text-gray-900 dark:text-white">
                    <p className="font-medium">{getProcedureLabel(procedure)}</p>
                    {procedure.additionalNote && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {procedure.additionalNote}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(procedure.totalPrice, receipt.currency)}
                  </td>
                </tr>
              ))}
              {receipt.procedures.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-muted-foreground" colSpan={2}>
                    {t("receipt.noProcedureRecorded")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/70">
          <SummaryRow
            label={t("receipt.subtotal")}
            value={formatCurrency(totals.subtotal, receipt.currency)}
          />
          <SummaryRow
            label={t("receipt.discount")}
            value={formatCurrency(totals.discount, receipt.currency)}
            valueClassName="text-red-600 dark:text-red-400"
          />
          <SummaryRow
            label={t("receipt.totalAmount")}
            value={formatCurrency(totals.totalAmount, receipt.currency)}
            labelClassName="text-lg font-bold text-teal-700 dark:text-teal-300"
            valueClassName="text-lg font-black text-teal-700 dark:text-teal-300"
          />
          <SummaryRow
            label={t("receipt.paidAmountCash")}
            value={formatCurrency(totals.paidAmount, receipt.currency)}
            valueClassName="font-semibold text-teal-700 dark:text-teal-300"
          />
          <div className="my-3 border-t border-gray-200 dark:border-gray-700" />
          <SummaryRow
            label={t("receipt.outstandingBalance")}
            value={formatCurrency(totals.outstandingAmount, receipt.currency)}
            labelClassName="text-lg font-bold text-red-600 dark:text-red-400"
            valueClassName="text-xl font-black text-red-600 dark:text-red-400"
            prominent
          />
        </div>

        {receipt.payments.length > 1 && (
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {t("receipt.payments")}
            </h3>
            <div className="space-y-2 text-sm">
              {receipt.payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between gap-4">
                  <span className="text-gray-600 dark:text-gray-300">
                    {payment.method || t("receipt.payment")}
                    {payment.notes ? ` — ${payment.notes}` : ""}
                  </span>
                  <span className="font-semibold text-teal-700 dark:text-teal-300">
                    {formatCurrency(payment.amount, receipt.currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <footer className="border-t border-gray-200 pt-4 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          <p className="font-medium text-gray-700 dark:text-gray-300">
            {t("receipt.thankYou")}
          </p>
        </footer>
      </div>
    </div>
  );
};

interface InfoRowProps {
  label: string;
  value: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value }) => (
  <div>
    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
      {label}
    </p>
    <p className="mt-0.5 font-semibold text-gray-900 dark:text-white">{value || "-"}</p>
  </div>
);

interface SummaryRowProps {
  label: string;
  value: string;
  labelClassName?: string;
  valueClassName?: string;
  prominent?: boolean;
}

const SummaryRow: React.FC<SummaryRowProps> = ({
  label,
  value,
  labelClassName = "",
  valueClassName = "",
  prominent = false,
}) => (
  <div
    className={cn(
      "flex items-center justify-between gap-4",
      prominent && "rounded-lg bg-white/70 p-3 dark:bg-gray-900/50",
    )}
  >
    <span className={cn("text-gray-600 dark:text-gray-300", labelClassName)}>
      {label}
    </span>
    <span className={cn("text-gray-900 dark:text-white", valueClassName)}>
      {value}
    </span>
  </div>
);

export { ReceiptPrintView };
