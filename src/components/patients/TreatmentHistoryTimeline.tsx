import React, { useState, useMemo } from "react";
import { cn } from "../../lib/utils";
import { Button, Card, CardContent, CardHeader, CardTitle } from "../ui";
import { Badge } from "../ui/Badge";
import { FilterIcon, ChevronDownIcon, ChevronUpIcon, DownloadIcon } from "../../shared/icons/icons";
import { TreatmentEntry } from "../../types/PatientTypes";
import { Modal } from "../ui/Modal";
import TreatmentHistoryFilterModal from "./TreatmentHistoryFilterModal";
import TreatmentHistoryDownloadModal from "./TreatmentHistoryDownloadModal";
import { convertFileSrc } from "@tauri-apps/api/core";
import { getCurrencySymbol } from "../common/getCurrencySymbol";

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

interface FlattenedEntry {
  visitId: string;
  date: string;
  time: string;
  status: string;
  notes: string | undefined;
  images: string[] | undefined;
  procedure: {
    name: string;
    toothNumbers: number[];
    additionalNote: string | undefined;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  };
  expandKey: string;
}

const flattenTreatments = (treatments: TreatmentEntry[]): FlattenedEntry[] => {
  const entries: FlattenedEntry[] = [];
  treatments.forEach((treatment) => {
    treatment.procedures?.forEach((procedure, index) => {
      entries.push({
        visitId: treatment.id,
        date: treatment.date,
        time: treatment.time,
        status: treatment.status,
        notes: treatment.notes,
        images: treatment.images,
        procedure: {
          name: procedure.name,
          toothNumbers: procedure.tooth_numbers ?? [],
          additionalNote: procedure.additional_note,
          quantity: procedure.quantity,
          unitPrice: procedure.unit_price,
          totalPrice: procedure.total_price,
        },
        expandKey: `${treatment.id}-proc-${index}`,
      });
    });
  });
  return entries;
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const formatTime = (timeStr: string) => {
  return new Date(timeStr).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getProcedureTitle = (toothNumbers: number[], name: string) => {
  const validTeeth = toothNumbers.filter((t) => t > 0);
  if (!validTeeth || validTeeth.length === 0) {
    return name;
  }
  return `${name} (Tooth: ${validTeeth.join(", ")})`;
};

const TreatmentHistoryTimeline: React.FC<TreatmentHistoryTimelineProps> = ({
  treatments: initialTreatments,
  onViewAll,
  patientId,
  patientName,
  className,
}) => {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [filteredTreatments, setFilteredTreatments] = useState<TreatmentEntry[]>(initialTreatments);

  const toggleExpand = (key: string) => {
    setExpandedKey(expandedKey === key ? null : key);
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

  const flattenedEntries = useMemo(() => flattenTreatments(filteredTreatments), [filteredTreatments]);

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
                <DownloadIcon/>
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute left-[18px] top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-700" />

            {flattenedEntries.length === 0 ? (
              <div className="relative flex gap-4">
                <div className="absolute left-0 w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center z-10">
                  <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="ml-14 flex-1 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-6 text-sm text-gray-500 dark:text-gray-400">
                  No treatment history recorded yet.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {flattenedEntries.map((entry, index) => {
                  const isExpanded = expandedKey === entry.expandKey;
                  const statusStyle = statusConfig[entry.status] || statusConfig.Completed;
                  const showDateDivider = index === 0 || flattenedEntries[index - 1].date !== entry.date;
                  const procedureTitle = getProcedureTitle(entry.procedure.toothNumbers, entry.procedure.name);

                  return (
                    <div key={entry.expandKey}>
                      {showDateDivider && (
                        <div className="flex items-center gap-3 mb-3 ml-0">
                          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                          <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            {formatDate(entry.date)}
                          </span>
                          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                        </div>
                      )}

                      <div className="relative flex gap-4">
                        <div className="absolute left-0 w-9 h-9 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center z-10 shadow-sm">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>

                        <div className="ml-14 flex-1">
                          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between p-4">
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                  {procedureTitle}
                                </h4>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatTime(entry.time)}
                                  </span>
                                  <Badge className={cn(statusStyle.bg, statusStyle.text)}>
                                    {entry.status.toUpperCase()}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 ml-4">
                                <span className="text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">
                                  {entry.procedure.totalPrice.toLocaleString()} AFN
                                </span>
                                <button
                                  onClick={() => toggleExpand(entry.expandKey)}
                                  className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
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
                              <div className="px-4 pb-4 space-y-3 border-t border-gray-100 dark:border-gray-700/50">
                                {entry.notes && (
                                  <div className="pt-3">
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                      Clinical Notes
                                    </span>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">
                                      {entry.notes}
                                    </p>
                                  </div>
                                )}

                                {entry.procedure.additionalNote && (
                                  <div className="rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-3">
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                      Procedure Note
                                    </span>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">
                                      {entry.procedure.additionalNote}
                                    </p>
                                  </div>
                                )}

                                <div className="grid grid-cols-3 gap-3 pt-2">
                                  <div className="rounded-lg bg-gray-50 dark:bg-gray-800/60 p-3 text-center">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quantity</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{entry.procedure.quantity}</p>
                                  </div>
                                  <div className="rounded-lg bg-gray-50 dark:bg-gray-800/60 p-3 text-center">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unit Price</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                                      {entry.procedure.unitPrice.toLocaleString()} {getCurrencySymbol(entry.procedure.name)} AFN
                                    </p>
                                  </div>
                                  <div className="rounded-lg bg-gray-50 dark:bg-gray-700/40 p-3 text-center">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</p>
                                    <p className="text-sm font-bold text-green-600 dark:text-green-400 mt-1">
                                      {entry.procedure.totalPrice.toLocaleString()} AFN
                                    </p>
                                  </div>
                                </div>

                                {entry.images && entry.images.length > 0 && (
                                  <div className="pt-2">
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                      Treatment Images
                                    </span>
                                    <div className="flex gap-2 flex-wrap mt-2">
                                      {entry.images.map((img, imgIndex) => {
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
                                                target.style.display = "none";
                                                const parent = target.parentElement;
                                                if (parent) {
                                                  parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-xs text-gray-500">Not found</div>`;
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
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

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

      <TreatmentHistoryFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        treatments={initialTreatments}
        onApplyFilter={setFilteredTreatments}
      />

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
