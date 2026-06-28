import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Button, Input } from "../ui";
import type { AddPaymentInput } from "../../types/ApiTypes";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string;
  outstandingAmount: number;
  onSave: (input: AddPaymentInput) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  invoiceId,
  outstandingAmount,
  onSave,
}) => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [method, setMethod] = useState<"Cash" | "Card" | "Mobile" | "Insurance">("Cash");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0 || paymentAmount > outstandingAmount) {
      return;
    }

    onSave({
      invoice_id: invoiceId,
      amount: paymentAmount,
      method,
      notes: notes.trim() || null,
    });

    setAmount("");
    setNotes("");
    setMethod("Cash");
    onClose();
  };

  const maxAmount = outstandingAmount;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t("billing.recordPayment", "Record Payment")} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t("billing.paymentAmount", "Payment Amount")} (AFN)</label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            max={maxAmount}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={t("billing.enterAmount", "Enter amount")}
            required
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            {t("billing.outstandingAmount", "Outstanding: {{amount}} AFN", { amount: maxAmount.toLocaleString() })}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t("billing.paymentMethod", "Payment Method")}</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as typeof method)}
            className="w-full px-3 py-2 border rounded-md text-sm"
          >
            <option value="Cash">{t("billing.methods.cash", "Cash")}</option>
            <option value="Card">{t("billing.methods.card", "Card")}</option>
            <option value="Mobile">{t("billing.methods.mobile", "Mobile")}</option>
            <option value="Insurance">{t("billing.methods.insurance", "Insurance")}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t("billing.notes", "Notes")} ({t("common.optional", "optional")})</label>
          <Input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("billing.paymentNotesPlaceholder", "Payment reference or notes")}
            className="w-full"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose} className="cursor-pointer">
            {t("common.cancel")}
          </Button>
          <Button type="submit" className="cursor-pointer">
            {t("billing.recordPayment")}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PaymentModal;