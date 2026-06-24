import type { InvoiceListItem } from "../types/ApiTypes";

export type InvoiceStatusFilter = "All" | "Unpaid" | "Partial" | "Paid";

export const INVOICE_STATUS_FILTER_OPTIONS: InvoiceStatusFilter[] = ["All", "Unpaid", "Partial", "Paid"];

export interface BillingHeaderProps {
  invoices: InvoiceListItem[];
  totalInvoices: number;
  totalOutstanding: number;
  searchQuery: string;
  selectedStatus: InvoiceStatusFilter;
  onSearchChange: (query: string) => void;
  onStatusChange: (status: InvoiceStatusFilter) => void;
}

export interface BillingTableProps {
  invoices: InvoiceListItem[];
  onRecordPayment?: (invoice: InvoiceListItem) => void;
  onPrintReceipt?: (invoice: InvoiceListItem) => void;
  onViewInvoice?: (invoice: InvoiceListItem) => void;
  onDownloadInvoice?: (invoice: InvoiceListItem) => void;
  onSendInvoice?: (invoice: InvoiceListItem) => void;
  onDeleteInvoice?: (invoice: InvoiceListItem) => void;
}