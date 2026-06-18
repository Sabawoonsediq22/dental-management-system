import React from "react";
import { cn } from "../../lib/utils";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/button";
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
  const handleDownloadCSV = () => {
    if (treatments.length === 0) return;

    const csvContent = [
      ["Date", "Time", "Procedure", "Status", "Notes", "Cost (AFN)"],
      ...treatments.map((t) => [
        formatDate(t.date),
        t.time,
        getTreatmentTitle(t),
        t.status,
        t.notes || "",
        t.cost.toLocaleString(),
      ]),
    ]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `treatment-history-${patientId || "unknown"}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onClose();
  };

  const handleDownloadPDF = () => {
    if (treatments.length === 0) return;

    const totalCost = treatments.reduce((sum, t) => sum + t.cost, 0);
    const statusCounts = treatments.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 20px; }
            .header h1 { color: #1f2937; margin: 0; }
            .header p { color: #6b7280; margin: 5px 0 0 0; }
            .stats { display: flex; gap: 20px; margin-bottom: 20px; }
            .stat-box { border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; min-width: 120px; }
            .stat-box h3 { margin: 0; color: #6b7280; font-size: 12px; }
            .stat-box p { margin: 5px 0 0 0; font-size: 18px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
            th { background-color: #f3f4f6; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .status { padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
            .status-completed { background-color: #d1fae5; color: #065f46; }
            .status-open { background-color: #dbeafe; color: #1e40af; }
            .status-scheduled { background-color: #fef3c7; color: #92400e; }
            .status-cancelled { background-color: #e5e7eb; color: #374151; }
            .footer { margin-top: 20px; text-align: center; color: #9ca3af; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Treatment History Report</h1>
            <p>Patient: ${patientName || "Unknown"} | Patient ID: ${patientId || "Unknown"}</p>
            <p>Generated on: ${new Date().toLocaleDateString("en-US")}</p>
          </div>
          
          <div class="stats">
            <div class="stat-box">
              <h3>Total Treatments</h3>
              <p>${treatments.length}</p>
            </div>
            <div class="stat-box">
              <h3>Total Cost</h3>
              <p>${totalCost.toLocaleString()} AFN</p>
            </div>
            <div class="stat-box">
              <h3>Completed</h3>
              <p>${statusCounts["Completed"] || 0}</p>
            </div>
            <div class="stat-box">
              <h3>Open</h3>
              <p>${statusCounts["Open"] || 0}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Procedure</th>
                <th>Status</th>
                <th>Notes</th>
                <th>Cost (AFN)</th>
              </tr>
            </thead>
            <tbody>
              ${treatments.map((t) => `
                <tr>
                  <td>${formatDate(t.date)}</td>
                  <td>${t.time}</td>
                  <td>${getTreatmentTitle(t)}</td>
                  <td><span class="status status-${t.status.toLowerCase()}">${t.status}</span></td>
                  <td>${t.notes || "-"}</td>
                  <td>${t.cost.toLocaleString()}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <div class="footer">
            Dental Management System - Treatment History Report
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        setTimeout(() => printWindow.close(), 1000);
      }, 500);
    }
    onClose();
  };

  const handleDownloadSummary = () => {
    const totalCost = treatments.reduce((sum, t) => sum + t.cost, 0);
    const statusCounts = treatments.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const summary = [
      `Treatment History Summary`,
      `========================`,
      ``,
      `Patient: ${patientName || "Unknown"}`,
      `Patient ID: ${patientId || "Unknown"}`,
      `Total Treatments: ${treatments.length}`,
      `Total Cost: ${totalCost.toLocaleString()} AFN`,
      ``,
      `Status Breakdown:`,
      `  - Completed: ${statusCounts["Completed"] || 0}`,
      `  - Open: ${statusCounts["Open"] || 0}`,
      `  - Scheduled: ${statusCounts["Scheduled"] || 0}`,
      `  - Cancelled: ${statusCounts["Cancelled"] || 0}`,
      ``,
      `Treatments:`,
      ...treatments.map((t, i) => {
        const title = getTreatmentTitle(t);
        return `  ${i + 1}. ${formatDate(t.date)} - ${title} (${t.cost.toLocaleString()} AFN)`;
      }),
    ].join("\n");

    const blob = new Blob([summary], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `treatment-history-${patientId || "unknown"}.txt`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Treatment History"
      size="md"
      className={cn("bg-white dark:bg-gray-800", className)}
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Export treatment history for {patientName || "this patient"}. Choose format below.
        </p>

        <div className="space-y-3">
          <div className="p-4 border rounded-lg dark:border-gray-700">
            <h4 className="font-medium mb-2">CSV Format</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Spreadsheet-compatible format. Includes date, time, procedure, status, notes, and cost.
            </p>
            <Button onClick={handleDownloadCSV} className="w-full">
              <DownloadIcon className="w-4 h-4 mr-2" />
              Download CSV
            </Button>
          </div>

          <div className="p-4 border rounded-lg dark:border-gray-700">
            <h4 className="font-medium mb-2">PDF Format</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Printable document with statistics, table, and professional formatting.
            </p>
            <Button onClick={handleDownloadPDF} variant="outline" className="w-full">
              <DownloadIcon className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>

          <div className="p-4 border rounded-lg dark:border-gray-700">
            <h4 className="font-medium mb-2">Text Summary</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Plain text summary with statistics and procedure list.
            </p>
            <Button onClick={handleDownloadSummary} variant="outline" className="w-full">
              <DownloadIcon className="w-4 h-4 mr-2" />
              Download Summary
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TreatmentHistoryDownloadModal;