import React from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Button, Modal } from "../ui";
import { api } from "../../lib/api";
import { cn } from "../../lib/utils";
import { DownloadIcon, CloseIcon } from "../../shared/icons/icons";
import { ReceiptSource } from "./types";
import { ReceiptPrintView } from "./ReceiptPrintView";
import {
  MOCK_RECEIPT_DATA,
  buildReceiptDownloadHtml,
} from "./receiptUtils";

interface ReceiptPreviewModalProps extends ReceiptSource {
  isOpen: boolean;
  onClose: () => void;
  logoUrl?: string | null;
  className?: string;
}

const ReceiptPreviewModal: React.FC<ReceiptPreviewModalProps> = ({
  isOpen,
  onClose,
  invoiceId,
  patientId,
  visitId,
  logoUrl,
  className,
  mockData,
}) => {
  const { t } = useTranslation();
  const sourceKey = invoiceId || visitId || patientId || "mock";
  const query = useQuery({
    queryKey: ["receipt", sourceKey],
    queryFn: () => {
      if (invoiceId) return api.receipts.getByInvoiceId(invoiceId);
      if (visitId) return api.receipts.getByVisitId(visitId);
      throw new Error("Receipt source is required");
    },
    enabled: !mockData && Boolean(invoiceId || visitId) && isOpen,
  });

  const receipt = mockData || query.data || null;
  const isLoading = !mockData && query.isLoading;
  const error = !mockData ? query.error : null;

  const receiptPrintRef = React.useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!receipt) return;

    window.setTimeout(() => window.print(), 50);
  };

  const handleExportPdf = () => {
    handlePrint();
  };

  const handleDownloadHtml = () => {
    if (!receipt) return;

    const blob = new Blob([buildReceiptDownloadHtml(receipt)], {
      type: "text/html;charset=utf-8",
    });
    downloadBlob(blob, `receipt-${receipt.invoiceNumber}.html`);
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t("receipt.printReceipt")}
      description={t("receipt.previewDescription")}
      size="xl"
      className={cn("receipt-print-modal bg-white dark:bg-gray-900", className)}
      footerClassName="bg-white/95 dark:bg-gray-900/95"
      footer={
        <div
          data-receipt-print-action
          className="grid grid-cols-2 gap-3"
        >
          <Button
            type="button"
            onClick={handlePrint}
            disabled={isLoading || Boolean(error)}
            className="h-11 bg-teal-700 text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"
          >
            <PrinterIcon className="h-4 w-4" />
            {t("receipt.printReceipt")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="h-11 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <CloseIcon className="h-4 w-4" />
            {t("common.closeModal", "Close")}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div
          data-receipt-print-action
          className="flex flex-wrap items-center justify-end gap-2"
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportPdf}
            disabled={isLoading || Boolean(error) || !receipt}
            className="cursor-pointer"
          >
            <PrinterIcon className="h-4 w-4" />
            {t("receipt.exportPdf")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownloadHtml}
            disabled={isLoading || Boolean(error) || !receipt}
            className="cursor-pointer"
          >
            <DownloadIcon className="h-4 w-4" />
            {t("receipt.downloadReceipt")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => query.refetch()}
            disabled={isLoading || Boolean(mockData) || !receipt}
            className="cursor-pointer"
          >
            {t("receipt.regenerate")}
          </Button>
        </div>

        <div ref={receiptPrintRef} className="receipt-print-root">
          <ReceiptPrintView
            receipt={receipt}
            error={error}
            isLoading={isLoading}
            logoUrl={logoUrl}
          />
        </div>
      </div>
    </Modal>
  );
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const PrinterIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2v7H6v-7z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 14h12" />
  </svg>
);

export { MOCK_RECEIPT_DATA };
export type { ReceiptPreviewModalProps };
export { ReceiptPreviewModal };
