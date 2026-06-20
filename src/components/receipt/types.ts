export type ReceiptInvoiceStatus = "Unpaid" | "Partial" | "Paid";

export type ReceiptCurrency = "AFN" | "USD";

export interface ReceiptClinic {
  name: string;
  address: string;
  phone: string;
  logoUrl?: string | null;
}

export interface ReceiptPatient {
  id: string;
  fullName: string;
  phone?: string | null;
}

export interface ReceiptPayment {
  id: string;
  amount: number;
  method?: string | null;
  notes?: string | null;
  receivedAt: string;
}

export interface ReceiptProcedure {
  treatmentRecordId?: string;
  procedureName: string;
  additionalNote?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  performedAt?: string;
  toothNumbers?: number[];
}

export interface ReceiptData {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  patientPhone?: string | null;
  visitId: string;
  issueDate: string;
  currency: ReceiptCurrency;
  subtotal: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: ReceiptInvoiceStatus;
  procedures: ReceiptProcedure[];
  payments: ReceiptPayment[];
  clinic: ReceiptClinic;
}

export interface ReceiptSource {
  invoiceId?: string;
  patientId?: string;
  visitId?: string;
  mockData?: ReceiptData;
}
