import type { ReceiptCurrency, ReceiptData, ReceiptProcedure } from "./types";

export const DEFAULT_CLINIC = {
  name: "KHWAJA DENTAL & IMPLANT SERVICE",
  address: "House 42, Road 7, Sector 3, Uttara, Dhaka",
  phone: "Phone: +880 1711-223344",
};

export const DOLLAR_PROCEDURES = [
  "Zirconium Crown",
  "Orthodontics (Basic)",
  "Orthodontics (Standard)",
  "Implant Surgery Only (Standard)",
  "Implant Surgery Only (Premium)",
  "Bleaching",
];

export const MOCK_RECEIPT_DATA: ReceiptData = {
  id: "INV-MOCK-20260619",
  invoiceNumber: "RCP-2023-0492",
  patientId: "KD-8821",
  patientName: "Rahim Ahmed",
  patientPhone: "+880 1711-223344",
  visitId: "V-20231012-000001",
  issueDate: "2023-10-12T00:00:00.000Z",
  currency: "AFN",
  subtotal: 8000,
  discount: 0,
  totalAmount: 8000,
  paidAmount: 5000,
  outstandingAmount: 3000,
  status: "Partial",
  clinic: DEFAULT_CLINIC,
  procedures: [
    {
      treatmentRecordId: "TR-MOCK-1",
      procedureName: "Root Canal Treatment",
      quantity: 1,
      unitPrice: 5000,
      totalPrice: 5000,
      performedAt: "2023-10-12T00:00:00.000Z",
      toothNumbers: [16],
    },
    {
      treatmentRecordId: "TR-MOCK-2",
      procedureName: "Zirconium Crown",
      quantity: 2,
      unitPrice: 1500,
      totalPrice: 3000,
      performedAt: "2023-10-12T00:00:00.000Z",
      toothNumbers: [11, 21],
    },
  ],
  payments: [
    {
      id: "PAY-MOCK-1",
      amount: 5000,
      method: "Cash",
      notes: "Initial cash payment",
      receivedAt: "2023-10-12T00:00:00.000Z",
    },
  ],
};

export const formatCurrency = (amount: number, currency: ReceiptCurrency = "AFN") => {
  const value = Number.isFinite(amount) ? amount : 0;
  const symbol = currency === "USD" ? "$" : "AFN";
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

  return `${formatted} ${symbol}`;
};

export const formatShortCurrency = (amount: number, currency: ReceiptCurrency = "AFN") => {
  const value = Number.isFinite(amount) ? amount : 0;
  const symbol = currency === "USD" ? "$" : "AFN";
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

  return `${formatted} ${symbol}`;
};

export const formatReceiptDate = (dateValue: string | null | undefined) => {
  if (!dateValue) return "-";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

export const formatReceiptTime = (dateValue: string | null | undefined) => {
  if (!dateValue) return "";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getCurrencyForProcedureName = (procedureName: string): ReceiptCurrency =>
  DOLLAR_PROCEDURES.includes(procedureName) ? "USD" : "AFN";

export const getProcedureLabel = (procedure: ReceiptProcedure) => {
  const toothNumbersArray = typeof procedure.toothNumbers === 'string'
    ? procedure.toothNumbers.split(',').map(n => n.trim()).filter(n => n)
    : procedure.toothNumbers;
  const toothLabel = toothNumbersArray && toothNumbersArray.length > 0
    ? ` (Tooth: ${toothNumbersArray.join(", ")})`
    : "";
  const quantityLabel = procedure.quantity > 1 ? ` (x${procedure.quantity})` : "";

  return `${procedure.procedureName}${toothLabel}${quantityLabel}`;
};

export const getReceiptTotals = (receipt: ReceiptData) => {
  const subtotal = receipt.procedures.reduce((sum, item) => sum + item.totalPrice, 0);
  const discount = Math.max(receipt.discount, 0);
  const totalAmount = Math.max(subtotal - discount, 0);
  const paidAmount = receipt.payments.reduce((sum, payment) => sum + payment.amount, 0) || receipt.paidAmount;
  const outstandingAmount = Math.max(totalAmount - paidAmount, 0);

  return {
    subtotal,
    discount,
    totalAmount,
    paidAmount,
    outstandingAmount,
  };
};

export const buildReceiptDownloadJson = (receipt: ReceiptData) =>
  JSON.stringify(receipt, null, 2);

export const buildReceiptDownloadHtml = (receipt: ReceiptData) => `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt ${receipt.invoiceNumber}</title>
  <style>
    body { font-family: Inter, system-ui, sans-serif; margin: 0; background: #fff; color: #111827; }
    .receipt { width: 80mm; margin: 0 auto; padding: 12px; }
    .brand { text-align: center; color: #0f766e; font-weight: 800; font-size: 16px; }
    .address { text-align: center; color: #6b7280; font-size: 11px; margin-top: 4px; }
    .divider { border-top: 1px solid #e5e7eb; margin: 10px 0; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px; }
    .right { text-align: right; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
    th { text-align: left; text-transform: uppercase; color: #6b7280; border-bottom: 1px solid #e5e7eb; padding: 4px 0; }
    td { padding: 6px 0; border-bottom: 1px solid #f3f4f6; }
    .money { text-align: right; }
    .total { color: #0f766e; font-size: 14px; font-weight: 800; }
    .outstanding { color: #dc2626; font-size: 14px; font-weight: 800; }
    .footer { text-align: center; color: #6b7280; font-size: 10px; margin-top: 14px; }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="brand">${receipt.clinic.name}</div>
    <div class="address">${receipt.clinic.address}<br />${receipt.clinic.phone}</div>
    <div class="divider"></div>
    <div class="meta">
      <div>Receipt No: <strong>#${receipt.invoiceNumber}</strong><br />Patient Name: <strong>${receipt.patientName}</strong></div>
      <div class="right">Date: <strong>${formatReceiptDate(receipt.issueDate)}</strong><br />Patient ID: <strong>${receipt.patientId}</strong></div>
    </div>
    <table>
      <thead><tr><th>Procedure</th><th class="money">Price</th></tr></thead>
      <tbody>${receipt.procedures.map((procedure) => `<tr><td>${getProcedureLabel(procedure)}</td><td class="money">${formatCurrency(procedure.totalPrice, receipt.currency)}</td></tr>`).join("")}</tbody>
    </table>
    <div class="divider"></div>
    <div class="meta">
      <div>Subtotal<br />Discount<br /><span class="total">Total Amount<br />Paid Amount (Cash)</span></div>
      <div class="right">${formatCurrency(receipt.subtotal, receipt.currency)}<br /><span style="color:#dc2626">${formatCurrency(receipt.discount, receipt.currency)}</span><br /><span class="total">${formatCurrency(receipt.totalAmount, receipt.currency)}</span><br /><span class="total">${formatCurrency(receipt.paidAmount, receipt.currency)}</span></div>
    </div>
    <div class="divider"></div>
    <div class="meta">
      <div>Outstanding Balance</div>
      <div class="right outstanding">${formatCurrency(receipt.outstandingAmount, receipt.currency)}</div>
    </div>
    <div class="footer">Thank you for choosing Khwaja Dental!</div>
  </div>
</body>
</html>`;
