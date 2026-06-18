import React, { useState } from "react";
import { cn } from "../../lib/utils";
import { Button, Card, CardContent, CardHeader, CardTitle } from "../ui";
import { Badge } from "../ui/Badge";
import { FilterIcon, ChevronDownIcon, ChevronUpIcon } from "../../shared/icons/icons";
import { TreatmentEntry } from "../../types/PatientTypes";
import { Modal } from "../ui/Modal";
import TreatmentHistoryFilterModal from "./TreatmentHistoryFilterModal";
import TreatmentHistoryDownloadModal from "./TreatmentHistoryDownloadModal";
import i18n from "../../i18n";
import { convertFileSrc } from "@tauri-apps/api/core";

const isTauri = typeof window !== "undefined" && "__TAURI__" in window;

interface TreatmentHistoryTimelineProps {
  treatments: TreatmentEntry[];
  onViewAll?: () => void;
  patientId?: string;
  patientName?: string;
  className?: string;
}

const statusConfig: Record<string, { bg: string; text: string }> = {
  Completed: {
    bg: "bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50",
    text: "text-green-700 dark:text-green-400",
  },
  Open: {
    bg: "bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50",
    text: "text-blue-700 dark:text-blue-400",
  },
  "In Progress": {
    bg: "bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50",
    text: "text-blue-700 dark:text-blue-400",
  },
  Cancelled: {
    bg: "bg-gray-100 dark:bg-gray-700/30 hover:bg-gray-200 dark:hover:bg-gray-700/50",
    text: "text-gray-700 dark:text-gray-400",
  },
  Scheduled: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50",
    text: "text-yellow-700 dark:text-yellow-400",
  },
};
const isRTL = i18n.language === "ps";

const TreatmentHistoryTimeline: React.FC<TreatmentHistoryTimelineProps> = ({
  treatments: initialTreatments,
  onViewAll,
  patientId,
  patientName,
  className,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [filteredTreatments, setFilteredTreatments] = useState<TreatmentEntry[]>(initialTreatments);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const getImageUrl = (filePath: string): string => {
    if (!filePath) return "";
    if (isTauri) {
      try {
        const converted = convertFileSrc(filePath);
        return converted;
      } catch (e) {
        console.error("Failed to convert file path:", e, filePath);
        return "";
      }
    }
    return filePath;
  };

  type TreatmentProcedureEntry = NonNullable<TreatmentEntry["procedures"]>[number];

  const getProcedureTitle = (procedure: TreatmentProcedureEntry) => {
    const toothNumbers = procedure.tooth_numbers?.filter((tooth) => tooth > 0);
    if (!toothNumbers || toothNumbers.length === 0) {
      return procedure.name;
    }
    return `${procedure.name} (Tooth: ${toothNumbers.join(", ")})`;
  };

  const getTreatmentTitle = (t: TreatmentEntry) => {
    const procedureNames = t.procedures?.map((p) => getProcedureTitle(p)).join(", ");
    if (procedureNames) {
      return procedureNames;
    }
    if (t.tooth_number) {
      return `${t.title} (Tooth ${t.tooth_number})`;
    }
    return t.title;
  };

  return (
    <>
      <Card className={cn("w-full bg-white dark:bg-gray-800", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Treatment History
            </CardTitle>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilterModal(true)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                aria-label="Filter treatments"
              >
                <FilterIcon size="md" />
              </button>
              <button
                onClick={() => setShowDownloadModal(true)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                aria-label="Export treatments"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

            <div className="space-y-6">
              {filteredTreatments.length === 0 ? (
                <div className="relative flex gap-4">
                  <div className="absolute left-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center z-10">
                    <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div className="ml-12 flex-1 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-6 text-sm text-gray-500 dark:text-gray-400">
                    No treatment history recorded yet.
                  </div>
                </div>
              ) : filteredTreatments.map((treatment) => {
                const isExpanded = expandedId === treatment.id;
                const statusStyle = statusConfig[treatment.status] || statusConfig.Completed;

                return (
                  <div key={treatment.id} className="relative flex gap-4">
                    {/* Timeline node */}
                    <div className="absolute left-0 w-8 h-8 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center z-10">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>

                    {/* Content */}
                    <div className="ml-12 flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                            {getTreatmentTitle(treatment)}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {formatDate(treatment.date)} • {treatment.time}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className={`text-sm font-bold text-gray-900 dark:text-white ${isRTL ? "ml-4" : "mr-4"}`}>
                            {treatment.cost.toLocaleString()} AFN
                          </p>
                          <Badge className={cn(statusStyle.bg, statusStyle.text)}>
                            {treatment.status.toUpperCase()}
                          </Badge>
                          <button
                            onClick={() => toggleExpand(treatment.id)}
                            className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer focus:outline-none"
                            aria-label={isExpanded ? "Collapse" : "Expand"}
                          >
                            {isExpanded ? (
                              <ChevronUpIcon size="md" />
                            ) : (
                              <ChevronDownIcon size="md" />
                            )}
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 space-y-3">
                          {treatment.notes && (
                            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                Notes:{" "}
                              </span>
                              <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {treatment.notes}
                              </span>
                            </div>
                          )}
                          {treatment.procedures && treatment.procedures.length > 0 && (
                            <div className="space-y-3">
                              {treatment.procedures.map((procedure, procedureIndex) => (
                                <div
                                  key={`${treatment.id}-procedure-${procedureIndex}`}
                                  className="rounded-lg border border-gray-200 dark:border-gray-700 p-3"
                                >
                                  {procedure.additional_note && (
                                    <div className="mb-2">
                                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Procedure Note:{" "}
                                      </span>
                                      <span className="text-xs text-gray-700 dark:text-gray-300">
                                        {procedure.additional_note}
                                      </span>
                                    </div>
                                  )}
                                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 dark:text-gray-400">
                                    <span>
                                      Number of procedures: {procedure.quantity}
                                    </span>
                                    <span>
                                      Unit: {procedure.unit_price.toLocaleString()} AFN
                                    </span>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                      Total: {procedure.total_price.toLocaleString()} AFN
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {treatment.images && treatment.images.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                                Treatment Images
                              </p>
                              <div className="flex gap-2 flex-wrap">
                                {treatment.images.map((img, imgIndex) => {
                                  const imgUrl = getImageUrl(img);
                                  return (
                                    <button
                                      key={imgIndex}
                                      onClick={() => setPreviewImage(img)}
                                      className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:opacity-80 transition-opacity bg-gray-100 dark:bg-gray-700"
                                      title={`Treatment image ${imgIndex + 1}`}
                                    >
                                      <img
                                        src={imgUrl}
                                        alt={`Treatment image ${imgIndex + 1}`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          console.error("Image failed to load:", img, "URL:", imgUrl);
                                          target.style.display = "none";
                                          const parent = target.parentElement;
                                          if (parent) {
                                            parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-xs text-gray-500">Image not found</div>`;
                                          }
                                        }}
                                      />
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="h-px bg-gray-200 dark:bg-gray-700 mt-4" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* View All link */}
            {onViewAll && (
              <div className="flex justify-center mt-6">
                <Button
                  variant="link"
                  onClick={onViewAll}
                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  View All Visit Records →
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Image Preview Modal */}
      <Modal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        size="xl"
        showCloseButton={true}
      >
        {previewImage && (
          <div className="flex items-center justify-center p-4">
            <img
              src={getImageUrl(previewImage)}
              alt="Treatment preview"
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
          </div>
        )}
      </Modal>

      {/* Filter Modal */}
      <TreatmentHistoryFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        treatments={initialTreatments}
        onApplyFilter={setFilteredTreatments}
      />

      {/* Download Modal */}
      <TreatmentHistoryDownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        treatments={filteredTreatments.length > 0 ? filteredTreatments : initialTreatments}
        patientId={patientId}
        patientName={patientName}
      />
    </>
  );
};

export default TreatmentHistoryTimeline;