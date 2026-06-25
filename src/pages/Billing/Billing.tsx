import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LoadingSpinner, Pagination } from "../../components/ui";
import BillingHeader from "../../components/billing/BillingHeader";
import BillingTable from "../../components/billing/BillingTable";
import PaymentModal from "../../components/billing/PaymentModal";
import { ReceiptPreviewModal } from "../../components/receipt";
import { useInvoices, useAddPayment } from "../../hooks/useInvoices";
import { useDebounce } from "../../hooks/useDebounce";
import { useQueryClient } from "@tanstack/react-query";
import type { InvoiceListItem } from "../../types/ApiTypes";
import { toast } from "sonner";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

const Billing: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"All" | "Unpaid" | "Partial" | "Paid">("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(PAGE_SIZE);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceListItem | null>(null);

  const debouncedSearchQuery = useDebounce(searchQuery, SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery]);

  const { data, isLoading, error } = useInvoices({
    query: debouncedSearchQuery || undefined,
    status: selectedStatus !== "All" ? selectedStatus : undefined,
    page: currentPage,
    perPage: itemsPerPage,
  });

  const addPaymentMutation = useAddPayment();

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleStatusChange = (status: "All" | "Unpaid" | "Partial" | "Paid") => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= (data?.total_pages ?? 1)) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  const handleRecordPayment = (invoice: InvoiceListItem) => {
    setSelectedInvoice(invoice);
    setShowPaymentModal(true);
  };

  const handlePrintReceipt = (invoice: InvoiceListItem) => {
    setSelectedInvoice(invoice);
    setShowReceiptModal(true);
  };

  const handlePaymentSubmit = (input: { invoice_id: string; amount: number; method: "Cash" | "Card" | "Mobile" | "Insurance"; notes?: string | null }) => {
    addPaymentMutation.mutate(input, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["invoices"] });
        toast.success(t("billing.notifications.paymentAdded", "Payment recorded successfully"));
      },
      onError: (error) => {
        toast.error(`${t("billing.notifications.paymentError", "Failed to record payment")}: ${String(error)}`);
      },
    });
  };

  const invoices = data?.items ?? [];
  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.outstanding_amount, 0);

  return (
    <div className="flex flex-col h-full">
      <BillingHeader
        invoices={invoices}
        totalInvoices={data?.total ?? 0}
        totalOutstanding={totalOutstanding}
        searchQuery={searchQuery}
        selectedStatus={selectedStatus}
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
      />

      <div className="flex-1 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 mb-3">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <LoadingSpinner size="lg" text="Loading invoices..." />
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-lg text-red-500">
              Error loading invoices: {String(error)}
            </div>
          </div>
        ) : (
          <BillingTable
            invoices={invoices}
            onRecordPayment={handleRecordPayment}
            onPrintReceipt={handlePrintReceipt}
          />
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={data?.total_pages ?? 1}
        totalItems={data?.total ?? 0}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
      />

      {selectedInvoice && (
        <>
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            invoiceId={selectedInvoice.id}
            outstandingAmount={selectedInvoice.outstanding_amount}
            onSave={handlePaymentSubmit}
          />

          <ReceiptPreviewModal
            invoiceId={selectedInvoice.id}
            isOpen={showReceiptModal}
            onClose={() => setShowReceiptModal(false)}
          />
        </>
      )}
    </div>
  );
};

export default Billing;