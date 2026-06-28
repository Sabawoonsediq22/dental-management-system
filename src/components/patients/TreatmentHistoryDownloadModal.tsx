import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "../../lib/utils";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/button";
import { LoadingSpinner } from "../ui";
import { TreatmentEntry } from "../../types/PatientTypes";
import { DownloadIcon } from "../../shared/icons/icons";

interface TreatmentHistoryDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  treatments: TreatmentEntry[];
  patientId?: string;
  patientName?: string;
  className?: string;
}

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const getTreatmentTitle = (t: TreatmentEntry): string => {
  const procedureNames = t.procedures?.map((p) => {
    const toothNumbers = p.tooth_numbers?.filter((tooth) => tooth > 0);
    if (!toothNumbers || toothNumbers.length === 0) {
      return p.name;
    }
    return `${p.name} (Tooth: ${toothNumbers.join(", ")})`;
  }).join(", ");
  return procedureNames || t.title || "Treatment";
};

const TreatmentHistoryDownloadModal: React.FC<TreatmentHistoryDownloadModalProps> = ({
  isOpen,
  onClose,
  treatments,
  patientId,
  patientName,
  className,
}) => {
  const { t } = useTranslation();
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownloadCSV = () => {
    if (treatments.length === 0) return;
    setDownloading("csv");

    try {
      const headers = ["Date", "Time", "Procedure", t("common.status", "Status"), "Notes", "Cost (AFN)"];
      const rows = treatments.map((t) => [
        formatDate(t.date),
        t.time,
        getTreatmentTitle(t),
        t.status,
        t.notes || "",
        t.cost.toLocaleString(),
      ]);

      const csv = [
        headers.join(","),
        ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")),
      ].join("\r\n");

      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `treatment-history-${patientId || "unknown"}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onClose();
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadPDF = async () => {
    if (treatments.length === 0) return;
    setDownloading("pdf");

    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ unit: "mm", format: "a4" });

      doc.setFontSize(16);
      doc.text("Treatment History Report", 14, 20);

      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`Patient: ${patientName || "Unknown"} | ID: ${patientId || "Unknown"}`, 14, 27);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32);

      const totalCost = treatments.reduce((sum, t) => sum + t.cost, 0);
      const statusCounts = treatments.reduce((acc, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      doc.setFontSize(10);
      doc.setTextColor(50);
      doc.text(`Total Treatments: ${treatments.length}`, 14, 40);
      doc.text(`Total Cost: ${totalCost.toLocaleString()} AFN`, 14, 46);
      doc.text(
        `Completed: ${statusCounts["Completed"] || 0} | Open: ${statusCounts["Open"] || 0} | Cancelled: ${statusCounts["Cancelled"] || 0}`,
        14,
        52,
      );

      const headers = ["Date", "Time", "Procedure", "Status", "Notes", "Cost (AFN)"];
      const body = treatments.map((t) => [
        formatDate(t.date),
        t.time,
        getTreatmentTitle(t),
        t.status,
        t.notes || "-",
        `${t.cost.toLocaleString()} AFN`,
      ]);

      autoTable(doc, {
        head: [headers],
        body: body as unknown as string[][],
        startY: 58,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [0, 106, 113] },
        margin: { top: 55 },
        columnStyles: {
          0: { cellWidth: 28 },
          1: { cellWidth: 16 },
          3: { cellWidth: 20 },
          4: { cellWidth: 40 },
          5: { cellWidth: 24 },
        },
      });

      doc.save(`treatment-history-${patientId || "unknown"}.pdf`);
      onClose();
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadSummary = () => {
    if (treatments.length === 0) return;
    setDownloading("summary");

    try {
      const totalCost = treatments.reduce((sum, t) => sum + t.cost, 0);
      const statusCounts = treatments.reduce((acc, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const summary = [
        "Treatment History Summary",
        "=".repeat(30),
        "",
        `Patient: ${patientName || "Unknown"}`,
        `Patient ID: ${patientId || "Unknown"}`,
        `Total Treatments: ${treatments.length}`,
        `Total Cost: ${totalCost.toLocaleString()} AFN`,
        "",
        "Status Breakdown:",
        `  - Completed: ${statusCounts["Completed"] || 0}`,
        `  - Active: ${statusCounts["Open"] || 0}`,
        `  - Cancelled: ${statusCounts["Cancelled"] || 0}`,
        "",
        "Treatments:",
        ...treatments.map((t, i) => {
          const title = getTreatmentTitle(t);
          return `  ${i + 1}. ${formatDate(t.date)} - ${title} (${t.cost.toLocaleString()} AFN)`;
        }),
      ].join("\n");

      const blob = new Blob([summary], { type: "text/plain;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `treatment-history-${patientId || "unknown"}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onClose();
    } finally {
      setDownloading(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("patientProfile.exportTreatmentHistory", "Export Treatment History")}
      size="md"
      className={cn("bg-white dark:bg-gray-800", className)}
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t("patientProfile.exportTreatmentDesc", "Export treatment history for {{patientName}}. Choose format below.", { patientName })}
        </p>

        <div className="space-y-3">
          <div className="p-4 border rounded-lg dark:border-gray-700">
            <h4 className="font-medium mb-2">{t("patientProfile.csvFormat", "CSV Format")}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              {t("patientProfile.csvFormatDesc", "Spreadsheet-compatible format. Includes date, time, procedure, status, notes, and cost.")}
            </p>
            <Button onClick={handleDownloadCSV} disabled={downloading !== null} className="w-full">
              {downloading === "csv" ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <DownloadIcon className="w-4 h-4 mr-2" />
              )}
              {t("patientProfile.downloadCsv", "Download CSV")}
            </Button>
          </div>

          <div className="p-4 border rounded-lg dark:border-gray-700">
            <h4 className="font-medium mb-2">{t("patientProfile.pdfFormat", "PDF Format")}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              {t("patientProfile.pdfFormatDesc", "Professional PDF with statistics, treatment table, and formatted layout.")}
            </p>
            <Button onClick={handleDownloadPDF} disabled={downloading !== null} variant="outline" className="w-full">
              {downloading === "pdf" ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <DownloadIcon className="w-4 h-4 mr-2" />
              )}
              {t("patientProfile.downloadPdf", "Download PDF")}
            </Button>
          </div>

          <div className="p-4 border rounded-lg dark:border-gray-700">
            <h4 className="font-medium mb-2">{t("patientProfile.textSummary", "Text Summary")}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              {t("patientProfile.textSummaryDesc", "Plain text summary with statistics and procedure list.")}
            </p>
            <Button onClick={handleDownloadSummary} disabled={downloading !== null} variant="outline" className="w-full">
              {downloading === "summary" ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <DownloadIcon className="w-4 h-4 mr-2" />
              )}
              {t("patientProfile.downloadSummary", "Download Summary")}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TreatmentHistoryDownloadModal;
